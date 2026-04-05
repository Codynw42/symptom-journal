import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  streak: 'streak_data',
  entries: 'local_entries',
};

export interface StreakData {
  currentStreak: number;
  lastLoggedDate: string | null; // YYYY-MM-DD
  longestStreak: number;
}

const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  lastLoggedDate: null,
  longestStreak: 0,
};

function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export async function getStreak(): Promise<StreakData> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.streak);
    if (!raw) return DEFAULT_STREAK;
    const data: StreakData = JSON.parse(raw);

    // If they haven't logged today or yesterday, streak is broken
    const today = todayString();
    const yesterday = yesterdayString();
    if (
      data.lastLoggedDate !== today &&
      data.lastLoggedDate !== yesterday
    ) {
      return { ...data, currentStreak: 0 };
    }

    return data;
  } catch {
    return DEFAULT_STREAK;
  }
}

export async function recordLog(): Promise<StreakData> {
  try {
    const today = todayString();
    const yesterday = yesterdayString();
    const current = await getStreak();

    // Already logged today — don't double count
    if (current.lastLoggedDate === today) return current;

    const newStreak =
      current.lastLoggedDate === yesterday
        ? current.currentStreak + 1
        : 1;

    const updated: StreakData = {
      currentStreak: newStreak,
      lastLoggedDate: today,
      longestStreak: Math.max(newStreak, current.longestStreak),
    };

    await AsyncStorage.setItem(KEYS.streak, JSON.stringify(updated));
    return updated;
  } catch {
    return DEFAULT_STREAK;
  }
}