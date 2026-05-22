from fastapi import APIRouter
from models.schemas import ExplainRequest
from services.claude_service import explain_wrong_answer, predict_score, build_roadmap, generate_roadmap_advice
from services.supabase_service import db

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/explain")
async def explain_answer(req: ExplainRequest):
    explanation = await explain_wrong_answer(
        question_text=req.question_text,
        options=req.options,
        correct_index=req.correct_index,
        selected_index=req.selected_index,
        subject=req.subject,
        topic=req.topic,
    )
    return {"explanation": explanation}


@router.get("/predict/{user_id}")
async def predict_dtm_score(user_id: str, goal: int = 160):
    try:
        rows = await db.select(
            "mock_sessions",
            f"user_id=eq.{user_id}&order=created_at.desc",
            limit=10,
        )
        return await predict_score(rows, goal)
    except Exception:
        return {"available": False, "message": "Ma'lumot topilmadi"}


@router.get("/roadmap/{user_id}")
async def get_roadmap(
    user_id: str,
    goal_score: int = 160,
    days_remaining: int = 30,
    subjects: str = "math,history,uzbek",
):
    """Return a week-by-week personalised study roadmap."""
    # 1. Fetch weaknesses from Supabase
    try:
        weaknesses = await db.select(
            "weakness_topics",
            f"user_id=eq.{user_id}&order=accuracy_pct.asc",
            limit=20,
        )
    except Exception:
        weaknesses = []

    # 2. Fallback: pull from in-memory session results (if Supabase empty)
    if not weaknesses:
        try:
            from routers.mock import _session_store
            merged: dict[str, dict] = {}
            for session in _session_store.values():
                if session.get("user_id") != user_id:
                    continue
                for w in session.get("result", {}).get("weakness_topics", []):
                    key = f"{w['subject']}:{w['topic']}"
                    if key not in merged or w["accuracy_pct"] < merged[key]["accuracy_pct"]:
                        merged[key] = w
            weaknesses = sorted(merged.values(), key=lambda x: x["accuracy_pct"])
        except Exception:
            weaknesses = []

    subject_list = [s.strip() for s in subjects.split(",") if s.strip()]

    # 3. Build rule-based roadmap (instant)
    roadmap = build_roadmap(weaknesses, days_remaining, goal_score, subject_list)

    # 4. AI advice (fast via Groq)
    advice = await generate_roadmap_advice(
        weaknesses,
        days_remaining,
        goal_score,
        roadmap["current_readiness_pct"],
    )
    roadmap["ai_advice"] = advice
    return roadmap


@router.get("/summary/{user_id}")
async def get_user_summary(user_id: str):
    try:
        weaknesses = await db.select(
            "weakness_topics",
            f"user_id=eq.{user_id}&order=accuracy_pct.asc",
            limit=5,
        )
        sessions = await db.select(
            "mock_sessions",
            f"user_id=eq.{user_id}&order=created_at.desc",
            limit=3,
        )
        scores = [s.get("score_pct", 0) for s in sessions]
        avg_score = int(sum(scores) / len(scores)) if scores else 0
        trend = (scores[0] - scores[-1]) if len(scores) > 1 else 0
        return {
            "avg_score_pct": avg_score,
            "trend": trend,
            "top_weaknesses": weaknesses[:3],
            "session_count": len(sessions),
        }
    except Exception:
        return {"avg_score_pct": 0, "trend": 0, "top_weaknesses": [], "session_count": 0}
