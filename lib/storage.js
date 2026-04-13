import AsyncStorage from '@react-native-async-storage/async-storage';

const K = {
  user: '@mathstar_user',
  history: '@mathstar_history',
  achievements: '@mathstar_ach',
  streak: '@mathstar_streak',
};

function parse(json, fallback) {
  if (!json) return fallback;
  try { return JSON.parse(json); } catch { return fallback; }
}

export const loadUser = async () => parse(await AsyncStorage.getItem(K.user), null);
export const saveUser = async (u) => AsyncStorage.setItem(K.user, JSON.stringify(u));

export const loadHistory = async () => parse(await AsyncStorage.getItem(K.history), []);
export const saveHistory = async (h) => AsyncStorage.setItem(K.history, JSON.stringify(h));

export async function addRecord(record) {
  const h = await loadHistory();
  h.unshift(record);
  if (h.length > 200) h.length = 200;
  await saveHistory(h);
  return h;
}

export const loadAchievements = async () => parse(await AsyncStorage.getItem(K.achievements), {});
export const saveAchievements = async (a) => AsyncStorage.setItem(K.achievements, JSON.stringify(a));

export const loadStreak = async () => parse(await AsyncStorage.getItem(K.streak), { count: 0, lastDate: null });
export const saveStreak = async (s) => AsyncStorage.setItem(K.streak, JSON.stringify(s));

export async function clearAll() {
  await AsyncStorage.multiRemove(Object.values(K));
}
