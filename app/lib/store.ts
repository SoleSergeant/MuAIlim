import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, ExamType, Subject } from './types';

const KEYS = {
  profile: 'muailim_profile',
  streak: 'muailim_streak',
  lastActive: 'muailim_last_active',
};

export const DEMO_PROFILE: UserProfile = {
  user_id: 'demo_jasur',
  display_name: 'Jasur',
  exam_type: 'dtm',
  subjects: ['math', 'history', 'uzbek'],
  goal_score: 189,
  exam_date: '2026-07-15',
  streak: 12,
  is_premium: false,
};

export async function getProfile(): Promise<UserProfile> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.profile);
    return raw ? JSON.parse(raw) : DEMO_PROFILE;
  } catch {
    return DEMO_PROFILE;
  }
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

export async function clearProfile(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.profile);
}

export async function isOnboarded(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEYS.profile);
  return raw !== null;
}

export function daysUntilExam(examDate: string): number {
  const now = new Date();
  const exam = new Date(examDate);
  const diff = exam.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function calcReadinessPct(scorePct: number, goal: number): number {
  const maxScore = 100;
  const target = (goal / 200) * 100;
  return Math.min(100, Math.round((scorePct / target) * 100));
}
