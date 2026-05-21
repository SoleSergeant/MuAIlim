import httpx
import json
import os
from typing import List
from models.schemas import Subject, Difficulty

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

SUBJECT_NAMES_UZ = {
    "math": "Matematika",
    "history": "Tarix",
    "uzbek": "Ona tili",
    "english": "Ingliz tili",
    "physics": "Fizika",
    "chemistry": "Kimyo",
    "biology": "Biologiya",
}


SYSTEM_PROMPT = (
    "Sen O'zbekiston DTM (Kirish imtixoni) imtihoniga tayyorlash uchun "
    "maxsus o'qituvchi-AIsan. Sening vazifang o'quvchilarga savollarni "
    "O'zbekcha, tushunarli va aniq tushuntirish. "
    "Har doim: 1) Nima uchun o'quvchi xato qilganini aytsang, "
    "2) To'g'ri javobni qoidasi yoki mantiq bilan asoslasang, "
    "3) Eslab qolish uchun qisqa maslahat bersang. "
    "Hech qachon inglizcha so'z ishlatma. Faqat O'zbekcha yoz."
)

async def _chat(prompt: str, max_tokens: int = 1000, system: str = SYSTEM_PROMPT) -> str:
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        "stream": False,
        "options": {"num_predict": max_tokens, "temperature": 0.4},
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
        r.raise_for_status()
        data = r.json()
        return data["message"]["content"].strip()


async def generate_questions(subject: Subject, topic: str, count: int, difficulty: Difficulty) -> List[dict]:
    subject_uz = SUBJECT_NAMES_UZ.get(subject, subject)
    prompt = f"""O'zbekiston DTM imtihoni uchun {subject_uz} fanidan "{topic}" mavzusida {count} ta test savol yarat.
Qiyinlik darajasi: {difficulty}.
Har bir savol uchun 4 ta variant (A, B, C, D) bo'lishi kerak.
Faqat JSON formatida qaytargin, boshqa matn yo'q.

Format:
{{
  "questions": [
    {{
      "text": "Savol matni",
      "options": ["A variant", "B variant", "C variant", "D variant"],
      "correct_index": 0,
      "topic": "{topic}",
      "difficulty": "{difficulty}"
    }}
  ]
}}"""

    raw = await _chat(prompt, max_tokens=1500)
    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start == -1:
        return []
    data = json.loads(raw[start:end])
    return data.get("questions", [])


async def analyze_mock_results(answers: list, questions: List[dict], user_goal: int = 160) -> dict:
    q_map = {q["id"]: q for q in questions}
    wrong_topics: dict[str, dict] = {}
    by_subject: dict[str, dict] = {}
    by_difficulty: dict[str, dict] = {}

    for ans in answers:
        q = q_map.get(ans.question_id, {})
        subj = q.get("subject", "unknown")
        topic = q.get("topic", "Noma'lum mavzu")
        diff = q.get("difficulty", "medium")
        is_correct = ans.selected_index == q.get("correct_index", -1)
        secs = getattr(ans, "time_spent_secs", 0) or getattr(ans, "time_spent_seconds", 0) or 0

        # by subject
        if subj not in by_subject:
            by_subject[subj] = {"correct": 0, "total": 0, "total_secs": 0}
        by_subject[subj]["total"] += 1
        by_subject[subj]["total_secs"] += secs
        if is_correct:
            by_subject[subj]["correct"] += 1

        # by difficulty timing
        if diff not in by_difficulty:
            by_difficulty[diff] = {"correct": 0, "total": 0, "total_secs": 0}
        by_difficulty[diff]["total"] += 1
        by_difficulty[diff]["total_secs"] += secs
        if is_correct:
            by_difficulty[diff]["correct"] += 1

        # by topic
        key = f"{subj}:{topic}"
        if key not in wrong_topics:
            wrong_topics[key] = {"subject": subj, "topic": topic, "correct": 0, "total": 0}
        wrong_topics[key]["total"] += 1
        if is_correct:
            wrong_topics[key]["correct"] += 1

    weaknesses = []
    for item in wrong_topics.values():
        acc = int(item["correct"] / item["total"] * 100) if item["total"] else 0
        if acc < 80:
            weaknesses.append({
                "subject": item["subject"],
                "topic": item["topic"],
                "accuracy_pct": acc,
                "question_count": item["total"],
                "priority": "high" if acc < 40 else "medium",
            })
    weaknesses.sort(key=lambda x: x["accuracy_pct"])

    total = len(answers)
    correct = sum(
        1 for ans in answers
        if q_map.get(ans.question_id, {}).get("correct_index") == ans.selected_index
    )
    score_pct = int(correct / total * 100) if total else 0
    total_secs = sum(
        getattr(a, "time_spent_secs", 0) or getattr(a, "time_spent_seconds", 0) or 0
        for a in answers
    )

    # Timing benchmarks (DTM: 90 q in 90 min = 60s avg)
    BENCH = {"easy": 45, "medium": 60, "hard": 90}
    timing_flags = []
    timing_by_diff = {}
    for diff, stats in by_difficulty.items():
        if stats["total"] == 0:
            continue
        avg = stats["total_secs"] / stats["total"]
        timing_by_diff[diff] = round(avg)
        bench = BENCH.get(diff, 60)
        if diff == "easy" and avg > bench * 1.8:
            timing_flags.append(f"Oson savollarga o'rtacha {round(avg)}s sarflandi (me'yor: {bench}s) — yodlash zaif")
        elif diff == "easy" and avg > bench * 1.4:
            timing_flags.append(f"Oson savollarda vaqt yo'qotilmoqda ({round(avg)}s o'rniga {bench}s bo'lishi kerak)")
        if diff == "hard" and avg < bench * 0.5:
            timing_flags.append(f"Qiyin savollarga juda oz vaqt ({round(avg)}s) — shoshqaloqlik bor")
        if diff == "medium" and avg > bench * 2:
            timing_flags.append(f"O'rtacha savollarda sekinlik ({round(avg)}s) — tushunish muammosi bo'lishi mumkin")

    avg_per_q = round(total_secs / total) if total else 0

    # Subject timing
    subj_time_summary = "\n".join(
        f"- {SUBJECT_NAMES_UZ.get(s, s)}: {v['correct']}/{v['total']} to'g'ri, "
        f"o'rtacha {round(v['total_secs']/v['total'])}s/savol"
        for s, v in by_subject.items() if v["total"] > 0
    )
    weak_summary = "\n".join(
        f"- {SUBJECT_NAMES_UZ.get(w['subject'], w['subject'])}: {w['topic']} — {w['accuracy_pct']}% to'g'ri ({w['question_count']} savol)"
        for w in weaknesses[:6]
    ) or "Zaif mavzu aniqlanmadi"
    timing_summary = "\n".join(f"- {f}" for f in timing_flags) or "- Vaqt sarfi me'yorida"
    diff_time_lines = "\n".join(
        f"- {d}: o'rtacha {s}s/savol (me'yor: {BENCH.get(d,60)}s)"
        for d, s in timing_by_diff.items()
    )

    prompt = f"""Sen DTM imtihoniga tayyorlovchi AI o'qituvchisan. O'quvchining mock imtihon natijalarini chuqur tahlil qil.

NATIJALAR:
Jami: {correct}/{total} ({score_pct}%) | Jami vaqt: {total_secs//60} daqiqa {total_secs%60} soniya | O'rtacha: {avg_per_q}s/savol

FAN BO'YICHA:
{subj_time_summary}

ZAIF MAVZULAR (aniq):
{weak_summary}

VAQT TAHLILI:
{diff_time_lines}
{timing_summary}

MAQSAD: {user_goal} ball

Quyidagilarni O'zbekcha, aniq va shaxsiy tarzda yoz (5-6 gap):
1. Qaysi ANIQ mavzular eng zaif (foiz bilan ayt)
2. Vaqt sarfida muammo bor-yo'qligini ayt (oson savollarga ko'p vaqt sarflayaptimi, qiyin savollarda shoshyaptimi)
3. Keyingi hafta uchun ANIQ reja: qaysi 2-3 mavzuga e'tibor bersin
4. Maqsad ({user_goal} ball) ga yetish uchun necha foiz yaxshilanish kerak

Faqat matn yoz, JSON yoki ro'yxat belgisi yo'q:"""

    try:
        ai_summary = await _chat(prompt, max_tokens=400)
    except Exception:
        top_weak = weaknesses[0]["topic"] if weaknesses else "mavzular"
        ai_summary = (
            f"Siz {score_pct}% natija ko'rsatdingiz. "
            f"Eng zaif mavzu: {top_weak}. "
            f"O'rtacha har bir savolga {avg_per_q} soniya sarfladingiz. "
            f"Maqsad: {user_goal} ball."
        )

    predicted = None
    if total >= 5:
        predicted = round(score_pct * 2.0, 1)

    return {
        "total_questions": total,
        "correct_count": correct,
        "score_pct": score_pct,
        "by_subject": by_subject,
        "weakness_topics": weaknesses,
        "predicted_dtm_score": predicted,
        "ai_summary": ai_summary,
        "timing": {
            "total_secs": total_secs,
            "avg_per_question": avg_per_q,
            "by_difficulty": timing_by_diff,
            "flags": timing_flags,
        },
    }


FEW_SHOT_EXAMPLES = {
    "math": """Misol:
Savol: x² - 5x + 6 = 0 tenglamaning ildizlari yig'indisi nechaga teng?
O'quvchi tanladi: 3
To'g'ri javob: 5
Tushuntirish: Kvadrat tenglama ax²+bx+c=0 da ildizlar yig'indisi Viet formulasi bo'yicha x₁+x₂ = -b/a = -(-5)/1 = 5 ga teng. Siz 3 ni tanladingiz, bu ildizlardan biri (x=3), lekin yig'indi emas. Eslab qoling: ildizlar YIG'INDISI = -b/a, KO'PAYTMASI = c/a.""",

    "uzbek": """Misol:
Savol: 'Chiroyli' so'zi qaysi so'z turkumiga kiradi?
O'quvchi tanladi: Ravish
To'g'ri javob: Sifat
Tushuntirish: Sifat — predmetning belgisini bildiradi va "qanday?" savoliga javob beradi. "Chiroyli" so'zi "qanday?" savoliga javob beradi, shuning uchun u sifat. Ravish esa harakat belgisini bildiradi ("qanday harakat qilmoq?"). Eslab qoling: narsa+belgi=sifat, harakat+belgi=ravish.""",

    "history": """Misol:
Savol: Amir Temur qaysi yili Samarqandni poytaxtiga aylantirdi?
O'quvchi tanladi: 1380
To'g'ri javob: 1370
Tushuntirish: Amir Temur 1370 yilda Movarounnahr hokimiyatini qo'lga kiritib, Samarqandni poytaxt qildi. 1380 yil — Temurning Xuroson yurishlaridan biri davri. Eslab qoling: 1370 = Temur taxtga o'tirgan yil, Samarqand = poytaxt.""",
}


async def explain_wrong_answer(
    question_text: str,
    options: List[str],
    correct_index: int,
    selected_index: int,
    subject: str,
    topic: str,
) -> str:
    subject_uz = SUBJECT_NAMES_UZ.get(subject, subject)
    correct_opt = options[correct_index] if correct_index < len(options) else ""
    selected_opt = options[selected_index] if selected_index < len(options) else ""
    example = FEW_SHOT_EXAMPLES.get(subject, FEW_SHOT_EXAMPLES["uzbek"])

    prompt = f"""Quyida {subject_uz} fanidan yaxshi tushuntirish namunasi:

{example}

Endi shu uslubda tushuntir (3-4 gap, O'zbekcha):
Fan: {subject_uz}
Mavzu: {topic}
Savol: {question_text}
O'quvchi tanladi: {selected_opt}
To'g'ri javob: {correct_opt}

Tushuntirish (faqat matn, boshqa narsa yozma):"""

    try:
        result = await _chat(prompt, max_tokens=350)
        # Strip any prompt leakage
        for marker in ["Tushuntirish:", "Savol:", "Fan:", "Mavzu:"]:
            if marker in result:
                result = result.split(marker)[-1].strip()
        return result
    except Exception:
        return (
            f"Noto'g'ri javob: \"{selected_opt}\".\n"
            f"To'g'ri javob: \"{correct_opt}\".\n"
            f"{topic} mavzusini qayta o'rganib chiqing."
        )


async def predict_score(mock_results: List[dict], goal: int) -> dict:
    if len(mock_results) < 3:
        return {"available": False, "message": "Kamida 3 ta mock kerak"}

    scores = [r.get("score_pct", 0) for r in mock_results[-5:]]
    avg = sum(scores) / len(scores)
    predicted_ball = round(avg * 2.0, 1)
    min_ball = round(max(0, (avg - 10) * 2.0), 1)
    max_ball = round(min(200, (avg + 10) * 2.0), 1)
    readiness_pct = min(100, int(avg))

    return {
        "available": True,
        "predicted_range": f"{min_ball}–{max_ball}",
        "readiness_pct": readiness_pct,
        "trend": scores[-1] - scores[0] if len(scores) > 1 else 0,
        "goal": goal,
        "gap_to_goal": max(0, round(goal - predicted_ball, 1)),
    }
