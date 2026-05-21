from fastapi import APIRouter, Query
from services.supabase_service import db

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

DEMO_LEADERBOARD = [
    {"rank": 1, "user_id": "demo_jasur", "display_name": "Jasur T.", "score": 2840, "streak": 12, "exam_type": "dtm"},
    {"rank": 2, "user_id": "demo_malika", "display_name": "Malika S.", "score": 2690, "streak": 8, "exam_type": "dtm"},
    {"rank": 3, "user_id": "demo_bobur", "display_name": "Bobur A.", "score": 2510, "streak": 5, "exam_type": "dtm"},
    {"rank": 4, "user_id": "demo_zulfiya", "display_name": "Zulfiya N.", "score": 2340, "streak": 15, "exam_type": "dtm"},
    {"rank": 5, "user_id": "demo_sardor", "display_name": "Sardor U.", "score": 2180, "streak": 3, "exam_type": "dtm"},
]


@router.get("/")
async def get_leaderboard(
    exam_type: str = Query("dtm"),
    user_id: str = Query(None),
    limit: int = Query(10),
):
    try:
        rows = await db.select(
            "leaderboard_scores",
            f"exam_type=eq.{exam_type}&order=score.desc",
            limit=limit,
        )
        if rows:
            for i, row in enumerate(rows):
                row["rank"] = i + 1
            return {"entries": rows, "source": "database"}
    except Exception:
        pass

    entries = DEMO_LEADERBOARD[:limit]
    user_rank = None
    if user_id:
        for e in entries:
            if e["user_id"] == user_id:
                user_rank = e["rank"]
                break
    return {"entries": entries, "user_rank": user_rank, "source": "demo"}


@router.post("/update-score")
async def update_score(user_id: str, display_name: str, points: int, exam_type: str = "dtm"):
    try:
        await db.upsert("leaderboard_scores", {
            "user_id": user_id,
            "display_name": display_name,
            "exam_type": exam_type,
            "score": points,
        })
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
