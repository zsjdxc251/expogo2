import AsyncStorage from '@react-native-async-storage/async-storage';

const K = {
  user: '@learnpark_user',
  history: '@learnpark_history',
  achievements: '@learnpark_ach',
  streak: '@learnpark_streak',
};

const OLD_K = {
  user: '@mathstar_user',
  history: '@mathstar_history',
  achievements: '@mathstar_ach',
  streak: '@mathstar_streak',
};

function parse(json, fallback) {
  if (!json) return fallback;
  try { return JSON.parse(json); } catch { return fallback; }
}

async function migrateIfNeeded(newKey, oldKey, fallback) {
  const val = await AsyncStorage.getItem(newKey);
  if (val) return parse(val, fallback);
  const old = await AsyncStorage.getItem(oldKey);
  if (old) {
    await AsyncStorage.setItem(newKey, old);
    await AsyncStorage.removeItem(oldKey);
    return parse(old, fallback);
  }
  return fallback;
}

export const loadUser = () => migrateIfNeeded(K.user, OLD_K.user, null);
export const saveUser = async (u) => AsyncStorage.setItem(K.user, JSON.stringify(u));

export const loadHistory = () => migrateIfNeeded(K.history, OLD_K.history, []);
export const saveHistory = async (h) => AsyncStorage.setItem(K.history, JSON.stringify(h));

export async function addRecord(record) {
  const h = await loadHistory();
  h.unshift(record);
  if (h.length > 200) h.length = 200;
  await saveHistory(h);
  return h;
}

export const loadAchievements = () => migrateIfNeeded(K.achievements, OLD_K.achievements, {});
export const saveAchievements = async (a) => AsyncStorage.setItem(K.achievements, JSON.stringify(a));

export const loadStreak = () => migrateIfNeeded(K.streak, OLD_K.streak, { count: 0, lastDate: null });
export const saveStreak = async (s) => AsyncStorage.setItem(K.streak, JSON.stringify(s));

export async function clearAll() {
  await AsyncStorage.multiRemove([
    ...Object.values(K),
    ...Object.values(OLD_K),
    '@daily_tasks',
    '@speed_best',
    '@learnpark_qfreq',
  ]);
}
