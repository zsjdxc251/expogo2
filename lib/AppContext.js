import { createContext, useState, useEffect, useCallback, useRef, useContext } from 'react';
import {
  loadUser, saveUser, loadHistory, addRecord,
  loadAchievements, saveAchievements, loadStreak, saveStreak, clearAll,
  loadUnfamiliar, saveUnfamiliar, loadPointsLog, savePointsLog,
  loadAdventureProgress, saveAdventureProgress, loadChallengeHighScore, saveChallengeHighScore,
  loadMasteredErrors,
} from './storage';
import { calcPoints, getLevel, checkNewAchievements, updateStreak, genId } from './points';
import { getStarCount } from './adventureLevels';
import { shuffle, preloadFreq } from './questions';
import { preload as preloadSounds } from './sounds';
import { loadDailyTasks, saveDailyTasks, updateTaskProgress, rebuildTasks } from './dailyTasks';

const DEFAULT_SETTINGS = { autoSubmit: false };
const DEFAULT_BREAK = { usageMinutes: 20, breakMinutes: 5 };
const DEFAULT_REWARD = { perCorrect: 5, perfectBonus: 10, taskReward: 10 };

const MATH_KEYS = [
  'mulForward','mulBlank','add','subtract','divide','divRem','divReverse',
  'addTwo','subtractTwo','mulReverse','compare','wordProblem','pattern',
];
const DEFAULT_VISIBILITY = {
  math: true, english: true, chinese: true,
  math_speed: true,
  ...Object.fromEntries(MATH_KEYS.map((k) => [`math_${k}`, true])),
  allowedDifficulties: ['easy', 'normal', 'hard'],
};

const AppContext = createContext(null);

function makeErrorBookKey(q) {
  if (!q) return '';
  return `${q.left}-${q.op}-${q.right}-${q.missingPos}`;
}

function getErrorBookStats(history, masteredMap) {
  const seen = new Set();
  history.forEach((h) => {
    (h.wrongList || []).forEach((q) => {
      const k = makeErrorBookKey(q);
      if (!k) return;
      seen.add(k);
    });
  });
  const keys = [...seen];
  return {
    totalErrorCount: keys.length,
    masteredErrorCount: keys.filter((k) => masteredMap[k]).length,
  };
}

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

  const [unfamiliarChars, setUnfamiliarChars] = useState([]);
  const [pointsLog, setPointsLog] = useState([]);
  const [adventureProgress, setAdventureProgress] = useState({});
  const [challengeHighScore, setChallengeHighScore] = useState(0);

  const [showBreak, setShowBreak] = useState(false);
  const usageStart = useRef(Date.now());
  const breakPinResolve = useRef(null);

  const settings = user?.settings || DEFAULT_SETTINGS;
  const breakConfig = user?.breakConfig || DEFAULT_BREAK;
  const rewardConfig = user?.rewardConfig || DEFAULT_REWARD;
  const visibility = user?.visibility || DEFAULT_VISIBILITY;

  useEffect(() => {
    (async () => {
      try {
        const [u, h, a, s] = await Promise.all([
          loadUser(), loadHistory(), loadAchievements(), loadStreak(),
        ]);
        preloadSounds();
        preloadFreq();
        if (u) {
          setUser(u);
          setHistory(h);
          setAchievements(a);
          setStreak(s);
          const tasks = await loadDailyTasks(u?.taskConfig);
          setDailyTasks(tasks);
          const uf = await loadUnfamiliar();
          setUnfamiliarChars(uf);
          const pl = await loadPointsLog();
          setPointsLog(pl);
          const advProg = await loadAdventureProgress();
          setAdventureProgress(advProg);
          const chs = await loadChallengeHighScore();
          setChallengeHighScore(chs);
          setHasUser(true);
        }
      } catch (e) {
        console.warn('AppContext bootstrap error:', e);
      }
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
      rewardConfig: DEFAULT_REWARD,
      visibility: DEFAULT_VISIBILITY,
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
    if (patch.taskConfig) {
      const newTasks = rebuildTasks(patch.taskConfig);
      setDailyTasks(newTasks);
      await saveDailyTasks(newTasks);
    }
  }, [user]);

  const resetAll = useCallback(async () => {
    await clearAll();
    setUser(null);
    setHistory([]);
    setAchievements({});
    setStreak({ count: 0, lastDate: null });
    setDailyTasks([]);
    setUnfamiliarChars([]);
    setPointsLog([]);
    setAdventureProgress({});
    setChallengeHighScore(0);
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
    if (!user) return null;
    const { questions = [], answers = [], elapsed = 0, subject, difficulty, maxCombo = 0 } = data;
    if (questions.length === 0) return null;

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
    const rc = user?.rewardConfig || DEFAULT_REWARD;
    const PERFECT_MIN = 10;
    const pointsEarned = calcPoints({ total, correct, perCorrect: rc.perCorrect, perfectBonus: rc.perfectBonus, perfectMinCount: PERFECT_MIN });
    const isPerfect = correct === total && total >= PERFECT_MIN;

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

    const masteredMap = await loadMasteredErrors();
    const { totalErrorCount, masteredErrorCount } = getErrorBookStats(newHist, masteredMap);

    let advForAch = { ...adventureProgress };
    if (data.adventureLevel) {
      const al = data.adventureLevel;
      const stars = getStarCount(record.accuracy, al.stars);
      if (stars > 0) {
        const prev = adventureProgress[al.id] || 0;
        const nextStars = Math.max(prev, stars);
        const merged = { ...adventureProgress, [al.id]: nextStars };
        if (nextStars > prev) {
          setAdventureProgress(merged);
          await saveAdventureProgress(merged);
        }
        advForAch = merged;
      }
    }

    const challengeHs = Math.max(challengeHighScore || 0, await loadChallengeHighScore());

    const freshAch = checkNewAchievements({
      user: updatedUser,
      history: newHist,
      record,
      streak: newStreak,
      unlocked: achievements,
      adventureProgress: advForAch,
      challengeHighScore: challengeHs,
      masteredErrorCount,
      totalErrorCount,
    });
    let updAch = achievements;
    if (freshAch.length > 0) {
      updAch = { ...achievements };
      freshAch.forEach((id) => { updAch[id] = { unlocked: true, date: new Date().toISOString() }; });
      setAchievements(updAch);
      await saveAchievements(updAch);
    }

    const prevCompleted = dailyTasks.filter((t) => t.completed).length;
    const updTasks = updateTaskProgress(dailyTasks, record);
    const newCompleted = updTasks.filter((t) => t.completed).length;
    const perTask = rc.taskReward || 10;
    const taskBonus = (newCompleted - prevCompleted) * perTask;
    setDailyTasks(updTasks);
    saveDailyTasks(updTasks);

    let finalTotal = newTotal;
    if (taskBonus > 0) {
      finalTotal = updatedUser.totalPoints + taskBonus;
      const withBonus = { ...updatedUser, totalPoints: finalTotal };
      setUser(withBonus);
      await saveUser(withBonus);
    }

    const totalEarned = pointsEarned + taskBonus;
    if (totalEarned > 0) {
      const subInfo = subject || '练习';
      const logEntry = {
        id: `quiz_${record.id}`,
        type: 'add', amount: totalEarned,
        reason: `练习 ${correct}/${total}`,
        note: taskBonus > 0 ? `含任务奖励 +${taskBonus}` : '',
        date: record.date,
        balance: finalTotal,
        source: 'quiz',
        subject,
      };
      const newLog = [logEntry, ...pointsLog].slice(0, 200);
      setPointsLog(newLog);
      await savePointsLog(newLog);
    }

    const result = {
      ...record, pointsEarned: totalEarned, taskBonus,
      isPerfect, perfectBonusValue: isPerfect ? rc.perfectBonus : 0,
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
  }, [
    user, history, streak, achievements, breakConfig.usageMinutes, dailyTasks, pointsLog,
    adventureProgress, challengeHighScore,
  ]);

  const recordLearning = useCallback(async (subject) => {
    if (!user) return;
    const record = { subject, total: 1, correct: 1, wrong: 0, elapsed: 0 };
    const prevCompleted = dailyTasks.filter((t) => t.completed).length;
    const updTasks = updateTaskProgress(dailyTasks, record);
    const newCompleted = updTasks.filter((t) => t.completed).length;
    const perTask = (user?.rewardConfig || DEFAULT_REWARD).taskReward || 10;
    const taskBonus = (newCompleted - prevCompleted) * perTask;
    setDailyTasks(updTasks);
    saveDailyTasks(updTasks);
    if (taskBonus > 0) {
      const updated = { ...user, totalPoints: (user.totalPoints || 0) + taskBonus };
      setUser(updated);
      await saveUser(updated);
    }
  }, [user, dailyTasks]);

  const toggleUnfamiliar = useCallback(async (char) => {
    setUnfamiliarChars((prev) => {
      const next = prev.includes(char) ? prev.filter((c) => c !== char) : [...prev, char];
      saveUnfamiliar(next);
      return next;
    });
  }, []);

  const removeUnfamiliar = useCallback(async (char) => {
    setUnfamiliarChars((prev) => {
      const next = prev.filter((c) => c !== char);
      saveUnfamiliar(next);
      return next;
    });
  }, []);

  const addUnfamiliar = useCallback(async (char) => {
    setUnfamiliarChars((prev) => {
      if (prev.includes(char)) return prev;
      const next = [...prev, char];
      saveUnfamiliar(next);
      return next;
    });
  }, []);

  const adjustPoints = useCallback(async (type, amount, reason, note) => {
    if (!user) return;
    const delta = type === 'add' ? amount : -amount;
    const newTotal = Math.max(0, (user.totalPoints || 0) + delta);
    const entry = {
      id: `pt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type, amount, reason, note: note || '',
      date: new Date().toISOString(),
      balance: newTotal,
    };
    const newLog = [entry, ...pointsLog].slice(0, 200);
    setPointsLog(newLog);
    await savePointsLog(newLog);
    const updated = { ...user, totalPoints: newTotal, level: getLevel(newTotal).level };
    setUser(updated);
    await saveUser(updated);
  }, [user, pointsLog]);

  const updateAdventureProgress = useCallback(async (levelId, stars) => {
    const updated = { ...adventureProgress };
    if (!updated[levelId] || updated[levelId] < stars) {
      updated[levelId] = stars;
      setAdventureProgress(updated);
      await saveAdventureProgress(updated);
    }
  }, [adventureProgress]);

  const updateChallengeHighScore = useCallback(async (score) => {
    if (score > challengeHighScore) {
      setChallengeHighScore(score);
      await saveChallengeHighScore(score);
    }
  }, [challengeHighScore]);

  const requestPin = useCallback((mode) => {
    setPinMode(mode);
    setShowPin(true);
  }, []);

  const onPinSuccess = useCallback(async (pin) => {
    setShowPin(false);
    if (pinMode === 'setup') {
      await updateUser({ parentPin: pin });
    }
    if (breakPinResolve.current) {
      breakPinResolve.current();
      breakPinResolve.current = null;
      return;
    }
    setIsParent(true);
  }, [pinMode, updateUser]);

  const onPinCancel = useCallback(() => {
    setShowPin(false);
    breakPinResolve.current = null;
  }, []);

  const exitParent = useCallback(() => setIsParent(false), []);

  const requestBreakUnlock = useCallback(() => {
    breakPinResolve.current = () => {
      setShowBreak(false);
      usageStart.current = Date.now();
    };
    requestPin('verify');
  }, [requestPin]);

  const saveQuizRoute = useCallback((routeName, params) => {
    setLastQuizRoute({ routeName, params });
  }, []);

  const taskConfig = user?.taskConfig || { enabled: false, tasks: [] };
  const allTasksDone = !taskConfig.enabled || dailyTasks.every((t) => t.completed);

  const value = {
    ready, hasUser, user, history, achievements, streak, dailyTasks,
    settings, breakConfig, rewardConfig, visibility, quizResult, lastQuizRoute,
    showPin, pinMode, isParent, showBreak,
    unfamiliarChars, pointsLog, taskConfig, allTasksDone,
    adventureProgress, challengeHighScore,

    createUser, updateUser, resetAll,
    buildErrorReview, finishQuiz, recordLearning, saveQuizRoute,
    toggleUnfamiliar, removeUnfamiliar, addUnfamiliar, adjustPoints,
    updateAdventureProgress, updateChallengeHighScore,
    requestPin, onPinSuccess, onPinCancel, exitParent,
    onBreakDone, requestBreakUnlock,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be within AppProvider');
  return ctx;
}

export default AppContext;
