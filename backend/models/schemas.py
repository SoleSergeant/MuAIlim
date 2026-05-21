from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class ExamType(str, Enum):
    dtm = "dtm"
    attestat_9 = "attestat_9"
    teacher = "teacher"
    national_cert = "national_cert"


class Subject(str, Enum):
    math = "math"
    history = "history"
    uzbek = "uzbek"
    english = "english"
    physics = "physics"
    chemistry = "chemistry"
    biology = "biology"


class Difficulty(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class Question(BaseModel):
    id: str
    subject: Subject
    topic: str
    difficulty: Difficulty
    text: str
    options: List[str]
    correct_index: int
    source: str = "ai_generated"
    year: Optional[int] = None


class MockSubmitAnswer(BaseModel):
    question_id: str
    selected_index: int
    time_spent_seconds: int


class MockSubmitRequest(BaseModel):
    session_id: str
    user_id: str
    answers: List[MockSubmitAnswer]


class WeaknessTopic(BaseModel):
    subject: Subject
    topic: str
    accuracy_pct: int
    question_count: int
    priority: str


class MockResult(BaseModel):
    session_id: str
    total_questions: int
    correct_count: int
    score_pct: int
    by_subject: dict
    weakness_topics: List[WeaknessTopic]
    predicted_dtm_score: Optional[float] = None
    ai_summary: str


class PersonalizedTestRequest(BaseModel):
    user_id: str
    topic: str
    subject: Subject
    count: int = 5


class ExplainRequest(BaseModel):
    question_text: str
    options: List[str]
    correct_index: int
    selected_index: int
    subject: Subject
    topic: str


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    display_name: str
    score: int
    streak: int
    exam_type: ExamType


class UserProfile(BaseModel):
    user_id: str
    exam_type: ExamType
    subjects: List[Subject]
    goal_score: int
    exam_date: str
    streak: int = 0
    is_premium: bool = False
