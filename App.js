import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { C, SAFE_TOP } from './lib/theme';
import {
  loadUser, saveUser, loadHistory, addRecord,
  loadAchievements, saveAchievements, loadStreak, saveStreak, clearAll,
} from './lib/storage';
import { calcPoints, getLevel, checkNewAchievements, updateStreak, genId } from './lib/points';
import { shuffle } from './lib/questions';

import TabBar from './components/TabBar';
import WelcomeScreen from './screens/WelcomeScreen';
import HomeScreen from './screens/HomeScreen';
import QuizScreen from './screens/QuizScreen';
import ResultsScreen from './screens/ResultsScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';

const DEFAULT_SETTINGS = { autoSubmit: false };

export default function App() {
  const [screen, setScreen] = useState('loading');
  const [tab, setTab] = useState('home');
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [achievements, setAchievements] = useState({});
  const [streak, setStreak] = useState({ count: 0, lastDate: null });
  const [quizParams, setQuizParams] = useState(null);
  const [quizResult, setQuizResult] = useState(null);

  const settings = user?.settings || DEFAULT_SETTINGS;

  // ── Bootstrap ────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const [u, h, a, s] = await Promise.all([
          loadUser(), loadHistory(), loadAchievements(), loadStreak(),
        ]);
        if (u) {
          setUser(u);
          setHistory(h);
          setAchievements(a);
          setStreak(s);
          setScreen('main');
        } else {
          setScreen('welcome');
        }
      } catch {
        setScreen('welcome');
      }
    })();
  }, []);

  // ── Welcome complete ────────────────────────────────

  const onWelcome = useCallback(async ({ name, avatar }) => {
    const u = {
      name, avatar,
      createdAt: new Date().toISOString(),
      totalPoints: 0,
      level: 1,
      settings: DEFAULT_SETTINGS,
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

  // ── Quiz finish ─────────────────────────────────────

  const onQuizFinish = useCallback(
    async (data) => {
      const { questions, answers, elapsed, subject, difficulty, maxCombo } = data;
      const correct = questions.filter((q, i) => answers[i] === q.answer).length;
      const total = questions.length;
      const wrong = total - correct;
      const wrongList = questions
        .map((q, i) => ({ ...q, userAnswer: answers[i] }))
        .filter((_, i) => answers[i] !== questions[i].answer);

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

      setQuizResult({
        ...record,
        pointsEarned,
        levelUp: lvl.level > prevLevel,
        newLevel: lvl,
        newAchievements: freshAch,
      });
      setScreen('results');
    },
    [user, history, streak, achievements],
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
    setScreen('welcome');
  }, []);

  const goHome = useCallback(() => { setTab('home'); setScreen('main'); }, []);

  const retryQuiz = useCallback(() => {
    if (quizParams) setScreen('quiz');
    else goHome();
  }, [quizParams, goHome]);

  // ── Render ──────────────────────────────────────────

  const wrap = (children) => (
    <SafeAreaView style={st.root}>
      <View style={st.inner}>{children}</View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );

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
        onFinish={onQuizFinish}
        onBack={goHome}
      />,
    );
  }

  if (screen === 'results') {
    return wrap(<ResultsScreen data={quizResult} onHome={goHome} onRetry={retryQuiz} />);
  }

  // screen === 'main' with tab bar
  return (
    <SafeAreaView style={st.root}>
      <View style={st.inner}>
        <View style={{ flex: 1 }}>
          {tab === 'home' && (
            <HomeScreen
              user={user}
              streak={streak}
              achievements={achievements}
              onSubject={onSubject}
            />
          )}
          {tab === 'history' && (
            <HistoryScreen history={history} onErrorReview={onErrorReview} />
          )}
          {tab === 'settings' && (
            <SettingsScreen
              user={user}
              settings={settings}
              onUpdate={onUpdateUser}
              onClear={onClearAll}
            />
          )}
        </View>
        <TabBar active={tab} onChange={setTab} />
      </View>
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
