import Constants from 'expo-constants';
import { MockAnswer, Question, MockResult, LeaderboardEntry, WeaknessTopic, Roadmap } from './types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getMockQuestions: (subjects = 'math,history,uzbek', count = 10) =>
    req<{ questions: Question[]; total: number }>(
      `/api/questions/mock?subjects=${subjects}&count=${count}`
    ),

  startMock: (user_id: string, exam_type = 'dtm') =>
    req<{ session_id: string }>(`/api/mock/start?user_id=${user_id}&exam_type=${exam_type}`, {
      method: 'POST',
    }),

  submitMock: (session_id: string, user_id: string, answers: MockAnswer[]) =>
    req<MockResult & { session_id: string }>('/api/mock/submit', {
      method: 'POST',
      body: JSON.stringify({ session_id, user_id, answers }),
    }),

  getMockResult: (session_id: string) =>
    req<MockResult & { session_id: string }>(`/api/mock/result/${session_id}`),

  getMockHistory: (user_id: string) =>
    req<{ sessions: any[] }>(`/api/mock/history/${user_id}`),

  getWeaknessMap: (user_id: string) =>
    req<{ weaknesses: WeaknessTopic[] }>(`/api/mock/weakness/${user_id}`),

  getPersonalizedQuestions: (topic: string, subject: string, count = 5) =>
    req<{ questions: Question[]; source: string; total: number }>(
      `/api/questions/personalized?topic=${encodeURIComponent(topic)}&subject=${subject}&count=${count}`
    ),

  explainAnswer: (payload: {
    question_text: string;
    options: string[];
    correct_index: number;
    selected_index: number;
    subject: string;
    topic: string;
  }) =>
    req<{ explanation: string }>('/api/analysis/explain', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  predictScore: (user_id: string, goal = 160) =>
    req<any>(`/api/analysis/predict/${user_id}?goal=${goal}`),

  getLeaderboard: (exam_type = 'dtm', user_id?: string) =>
    req<{ entries: LeaderboardEntry[]; user_rank?: number; source: string }>(
      `/api/leaderboard/?exam_type=${exam_type}${user_id ? `&user_id=${user_id}` : ''}`
    ),

  updateLeaderboardScore: (user_id: string, display_name: string, points: number) =>
    req('/api/leaderboard/update-score', {
      method: 'POST',
      body: JSON.stringify({ user_id, display_name, points, exam_type: 'dtm' }),
    }),

  getNotebookDue: (user_id: string) =>
    req<{ cards: any[]; total_due: number }>(`/api/notebook/due/${user_id}`),

  reviewCard: (card_id: string, user_id: string, correct: boolean) =>
    req(`/api/notebook/review/${card_id}?user_id=${user_id}&correct=${correct}`, {
      method: 'POST',
    }),

  getRoadmap: (user_id: string, goal_score: number, days_remaining: number, subjects: string) =>
    req<Roadmap>(
      `/api/analysis/roadmap/${user_id}?goal_score=${goal_score}&days_remaining=${days_remaining}&subjects=${encodeURIComponent(subjects)}`
    ),

  chat: (message: string, history: { role: string; content: string }[]) =>
    req<{ reply: string; reply_en: string }>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
};
