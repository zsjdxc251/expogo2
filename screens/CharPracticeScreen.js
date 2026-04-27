import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import * as Speech from 'expo-speech';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { C, RADIUS, SHADOW, SHADOW_SM } from '../lib/theme';
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
    <View style={st.setupContainer}>
      <View style={st.setupHeader}>
        <TouchableOpacity
          style={st.headerBackCircle}
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={C.primary} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>看字选拼音</Text>
        <View style={st.headerSpacer} />
      </View>

      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.setupContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={st.setupIconWrap}>
          <MaterialIcons name="spellcheck" size={40} color={C.primary} />
        </View>
        <Text style={st.setupTitle}>看字选拼音</Text>
        <Text style={st.setupDesc}>共 {pool.length} 个字可练习</Text>

        <View style={st.card}>
          <Text style={st.sectionLabel}>练习范围</Text>
          <TouchableOpacity
            style={[st.rangeRow, !filterUf && st.rangeRowOn]}
            onPress={() => setFilterUf(false)}
            activeOpacity={0.8}
          >
            <View style={[st.rangeIconWrap, !filterUf && st.rangeIconWrapOn]}>
              <MaterialIcons name="menu-book" size={20} color={!filterUf ? C.onPrimary : C.primary} />
            </View>
            <Text style={[st.rangeLabel, !filterUf && st.rangeLabelOn]}>
              全部 ({pool.length}字)
            </Text>
            {!filterUf && <MaterialIcons name="check-circle" size={20} color={C.onPrimary} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.rangeRow, filterUf && st.rangeRowOn, ufCount === 0 && { opacity: 0.4 }]}
            onPress={() => { if (ufCount > 0) setFilterUf(true); }}
            disabled={ufCount === 0}
            activeOpacity={0.8}
          >
            <View style={[st.rangeIconWrap, { backgroundColor: C.secondaryFixed }, filterUf && st.rangeIconWrapOn]}>
              <MaterialIcons name="star" size={20} color={filterUf ? C.onPrimary : C.secondary} />
            </View>
            <Text style={[st.rangeLabel, filterUf && st.rangeLabelOn]}>
              陌生字 ({ufCount}字)
            </Text>
            {filterUf && <MaterialIcons name="check-circle" size={20} color={C.onPrimary} />}
          </TouchableOpacity>

          <Text style={[st.sectionLabel, { marginTop: 20 }]}>题数</Text>
          <View style={st.countRow}>
            <TouchableOpacity
              style={st.stepperBtn}
              onPress={() => setCount((c) => Math.max(1, c - 1))}
              activeOpacity={0.7}
            >
              <MaterialIcons name="remove" size={22} color={C.primary} />
            </TouchableOpacity>
            <Text style={st.countNum}>{clamped}</Text>
            <TouchableOpacity
              style={st.stepperBtn}
              onPress={() => setCount((c) => Math.min(max, c + 1))}
              activeOpacity={0.7}
            >
              <MaterialIcons name="add" size={22} color={C.primary} />
            </TouchableOpacity>
          </View>
          {PRESETS.length > 0 && (
            <View style={st.presetRow}>
              {PRESETS.map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[st.presetChip, clamped === n && st.presetChipOn]}
                  onPress={() => setCount(n)}
                  activeOpacity={0.7}
                >
                  <Text style={[st.presetTxt, clamped === n && st.presetTxtOn]}>{n}题</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[st.startBtn, max === 0 && { opacity: 0.4 }]}
          activeOpacity={0.85}
          disabled={max === 0}
          onPress={() => onStart(filtered, clamped)}
        >
          <MaterialIcons name="play-arrow" size={24} color={C.onPrimary} />
          <Text style={st.startBtnTxt}>开始练习</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
        <TouchableOpacity
          style={st.headerBackCircle}
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={C.primary} />
        </TouchableOpacity>
        <View style={st.timerChip}>
          <MaterialIcons name="timer" size={16} color={C.primary} />
          <Text style={st.timerTxt}>{fmt(elapsed)}</Text>
        </View>
        <View style={st.progChip}>
          <Text style={st.progTxt}>{allDone ? questions.length : idx + 1}/{questions.length}</Text>
        </View>
      </View>

      <View style={st.progressBarWrap}>
        <View style={[st.progressBarFill, { width: `${pct}%` }]} />
      </View>

      {showCombo && (
        <Animated.View style={[st.comboChip, { transform: [{ scale: comboAnim }] }]}>
          <MaterialIcons name="local-fire-department" size={18} color={C.accent} />
          <Text style={st.comboTxt}>连击 x{combo}!</Text>
        </Animated.View>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={st.qArea} showsVerticalScrollIndicator={false}>
        {allDone ? (
          <View style={st.doneCard}>
            <View style={st.doneIconWrap}>
              <MaterialIcons name="celebration" size={48} color={C.primary} />
            </View>
            <Text style={st.doneTxt}>全部答完了!</Text>
            <Text style={st.doneSub}>
              {results.filter((r) => r.correct).length}/{questions.length} 题答对
            </Text>
          </View>
        ) : (
          <View style={st.qCard}>
            <Text style={st.qIdx}>第 {idx + 1} 题</Text>
            <TouchableOpacity
              onPress={() => Speech.speak(q.char, { language: 'zh-CN', rate: 0.7 })}
              activeOpacity={0.7}
              style={st.charWrap}
            >
              <Text style={st.bigChar}>{q.char}</Text>
              <View style={st.speakHint}>
                <MaterialIcons name="volume-up" size={16} color={C.primary} />
              </View>
            </TouchableOpacity>
            <Text style={st.askTxt}>这个字的拼音是什么？</Text>
            <View style={st.optGrid}>
              {q.options.map((opt, i) => {
                const bg = optColor(i);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      st.optBtn,
                      bg && { borderColor: bg, backgroundColor: bg === C.success ? C.successBg : C.errorBg },
                    ]}
                    onPress={() => onPick(i)}
                    disabled={picked !== null}
                    activeOpacity={0.7}
                  >
                    <Text style={[st.optTxt, bg && { color: bg }]}>{opt}</Text>
                    {picked !== null && i === q.answer && (
                      <MaterialIcons name="check-circle" size={18} color={C.success} style={st.optIcon} />
                    )}
                    {picked === i && i !== q.answer && (
                      <MaterialIcons name="cancel" size={18} color={C.error} style={st.optIcon} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            {picked !== null && picked !== q.answer && (
              <View style={st.correctHintRow}>
                <MaterialIcons name="info" size={16} color={C.primary} />
                <Text style={st.correctHint}>正确答案: {q.pinyin}</Text>
              </View>
            )}
          </View>
        )}
        <Feedback type={fb} points={fb === 'correct' ? 10 + (combo >= 3 ? 5 : 0) : 0} combo={combo} onDone={onFbDone} />
      </ScrollView>

      {allDone && (
        <View style={st.bottomBar}>
          <TouchableOpacity style={st.finishBtn} onPress={handleFinish} activeOpacity={0.85}>
            <Text style={st.finishTxt}>查看结果</Text>
            <MaterialIcons name="arrow-forward" size={20} color={C.onPrimary} />
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

const st = StyleSheet.create({
  setupContainer: { flex: 1, backgroundColor: C.bg },
  setupHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  headerBackCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: C.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, fontSize: 18, fontWeight: '800', color: C.text, textAlign: 'center',
  },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  setupContent: {
    alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40,
  },
  setupIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: C.primaryBg,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  setupTitle: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 4 },
  setupDesc: { fontSize: 14, color: C.textMid, marginBottom: 20 },

  card: {
    width: '100%', backgroundColor: C.cardWhite, borderRadius: RADIUS, padding: 20,
    ...SHADOW,
  },
  sectionLabel: {
    fontSize: 14, fontWeight: '700', color: C.textMid, marginBottom: 10, textAlign: 'center',
  },
  rangeRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: RADIUS,
    backgroundColor: C.surfaceContainerLow, marginBottom: 8,
    borderWidth: 2, borderColor: C.border,
  },
  rangeRowOn: { backgroundColor: C.primary, borderColor: C.primary },
  rangeIconWrap: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.primaryBg,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  rangeIconWrapOn: { backgroundColor: 'rgba(255,255,255,0.2)' },
  rangeLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: C.text },
  rangeLabelOn: { color: C.onPrimary },

  countRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  stepperBtn: {
    width: 44, height: 44, borderRadius: RADIUS,
    backgroundColor: C.surfaceContainerLow, alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 12, borderWidth: 1.5, borderColor: C.border,
  },
  countNum: {
    fontSize: 38, fontWeight: '800', color: C.primary, minWidth: 50, textAlign: 'center',
  },
  presetRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  presetChip: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999,
    backgroundColor: C.surfaceContainerLow, borderWidth: 1, borderColor: C.border,
  },
  presetChipOn: { backgroundColor: C.primaryContainer, borderColor: C.primaryContainer },
  presetTxt: { fontSize: 13, fontWeight: '600', color: C.textMid },
  presetTxtOn: { color: C.onPrimary },

  startBtn: {
    marginTop: 24, width: '100%', height: 56, borderRadius: RADIUS,
    backgroundColor: C.primary, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    ...SHADOW_SM,
  },
  startBtnTxt: { fontSize: 18, fontWeight: '700', color: C.onPrimary },

  quizRoot: { flex: 1, backgroundColor: C.bg },
  qHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8,
  },
  timerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.primaryBg, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
  },
  timerTxt: {
    fontSize: 16, fontWeight: '700', color: C.primary, fontVariant: ['tabular-nums'],
  },
  progChip: {
    backgroundColor: C.surfaceContainerHigh, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999,
  },
  progTxt: { fontSize: 14, fontWeight: '700', color: C.textMid },

  progressBarWrap: {
    height: 6, backgroundColor: C.surfaceContainer, marginHorizontal: 16,
    borderRadius: 3, overflow: 'hidden',
  },
  progressBarFill: { height: 6, borderRadius: 3, backgroundColor: C.primary },

  comboChip: {
    alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 10, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999, backgroundColor: C.accentBg,
  },
  comboTxt: { fontSize: 15, fontWeight: '800', color: C.secondary },

  qArea: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16, paddingBottom: 16 },
  qCard: {
    backgroundColor: C.cardWhite, borderRadius: RADIUS, padding: 24,
    alignItems: 'center', ...SHADOW,
  },
  qIdx: { fontSize: 13, fontWeight: '600', color: C.textLight, marginBottom: 8 },
  charWrap: { alignItems: 'center', position: 'relative' },
  bigChar: { fontSize: 72, fontWeight: '800', color: C.text, marginBottom: 4 },
  speakHint: {
    position: 'absolute', bottom: 4, right: -24,
    width: 28, height: 28, borderRadius: 14, backgroundColor: C.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  askTxt: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 16 },
  optGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  optBtn: {
    width: '44%', paddingVertical: 14, borderRadius: RADIUS,
    backgroundColor: C.surfaceContainerLow, alignItems: 'center',
    borderWidth: 2, borderColor: C.border,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  optTxt: { fontSize: 22, fontWeight: '700', color: C.text },
  optIcon: { marginLeft: 2 },
  correctHintRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 14,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS,
    backgroundColor: C.primaryBg,
  },
  correctHint: { fontSize: 14, color: C.primary, fontWeight: '700' },

  doneCard: {
    alignItems: 'center', backgroundColor: C.cardWhite, borderRadius: RADIUS,
    padding: 32, ...SHADOW,
  },
  doneIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: C.primaryBg,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  doneTxt: { fontSize: 22, fontWeight: '700', color: C.primary },
  doneSub: { fontSize: 16, color: C.textMid, marginTop: 6 },

  bottomBar: { paddingHorizontal: 16, paddingBottom: 16 },
  finishBtn: {
    height: 56, borderRadius: RADIUS, backgroundColor: C.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    ...SHADOW_SM,
  },
  finishTxt: { fontSize: 18, fontWeight: '700', color: C.onPrimary },
});
