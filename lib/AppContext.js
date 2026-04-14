import { createContext, useState, useEffect, useCallback, useRef, useContext } from 'react';
import {
  loadUser, saveUser, loadHistory, addRecord,
  loadAchievements, saveAchievements, loadStreak, saveStreak, clearAll,
} from './storage';
import { calcPoints, getLevel, checkNewAchievements, updateStreak, genId } from './points';
import { shuffle } from './questions';
import { preload as preloadSounds } from './sounds';
import { loadDailyTasks, saveDailyTasks, updateTaskProgress } from './dailyTasks';

const DEFAULT_SETTINGS = { autoSubmit: false };
const DEFAULT_BREAK = { usageMinutes: 20, breakMinutes: 5 };

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [hasUser, setHasUser] = useState(false);
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [achievements, setAchievements] = useState({});
  const [streak, setStreak] = useState({ count: 0, lastDate: null });
  const [dailyTasks, setDailyTasks] = useState([]);
  const [quizResult, setQuizResult] = useState(null);
  const [lastQuizRoute, setLastQuizRoute] = useState(null);

  const [showPin, setShowPin] = useState(false);
  const [pinMode, setPinMode] = useState('verify');
  const [isParent, setIsParent] = useState(false);

  const [showBreak, setShowBreak] = useState(false);
  const usageStart = useRef(Date.now());

  const settings = user?.settings || DEFAULT_SETTINGS;
  const breakConfig = user?.breakConfig || DEFAULT_BREAK;

  useEffect(() => {
    (async () => {
      try {
        const [u, h, a, s] = await Promise.all([
          loadUser(), loadHistory(), loadAchievements(), loadStreak(),
        ]);
        preloadSounds();
        if (u) {
          setUser(u);
          setHistory(h);
          setAchievements(a);
          setStreak(s);
          const tasks = await loadDailyTasks();
          setDailyTasks(tasks);
          setHasUser(true);
        }
      } catch {}
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!user || showBreak) return;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - usageStart.current) / 60000;
      if (elapsed >= breakConfig.usageMinutes) setShowBreak(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [user, showBreak, breakConfig.usageMinutes]);

  const onBreakDone = useCallback(async (rewardPts) => {
    setShowBreak(false);
    usageStart.current = Date.now();
    if (rewardPts && user) {
      const updated = { ...user, totalPoints: (user.totalPoints || 0) + rewardPts };
      setUser(updated);
      await saveUser(updated);
    }
  }, [user]);

  const createUser = useCallback(async ({ name, avatar }) => {
    const u = {
      name, avatar,
      createdAt: new Date().toISOString(),
      totalPoints: 0, level: 1,
      settings: DEFAULT_SETTINGS,
      breakConfig: DEFAULT_BREAK,
    };
    await saveUser(u);
    setUser(u);
    setHasUser(true);
    const tasks = await loadDailyTasks();
    setDailyTasks(tasks);
  }, []);

  const updateUser = useCallback(async (patch) => {
    const updated = { ...user, ...patch };
    setUser(updated);
    await saveUser(updated);
  }, [user]);

  const resetAll = useCallback(async () => {
    await clearAll();
    setUser(null);
    setHistory([]);
    setAchievements({});
    setStreak({ count: 0, lastDate: null });
    setDailyTasks([]);
    setIsParent(false);
    setHasUser(false);
  }, []);

  const buildErrorReview = useCallback(() => {
    const allWrong = history.flatMap((h) => h.wrongList || []);
    if (allWrong.length === 0) return null;
    const seen = new Set();
    const unique = allWrong.filter((q) => {
      const k = `${q.left}-${q.op}-${q.right}-${q.missingPos}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return { questions: shuffle(unique), subject: 'review', isReview: true };
  }, [history]);

  const finishQuiz = useCallback(async (data) => {
    const { questions, answers, elapsed, subject, difficulty, maxCombo } = data;
    const isCorrect = (q, a) => {
      if (typeof q.answer === 'object' && q.answer !== null) {
        return a !== null && typeof a === 'object' &&
          Object.keys(q.answer).every((k) => a[k] === q.answer[k]);
      }
      return a === q.answer;
    };
    const correct = questions.filter((q, i) => isCorrect(q, answers[i])).length;
    const total = questions.length;
    const wrong = total - correct;
    const wrongList = questions
      .map((q, i) => ({ ...q, userAnswer: answers[i] }))
      .filter((q, i) => !isCorrect(questions[i], answers[i]));

    const today = new Date().toISOString().split('T')[0];
    const dailyFirst = !history.some((h) => h.date.startsWith(today));
    const pointsEarned = calcPoints({ total, correct, elapsed, maxCombo, dailyFirst });

    const newTotal = (user?.totalPoints || 0) + pointsEarned;
    const lvl = getLevel(newTotal);
    const prevLevel = user?.level || 1;
    const updatedUser = { ...user, totalPoints: newTotal, level: lvl.level };
    setUser(updatedUser);
    await saveUser(updatedUser);

    const record = {
      id: genId(), subject, difficulty: difficulty || 'normal',
      date: new Date().toISOString(),
      total, correct, wrong, elapsed, pointsEarned,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      wrongList,
    };
    const newHist = await addRecord(record);
    setHistory(newHist);

    const newStreak = updateStreak(streak);
    setStreak(newStreak);
    await saveStreak(newStreak);

    const freshAch = checkNewAchievements({
      user: updatedUser, history: newHist, record, streak: newStreak, unlocked: achievements,
    });
    let updAch = achievements;
    if (freshAch.length > 0) {
      updAch = { ...achievements };
      freshAch.forEach((id) => { updAch[id] = { unlocked: true, date: new Date().toISOString() }; });
      setAchievements(updAch);
      await saveAchievements(updAch);
    }

    const updTasks = updateTaskProgress(dailyTasks, record);
    setDailyTasks(updTasks);
    saveDailyTasks(updTasks);

    const result = {
      ...record, pointsEarned,
      levelUp: lvl.level > prevLevel,
      newLevel: lvl,
      newAchievements: freshAch,
    };
    setQuizResult(result);

    const usageElapsed = (Date.now() - usageStart.current) / 60000;
    if (usageElapsed >= breakConfig.usageMinutes) {
      setTimeout(() => setShowBreak(true), 1500);
    }

    return result;
  }, [user, history, streak, achievements, breakConfig.usageMinutes, dailyTasks]);

  const requestPin = useCallback((mode) => {
    setPinMode(mode);
    setShowPin(true);
  }, []);

  const onPinSuccess = useCallback(async (pin) => {
    setShowPin(false);
    if (pinMode === 'setup') {
      await updateUser({ parentPin: pin });
    }
    setIsParent(true);
  }, [pinMode, updateUser]);

  const onPinCancel = useCallback(() => setShowPin(false), []);

  const exitParent = useCallback(() => setIsParent(false), []);

  const saveQuizRoute = useCallback((routeName, params) => {
    setLastQuizRoute({ routeName, params });
  }, []);

  const value = {
    ready, hasUser, user, history, achievements, streak, dailyTasks,
    settings, breakConfig, quizResult, lastQuizRoute,
    showPin, pinMode, isParent, showBreak,

    createUser, updateUser, resetAll,
    buildErrorReview, finishQuiz, saveQuizRoute,
    requestPin, onPinSuccess, onPinCancel, exitParent,
    onBreakDone,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be within AppProvider');
  return ctx;
}

export default AppContext;
