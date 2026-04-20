import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import * as Speech from 'expo-speech';
import { useNavigation, useRoute } from '@react-navigation/native';
import { C, RADIUS } from '../lib/theme';
import { getCharsForLessons } from '../lib/textbookData';
import { useApp } from '../lib/AppContext';
import Feedback from '../components/Feedback';
import ExitConfirmModal from '../components/ExitConfirmModal';

function stripTone(py) {
  return py.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function genQuestions(pool, count) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
  const allPy = [...new Set(pool.map((c) => c.pinyin))];

  return shuffled.map((c) => {
    const base = stripTone(c.pinyin);
    const similar = allPy.filter((p) => p !== c.pinyin && stripTone(p) === base);
    const different = allPy.filter((p) => p !== c.pinyin && stripTone(p) !== base);
    const sShuffle = [...similar].sort(() => Math.random() - 0.5);
    const dShuffle = [...different].sort(() => Math.random() - 0.5);
    const distractors = [];
    while (distractors.length < 3) {
      if (sShuffle.length > 0) distractors.push(sShuffle.pop());
      else if (dShuffle.length > 0) distractors.push(dShuffle.pop());
      else break;
    }
    const options = [c.pinyin, ...distractors].sort(() => Math.random() - 0.5);
    return { char: c.char, pinyin: c.pinyin, options, answer: options.indexOf(c.pinyin) };
  });
}

function SetupPhase({ pool, onStart, onBack }) {
  const { unfamiliarChars } = useApp();
  const [filterUf, setFilterUf] = useState(false);
  const [count, setCount] = useState(10);

  const filtered = filterUf ? pool.filter((c) => unfamiliarChars.includes(c.char)) : pool;
  const max = filtered.length;
  const clamped = Math.min(count, max);
  useEffect(() => { if (count > max && max > 0) setCount(max); }, [filterUf, max]);

  const PRESETS = [5, 10, 15, 20].filter((n) => n <= max);
  const ufCount = pool.filter((c) => unfamiliarChars.includes(c.char)).length;

  return (
    <ScrollView style={st.scroll} contentContainerStyle={st.setupRoot} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={st.backBtn} onPress={onBack}>
        <Text style={st.backTxt}>← 返回</Text>
      </TouchableOpacity>
      <Text style={st.setupEmoji}>📝</Text>
      <Text style={st.setupTitle}>看字选拼音</Text>
      <Text style={st.setupDesc}>共 {pool.length} 个字可练习</Text>

      <View style={st.card}>
        <Text style={st.label}>练习范围</Text>
        <TouchableOpacity
          style={[st.unitRow, !filterUf && st.unitRowOn]}
          onPress={() => setFilterUf(false)}
        >
          <Text style={st.unitIcon}>📖</Text>
          <Text style={[st.unitLabel, !filterUf && { color: '#fff' }]}>
            全部 ({pool.length}字)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.unitRow, filterUf && st.unitRowOn, ufCount === 0 && { opacity: 0.4 }]}
          onPress={() => { if (ufCount > 0) setFilterUf(true); }}
          disabled={ufCount === 0}
        >
          <Text style={st.unitIcon}>⭐</Text>
          <Text style={[st.unitLabel, filterUf && { color: '#fff' }]}>
            陌生字 ({ufCount}字)
          </Text>
        </TouchableOpacity>

        <Text style={[st.label, { marginTop: 18 }]}>题数</Text>
        <View style={st.countRow}>
          <TouchableOpacity style={st.cBtn} onPress={() => setCount((c) => Math.max(1, c - 1))}>
            <Text style={st.cBtnTxt}>−</Text>
          </TouchableOpacity>
          <Text style={st.countNum}>{clamped}</Text>
          <TouchableOpacity style={st.cBtn} onPress={() => setCount((c) => Math.min(max, c + 1))}>
            <Text style={st.cBtnTxt}>+</Text>
          </TouchableOpacity>
        </View>
        {PRESETS.length > 0 && (
          <View style={st.presetRow}>
            {PRESETS.map((n) => (
              <TouchableOpacity key={n} style={[st.presetBtn, clamped === n && st.presetOn]} onPress={() => setCount(n)}>
                <Text style={[st.presetTxt, clamped === n && { color: '#fff' }]}>{n}题</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[st.goBtn, max === 0 && { opacity: 0.4 }]}
        activeOpacity={0.8}
        disabled={max === 0}
        onPress={() => onStart(filtered, clamped)}
      >
        <Text style={st.goBtnTxt}>开始练习</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function QuizPhase({ questions, onFinish, onBack }) {
  const { removeUnfamiliar, addUnfamiliar } = useApp();
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [timing, setTiming] = useState(true);
  const [fb, setFb] = useState(null);
  const [picked, setPicked] = useState(null);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const tick = useRef(null);
  const comboAnim = useRef(new Animated.Value(1)).current;
  const allDone = idx >= questions.length;
  const q = questions[idx];

  function fmt(sec) {
    return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  }

  useEffect(() => {
    if (timing) tick.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(tick.current);
  }, [timing]);

  const onPick = useCallback((i) => {
    if (picked !== null) return;
    setPicked(i);
    const correct = i === q.answer;
    if (correct) removeUnfamiliar(q.char);
    else addUnfamiliar(q.char);
    setResults((prev) => [...prev, { q, correct }]);
    if (correct) {
      const next = combo + 1;
      setCombo(next);
      setMaxCombo((m) => Math.max(m, next));
      if (next >= 3) {
        comboAnim.setValue(1.4);
        Animated.spring(comboAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
      }
    } else { setCombo(0); }
    setFb(correct ? 'correct' : 'wrong');
  }, [picked, q, combo, comboAnim, removeUnfamiliar, addUnfamiliar]);

  const onFbDone = useCallback(() => {
    setFb(null); setPicked(null);
    if (idx < questions.length - 1) setIdx((i) => i + 1);
    else { setIdx(questions.length); setTiming(false); }
  }, [idx, questions.length]);

  const handleFinish = useCallback(() => {
    setTiming(false); clearInterval(tick.current);
    const correct = results.filter((r) => r.correct).length;
    const total = questions.length;
    onFinish({
      questions, answers: results.map((r) => (r.correct ? 1 : 0)),
      elapsed, subject: 'chn_charPractice', maxCombo,
      total, correct, wrong: total - correct,
      wrongList: results.filter((r) => !r.correct).map((r) => ({
        ...r.q, op: 'chn_charPractice',
        stem: r.q.char, answer: r.q.pinyin, userAnswer: '(错误)',
      })),
    });
  }, [questions, results, elapsed, maxCombo, onFinish]);

  const optColor = (i) => {
    if (picked === null) return null;
    if (i === q.answer) return C.success;
    if (i === picked) return C.error;
    return null;
  };
  const pct = Math.round(((allDone ? questions.length : idx) / questions.length) * 100);
  const showCombo = combo >= 3 && !allDone;

  return (
    <View style={st.quizRoot}>
      <View style={st.qHeader}>
        <TouchableOpacity onPress={onBack}><Text style={st.backTxt}>←</Text></TouchableOpacity>
        <View style={st.timerBox}><Text style={st.timerTxt}>{fmt(elapsed)}</Text></View>
        <Text style={st.progTxt}>{allDone ? questions.length : idx + 1}/{questions.length}</Text>
      </View>
      <View style={st.bar}><View style={[st.barFill, { width: `${pct}%` }]} /></View>
      {showCombo && (
        <Animated.View style={[st.comboBox, { transform: [{ scale: comboAnim }] }]}>
          <Text style={st.comboTxt}>🔥 连击 x{combo}!</Text>
        </Animated.View>
      )}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={st.qArea} showsVerticalScrollIndicator={false}>
        {allDone ? (
          <View style={st.doneBox}>
            <Text style={st.doneEmoji}>🎉</Text>
            <Text style={st.doneTxt}>全部答完了!</Text>
            <Text style={st.doneSub}>{results.filter((r) => r.correct).length}/{questions.length} 题答对</Text>
          </View>
        ) : (
          <View style={st.qCard}>
            <Text style={st.qIdx}>第 {idx + 1} 题</Text>
            <TouchableOpacity onPress={() => Speech.speak(q.char, { language: 'zh-CN', rate: 0.7 })} activeOpacity={0.7}>
              <Text style={st.bigChar}>{q.char}</Text>
            </TouchableOpacity>
            <Text style={st.askTxt}>这个字的拼音是什么？</Text>
            <View style={st.optGrid}>
              {q.options.map((opt, i) => {
                const bg = optColor(i);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[st.optBtn, bg && { borderColor: bg, backgroundColor: bg + '18' }]}
                    onPress={() => onPick(i)}
                    disabled={picked !== null}
                    activeOpacity={0.7}
                  >
                    <Text style={[st.optTxt, bg && { color: bg }]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {picked !== null && picked !== q.answer && (
              <Text style={st.correctHint}>正确答案: {q.pinyin}</Text>
            )}
          </View>
        )}
        <Feedback type={fb} points={fb === 'correct' ? 10 + (combo >= 3 ? 5 : 0) : 0} combo={combo} onDone={onFbDone} />
      </ScrollView>
      {allDone && (
        <View style={st.bottomBar}>
          <TouchableOpacity style={st.finishBtn} onPress={handleFinish} activeOpacity={0.8}>
            <Text style={st.finishTxt}>查看结果</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function CharPracticeScreen() {
  const nav = useNavigation();
  const route = useRoute();
  const { finishQuiz } = useApp();
  const finishedRef = useRef(false);

  const { tableType, lessonKeys } = route.params || {};
  const pool = useMemo(
    () => getCharsForLessons(tableType || 'shizi', lessonKeys || []),
    [tableType, lessonKeys],
  );

  const [phase, setPhase] = useState('setup');
  const [questions, setQuestions] = useState([]);
  const [showExit, setShowExit] = useState(false);
  const inQuiz = phase === 'quiz';

  const directBack = useCallback(() => nav.goBack(), [nav]);
  const onBack = useCallback(() => { if (inQuiz) setShowExit(true); else nav.goBack(); }, [inQuiz, nav]);

  useEffect(() => {
    if (!inQuiz) return;
    const unsub = nav.addListener('beforeRemove', (e) => {
      if (finishedRef.current || showExit) return;
      e.preventDefault();
      setShowExit(true);
    });
    return unsub;
  }, [nav, inQuiz, showExit]);

  const startQuiz = useCallback((filteredPool, count) => {
    setQuestions(genQuestions(filteredPool, count));
    setPhase('quiz');
  }, []);

  const handleFinish = useCallback(async (data) => {
    finishedRef.current = true;
    await finishQuiz(data);
    nav.replace('Results');
  }, [finishQuiz, nav]);

  if (phase === 'setup') {
    return <SetupPhase pool={pool} onStart={startQuiz} onBack={onBack} />;
  }

  return (
    <>
      <QuizPhase questions={questions} onFinish={handleFinish} onBack={onBack} />
      <ExitConfirmModal visible={showExit} onCancel={() => setShowExit(false)} onConfirm={directBack} />
    </>
  );
}

const GRN = '#4CAF7D';

const st = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.paperBg },
  setupRoot: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 12 },
  backTxt: { fontSize: 16, fontWeight: '600', color: GRN },
  setupEmoji: { fontSize: 48, marginBottom: 4 },
  setupTitle: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 2 },
  setupDesc: { fontSize: 14, color: C.textMid, marginBottom: 18 },
  card: { width: '100%', backgroundColor: C.paperCard, borderRadius: 20, padding: 20 },
  label: { fontSize: 15, fontWeight: '600', color: C.textMid, marginBottom: 10, textAlign: 'center' },
  unitRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
    backgroundColor: '#FFFDF7', marginBottom: 6, borderWidth: 2, borderColor: C.border,
  },
  unitRowOn: { backgroundColor: GRN, borderColor: GRN },
  unitIcon: { fontSize: 22, marginRight: 10 },
  unitLabel: { fontSize: 15, fontWeight: '700', color: C.text },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  cBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFDF7', alignItems: 'center', justifyContent: 'center', marginHorizontal: 10 },
  cBtnTxt: { fontSize: 22, fontWeight: '700', color: GRN },
  countNum: { fontSize: 38, fontWeight: '800', color: GRN, minWidth: 50, textAlign: 'center' },
  presetRow: { flexDirection: 'row', justifyContent: 'center' },
  presetBtn: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 14, backgroundColor: '#FFFDF7', marginHorizontal: 3 },
  presetOn: { backgroundColor: GRN },
  presetTxt: { fontSize: 13, fontWeight: '600', color: C.textMid },
  goBtn: { marginTop: 24, width: '100%', height: 54, borderRadius: 16, backgroundColor: GRN, alignItems: 'center', justifyContent: 'center' },
  goBtnTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },

  quizRoot: { flex: 1, backgroundColor: C.paperBg },
  qHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 },
  timerBox: { backgroundColor: C.paperCard, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 16 },
  timerTxt: { fontSize: 18, fontWeight: '700', color: GRN, fontVariant: ['tabular-nums'] },
  progTxt: { fontSize: 14, fontWeight: '700', color: C.textMid },
  bar: { height: 6, backgroundColor: 'rgba(196,196,196,0.4)', marginHorizontal: 16, borderRadius: 30, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 30, backgroundColor: GRN },
  comboBox: { alignSelf: 'center', marginTop: 8, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 16, backgroundColor: C.accentBg },
  comboTxt: { fontSize: 15, fontWeight: '800', color: C.accent },
  qArea: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16, paddingBottom: 16 },
  qCard: { backgroundColor: '#FFFDF7', borderRadius: RADIUS, padding: 24, alignItems: 'center' },
  qIdx: { fontSize: 13, fontWeight: '600', color: C.textLight, marginBottom: 8 },
  bigChar: { fontSize: 72, fontWeight: '800', color: '#333', marginBottom: 4 },
  askTxt: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 16 },
  optGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  optBtn: { width: '44%', paddingVertical: 14, borderRadius: 16, backgroundColor: C.paperCard, alignItems: 'center', margin: 6, borderWidth: 2.5, borderColor: 'rgba(0,0,0,0.08)' },
  optTxt: { fontSize: 22, fontWeight: '700', color: C.text },
  correctHint: { fontSize: 14, color: C.success, fontWeight: '700', marginTop: 12 },
  doneBox: { alignItems: 'center', paddingVertical: 40 },
  doneEmoji: { fontSize: 56, marginBottom: 10 },
  doneTxt: { fontSize: 22, fontWeight: '700', color: C.success },
  doneSub: { fontSize: 16, color: C.textMid, marginTop: 4 },
  bottomBar: { paddingHorizontal: 16, paddingBottom: 12 },
  finishBtn: { height: 54, borderRadius: 14, backgroundColor: GRN, alignItems: 'center', justifyContent: 'center' },
  finishTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },
});
