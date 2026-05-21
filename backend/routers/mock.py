import uuid
from fastapi import APIRouter, HTTPException
from models.schemas import MockSubmitRequest, MockResult
from services.claude_service import analyze_mock_results
from services.supabase_service import db
from routers.questions import DEMO_QUESTIONS, _question_store

router = APIRouter(prefix="/mock", tags=["mock"])

_session_store: dict[str, dict] = {}


@router.post("/start")
async def start_mock_session(user_id: str, exam_type: str = "dtm"):
    session_id = uuid.uuid4().hex
    _session_store[session_id] = {
        "session_id": session_id,
        "user_id": user_id,
        "exam_type": exam_type,
        "status": "active",
    }
    return {"session_id": session_id}


@router.post("/submit")
async def submit_mock(req: MockSubmitRequest):
    questions = list(_question_store.values())
    if not questions:
        questions = DEMO_QUESTIONS

    result = await analyze_mock_results(req.answers, questions)

    _session_store[req.session_id] = {
        **_session_store.get(req.session_id, {}),
        "result": result,
        "status": "completed",
    }

    try:
        await db.insert("mock_sessions", {
            "id": req.session_id,
            "user_id": req.user_id,
            "score_pct": result["score_pct"],
            "correct_count": result["correct_count"],
            "total_questions": result["total_questions"],
            "ai_summary": result["ai_summary"],
        })
        for w in result["weakness_topics"]:
            await db.upsert("weakness_topics", {
                "user_id": req.user_id,
                "subject": w["subject"],
                "topic": w["topic"],
                "accuracy_pct": w["accuracy_pct"],
                "question_count": w["question_count"],
                "priority": w["priority"],
            })
    except Exception:
        pass

    return {**result, "session_id": req.session_id}


@router.get("/result/{session_id}")
async def get_result(session_id: str):
    session = _session_store.get(session_id)
    if not session or "result" not in session:
        raise HTTPException(status_code=404, detail="Session not found or not completed")
    return {**session["result"], "session_id": session_id}


@router.get("/history/{user_id}")
async def get_history(user_id: str, limit: int = 10):
    try:
        rows = await db.select("mock_sessions", f"user_id=eq.{user_id}", limit=limit)
        return {"sessions": rows}
    except Exception:
        return {"sessions": []}


@router.get("/weakness/{user_id}")
async def get_weakness_map(user_id: str):
    try:
        rows = await db.select("weakness_topics", f"user_id=eq.{user_id}&order=accuracy_pct.asc", limit=20)
        return {"weaknesses": rows}
    except Exception:
        return {"weaknesses": []}
