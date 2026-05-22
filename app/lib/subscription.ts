/**
 * Subscription & usage-limit helpers.
 *
 * Premium status lives in UserProfile.is_premium (already in store).
 * Usage counters are stored in AsyncStorage with daily/weekly resets.
 *
 * Keys:
 *   sub_mock_count      – { count: number, weekStart: string (ISO Mon) }
 *   sub_explain_count   – { count: number, day: string (YYYY-MM-DD) }
 *   sub_notebook_days   – { days: string[], weekStart: string }
 *                          days = unique calendar days notebook was opened this week
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Limits ──────────────────────────────────────────────────────────────────
export const FREE_MOCK_PER_WEEK       = 2;
export const FREE_EXPLAIN_PER_DAY     = 2;
export const FREE_NOTEBOOK_DAYS_WEEK  = 2;
export const FREE_CHAT_PER_DAY        = 5;

// ─── Pricing ─────────────────────────────────────────────────────────────────
export const PRICE_MONTHLY  = '25 000 UZS';
export const PRICE_ANNUAL   = '200 000 UZS';
export const PRICE_SAVE_PCT = '33%';

// ─── Date helpers ─────────────────────────────────────────────────────────────
function todayStr(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/** ISO date of the most recent Monday (week boundary). */
function currentWeekStart(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = (day === 0 ? -6 : 1 - day); // back to Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

// ─── Mock exam usage ─────────────────────────────────────────────────────────
interface MockUsage { count: number; weekStart: string }

async function getMockUsage(): Promise<MockUsage> {
  try {
    const raw = await AsyncStorage.getItem('sub_mock_count');
    if (raw) {
      const data: MockUsage = JSON.parse(raw);
      if (data.weekStart === currentWeekStart()) return data;
    }
  } catch {}
  return { count: 0, weekStart: currentWeekStart() };
}

export async function getMocksUsedThisWeek(): Promise<number> {
  return (await getMockUsage()).count;
}

export async function canStartMock(isPremium: boolean): Promise<boolean> {
  if (isPremium) return true;
  const { count } = await getMockUsage();
  return count < FREE_MOCK_PER_WEEK;
}

export async function incrementMockCount(): Promise<void> {
  const usage = await getMockUsage();
  await AsyncStorage.setItem(
    'sub_mock_count',
    JSON.stringify({ count: usage.count + 1, weekStart: usage.weekStart })
  );
}

export async function mockRemainingThisWeek(isPremium: boolean): Promise<number | null> {
  if (isPremium) return null; // null = unlimited
  const { count } = await getMockUsage();
  return Math.max(0, FREE_MOCK_PER_WEEK - count);
}

// ─── AI Explanation usage ────────────────────────────────────────────────────
interface ExplainUsage { count: number; day: string }

async function getExplainUsage(): Promise<ExplainUsage> {
  try {
    const raw = await AsyncStorage.getItem('sub_explain_count');
    if (raw) {
      const data: ExplainUsage = JSON.parse(raw);
      if (data.day === todayStr()) return data;
    }
  } catch {}
  return { count: 0, day: todayStr() };
}

export async function getExplainsUsedToday(): Promise<number> {
  return (await getExplainUsage()).count;
}

export async function canExplain(isPremium: boolean): Promise<boolean> {
  if (isPremium) return true;
  const { count } = await getExplainUsage();
  return count < FREE_EXPLAIN_PER_DAY;
}

export async function incrementExplainCount(): Promise<void> {
  const usage = await getExplainUsage();
  await AsyncStorage.setItem(
    'sub_explain_count',
    JSON.stringify({ count: usage.count + 1, day: usage.day })
  );
}

export async function explainsRemainingToday(isPremium: boolean): Promise<number | null> {
  if (isPremium) return null;
  const { count } = await getExplainUsage();
  return Math.max(0, FREE_EXPLAIN_PER_DAY - count);
}

// ─── Notebook day usage ──────────────────────────────────────────────────────
// Tracks unique calendar days the notebook was opened this week.
interface NotebookDayUsage { days: string[]; weekStart: string }

async function getNotebookDayUsage(): Promise<NotebookDayUsage> {
  try {
    const raw = await AsyncStorage.getItem('sub_notebook_days');
    if (raw) {
      const data: NotebookDayUsage = JSON.parse(raw);
      if (data.weekStart === currentWeekStart()) return data;
    }
  } catch {}
  return { days: [], weekStart: currentWeekStart() };
}

/** Call when the user opens the notebook tab. Records today if not already recorded. */
export async function recordNotebookOpen(): Promise<void> {
  const usage = await getNotebookDayUsage();
  const today = todayStr();
  if (!usage.days.includes(today)) {
    usage.days.push(today);
    await AsyncStorage.setItem('sub_notebook_days', JSON.stringify(usage));
  }
}

/** Returns true if the user can access the notebook right now. */
export async function canAccessNotebook(isPremium: boolean): Promise<boolean> {
  if (isPremium) return true;
  const usage = await getNotebookDayUsage();
  const today = todayStr();
  // Already used today → still allowed for the rest of the day
  if (usage.days.includes(today)) return true;
  // New day → allowed only if fewer than FREE_NOTEBOOK_DAYS_WEEK distinct days used
  return usage.days.length < FREE_NOTEBOOK_DAYS_WEEK;
}

/** How many notebook days are left this week (null = unlimited). */
export async function notebookDaysRemainingThisWeek(isPremium: boolean): Promise<number | null> {
  if (isPremium) return null;
  const usage = await getNotebookDayUsage();
  return Math.max(0, FREE_NOTEBOOK_DAYS_WEEK - usage.days.length);
}

export function canAccessRoadmap(isPremium: boolean): boolean {
  return isPremium;
}

export function canAccessOlympiadPrep(isPremium: boolean): boolean {
  return isPremium;
}

// ─── Chatbot usage ───────────────────────────────────────────────────────────
interface ChatUsage { count: number; day: string }

async function getChatUsage(): Promise<ChatUsage> {
  try {
    const raw = await AsyncStorage.getItem('sub_chat_count');
    if (raw) {
      const data: ChatUsage = JSON.parse(raw);
      if (data.day === todayStr()) return data;
    }
  } catch {}
  return { count: 0, day: todayStr() };
}

export async function canChat(isPremium: boolean): Promise<boolean> {
  if (isPremium) return true;
  const { count } = await getChatUsage();
  return count < FREE_CHAT_PER_DAY;
}

export async function incrementChatCount(): Promise<void> {
  const usage = await getChatUsage();
  await AsyncStorage.setItem(
    'sub_chat_count',
    JSON.stringify({ count: usage.count + 1, day: usage.day })
  );
}

export async function chatRemainingToday(isPremium: boolean): Promise<number | null> {
  if (isPremium) return null;
  const { count } = await getChatUsage();
  return Math.max(0, FREE_CHAT_PER_DAY - count);
}
