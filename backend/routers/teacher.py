"""
Teacher Mode Router
Endpoints for class management, student progress, custom test creation
"""
import uuid
import random
import string
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.claude_service import generate_questions
from models.schemas import Subject, Difficulty

# ── Fallback question bank (used when Ollama is slow/unavailable) ─
FALLBACK_QUESTIONS: dict[str, list[dict]] = {
    "Kvadrat tenglamalar": [
        {"text": "x² - 5x + 6 = 0 tenglamaning ildizlari yig'indisi?", "options": ["2","3","5","-5"], "correct_index": 2, "difficulty": "medium"},
        {"text": "x² - 9 = 0 tenglamaning musbat ildizi?", "options": ["3","6","9","1"], "correct_index": 0, "difficulty": "easy"},
        {"text": "2x² - 8x = 0 tenglamaning ildizlari?", "options": ["0 va 4","2 va 4","0 va 2","1 va 4"], "correct_index": 0, "difficulty": "medium"},
        {"text": "x² + 4x + 4 = 0 tenglamaning diskriminanti?", "options": ["0","4","16","8"], "correct_index": 0, "difficulty": "easy"},
        {"text": "x² - 6x + 9 = 0 tenglamaning ildizi nechta?", "options": ["0 ta","1 ta","2 ta","3 ta"], "correct_index": 1, "difficulty": "medium"},
        {"text": "Viet formulasi bo'yicha x₁·x₂ = ?", "options": ["b/a","c/a","-b/a","-c/a"], "correct_index": 1, "difficulty": "hard"},
        {"text": "x² + 2x - 3 = 0 ning katta ildizi qaysi?", "options": ["-3","1","2","-1"], "correct_index": 1, "difficulty": "medium"},
        {"text": "D > 0 bo'lsa ildizlar soni?", "options": ["0","1","2","3"], "correct_index": 2, "difficulty": "easy"},
    ],
    "Logarifm": [
        {"text": "log₂8 = ?", "options": ["2","3","4","6"], "correct_index": 1, "difficulty": "easy"},
        {"text": "log₁₀100 = ?", "options": ["1","2","10","20"], "correct_index": 1, "difficulty": "easy"},
        {"text": "logₐ1 = ?", "options": ["0","1","a","−1"], "correct_index": 0, "difficulty": "easy"},
        {"text": "log₂(8·4) = ?", "options": ["5","6","7","8"], "correct_index": 2, "difficulty": "medium"},
        {"text": "log₃81 = ?", "options": ["3","4","9","27"], "correct_index": 1, "difficulty": "medium"},
        {"text": "ln(e²) = ?", "options": ["1","2","e","e²"], "correct_index": 1, "difficulty": "medium"},
        {"text": "log₂(1/8) = ?", "options": ["3","-3","1/3","-1/3"], "correct_index": 1, "difficulty": "hard"},
        {"text": "logₐ(x·y) = ?", "options": ["logₐx + logₐy","logₐx · logₐy","logₐx - logₐy","logₐ(x+y)"], "correct_index": 0, "difficulty": "hard"},
    ],
    "Trigonometriya": [
        {"text": "sin 90° = ?", "options": ["0","1","√2/2","√3/2"], "correct_index": 1, "difficulty": "easy"},
        {"text": "cos 0° = ?", "options": ["0","1","-1","1/2"], "correct_index": 1, "difficulty": "easy"},
        {"text": "sin²α + cos²α = ?", "options": ["0","1","2","sin2α"], "correct_index": 1, "difficulty": "easy"},
        {"text": "sin 30° = ?", "options": ["√3/2","1/2","1","0"], "correct_index": 1, "difficulty": "easy"},
        {"text": "tan 45° = ?", "options": ["0","√3","1","1/√3"], "correct_index": 2, "difficulty": "medium"},
        {"text": "cos 60° = ?", "options": ["1/2","√3/2","1","0"], "correct_index": 0, "difficulty": "medium"},
        {"text": "sin 2α = ?", "options": ["2sinα","2sinαcosα","sin²α - cos²α","2cosα"], "correct_index": 1, "difficulty": "hard"},
        {"text": "cos(π) = ?", "options": ["0","1","-1","π"], "correct_index": 2, "difficulty": "medium"},
    ],
    "Gap bo'laklari": [
        {"text": "'O'quvchi dars o'qiyapti' — ega qaysi?", "options": ["dars","o'qiyapti","O'quvchi","o'q"], "correct_index": 2, "difficulty": "easy"},
        {"text": "Kesim gapning qaysi bo'lagi?", "options": ["Ega","Kesim","To'ldiruvchi","Aniqlovchi"], "correct_index": 1, "difficulty": "easy"},
        {"text": "To'ldiruvchi necha turli bo'ladi?", "options": ["2","3","4","5"], "correct_index": 0, "difficulty": "medium"},
        {"text": "'Katta kitob' — 'katta' qaysi bo'lak?", "options": ["Ega","Aniqlovchi","Kesim","Hol"], "correct_index": 1, "difficulty": "easy"},
        {"text": "Hol 'qayerda, qachon, qanday' savollariga javob bersa, turi?", "options": ["O'rin holi","Payt holi","Holat holi","Daraja holi"], "correct_index": 2, "difficulty": "hard"},
        {"text": "Ikkinchi darajali gap bo'laklari nechtadan iborat?", "options": ["2","3","4","5"], "correct_index": 2, "difficulty": "medium"},
        {"text": "'Tez yugurdi' — 'tez' qaysi bo'lak?", "options": ["Aniqlovchi","Hol","To'ldiruvchi","Ega"], "correct_index": 1, "difficulty": "easy"},
        {"text": "Undalma gapning qaysi bo'lagi?", "options": ["Hech qaysi","Ega","Kesim","Aniqlovchi"], "correct_index": 0, "difficulty": "hard"},
    ],
    "So'z turkumlari": [
        {"text": "'Chiroyli' so'zi qaysi turkumga kiradi?", "options": ["Ot","Fe'l","Sifat","Ravish"], "correct_index": 2, "difficulty": "easy"},
        {"text": "'Tez' so'zi qaysi turkumga kiradi?", "options": ["Sifat","Ravish","Ot","Fe'l"], "correct_index": 1, "difficulty": "easy"},
        {"text": "'O'qimoq' qaysi turkum?", "options": ["Ot","Sifat","Fe'l","Olmosh"], "correct_index": 2, "difficulty": "easy"},
        {"text": "Olmoshning asosiy vazifasi?", "options": ["Belgi bildirish","Ot o'rnida kelish","Harakat bildirish","Son bildirish"], "correct_index": 1, "difficulty": "medium"},
        {"text": "'Besh' so'zi qaysi turkum?", "options": ["Ot","Son","Sifat","Ravish"], "correct_index": 1, "difficulty": "easy"},
        {"text": "Modal so'zlar qaysi turkumga kiradi?", "options": ["Ot","Fe'l","Yordamchi so'zlar","Ravish"], "correct_index": 2, "difficulty": "hard"},
        {"text": "'Men' so'zi qaysi olmosh turi?", "options": ["Ko'rsatish","So'roq","Shaxs-son","Bo'lishsizlik"], "correct_index": 2, "difficulty": "medium"},
        {"text": "Sifat qaysi savolga javob beradi?", "options": ["Kim?","Nima?","Qanday?","Qayer?"], "correct_index": 2, "difficulty": "easy"},
    ],
    "Geometriya": [
        {"text": "To'g'ri to'rtburchakning yuzasi?", "options": ["a+b","2(a+b)","a·b","a²"], "correct_index": 2, "difficulty": "easy"},
        {"text": "Aylana uzunligi?", "options": ["πr","2πr","πr²","2πr²"], "correct_index": 1, "difficulty": "easy"},
        {"text": "Uchburchak ichki burchaklari yig'indisi?", "options": ["90°","180°","270°","360°"], "correct_index": 1, "difficulty": "easy"},
        {"text": "To'g'ri burchakli uchburchakda Pifagor teoremasi?", "options": ["a+b=c","a²+b²=c²","a·b=c","a²-b²=c²"], "correct_index": 1, "difficulty": "medium"},
        {"text": "Kvadrat yuzi a tomonli bo'lsa?", "options": ["4a","a²","2a","a³"], "correct_index": 1, "difficulty": "easy"},
        {"text": "Doira yuzi?", "options": ["πr","2πr","πr²","πd"], "correct_index": 2, "difficulty": "medium"},
        {"text": "Muntazam olti burchak necha simmetriya o'qi?", "options": ["3","6","12","1"], "correct_index": 1, "difficulty": "hard"},
        {"text": "Ikki parallel to'g'ri chiziq kesuvchi bilan hosil qilgan al-ichki burchaklar?", "options": ["Teng","Qo'shma","To'liq","Ikkilamchi"], "correct_index": 0, "difficulty": "hard"},
    ],
    "Imlo qoidalari": [
        {"text": "Qaysi so'z to'g'ri yozilgan?", "options": ["kitob","kitap","kittob","kitoob"], "correct_index": 0, "difficulty": "easy"},
        {"text": "'O'zbek' so'zida nechta o'ziga xos harf?", "options": ["1","2","3","4"], "correct_index": 1, "difficulty": "medium"},
        {"text": "Qaysi so'z bir o'zakdan yasalmagan?", "options": ["o'quvchi","o'qituvchi","o'qimishli","yozuvchi"], "correct_index": 3, "difficulty": "hard"},
        {"text": "Bosh harf bilan yoziladigan so'z?", "options": ["kitob","toshkent","Toshkent","maktab"], "correct_index": 2, "difficulty": "easy"},
        {"text": "Qo'shma so'z qanday yoziladi?", "options": ["har doim qo'shib","har doim ajratib","vaziyatga qarab","doim defis bilan"], "correct_index": 2, "difficulty": "hard"},
        {"text": "'Sog'liq' so'zidagi tutuq belgisi nima uchun?", "options": ["Estetik","Talaffuzni ko'rsatish","Harfni ajratish","Qoida yo'q"], "correct_index": 1, "difficulty": "medium"},
    ],
    "Amir Temur davri": [
        {"text": "Amir Temur qaysi yili Samarqandni poytaxt qildi?", "options": ["1360","1370","1380","1395"], "correct_index": 1, "difficulty": "easy"},
        {"text": "Temuriylar sulolasining asoschisi kim?", "options": ["Ulug'bek","Shahruh","Amir Temur","Boburshoh"], "correct_index": 2, "difficulty": "easy"},
        {"text": "Amir Temur qaysi davlatga qo'shin tortdi va g'alaba qozondi?", "options": ["Xitoy","Hindiston","Oltin O'rda","Barchasiga"], "correct_index": 3, "difficulty": "medium"},
        {"text": "Bibixonim masjidi qaysi shahrida?", "options": ["Buxoro","Toshkent","Samarqand","Qo'qon"], "correct_index": 2, "difficulty": "easy"},
        {"text": "Temur qachon vafot etdi?", "options": ["1400","1405","1410","1415"], "correct_index": 1, "difficulty": "medium"},
    ],
}

def _get_fallback_questions(topic: str, subject: str, count: int, difficulty: str) -> list[dict]:
    """Return pre-built questions for a topic, filtered by difficulty if possible."""
    bank = FALLBACK_QUESTIONS.get(topic, [])
    if not bank:
        # Search partial match
        for key in FALLBACK_QUESTIONS:
            if key.lower() in topic.lower() or topic.lower() in key.lower():
                bank = FALLBACK_QUESTIONS[key]
                break
    if not bank:
        return []
    # Prefer matching difficulty, then fall back to all
    filtered = [q for q in bank if q.get("difficulty") == difficulty] or bank
    random.shuffle(filtered)
    return filtered[:count]

router = APIRouter(prefix="/teacher", tags=["teacher"])

# ── In-memory stores ──────────────────────────────────────────────
_classes: dict[str, dict] = {}
_custom_tests: dict[str, dict] = {}

# Demo class pre-loaded for hackathon
DEMO_CLASS_CODE = "MUA-2026"
_classes[DEMO_CLASS_CODE] = {
    "code": DEMO_CLASS_CODE,
    "teacher_id": "teacher_demo",
    "teacher_name": "Abdullayev S.",
    "subject": "math",
    "grade_levels": ["5-9", "10-11"],
    "students": [
        {
            "id": "s1", "name": "Kamola Yusupova",
            "score_pct": 72, "streak": 5,
            "mock_count": 4,
            "avg_time_per_q": 58,
            "weak_topics": [
                {"topic": "Kvadrat tenglamalar", "accuracy_pct": 33, "priority": "high"},
                {"topic": "Logarifm", "accuracy_pct": 45, "priority": "high"},
            ],
            "by_subject": {"math": {"correct": 21, "total": 30}},
        },
        {
            "id": "s2", "name": "Bobur Rahimov",
            "score_pct": 55, "streak": 2,
            "mock_count": 2,
            "avg_time_per_q": 74,
            "weak_topics": [
                {"topic": "Geometriya", "accuracy_pct": 28, "priority": "high"},
                {"topic": "Trigonometriya", "accuracy_pct": 40, "priority": "high"},
            ],
            "by_subject": {"math": {"correct": 16, "total": 30}},
        },
        {
            "id": "s3", "name": "Malika Toshmatova",
            "score_pct": 88, "streak": 14,
            "mock_count": 7,
            "avg_time_per_q": 44,
            "weak_topics": [
                {"topic": "Integral", "accuracy_pct": 60, "priority": "medium"},
            ],
            "by_subject": {"math": {"correct": 26, "total": 30}},
        },
        {
            "id": "s4", "name": "Jasur Mirzayev",
            "score_pct": 61, "streak": 7,
            "mock_count": 5,
            "avg_time_per_q": 63,
            "weak_topics": [
                {"topic": "Logarifm", "accuracy_pct": 35, "priority": "high"},
                {"topic": "Funksiyalar", "accuracy_pct": 50, "priority": "medium"},
            ],
            "by_subject": {"math": {"correct": 18, "total": 30}},
        },
        {
            "id": "s5", "name": "Zulfiya Nazarova",
            "score_pct": 79, "streak": 3,
            "mock_count": 3,
            "avg_time_per_q": 51,
            "weak_topics": [
                {"topic": "Trigonometriya", "accuracy_pct": 55, "priority": "medium"},
            ],
            "by_subject": {"math": {"correct": 23, "total": 30}},
        },
    ],
}


def _generate_code() -> str:
    letters = "".join(random.choices(string.ascii_uppercase, k=3))
    digits = "".join(random.choices(string.digits, k=4))
    return f"{letters}-{digits}"


# ── Endpoints ─────────────────────────────────────────────────────

class CreateClassBody(BaseModel):
    teacher_id: str
    teacher_name: str
    subject: str
    grade_levels: list[str]


@router.post("/class")
async def create_class(body: CreateClassBody):
    # Check if teacher already has a class
    for cls in _classes.values():
        if cls["teacher_id"] == body.teacher_id:
            return cls

    code = _generate_code()
    cls = {
        "code": code,
        "teacher_id": body.teacher_id,
        "teacher_name": body.teacher_name,
        "subject": body.subject,
        "grade_levels": body.grade_levels,
        "students": [],
    }
    _classes[code] = cls
    return cls


@router.get("/class/{code}")
async def get_class(code: str):
    cls = _classes.get(code.upper())
    if not cls:
        raise HTTPException(status_code=404, detail="Sinf topilmadi")
    return cls


@router.get("/class/{code}/stats")
async def get_class_stats(code: str):
    cls = _classes.get(code.upper())
    if not cls:
        raise HTTPException(status_code=404, detail="Sinf topilmadi")

    students = cls["students"]
    if not students:
        return {"total": 0, "avg_score": 0, "top_student": None, "common_weak_topic": None}

    avg_score = round(sum(s["score_pct"] for s in students) / len(students))
    top = max(students, key=lambda s: s["score_pct"])

    # Most common weak topic
    topic_counts: dict[str, int] = {}
    for s in students:
        for w in s.get("weak_topics", []):
            t = w["topic"]
            topic_counts[t] = topic_counts.get(t, 0) + 1
    common_weak = max(topic_counts, key=topic_counts.get) if topic_counts else None

    struggling = [s for s in students if s["score_pct"] < 60]

    return {
        "total_students": len(students),
        "avg_score_pct": avg_score,
        "top_student": {"name": top["name"], "score_pct": top["score_pct"]},
        "common_weak_topic": common_weak,
        "struggling_count": len(struggling),
        "mock_count_avg": round(sum(s.get("mock_count", 0) for s in students) / len(students)),
    }


@router.get("/student/{student_id}")
async def get_student(code: str, student_id: str):
    cls = _classes.get(code.upper())
    if not cls:
        raise HTTPException(status_code=404, detail="Sinf topilmadi")
    student = next((s for s in cls["students"] if s["id"] == student_id), None)
    if not student:
        raise HTTPException(status_code=404, detail="O'quvchi topilmadi")
    return student


class JoinClassBody(BaseModel):
    student_id: str
    student_name: str


@router.post("/class/{code}/join")
async def join_class(code: str, body: JoinClassBody):
    cls = _classes.get(code.upper())
    if not cls:
        raise HTTPException(status_code=404, detail="Noto'g'ri sinf kodi")
    # Check already joined
    if any(s["id"] == body.student_id for s in cls["students"]):
        return {"joined": True, "class": cls}
    cls["students"].append({
        "id": body.student_id,
        "name": body.student_name,
        "score_pct": 0,
        "streak": 0,
        "mock_count": 0,
        "avg_time_per_q": 0,
        "weak_topics": [],
        "by_subject": {},
    })
    return {"joined": True, "class": cls}


class CreateTestBody(BaseModel):
    teacher_id: str
    subject: str
    topic: str
    grade: str
    difficulty: str = "medium"
    question_count: int = 10
    title: str = ""


@router.post("/test")
async def create_custom_test(body: CreateTestBody):
    test_id = f"test_{uuid.uuid4().hex[:8]}"

    # Try fallback bank first (instant), then AI if count not met
    questions = _get_fallback_questions(body.topic, body.subject, body.question_count, body.difficulty)

    if len(questions) < body.question_count:
        try:
            ai_qs = await generate_questions(
                Subject(body.subject),
                body.topic,
                body.question_count - len(questions),
                Difficulty(body.difficulty)
            )
            questions = questions + ai_qs
        except Exception:
            pass

    questions = questions[:body.question_count]

    # Assign IDs
    for i, q in enumerate(questions):
        q["id"] = f"{test_id}_q{i}"
        q["subject"] = body.subject
        q["source"] = "teacher_custom"

    test = {
        "id": test_id,
        "teacher_id": body.teacher_id,
        "title": body.title or f"{body.topic} — {body.grade} sinf",
        "subject": body.subject,
        "topic": body.topic,
        "grade": body.grade,
        "difficulty": body.difficulty,
        "questions": questions,
        "question_count": len(questions),
        "created_at": str(uuid.uuid4()),  # placeholder timestamp
    }
    _custom_tests[test_id] = test
    return test


@router.get("/test/{test_id}")
async def get_test(test_id: str):
    test = _custom_tests.get(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test topilmadi")
    return test


@router.get("/tests/{teacher_id}")
async def list_teacher_tests(teacher_id: str):
    tests = [
        {k: v for k, v in t.items() if k != "questions"}
        for t in _custom_tests.values()
        if t["teacher_id"] == teacher_id
    ]
    return {"tests": tests}


@router.get("/take/{test_id}")
async def take_test(test_id: str):
    """Return test questions for students — correct_index is hidden."""
    test = _custom_tests.get(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test topilmadi. Kodni tekshiring.")
    student_qs = [
        {k: v for k, v in q.items() if k != "correct_index"}
        for q in test["questions"]
    ]
    return {
        "id": test["id"],
        "title": test["title"],
        "subject": test["subject"],
        "topic": test["topic"],
        "grade": test["grade"],
        "question_count": test["question_count"],
        "questions": student_qs,
        # Include answers separately so student screen can show results after submit
        "_answer_key": {q["id"]: q["correct_index"] for q in test["questions"]},
    }


class SubmitTestBody(BaseModel):
    student_id: str
    student_name: str
    answers: list[dict]  # [{question_id, selected_index}]


@router.post("/submit-test/{test_id}")
async def submit_teacher_test(test_id: str, body: SubmitTestBody):
    test = _custom_tests.get(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test topilmadi")

    correct = sum(
        1 for ans in body.answers
        if next((q for q in test["questions"] if q["id"] == ans.get("question_id")), {}).get("correct_index") == ans.get("selected_index")
    )
    total = len(body.answers)
    score_pct = int(correct / total * 100) if total else 0

    result = {
        "student_id": body.student_id,
        "student_name": body.student_name,
        "correct": correct,
        "total": total,
        "score_pct": score_pct,
    }
    test.setdefault("results", []).append(result)

    return {
        "test_id": test_id,
        "title": test["title"],
        "correct": correct,
        "total": total,
        "score_pct": score_pct,
    }


@router.get("/class/{code}/tests")
async def get_class_tests(code: str):
    """Return all published tests by the teacher of this class."""
    cls = _classes.get(code.upper())
    if not cls:
        raise HTTPException(status_code=404, detail="Sinf topilmadi")
    teacher_id = cls["teacher_id"]
    tests = [
        {k: v for k, v in t.items() if k != "questions"}
        for t in _custom_tests.values()
        if t["teacher_id"] == teacher_id
    ]
    return {"tests": tests}
