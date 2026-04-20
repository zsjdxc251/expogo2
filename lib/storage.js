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

const K_UNFAMILIAR = '@learnpark_unfamiliar';
const K_POINTS_LOG = '@learnpark_points_log';
const ADV_KEY = '@learnpark_adventure';
const CHS_KEY = '@learnpark_challenge_hs';
const MASTERED_KEY = '@learnpark_mastered_errors';

export const loadUnfamiliar = async () => {
  const raw = await AsyncStorage.getItem(K_UNFAMILIAR);
  return parse(raw, []);
};
export const saveUnfamiliar = async (arr) =>
  AsyncStorage.setItem(K_UNFAMILIAR, JSON.stringify(arr));

export const loadPointsLog = async () => {
  const raw = await AsyncStorage.getItem(K_POINTS_LOG);
  return parse(raw, []);
};
export const savePointsLog = async (log) =>
  AsyncStorage.setItem(K_POINTS_LOG, JSON.stringify(log));

export async function clearAll() {
  await AsyncStorage.multiRemove([
    ...Object.values(K),
    ...Object.values(OLD_K),
    '@daily_tasks',
    '@speed_best',
    '@learnpark_qfreq',
    K_UNFAMILIAR,
    K_POINTS_LOG,
    ADV_KEY,
    CHS_KEY,
    MASTERED_KEY,
  ]);
}

export async function loadAdventureProgress() {
  try {
    const raw = await AsyncStorage.getItem(ADV_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
export async function saveAdventureProgress(data) {
  await AsyncStorage.setItem(ADV_KEY, JSON.stringify(data));
}

export async function loadChallengeHighScore() {
  try {
    const raw = await AsyncStorage.getItem(CHS_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch { return 0; }
}
export async function saveChallengeHighScore(score) {
  await AsyncStorage.setItem(CHS_KEY, String(score));
}

export async function loadMasteredErrors() {
  try {
    const raw = await AsyncStorage.getItem(MASTERED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
export async function saveMasteredErrors(data) {
  await AsyncStorage.setItem(MASTERED_KEY, JSON.stringify(data));
}
