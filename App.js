import { useState, useEffect, useCallback, useRef } from 'react';
import { SafeAreaView, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { C, SAFE_TOP } from './lib/theme';
import {
  loadUser, saveUser, loadHistory, addRecord,
  loadAchievements, saveAchievements, loadStreak, saveStreak, clearAll,
} from './lib/storage';
import { calcPoints, getLevel, checkNewAchievements, updateStreak, genId } from './lib/points';
import { shuffle } from './lib/questions';
import { preload as preloadSounds } from './lib/sounds';
import { loadDailyTasks, saveDailyTasks, updateTaskProgress } from './lib/dailyTasks';

import TabBar from './components/TabBar';
import PinModal from './components/PinModal';
import WelcomeScreen from './screens/WelcomeScreen';
import HomeScreen from './screens/HomeScreen';
import QuizScreen from './screens/QuizScreen';
import ResultsScreen from './screens/ResultsScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import EnglishLearnScreen from './screens/EnglishLearnScreen';
import EnglishQuizScreen from './screens/EnglishQuizScreen';
import ChineseLearnScreen from './screens/ChineseLearnScreen';
import ChineseQuizScreen from './screens/ChineseQuizScreen';
import BreakScreen from './screens/BreakScreen';
import SpeedChallengeScreen from './screens/SpeedChallengeScreen';
import DictationScreen from './screens/DictationScreen';

const DEFAULT_SETTINGS = { autoSubmit: false };
const DEFAULT_BREAK = { usageMinutes: 20, breakMinutes: 5 };

export default function App() {
  const [screen, setScreen] = useState('loading');
  const [tab, setTab] = useState('home');
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [achievements, setAchievements] = useState({});
  const [streak, setStreak] = useState({ count: 0, lastDate: null });
  const [quizParams, setQuizParams] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [engTopicKey, setEngTopicKey] = useState(null);
  const [chnTopicKey, setChnTopicKey] = useState(null);
  const [dictMode, setDictMode] = useState('eng');
  const [dailyTasks, setDailyTasks] = useState([]);

  // Parent PIN
  const [showPin, setShowPin] = useState(false);
  const [pinMode, setPinMode] = useState('verify');
  const [isParent, setIsParent] = useState(false);

  // Break timer
  const [showBreak, setShowBreak] = useState(false);
  const usageStart = useRef(Date.now());

  const settings = user?.settings || DEFAULT_SETTINGS;
  const breakConfig = user?.breakConfig || DEFAULT_BREAK;

  // ── Bootstrap ────────────────────────────────────────

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
          setScreen('main');
        } else {
          setScreen('welcome');
        }
      } catch {
        setScreen('welcome');
      }
    })();
  }, []);

  // ── Break timer check ─────────────────────────────────
  useEffect(() => {
    if (!user || showBreak) return;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - usageStart.current) / 60000;
      if (elapsed >= breakConfig.usageMinutes) {
        setShowBreak(true);
      }
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

  // ── Welcome complete ────────────────────────────────

  const onWelcome = useCallback(async ({ name, avatar }) => {
    const u = {
      name, avatar,
      createdAt: new Date().toISOString(),
      totalPoints: 0,
      level: 1,
      settings: DEFAULT_SETTINGS,
      breakConfig: DEFAULT_BREAK,
    };
    await saveUser(u);
    setUser(u);
    setScreen('main');
  }, []);

  // ── Start quiz ──────────────────────────────────────

  const onSubject = useCallback((subject) => {
    setQuizParams({ subject });
    setScreen('quiz');
  }, []);

  // ── English navigation ─────────────────────────────────

  const onEngLearn = useCallback((topicKey) => {
    setEngTopicKey(topicKey);
    setScreen('engLearn');
  }, []);

  const onEngPractice = useCallback((topicKey) => {
    setEngTopicKey(topicKey);
    setScreen('engQuiz');
  }, []);

  // ── Chinese navigation ─────────────────────────────────

  const onChnLearn = useCallback((topicKey) => {
    setChnTopicKey(topicKey);
    setScreen('chnLearn');
  }, []);

  const onChnPractice = useCallback((topicKey) => {
    setChnTopicKey(topicKey);
    setScreen('chnQuiz');
  }, []);

  // ── Error review ──────────────────────────────────────

  const onErrorReview = useCallback(() => {
    const allWrong = history.flatMap((h) => h.wrongList || []);
    if (allWrong.length === 0) return;
    const seen = new Set();
    const unique = allWrong.filter((q) => {
      const k = `${q.left}-${q.op}-${q.right}-${q.missingPos}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    setQuizParams({ questions: shuffle(unique), subject: 'review', isReview: true });
    setScreen('quiz');
  }, [history]);

  // ── Quiz finish (shared helper) ───────────────────────

  const finishQuiz = useCallback(
    async (data) => {
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

      setQuizResult({
        ...record,
        pointsEarned,
        levelUp: lvl.level > prevLevel,
        newLevel: lvl,
        newAchievements: freshAch,
      });
      setScreen('results');

      const usageElapsed = (Date.now() - usageStart.current) / 60000;
      if (usageElapsed >= breakConfig.usageMinutes) {
        setTimeout(() => setShowBreak(true), 1500);
      }
    },
    [user, history, streak, achievements, breakConfig.usageMinutes, dailyTasks],
  );

  // ── Settings handlers ───────────────────────────────

  const onUpdateUser = useCallback(
    async (patch) => {
      const updated = { ...user, ...patch };
      setUser(updated);
      await saveUser(updated);
    },
    [user],
  );

  const onClearAll = useCallback(async () => {
    await clearAll();
    setUser(null);
    setHistory([]);
    setAchievements({});
    setStreak({ count: 0, lastDate: null });
    setIsParent(false);
    setScreen('welcome');
  }, []);

  const goHome = useCallback(() => { setTab('home'); setIsParent(false); setScreen('main'); }, []);

  const retryQuiz = useCallback(() => {
    if (quizParams) setScreen('quiz');
    else goHome();
  }, [quizParams, goHome]);

  // ── PIN / parent handling ──────────────────────────────

  const handleTabChange = useCallback((newTab) => {
    if (newTab === 'settings') {
      if (!user?.parentPin) {
        setPinMode('setup');
        setShowPin(true);
      } else {
        setPinMode('verify');
        setShowPin(true);
      }
    } else {
      setIsParent(false);
      setTab(newTab);
    }
  }, [user]);

  const onPinSuccess = useCallback(async (pin) => {
    setShowPin(false);
    if (pinMode === 'setup') {
      await onUpdateUser({ parentPin: pin });
      setIsParent(true);
      setTab('settings');
    } else {
      setIsParent(true);
      setTab('settings');
    }
  }, [pinMode, onUpdateUser]);

  const onPinCancel = useCallback(() => {
    setShowPin(false);
  }, []);

  const onChangePin = useCallback(() => {
    setPinMode('setup');
    setShowPin(true);
  }, []);

  // ── Render ──────────────────────────────────────────

  const wrap = (children) => (
    <SafeAreaView style={st.root}>
      <View style={st.inner}>{children}</View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );

  // Break screen overlay
  if (showBreak) {
    return (
      <SafeAreaView style={st.root}>
        <BreakScreen breakMinutes={breakConfig.breakMinutes} onDone={onBreakDone} />
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  if (screen === 'loading') {
    return wrap(
      <View style={st.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={st.loadTxt}>加载中...</Text>
      </View>,
    );
  }

  if (screen === 'welcome') return wrap(<WelcomeScreen onComplete={onWelcome} />);

  if (screen === 'quiz') {
    return wrap(
      <QuizScreen
        params={quizParams}
        settings={settings}
        onFinish={finishQuiz}
        onBack={goHome}
      />,
    );
  }

  if (screen === 'engLearn') {
    return wrap(
      <EnglishLearnScreen
        topicKey={engTopicKey}
        onBack={goHome}
        onPractice={(key) => { setEngTopicKey(key); setScreen('engQuiz'); }}
      />,
    );
  }

  if (screen === 'engQuiz') {
    return wrap(
      <EnglishQuizScreen
        topicKey={engTopicKey}
        onFinish={finishQuiz}
        onBack={goHome}
      />,
    );
  }

  if (screen === 'chnLearn') {
    return wrap(
      <ChineseLearnScreen
        topicKey={chnTopicKey}
        onBack={goHome}
        onPractice={(key) => { setChnTopicKey(key); setScreen('chnQuiz'); }}
      />,
    );
  }

  if (screen === 'chnQuiz') {
    return wrap(
      <ChineseQuizScreen
        topicKey={chnTopicKey}
        onFinish={finishQuiz}
        onBack={goHome}
      />,
    );
  }

  if (screen === 'speed') {
    return wrap(
      <SpeedChallengeScreen
        onFinish={async (data) => {
          await finishQuiz(data);
          setScreen('speed');
        }}
        onBack={goHome}
      />,
    );
  }

  if (screen === 'dictation') {
    return wrap(
      <DictationScreen
        mode={dictMode}
        onFinish={finishQuiz}
        onBack={goHome}
      />,
    );
  }

  if (screen === 'results') {
    return wrap(<ResultsScreen data={quizResult} onHome={goHome} onRetry={retryQuiz} />);
  }

  return (
    <SafeAreaView style={st.root}>
      <View style={st.inner}>
        <View style={{ flex: 1 }}>
          {tab === 'home' && (
            <HomeScreen
              user={user}
              streak={streak}
              achievements={achievements}
              history={history}
              dailyTasks={dailyTasks}
              onSubject={onSubject}
              onEngLearn={onEngLearn}
              onEngPractice={onEngPractice}
              onChnLearn={onChnLearn}
              onChnPractice={onChnPractice}
              onSpeedChallenge={() => setScreen('speed')}
              onDictation={(mode) => { setScreen('dictation'); setDictMode(mode); }}
            />
          )}
          {tab === 'history' && (
            <HistoryScreen history={history} onErrorReview={onErrorReview} />
          )}
          {tab === 'settings' && isParent && (
            <SettingsScreen
              user={user}
              settings={settings}
              onUpdate={onUpdateUser}
              onClear={onClearAll}
              onChangePin={onChangePin}
            />
          )}
        </View>
        <TabBar active={tab} onChange={handleTabChange} />
      </View>
      <PinModal
        visible={showPin}
        mode={pinMode}
        correctPin={user?.parentPin}
        onSuccess={onPinSuccess}
        onCancel={onPinCancel}
      />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  inner: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingTop: SAFE_TOP },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadTxt: { fontSize: 15, color: C.textMid, marginTop: 12 },
});
