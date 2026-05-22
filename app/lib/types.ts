export type ExamType = 'dtm' | 'attestat_9' | 'teacher' | 'national_cert';
export type Subject = 'math' | 'history' | 'uzbek' | 'english' | 'physics' | 'chemistry' | 'biology';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  subject: Subject;
  topic: string;
  difficulty: Difficulty;
  text: string;
  options: string[];
  correct_index: number;
  source: string;
  year?: number;
}

export interface MockAnswer {
  question_id: string;
  selected_index: number;
  time_spent_seconds: number;
}

export interface WeaknessTopic {
  subject: Subject;
  topic: string;
  accuracy_pct: number;
  question_count: number;
  priority: 'high' | 'medium' | 'low';
}

export interface WrongQuestion {
  question_id: string;
  text: string;
  options: string[];
  correct_index: number;
  selected_index: number;
  subject: Subject;
  topic: string;
  difficulty: Difficulty;
  time_spent_secs: number;
}

export interface MockResult {
  session_id: string;
  total_questions: number;
  correct_count: number;
  score_pct: number;
  by_subject: Record<string, { correct: number; total: number; total_secs?: number }>;
  weakness_topics: WeaknessTopic[];
  predicted_dtm_score?: number;
  ai_summary: string;
  timing?: {
    total_secs: number;
    avg_per_question: number;
    by_difficulty: Record<string, number>;
    flags: string[];
  };
  wrong_questions?: WrongQuestion[];
}

export interface RoadmapTopic {
  subject: string;
  icon: string;
  topic: string;
  accuracy_pct: number | null;
  priority: 'high' | 'medium' | 'low';
}

export interface RoadmapWeek {
  week_num: number;
  date_label: string;
  theme: string;
  is_review_week: boolean;
  focus_topics: RoadmapTopic[];
  status: 'current' | 'upcoming';
}

export interface Roadmap {
  weeks: RoadmapWeek[];
  total_weeks: number;
  days_remaining: number;
  current_readiness_pct: number;
  goal_score: number;
  needed_pct: number;
  has_data: boolean;
  ai_advice: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  score: number;
  streak: number;
  exam_type: ExamType;
}

export interface UserProfile {
  user_id: string;
  display_name: string;
  exam_type: ExamType;
  subjects: Subject[];
  goal_score: number;
  exam_date: string;
  streak: number;
  is_premium: boolean;
  grade_levels?: string[]; // teacher only: ['1-4', '5-9', '10-11']
}

export const SUBJECT_LABELS: Record<Subject, string> = {
  math: 'Matematika',
  history: 'Tarix',
  uzbek: 'Ona tili',
  english: 'Ingliz tili',
  physics: 'Fizika',
  chemistry: 'Kimyo',
  biology: 'Biologiya',
};

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  dtm: 'Kirish imtixoni',
  attestat_9: 'Attestat (9-sinf)',
  teacher: "O'qituvchi attestati",
  national_cert: 'Milliy sertifikat',
};
