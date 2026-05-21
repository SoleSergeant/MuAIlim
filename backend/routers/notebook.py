import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Query
from services.supabase_service import db

router = APIRouter(prefix="/notebook", tags=["notebook"])

_notebook_store: dict[str, list] = {}


def _next_review(interval_days: int) -> str:
    return (datetime.utcnow() + timedelta(days=interval_days)).isoformat()


@router.post("/add")
async def add_to_notebook(
    user_id: str,
    question_id: str,
    question_text: str,
    correct_answer: str,
    subject: str,
    topic: str,
):
    entry = {
        "id": uuid.uuid4().hex,
        "user_id": user_id,
        "question_id": question_id,
        "question_text": question_text,
        "correct_answer": correct_answer,
        "subject": subject,
        "topic": topic,
        "repetition": 0,
        "interval_days": 1,
        "next_review": _next_review(1),
        "mastered": False,
    }
    if user_id not in _notebook_store:
        _notebook_store[user_id] = []
    _notebook_store[user_id].append(entry)

    try:
        await db.insert("error_notebook", entry)
    except Exception:
        pass

    return entry


@router.get("/due/{user_id}")
async def get_due_cards(user_id: str, limit: int = Query(10)):
    now = datetime.utcnow().isoformat()
    entries = _notebook_store.get(user_id, [])
    due = [e for e in entries if not e["mastered"] and e["next_review"] <= now]
    return {"cards": due[:limit], "total_due": len(due)}


@router.post("/review/{card_id}")
async def review_card(card_id: str, user_id: str, correct: bool):
    entries = _notebook_store.get(user_id, [])
    for entry in entries:
        if entry["id"] == card_id:
            if correct:
                entry["repetition"] += 1
                intervals = [1, 3, 7, 14, 30]
                rep = min(entry["repetition"], len(intervals) - 1)
                entry["interval_days"] = intervals[rep]
                if entry["repetition"] >= len(intervals):
                    entry["mastered"] = True
            else:
                entry["repetition"] = 0
                entry["interval_days"] = 1
            entry["next_review"] = _next_review(entry["interval_days"])
            return entry
    return {"error": "Card not found"}


@router.get("/stats/{user_id}")
async def get_notebook_stats(user_id: str):
    entries = _notebook_store.get(user_id, [])
    by_topic: dict[str, dict] = {}
    for e in entries:
        key = f"{e['subject']}:{e['topic']}"
        if key not in by_topic:
            by_topic[key] = {"subject": e["subject"], "topic": e["topic"], "total": 0, "mastered": 0}
        by_topic[key]["total"] += 1
        if e["mastered"]:
            by_topic[key]["mastered"] += 1
    return {
        "total_cards": len(entries),
        "mastered": sum(1 for e in entries if e["mastered"]),
        "by_topic": list(by_topic.values()),
    }
