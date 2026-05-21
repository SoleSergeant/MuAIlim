import uuid
from fastapi import APIRouter, Query, HTTPException
from models.schemas import Subject, Difficulty
from services.claude_service import generate_questions
from services.supabase_service import db

router = APIRouter(prefix="/questions", tags=["questions"])

DEMO_QUESTIONS = [
    {
        "id": "q_math_001", "subject": "math", "topic": "Kvadrat tenglamalar",
        "difficulty": "medium", "source": "dtm_2023", "year": 2023,
        "text": "x² - 5x + 6 = 0 tenglamaning ildizlari yig'indisi nechaga teng?",
        "options": ["2", "3", "5", "−5"], "correct_index": 2,
    },
    {
        "id": "q_math_002", "subject": "math", "topic": "Kvadrat tenglamalar",
        "difficulty": "medium", "source": "dtm_2022", "year": 2022,
        "text": "2x² − 8 = 0 tenglamaning musbat ildizi qanday?",
        "options": ["1", "2", "4", "8"], "correct_index": 1,
    },
    {
        "id": "q_math_003", "subject": "math", "topic": "Logarifmlar",
        "difficulty": "hard", "source": "dtm_2023", "year": 2023,
        "text": "log₂(32) ning qiymati nechaga teng?",
        "options": ["3", "4", "5", "6"], "correct_index": 2,
    },
    {
        "id": "q_math_004", "subject": "math", "topic": "Foizlar",
        "difficulty": "easy", "source": "dtm_2021", "year": 2021,
        "text": "400 sonining 25% i nechaga teng?",
        "options": ["25", "50", "100", "200"], "correct_index": 2,
    },
    {
        "id": "q_math_005", "subject": "math", "topic": "Trigonometriya",
        "difficulty": "medium", "source": "ai_generated",
        "text": "sin 30° ning qiymati nechaga teng?",
        "options": ["0", "0.5", "√2/2", "1"], "correct_index": 1,
    },
    {
        "id": "q_hist_001", "subject": "history", "topic": "Amir Temur davri",
        "difficulty": "easy", "source": "dtm_2023", "year": 2023,
        "text": "Amir Temur qaysi yili Samarqandni o'z poytaxtiga aylantirdi?",
        "options": ["1370", "1380", "1395", "1405"], "correct_index": 0,
    },
    {
        "id": "q_hist_002", "subject": "history", "topic": "Amir Temur davri",
        "difficulty": "medium", "source": "dtm_2022", "year": 2022,
        "text": "Temuriylar sulolasining asoschisi kim?",
        "options": ["Ulug'bek", "Shahruh", "Amir Temur", "Boburshoh"], "correct_index": 2,
    },
    {
        "id": "q_hist_003", "subject": "history", "topic": "Mustaqillik davri",
        "difficulty": "easy", "source": "dtm_2023", "year": 2023,
        "text": "O'zbekiston mustaqillikka qaysi yili erishdi?",
        "options": ["1989", "1990", "1991", "1992"], "correct_index": 2,
    },
    {
        "id": "q_hist_004", "subject": "history", "topic": "Qadimgi davr",
        "difficulty": "hard", "source": "dtm_2021", "year": 2021,
        "text": "Yunon-Baqtriya davlati qachon barpo etilgan?",
        "options": ["mil. av. 250-yil", "mil. av. 150-yil", "mil. av. 50-yil", "mil. 100-yil"], "correct_index": 0,
    },
    {
        "id": "q_hist_005", "subject": "history", "topic": "Jadidchilik",
        "difficulty": "medium", "source": "dtm_2022", "year": 2022,
        "text": "Jadidchilik harakatining asosiy maqsadi nima edi?",
        "options": ["Siyosiy mustaqillik", "Ta'limni isloh qilish", "Harbiy kuch", "Savdo rivojlantirish"], "correct_index": 1,
    },
    {
        "id": "q_uzb_001", "subject": "uzbek", "topic": "Imlo qoidalari",
        "difficulty": "easy", "source": "dtm_2023", "year": 2023,
        "text": "Qaysi so'z to'g'ri yozilgan?",
        "options": ["kitob", "kitap", "kittob", "kitoob"], "correct_index": 0,
    },
    {
        "id": "q_uzb_002", "subject": "uzbek", "topic": "Gap bo'laklari",
        "difficulty": "medium", "source": "dtm_2023", "year": 2023,
        "text": "'Oquvchi dars o'qiyapti' gapida ega qaysi so'z?",
        "options": ["dars", "o'qiyapti", "O'quvchi", "o'q"], "correct_index": 2,
    },
    {
        "id": "q_uzb_003", "subject": "uzbek", "topic": "So'z turkumlari",
        "difficulty": "medium", "source": "dtm_2022", "year": 2022,
        "text": "'Chiroyli' so'zi qaysi so'z turkumiga kiradi?",
        "options": ["Ot", "Fe'l", "Sifat", "Ravish"], "correct_index": 2,
    },
    {
        "id": "q_uzb_004", "subject": "uzbek", "topic": "Adabiyot",
        "difficulty": "hard", "source": "dtm_2021", "year": 2021,
        "text": "Alisher Navoiyning eng mashhur asari qaysi?",
        "options": ["Farhod va Shirin", "Xamsa", "Layli va Majnun", "Saddi Iskandariy"], "correct_index": 1,
    },
    {
        "id": "q_uzb_005", "subject": "uzbek", "topic": "Punktuatsiya",
        "difficulty": "easy", "source": "ai_generated",
        "text": "Undalma gapda qanday ajratiladi?",
        "options": ["Nuqta bilan", "Vergul bilan", "Tire bilan", "Ikki nuqta bilan"], "correct_index": 1,
    },
]

_question_store = {q["id"]: q for q in DEMO_QUESTIONS}


@router.get("/mock")
async def get_mock_questions(
    subjects: str = Query("math,history,uzbek"),
    count: int = Query(10, ge=5, le=30),
):
    subject_list = [s.strip() for s in subjects.split(",")]
    result = []
    per_subject = count // len(subject_list)
    remainder = count % len(subject_list)

    for i, subj in enumerate(subject_list):
        target = per_subject + (1 if i < remainder else 0)
        subj_qs = [q for q in DEMO_QUESTIONS if q["subject"] == subj]
        result.extend(subj_qs[:target])

    if len(result) < count:
        extras = [q for q in DEMO_QUESTIONS if q not in result]
        result.extend(extras[: count - len(result)])

    return {"questions": result[:count], "total": len(result[:count])}


@router.get("/personalized")
async def get_personalized_questions(
    topic: str = Query(...),
    subject: str = Query(...),
    count: int = Query(5, ge=3, le=15),
    difficulty: str = Query("medium"),
):
    existing = [
        q for q in DEMO_QUESTIONS
        if q["subject"] == subject and q["topic"].lower() == topic.lower()
    ]

    if len(existing) >= count:
        return {"questions": existing[:count], "source": "database", "total": count}

    try:
        ai_qs = await generate_questions(Subject(subject), topic, count - len(existing), Difficulty(difficulty))
        for q in ai_qs:
            q["id"] = f"ai_{uuid.uuid4().hex[:8]}"
            q["subject"] = subject
            q["source"] = "ai_generated"
            _question_store[q["id"]] = q
        combined = existing + ai_qs
        return {"questions": combined[:count], "source": "mixed", "total": len(combined[:count])}
    except Exception:
        fallback = [q for q in DEMO_QUESTIONS if q["subject"] == subject]
        return {"questions": fallback[:count], "source": "fallback", "total": len(fallback[:count])}


@router.get("/{question_id}")
async def get_question(question_id: str):
    q = _question_store.get(question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return q
