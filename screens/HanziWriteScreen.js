import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import * as Speech from 'expo-speech';
import { useNavigation } from '@react-navigation/native';
import { C, RADIUS, SUBJECT_COLORS } from '../lib/theme';
import { HANZI_UNITS, getMaxQuestions, genDictQuestions } from '../lib/hanziData';
import { useApp } from '../lib/AppContext';
import Feedback from '../components/Feedback';
import ExitConfirmModal from '../components/ExitConfirmModal';

const sc = SUBJECT_COLORS.chinese;

// ── Setup ────────────────────────────────────────────────

function SetupPhase({ onStart, onBack }) {
  const [unitIdx, setUnitIdx] = useState(0);
  const [count, setCount] = useState(10);

  const unit = HANZI_UNITS[unitIdx];
  const max = getMaxQuestions(unit.key);
  const clamped = Math.min(count, max);

  useEffect(() => { if (count > max) setCount(max); }, [unitIdx]);

  const PRESETS = [5, 8, 10, 15].filter((n) => n <= max);

  return (
    <ScrollView style={st.scroll} contentContainerStyle={st.setupRoot} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={st.backBtn} onPress={onBack}>
        <Text style={st.backTxt}>← 返回</Text>
      </TouchableOpacity>
      <Text style={st.setupEmoji}>📖</Text>
      <Text style={st.setupTitle}>看拼音写字</Text>
      <Text style={st.setupDesc}>像查字典一样，先找偏旁再找字</Text>

      <View style={st.card}>
        <Text style={st.label}>选择范围</Text>
        {HANZI_UNITS.map((u, i) => (
          <TouchableOpacity
            key={u.key}
            style={[st.unitRow, unitIdx === i && st.unitRowOn]}
            onPress={() => setUnitIdx(i)}
          >
            <Text style={st.unitIcon}>{u.icon}</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[st.unitLabel, unitIdx === i && { color: '#fff' }]}>{u.label}</Text>
              <Text style={[st.unitDesc, unitIdx === i && { color: 'rgba(255,255,255,0.8)' }]}>{u.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}

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
        <View style={st.presetRow}>
          {PRESETS.map((n) => (
            <TouchableOpacity
              key={n}
              style={[st.presetBtn, clamped === n && st.presetOn]}
              onPress={() => setCount(n)}
            >
              <Text style={[st.presetTxt, clamped === n && { color: '#fff' }]}>{n}题</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={st.goBtn} activeOpacity={0.8} onPress={() => onStart(unit.key, clamped)}>
        <Text style={st.goBtnTxt}>开始练习</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Two-step Dict Question ───────────────────────────────

function DictQuestion({ q, onComplete, questionNum }) {
  const [step, setStep] = useState(1);
  const [step1Wrong, setStep1Wrong] = useState(false);
  const [step2Wrong, setStep2Wrong] = useState(false);
  const [done, setDone] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [pickedRadical, setPickedRadical] = useState(null);
  const [pickedChar, setPickedChar] = useState(null);
  const stepAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setStep(1);
    setStep1Wrong(false);
    setStep2Wrong(false);
    setDone(false);
    setMistakes(0);
    setPickedRadical(null);
    setPickedChar(null);
    stepAnim.setValue(1);
  }, [q]);

  useEffect(() => {
    Speech.speak(q.pinyin, { language: 'zh-CN', rate: 0.7 });
  }, [q]);

  const animateStep2 = useCallback(() => {
    Animated.sequence([
      Animated.timing(stepAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(stepAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [stepAnim]);

  const onPickRadical = useCallback((idx) => {
    if (done) return;
    setPickedRadical(idx);
    if (idx === q.correctRadicalIdx) {
      setStep1Wrong(false);
      setTimeout(() => {
        setStep(2);
        animateStep2();
      }, 400);
    } else {
      setStep1Wrong(true);
      setMistakes((m) => m + 1);
      setTimeout(() => { setPickedRadical(null); setStep1Wrong(false); }, 800);
    }
  }, [q, done, animateStep2]);

  const onPickChar = useCallback((idx) => {
    if (done) return;
    setPickedChar(idx);
    if (idx === q.correctCharIdx) {
      setStep2Wrong(false);
      setDone(true);
      setTimeout(() => onComplete(mistakes === 0 && step === 2), 600);
    } else {
      setStep2Wrong(true);
      setMistakes((m) => m + 1);
      setTimeout(() => { setPickedChar(null); setStep2Wrong(false); }, 800);
    }
  }, [q, done, mistakes, step, onComplete]);

  const radicalColor = (idx) => {
    if (pickedRadical === null) return null;
    if (idx === q.correctRadicalIdx && pickedRadical === idx) return C.success;
    if (idx === pickedRadical && pickedRadical !== q.correctRadicalIdx) return C.error;
    return null;
  };

  const charColor = (idx) => {
    if (pickedChar === null) return null;
    if (idx === q.correctCharIdx && pickedChar === idx) return C.success;
    if (idx === pickedChar && pickedChar !== q.correctCharIdx) return C.error;
    return null;
  };

  return (
    <View style={st.qBody}>
      {/* Pinyin display */}
      <TouchableOpacity
        style={st.pinyinBubble}
        onPress={() => Speech.speak(q.pinyin, { language: 'zh-CN', rate: 0.7 })}
        activeOpacity={0.7}
      >
        <Text style={st.listenHint}>🔊 点击听发音</Text>
        <Text style={st.pinyinBig}>{q.pinyin}</Text>
        <Text style={st.meaningSmall}>{q.meaning}</Text>
      </TouchableOpacity>

      {/* Step indicator */}
      <View style={st.stepRow}>
        <View style={[st.stepDot, step >= 1 && st.stepDotActive]}>
          <Text style={[st.stepNum, step >= 1 && st.stepNumActive]}>1</Text>
        </View>
        <View style={[st.stepLine, step >= 2 && st.stepLineActive]} />
        <View style={[st.stepDot, step >= 2 && st.stepDotActive]}>
          <Text style={[st.stepNum, step >= 2 && st.stepNumActive]}>2</Text>
        </View>
      </View>

      <Animated.View style={{ opacity: stepAnim, width: '100%', alignItems: 'center' }}>
        {step === 1 ? (
          <>
            <Text style={st.stepLabel}>第一步：这个字的偏旁部首是什么？</Text>
            <View style={st.optGrid}>
              {q.radicalOptions.map((r, i) => {
                const bg = radicalColor(i);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[st.radicalBtn, bg && { borderColor: bg, backgroundColor: bg + '18' }]}
                    onPress={() => onPickRadical(i)}
                    disabled={pickedRadical !== null}
                    activeOpacity={0.7}
                  >
                    <Text style={[st.radicalTxt, bg && { color: bg }]}>{r}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {step1Wrong && (
              <Text style={st.wrongHint}>不对哦，再想想这个字的偏旁</Text>
            )}
          </>
        ) : (
          <>
            <View style={st.step2Header}>
              <Text style={st.stepLabel}>第二步：偏旁 </Text>
              <View style={st.radicalTag}>
                <Text style={st.radicalTagTxt}>{q.radical}</Text>
              </View>
              <Text style={st.stepLabel}> 下面哪个字是它？</Text>
            </View>
            <View style={st.charGrid}>
              {q.charOptions.map((ch, i) => {
                const bg = charColor(i);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[st.charBtn, bg && { borderColor: bg, backgroundColor: bg + '18' }]}
                    onPress={() => onPickChar(i)}
                    disabled={pickedChar !== null}
                    activeOpacity={0.7}
                  >
                    <Text style={[st.charTxt, bg && { color: bg }]}>{ch}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {step2Wrong && (
              <Text style={st.wrongHint}>不是这个字，再看看拼音想一想</Text>
            )}
          </>
        )}
      </Animated.View>

      {/* Reveal on done */}
      {done && (
        <View style={st.revealBox}>
          <Text style={st.revealChar}>{q.char}</Text>
          <Text style={st.revealInfo}>偏旁: {q.radical}　结构: {q.structure}</Text>
          {mistakes > 0 && <Text style={st.revealMistakes}>本题错误 {mistakes} 次</Text>}
        </View>
      )}
    </View>
  );
}

// ── Quiz Phase ───────────────────────────────────────────

function QuizPhase({ questions, onFinish, onBack }) {
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [timing, setTiming] = useState(true);
  const [fb, setFb] = useState(null);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const tick = useRef(null);
  const comboAnim = useRef(new Animated.Value(1)).current;

  const allDone = idx >= questions.length;

  function fmt(sec) {
    return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  }

  useEffect(() => {
    if (timing) tick.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(tick.current);
  }, [timing]);

  const onQuestionComplete = useCallback((perfect) => {
    setResults((prev) => [...prev, { q: questions[idx], perfect }]);
    if (perfect) {
      const next = combo + 1;
      setCombo(next);
      setMaxCombo((m) => Math.max(m, next));
      if (next >= 3) {
        comboAnim.setValue(1.4);
        Animated.spring(comboAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
      }
    } else {
      setCombo(0);
    }
    setFb(perfect ? 'correct' : 'wrong');
  }, [idx, questions, combo, comboAnim]);

  const onFbDone = useCallback(() => {
    setFb(null);
    if (idx < questions.length - 1) {
      setIdx((i) => i + 1);
    } else {
      setIdx(questions.length);
      setTiming(false);
    }
  }, [idx, questions.length]);

  const handleFinish = useCallback(() => {
    setTiming(false);
    clearInterval(tick.current);
    const correct = results.filter((r) => r.perfect).length;
    const total = questions.length;
    const wrongList = results
      .filter((r) => !r.perfect)
      .map((r) => ({
        ...r.q, op: 'chn_hanziWrite', left: 0, right: 0, result: 0,
        stem: `${r.q.pinyin} → ${r.q.char}`,
        answer: r.q.char,
        userAnswer: '(有错误)',
      }));
    onFinish({
      questions, answers: results.map((r) => r.perfect ? 1 : 0),
      elapsed, subject: 'chn_hanziWrite', maxCombo,
      total, correct, wrong: total - correct, wrongList,
    });
  }, [questions, results, elapsed, maxCombo, onFinish]);

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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={st.qArea}
        showsVerticalScrollIndicator={false}
      >
        {allDone ? (
          <View style={st.doneBox}>
            <Text style={st.doneEmoji}>🎉</Text>
            <Text style={st.doneTxt}>全部答完了!</Text>
            <Text style={st.doneSub}>
              {results.filter((r) => r.perfect).length}/{questions.length} 题一次答对
            </Text>
          </View>
        ) : (
          <View style={st.qCard}>
            <Text style={st.qIdx}>第 {idx + 1} 题</Text>
            <DictQuestion
              q={questions[idx]}
              questionNum={idx}
              onComplete={onQuestionComplete}
            />
          </View>
        )}
        <Feedback
          type={fb}
          points={fb === 'correct' ? 10 + (combo >= 3 ? 5 : 0) : 0}
          combo={combo}
          onDone={onFbDone}
        />
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

// ── Main ─────────────────────────────────────────────────

export default function HanziWriteScreen() {
  const nav = useNavigation();
  const { finishQuiz } = useApp();
  const directBack = useCallback(() => nav.goBack(), [nav]);
  const finishedRef = useRef(false);

  const [phase, setPhase] = useState('setup');
  const [questions, setQuestions] = useState([]);
  const [showExit, setShowExit] = useState(false);
  const inQuiz = phase === 'quiz';
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

  const startQuiz = useCallback((unitKey, count) => {
    setQuestions(genDictQuestions(unitKey, count));
    setPhase('quiz');
  }, []);

  const handleFinish = useCallback(async (data) => {
    finishedRef.current = true;
    await finishQuiz(data);
    nav.replace('Results');
  }, [finishQuiz, nav]);

  if (phase === 'setup') {
    return <SetupPhase onStart={startQuiz} onBack={onBack} />;
  }

  return (
    <>
      <QuizPhase questions={questions} onFinish={handleFinish} onBack={onBack} />
      <ExitConfirmModal visible={showExit} onCancel={() => setShowExit(false)} onConfirm={directBack} />
    </>
  );
}

// ── Styles ───────────────────────────────────────────────

const st = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  setupRoot: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 12 },
  backTxt: { fontSize: 16, fontWeight: '600', color: sc.primary },
  setupEmoji: { fontSize: 48, marginBottom: 4 },
  setupTitle: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 2 },
  setupDesc: { fontSize: 14, color: C.textMid, marginBottom: 18 },

  card: { width: '100%', backgroundColor: C.card, borderRadius: 20, padding: 20 },
  label: { fontSize: 15, fontWeight: '600', color: C.textMid, marginBottom: 10, textAlign: 'center' },

  unitRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
    backgroundColor: C.bg, marginBottom: 6, borderWidth: 2, borderColor: C.border,
  },
  unitRowOn: { backgroundColor: sc.primary, borderColor: sc.primary },
  unitIcon: { fontSize: 22 },
  unitLabel: { fontSize: 15, fontWeight: '700', color: C.text },
  unitDesc: { fontSize: 11, color: C.textMid, marginTop: 1 },

  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  cBtn: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: sc.bg,
    alignItems: 'center', justifyContent: 'center', marginHorizontal: 10,
  },
  cBtnTxt: { fontSize: 22, fontWeight: '700', color: sc.primary },
  countNum: { fontSize: 38, fontWeight: '800', color: sc.primary, minWidth: 50, textAlign: 'center' },
  presetRow: { flexDirection: 'row', justifyContent: 'center' },
  presetBtn: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 14, backgroundColor: C.bg, marginHorizontal: 3 },
  presetOn: { backgroundColor: sc.primary },
  presetTxt: { fontSize: 13, fontWeight: '600', color: C.textMid },

  goBtn: {
    marginTop: 24, width: '100%', height: 54, borderRadius: 16,
    backgroundColor: sc.primary, alignItems: 'center', justifyContent: 'center',
  },
  goBtnTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },

  // Quiz
  quizRoot: { flex: 1, backgroundColor: C.bg },
  qHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6,
  },
  timerBox: { backgroundColor: sc.bg, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 16 },
  timerTxt: { fontSize: 18, fontWeight: '700', color: sc.primary, fontVariant: ['tabular-nums'] },
  progTxt: { fontSize: 14, fontWeight: '700', color: C.textMid },
  bar: { height: 6, backgroundColor: 'rgba(196,196,196,0.4)', marginHorizontal: 16, borderRadius: 30, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 30, backgroundColor: sc.primary },

  comboBox: { alignSelf: 'center', marginTop: 8, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 16, backgroundColor: C.accentBg },
  comboTxt: { fontSize: 15, fontWeight: '800', color: C.accent },

  qArea: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16, paddingBottom: 16 },
  qCard: { backgroundColor: C.card, borderRadius: RADIUS, padding: 20, alignItems: 'center' },
  qIdx: { fontSize: 13, fontWeight: '600', color: C.textLight, marginBottom: 6 },

  // Question body
  qBody: { width: '100%', alignItems: 'center' },

  pinyinBubble: {
    alignItems: 'center', backgroundColor: sc.bg, borderRadius: 20,
    paddingVertical: 12, paddingHorizontal: 32, marginBottom: 16,
  },
  listenHint: { fontSize: 11, color: sc.dark, marginBottom: 4 },
  pinyinBig: { fontSize: 38, fontWeight: '800', color: sc.primary },
  meaningSmall: { fontSize: 14, color: sc.dark, marginTop: 2 },

  // Step indicator
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.border,
  },
  stepDotActive: { backgroundColor: sc.primary, borderColor: sc.primary },
  stepNum: { fontSize: 13, fontWeight: '700', color: C.textMid },
  stepNumActive: { color: '#fff' },
  stepLine: { width: 40, height: 3, backgroundColor: C.border, borderRadius: 2 },
  stepLineActive: { backgroundColor: sc.primary },

  // Step labels
  stepLabel: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12, textAlign: 'center' },
  step2Header: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 },
  radicalTag: {
    backgroundColor: sc.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
  },
  radicalTagTxt: { fontSize: 18, fontWeight: '800', color: '#fff' },

  // Radical options (step 1)
  optGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8 },
  radicalBtn: {
    width: 72, height: 72, borderRadius: 16, backgroundColor: C.cardWhite,
    alignItems: 'center', justifyContent: 'center', margin: 6,
    borderWidth: 2.5, borderColor: C.border,
  },
  radicalTxt: { fontSize: 32, fontWeight: '700', color: C.text },

  // Char options (step 2)
  charGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8 },
  charBtn: {
    width: 76, height: 76, borderRadius: 18, backgroundColor: C.cardWhite,
    alignItems: 'center', justifyContent: 'center', margin: 7,
    borderWidth: 2.5, borderColor: C.border,
  },
  charTxt: { fontSize: 36, fontWeight: '800', color: C.text },

  wrongHint: { fontSize: 13, color: C.error, fontWeight: '600', textAlign: 'center', marginTop: 4 },

  // Reveal
  revealBox: { alignItems: 'center', marginTop: 14, backgroundColor: C.successBg, borderRadius: 14, padding: 14, width: '100%' },
  revealChar: { fontSize: 52, fontWeight: '800', color: C.success },
  revealInfo: { fontSize: 13, color: C.textMid, marginTop: 4 },
  revealMistakes: { fontSize: 12, color: C.accent, marginTop: 2, fontWeight: '600' },

  // Done
  doneBox: { alignItems: 'center', paddingVertical: 40 },
  doneEmoji: { fontSize: 56, marginBottom: 10 },
  doneTxt: { fontSize: 22, fontWeight: '700', color: C.success },
  doneSub: { fontSize: 16, color: C.textMid, marginTop: 4 },

  bottomBar: { paddingHorizontal: 16, paddingBottom: 12 },
  finishBtn: { height: 54, borderRadius: 14, backgroundColor: sc.primary, alignItems: 'center', justifyContent: 'center' },
  finishTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },
});
