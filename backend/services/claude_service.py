import httpx
import json
import os
from datetime import datetime, timedelta
from typing import List
from models.schemas import Subject, Difficulty

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

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


async def _groq_chat(prompt: str, max_tokens: int = 400, system: str = SYSTEM_PROMPT) -> str:
    """Fast cloud AI via Groq (free tier, ~1-2 sec response)."""
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.4,
    }
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(GROQ_URL, json=payload, headers=headers)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()


async def _chat(prompt: str, max_tokens: int = 1000, system: str = SYSTEM_PROMPT) -> str:
    """Try Groq first (fast), fall back to Ollama (local)."""
    if GROQ_API_KEY:
        return await _groq_chat(prompt, max_tokens=min(max_tokens, 600), system=system)
    # Ollama fallback
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

    # Collect wrong questions for per-question review
    wrong_questions = []
    for ans in answers:
        q = q_map.get(ans.question_id, {})
        if not q:
            continue
        is_correct = ans.selected_index == q.get("correct_index", -1)
        if not is_correct:
            secs = getattr(ans, "time_spent_secs", 0) or getattr(ans, "time_spent_seconds", 0) or 0
            wrong_questions.append({
                "question_id": ans.question_id,
                "text": q.get("text", ""),
                "options": q.get("options", []),
                "correct_index": q.get("correct_index", 0),
                "selected_index": ans.selected_index,
                "subject": q.get("subject", ""),
                "topic": q.get("topic", ""),
                "difficulty": q.get("difficulty", "medium"),
                "time_spent_secs": secs,
            })

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
    has_timing_data = total_secs > 0  # only analyse timing if app sent real data

    if has_timing_data:
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

    avg_per_q = round(total_secs / total) if total and has_timing_data else 0

    # Subject summary (no timing if data unavailable)
    subj_time_summary = "\n".join(
        f"- {SUBJECT_NAMES_UZ.get(s, s)}: {v['correct']}/{v['total']} to'g'ri"
        + (f", o'rtacha {round(v['total_secs']/v['total'])}s/savol" if has_timing_data and v["total"] > 0 else "")
        for s, v in by_subject.items() if v["total"] > 0
    )
    weak_summary = "\n".join(
        f"- {SUBJECT_NAMES_UZ.get(w['subject'], w['subject'])}: {w['topic']} — {w['accuracy_pct']}% to'g'ri ({w['question_count']} savol)"
        for w in weaknesses[:6]
    ) or "Zaif mavzu aniqlanmadi"

    timing_section = ""
    if has_timing_data:
        diff_time_lines = "\n".join(
            f"- {d}: o'rtacha {s}s/savol (me'yor: {BENCH.get(d,60)}s)"
            for d, s in timing_by_diff.items()
        )
        timing_str = "\n".join(f"- {f}" for f in timing_flags) or "- Vaqt sarfi me'yorida"
        timing_section = f"\nVAQT TAHLILI:\n{diff_time_lines}\n{timing_str}"

    prompt = f"""Sen DTM imtihoniga tayyorlovchi AI o'qituvchisan. O'quvchining mock imtihon natijalarini tahlil qil.

NATIJALAR: {correct}/{total} ({score_pct}%)

FAN BO'YICHA:
{subj_time_summary}

ZAIF MAVZULAR:
{weak_summary}
{timing_section}
MAQSAD: {user_goal} ball

O'zbekcha, aniq va qisqa yoz (4-5 gap):
1. Qaysi ANIQ mavzular eng zaif (foiz bilan ayt)
2. Keyingi hafta uchun ANIQ reja: qaysi 2-3 mavzuga e'tibor bersin
3. Maqsad ({user_goal} ball) ga yetish uchun necha foiz yaxshilanish kerak

Faqat matn yoz, JSON yoki belgilar yo'q:"""

    try:
        ai_summary = await _chat(prompt, max_tokens=400)
    except Exception:
        # Rich rule-based fallback — specific and data-driven
        EMOJI = {"history": "🕌", "math": "➕", "uzbek": "📖"}
        perf_icon = "✅" if score_pct >= 70 else "⚠️" if score_pct >= 50 else "❌"

        # Subject performance line
        subj_parts = []
        for s, v in by_subject.items():
            if v["total"] == 0:
                continue
            pct = int(v["correct"] / v["total"] * 100)
            icon = "✅" if pct >= 70 else "⚠️" if pct >= 50 else "❌"
            subj_parts.append(f"{icon} {SUBJECT_NAMES_UZ.get(s, s)}: {v['correct']}/{v['total']} ({pct}%)")

        # Weakness line
        top_weak = weaknesses[:3]
        weak_str = ", ".join(
            f"{w['topic']} ({w['accuracy_pct']}%)" for w in top_weak
        ) if top_weak else None

        # Timing line — only if real timing data exists
        timing_parts = []
        if has_timing_data:
            if timing_by_diff.get("easy", 0) > 45 * 1.4:
                timing_parts.append(f"oson savollarda {timing_by_diff['easy']}s (me'yor: 45s) — yodlash muammosi")
            if timing_by_diff.get("medium", 0) > 60 * 2:
                timing_parts.append(f"o'rta savollarda {timing_by_diff['medium']}s — tushunish sekin")
            if timing_by_diff.get("hard", 0) > 0 and timing_by_diff.get("hard", 0) < 30:
                timing_parts.append(f"qiyin savollarda {timing_by_diff.get('hard', 0)}s — shoshqaloqlik bor")

        # Goal gap
        goal_pct_needed = round(user_goal / 2)
        gap = max(0, goal_pct_needed - score_pct)

        lines = [f"{perf_icon} {score_pct}% natija ({correct}/{total} to'g'ri)."]
        if subj_parts:
            lines.append("Fan bo'yicha: " + " | ".join(subj_parts) + ".")
        if weak_str:
            lines.append(f"Zaif mavzular: {weak_str}.")
        if timing_parts:
            lines.append("Vaqt: " + "; ".join(timing_parts) + ".")
        if top_weak:
            rec = " va ".join(f'"{w["topic"]}"' for w in top_weak[:2])
            lines.append(f"Tavsiya: {rec} mavzularini chuqur takrorla.")
        if gap > 0:
            lines.append(f"Maqsad {user_goal} ballga yetish uchun {gap}% ko'proq to'g'ri javob kerak.")

        ai_summary = " ".join(lines)

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
        "wrong_questions": wrong_questions,
    }


ENGLISH_SYSTEM = (
    "You are a concise exam tutor. Write exactly 3 sentences. "
    "Sentence 1: state why the student's answer is wrong (one specific reason). "
    "Sentence 2: show the correct method/calculation step-by-step in the same sentence. "
    "Sentence 3: give one memory trick to remember this rule. "
    "No bullet points. No repetition. Stop after 3 sentences."
)

SUBJECT_NAMES_EN = {
    "math": "Mathematics",
    "history": "History",
    "uzbek": "Uzbek Language",
    "english": "English",
    "physics": "Physics",
    "chemistry": "Chemistry",
    "biology": "Biology",
}


async def _google_translate(text: str, target: str = "uz", source: str = "en") -> str:
    """Translate text using Google Translate's free public endpoint (no API key needed)."""
    import urllib.parse
    url = (
        "https://translate.googleapis.com/translate_a/single"
        f"?client=gtx&sl={source}&tl={target}&dt=t&q={urllib.parse.quote(text)}"
    )
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            r.raise_for_status()
            data = r.json()
            # Response: [[[translated, original, ...], ...], ...]
            translated = "".join(
                part[0] for part in data[0] if part and part[0]
            )
            return translated.strip()
    except Exception:
        return text  # fall back to original if translation fails


async def explain_wrong_answer(
    question_text: str,
    options: List[str],
    correct_index: int,
    selected_index: int,
    subject: str,
    topic: str,
) -> str:
    subject_en = SUBJECT_NAMES_EN.get(subject, subject)
    subject_uz = SUBJECT_NAMES_UZ.get(subject, subject)
    correct_opt = options[correct_index] if correct_index < len(options) else ""
    selected_opt = options[selected_index] if selected_index < len(options) else ""

    # Step 1: generate a clear English explanation (models reason best in English)
    prompt = (
        f"Subject: {subject_en} | Topic: {topic}\n"
        f"Question: {question_text}\n"
        f"Student chose: {selected_opt}  |  Correct: {correct_opt}\n\n"
        f"Write exactly 3 sentences as instructed."
    )

    try:
        english = await _groq_chat(prompt, max_tokens=180, system=ENGLISH_SYSTEM)
        # Clean up any stray markers
        for marker in ["Explanation:", "Answer:", "Step "]:
            if english.startswith(marker):
                english = english[len(marker):].strip()

        # Step 2: translate the English explanation to Uzbek via Google Translate
        uzbek = await _google_translate(english, target="uz", source="en")
        return uzbek

    except Exception:
        return (
            f"Noto'g'ri javob: \"{selected_opt}\".\n"
            f"To'g'ri javob: \"{correct_opt}\".\n"
            f"{topic} mavzusini qayta o'rganib chiqing."
        )


_MONTH_UZ = {1:"Yan",2:"Fev",3:"Mar",4:"Apr",5:"May",6:"Iyn",
             7:"Iyl",8:"Avg",9:"Sen",10:"Okt",11:"Noy",12:"Dek"}

_SUBJECT_ICONS = {
    "math": "📐", "history": "🕌", "uzbek": "✍️",
    "english": "🇬🇧", "physics": "⚛️", "chemistry": "🧪", "biology": "🧬",
}

_DEFAULT_TOPICS = {
    "math":    ["Kvadrat tenglamalar", "Logarifmlar", "Trigonometriya", "Geometriya", "Funksiyalar"],
    "history": ["Amir Temur davri", "Mustaqillik davri", "Sovet davri", "O'rta asrlar", "Qadimgi davr"],
    "uzbek":   ["Gap bo'laklari", "So'z turkumlari", "Imlo qoidalari", "Adabiyot", "Sintaksis"],
    "english": ["Tenses", "Conditionals", "Passive Voice", "Modal verbs", "Vocabulary"],
    "physics": ["Mexanika", "Elektr", "Optika", "Termodinamika", "Atom fizikasi"],
    "chemistry":["Kimyoviy reaksiyalar", "Davriy jadval", "Organik kimyo", "Eritma", "Elektroliz"],
    "biology": ["Hujayra", "Genetika", "Ekologiya", "Evolyutsiya", "Fiziologiya"],
}

def _week_date_label(week_num: int) -> str:
    start = datetime.utcnow() + timedelta(days=(week_num - 1) * 7)
    end   = start + timedelta(days=6)
    if start.month == end.month:
        return f"{start.day}–{end.day} {_MONTH_UZ[start.month]}"
    return f"{start.day} {_MONTH_UZ[start.month]}–{end.day} {_MONTH_UZ[end.month]}"

def _week_theme(week_num: int, total_weeks: int) -> str:
    if week_num == 1:
        return "Eng zaif mavzulardan boshlash"
    if week_num <= max(1, total_weeks // 2):
        return "Asosiy zaifliklarni mustahkamlash"
    if week_num < total_weeks:
        return "O'rtacha mavzularni yaxshilash"
    return "Mock imtihon va umumiy takrorlash"

def build_roadmap(
    weaknesses: list,
    days_remaining: int,
    goal_score: int,
    subjects: list,
) -> dict:
    """Rule-based week-by-week study plan from weakness data."""
    total_weeks = min(8, max(2, max(1, days_remaining) // 7))

    # Deduplicate & sort weaknesses worst-first
    seen: set = set()
    sorted_weak: list = []
    for w in sorted(weaknesses, key=lambda x: x.get("accuracy_pct", 0)):
        key = f"{w.get('subject')}:{w.get('topic')}"
        if key not in seen:
            seen.add(key)
            sorted_weak.append(w)

    # If no real data, build default placeholders from subjects
    has_data = bool(sorted_weak)
    if not has_data:
        for subj in (subjects or ["math", "history", "uzbek"]):
            for topic in _DEFAULT_TOPICS.get(subj, []):   # all 5 topics per subject
                sorted_weak.append({
                    "subject": subj, "topic": topic,
                    "accuracy_pct": None, "priority": "medium",
                })

    weeks = []
    topic_idx = 0

    for wk in range(1, total_weeks + 1):
        is_review = (wk == total_weeks)
        status = "current" if wk == 1 else "upcoming"
        date_label = _week_date_label(wk)

        if is_review:
            weeks.append({
                "week_num": wk,
                "date_label": date_label,
                "theme": "Mock imtihon va umumiy takrorlash 🎯",
                "is_review_week": True,
                "focus_topics": [],
                "status": status,
            })
        else:
            chunk = sorted_weak[topic_idx: topic_idx + 3]
            topic_idx += 3
            # If ran out of topics, cycle from start (review earlier topics)
            if not chunk and sorted_weak:
                chunk = sorted_weak[:2]
            weeks.append({
                "week_num": wk,
                "date_label": date_label,
                "theme": _week_theme(wk, total_weeks),
                "is_review_week": False,
                "focus_topics": [
                    {
                        "subject": t.get("subject", ""),
                        "icon": _SUBJECT_ICONS.get(t.get("subject", ""), "📚"),
                        "topic": t.get("topic", ""),
                        "accuracy_pct": t.get("accuracy_pct"),   # None = no data yet
                        "priority": t.get("priority", "medium"),
                    }
                    for t in chunk
                ],
                "status": status,
            })

    # Current readiness
    valid = [w for w in weaknesses if w.get("accuracy_pct") is not None]
    current_pct = round(sum(w["accuracy_pct"] for w in valid) / len(valid)) if valid else 0
    needed_pct  = min(100, round(goal_score / 2))   # DTM 200-ball → %

    return {
        "weeks": weeks,
        "total_weeks": total_weeks,
        "days_remaining": days_remaining,
        "current_readiness_pct": current_pct,
        "goal_score": goal_score,
        "needed_pct": needed_pct,
        "has_data": has_data,
    }


async def generate_roadmap_advice(
    weaknesses: list,
    days_remaining: int,
    goal_score: int,
    current_pct: int,
) -> str:
    """Short AI-generated motivational + tactical advice for the roadmap."""
    if not weaknesses:
        return (
            f"Mock imtihon yechib, shaxsiy yo'l xaritangizni to'ldiring. "
            f"{days_remaining} kun ichida {goal_score} ballga erishish uchun har kuni 1-2 mavzu ishlang."
        )

    top3 = weaknesses[:3]
    weak_str = ", ".join(
        f"{w.get('topic')} ({w.get('accuracy_pct', '?')}%)" for w in top3
    )
    needed_pct = min(100, round(goal_score / 2))
    gap = max(0, needed_pct - current_pct)

    prompt = (
        f"O'quvchi DTM imtihoniga {days_remaining} kun qoldi. "
        f"Maqsad: {goal_score} ball ({needed_pct}%). Hozirgi holat: {current_pct}% ({gap}% oshirish kerak). "
        f"Eng zaif mavzular: {weak_str}. "
        f"2-3 gap, O'zbekcha, aniq va rag'batlantiruvchi maslahat ber. "
        f"Faqat matn, ro'yxat yoki emoji yo'q:"
    )
    try:
        return await _chat(prompt, max_tokens=180)
    except Exception:
        if gap > 30:
            return (
                f"{days_remaining} kun, {gap}% farq — katta ish bor, lekin mumkin. "
                f"Har kuni eng zaif mavzudan boshlang: {top3[0].get('topic')}."
            )
        return (
            f"Yaxshi yo'ldasiz! {days_remaining} kunda {gap}% oshirish kerak. "
            f"Zaif mavzularga e'tibor bering va har hafta mock imtihon yeching."
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
