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


async def _chat(prompt: str, max_tokens: int = 1000) -> str:
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "options": {"num_predict": max_tokens, "temperature": 0.7},
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
    from models.schemas import MockSubmitAnswer
    q_map = {q["id"]: q for q in questions}
    wrong_topics: dict[str, dict] = {}
    by_subject: dict[str, dict] = {}

    for ans in answers:
        q = q_map.get(ans.question_id, {})
        subj = q.get("subject", "unknown")
        topic = q.get("topic", "Noma'lum mavzu")
        is_correct = ans.selected_index == q.get("correct_index", -1)

        if subj not in by_subject:
            by_subject[subj] = {"correct": 0, "total": 0}
        by_subject[subj]["total"] += 1
        if is_correct:
            by_subject[subj]["correct"] += 1

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

    subject_summary = "\n".join(
        f"- {SUBJECT_NAMES_UZ.get(s, s)}: {v['correct']}/{v['total']} to'g'ri"
        for s, v in by_subject.items()
    )
    weak_summary = "\n".join(
        f"- {SUBJECT_NAMES_UZ.get(w['subject'], w['subject'])}: {w['topic']} — {w['accuracy_pct']}%"
        for w in weaknesses[:5]
    ) or "Zaif mavzu aniqlanmadi"

    prompt = f"""O'quvchi mock imtihon natijalarini tahlil qil va qisqa, motivatsiyali xulosa yaz (O'zbekcha, 3-4 gap).

Natijalar:
Jami: {correct}/{total} ({score_pct}%)
{subject_summary}

Zaif mavzular:
{weak_summary}

Maqsad: {user_goal} ball

Xulosa (faqat matn, JSON emas):"""

    try:
        ai_summary = await _chat(prompt, max_tokens=300)
    except Exception:
        ai_summary = f"Siz {score_pct}% natija ko'rsatdingiz. Zaif mavzularni ko'proq mashq qiling!"

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

    prompt = f"""O'quvchi quyidagi savolga xato javob berdi. O'zbekcha, tushunarli tilda tushuntir (3-5 gap).

Fan: {subject_uz}
Mavzu: {topic}
Savol: {question_text}
To'g'ri javob: {correct_opt}
O'quvchi tanlagan: {selected_opt}

Tushuntirish (faqat matn):"""

    try:
        return await _chat(prompt, max_tokens=400)
    except Exception:
        return f"To'g'ri javob: {correct_opt}. Bu mavzuni qayta ko'rib chiqing."


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
