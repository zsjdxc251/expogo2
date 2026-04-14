import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { C, SHADOW, SUBJECTS, DIFFICULTIES, OP_SYMBOL } from '../lib/theme';
import { generateQuestions, getMaxQuestions } from '../lib/questions';
import NumberPad from '../components/NumberPad';
import Feedback from '../components/Feedback';

function fmt(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

// ── Setup Phase ──────────────────────────────────────────

function SetupPhase({ subject, onStart, onBack }) {
  const sub = SUBJECTS[subject];
  const [diff, setDiff] = useState('normal');
  const [count, setCount] = useState(20);
  const max = getMaxQuestions(subject, DIFFICULTIES[diff].range);
  const clamped = Math.min(count, max);

  useEffect(() => { if (count > max) setCount(max); }, [diff]);

  const PRESETS = [10, 20, 30].filter((n) => n <= max).concat(max > 30 ? [max] : []);

  return (
    <View style={st.setupRoot}>
      <TouchableOpacity style={st.backBtn} onPress={onBack}>
        <Text style={st.backTxt}>← 返回</Text>
      </TouchableOpacity>
      <Text style={st.setupIcon}>{sub.icon}</Text>
      <Text style={st.setupTitle}>{sub.label}</Text>

      <View style={st.setupCard}>
        <Text style={st.setupLabel}>选择难度</Text>
        <View style={st.diffRow}>
          {Object.values(DIFFICULTIES).map((d) => (
            <TouchableOpacity
              key={d.key}
              style={[st.diffBtn, diff === d.key && { backgroundColor: d.color }]}
              onPress={() => setDiff(d.key)}
            >
              <Text style={[st.diffTxt, diff === d.key && { color: '#fff' }]}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[st.setupLabel, { marginTop: 20 }]}>选择题数</Text>
        <View style={st.countRow}>
          <TouchableOpacity style={st.cBtn} onPress={() => setCount((c) => Math.max(1, c - 5))}>
            <Text style={st.cBtnTxt}>−5</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.cBtn} onPress={() => setCount((c) => Math.max(1, c - 1))}>
            <Text style={st.cBtnTxt}>−1</Text>
          </TouchableOpacity>
          <View style={st.countDisp}>
            <Text style={st.countNum}>{clamped}</Text>
            <Text style={st.countUnit}>题</Text>
          </View>
          <TouchableOpacity style={st.cBtn} onPress={() => setCount((c) => Math.min(max, c + 1))}>
            <Text style={st.cBtnTxt}>+1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.cBtn} onPress={() => setCount((c) => Math.min(max, c + 5))}>
            <Text style={st.cBtnTxt}>+5</Text>
          </TouchableOpacity>
        </View>
        <View style={st.presetRow}>
          {PRESETS.map((n) => (
            <TouchableOpacity
              key={n}
              style={[st.presetBtn, clamped === n && st.presetOn]}
              onPress={() => setCount(n)}
            >
              <Text style={[st.presetTxt, clamped === n && st.presetTxtOn]}>{n}题</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={st.goBtn}
        activeOpacity={0.8}
        onPress={() => onStart(diff, clamped)}
      >
        <Text style={st.goBtnTxt}>开始答题</Text>
      </TouchableOpacity>
      <Text style={st.hint}>本难度最多 {max} 道不重复题</Text>
    </View>
  );
}

// ── Quiz Phase ───────────────────────────────────────────

function QuizPhase({ questions, subject, settings, onFinish, onBack }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState(() => new Array(questions.length).fill(null));
  const [input, setInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [timing, setTiming] = useState(true);
  const [fb, setFb] = useState(null);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const tick = useRef(null);
  const autoRef = useRef(null);
  const comboAnim = useRef(new Animated.Value(1)).current;

  const q = questions[idx];
  const answered = answers[idx] !== null;
  const allDone = answers.every((a) => a !== null);
  const sub = SUBJECTS[subject] || { icon: '📝', label: '错题练习', color: C.primary };
  const opSym = OP_SYMBOL[q?.op] || '?';

  useEffect(() => {
    if (timing) tick.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(tick.current);
  }, [timing]);

  const doSubmit = useCallback(
    (val) => {
      if (fb) return;
      const isOk = val === q.answer;
      setAnswers((prev) => { const n = [...prev]; n[idx] = val; return n; });
      if (isOk) {
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
      setFb(isOk ? 'correct' : 'wrong');
    },
    [fb, q, idx, combo, comboAnim],
  );

  const onSubmit = useCallback(() => {
    if (!input || fb || answered) return;
    doSubmit(parseInt(input, 10));
  }, [input, fb, answered, doSubmit]);

  const onKey = useCallback(
    (k) => {
      if (fb || answered) return;
      if (k === 'C') { setInput(''); return; }
      if (k === '⌫') { setInput((v) => v.slice(0, -1)); return; }
      setInput((v) => (v.length < 2 ? v + k : v));
    },
    [fb, answered],
  );

  // Auto-submit: wait until input length matches expected digit count
  useEffect(() => {
    if (!settings?.autoSubmit || !input || fb || answered || !q) return;
    const digits = String(q.answer).length;
    if (input.length < digits) return;
    autoRef.current = setTimeout(() => {
      doSubmit(parseInt(input, 10));
    }, 250);
    return () => clearTimeout(autoRef.current);
  }, [input, settings?.autoSubmit, fb, answered, doSubmit, q]);

  const onFbDone = useCallback(() => {
    setFb(null);
    setInput('');
    if (idx < questions.length - 1) {
      setIdx((i) => i + 1);
    } else {
      setTiming(false);
    }
  }, [idx, questions.length]);

  const handleFinish = useCallback(() => {
    setTiming(false);
    clearInterval(tick.current);
    onFinish({ questions, answers, elapsed, subject, maxCombo });
  }, [questions, answers, elapsed, subject, maxCombo, onFinish]);

  const pct = Math.round(((allDone ? questions.length : idx) / questions.length) * 100);
  const showCombo = combo >= 3 && !allDone;

  // Input box renderer
  const InputBox = (
    <View style={[st.qInput, input ? st.qInputFilled : null]}>
      <Text style={input ? st.qInputTxt : st.qInputPh}>{input || '?'}</Text>
    </View>
  );

  return (
    <View style={st.quizRoot}>
      {/* Header */}
      <View style={st.qHeader}>
        <TouchableOpacity onPress={onBack}><Text style={st.backTxt}>←</Text></TouchableOpacity>
        <View style={st.timerBox}>
          <Text style={st.timerTxt}>{fmt(elapsed)}</Text>
        </View>
        <Text style={st.qProg}>{allDone ? questions.length : idx + 1}/{questions.length}</Text>
      </View>
      <View style={st.bar}><View style={[st.barFill, { width: `${pct}%`, backgroundColor: sub.color }]} /></View>

      {/* Combo */}
      {showCombo && (
        <Animated.View style={[st.comboBox, { transform: [{ scale: comboAnim }] }]}>
          <Text style={st.comboTxt}>🔥 连击 x{combo}!</Text>
        </Animated.View>
      )}

      {/* Question area */}
      <View style={st.qArea}>
        {allDone ? (
          <View style={st.doneBox}>
            <Text style={st.doneEmoji}>🎉</Text>
            <Text style={st.doneTxt}>全部答完了!</Text>
          </View>
        ) : (
          <View style={st.qCard}>
            <Text style={st.qIdx}>第 {idx + 1} 题</Text>
            {q.op === 'divRem' ? (
              <View style={st.qRow}>
                <Text style={st.qNum}>{q.display.left}</Text>
                <Text style={st.qOp}>÷</Text>
                <Text style={st.qNum}>{q.display.right}</Text>
                <Text style={st.qOp}>=</Text>
                {q.missingPos === 'result' ? InputBox : <Text style={st.qNum}>{q.display.result}</Text>}
                <Text style={st.qDots}>...</Text>
                {q.missingPos === 'remainder' ? InputBox : <Text style={st.qNum}>{q.display.remainder}</Text>}
              </View>
            ) : (
              <View style={st.qRow}>
                {q.missingPos === 'left' ? InputBox : <Text style={st.qNum}>{q.display.left}</Text>}
                <Text style={st.qOp}>{opSym}</Text>
                {q.missingPos === 'right' ? InputBox : <Text style={st.qNum}>{q.display.right}</Text>}
                <Text style={st.qOp}>=</Text>
                {q.missingPos === 'result' ? InputBox : <Text style={st.qNum}>{q.display.result}</Text>}
              </View>
            )}
          </View>
        )}
        <Feedback
          type={fb}
          points={fb === 'correct' ? 10 + (combo >= 3 ? 5 : 0) : 0}
          onDone={onFbDone}
        />
      </View>

      {/* Pad + Buttons */}
      <View style={st.qBottom}>
        {!allDone && <NumberPad onPress={onKey} disabled={!!fb || answered} />}
        {allDone ? (
          <TouchableOpacity style={st.finishBtn} onPress={handleFinish} activeOpacity={0.8}>
            <Text style={st.finishTxt}>查看结果</Text>
          </TouchableOpacity>
        ) : !settings?.autoSubmit ? (
          <TouchableOpacity
            style={[st.subBtn, (!input || !!fb) && st.subBtnOff]}
            onPress={onSubmit}
            disabled={!input || !!fb || answered}
            activeOpacity={0.8}
          >
            <Text style={[st.subBtnTxt, (!input || !!fb) && st.subBtnTxtOff]}>确认</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

// ── Main Export ───────────────────────────────────────────

export default function QuizScreen({ params, settings, onFinish, onBack }) {
  const [phase, setPhase] = useState(params.isReview ? 'quiz' : 'setup');
  const [questions, setQuestions] = useState(params.questions || []);
  const [diff, setDiff] = useState(params.difficulty || 'normal');

  const startQuiz = useCallback(
    (difficulty, count) => {
      setDiff(difficulty);
      const range = DIFFICULTIES[difficulty].range;
      setQuestions(generateQuestions(params.subject, count, range));
      setPhase('quiz');
    },
    [params.subject],
  );

  if (phase === 'setup') {
    return <SetupPhase subject={params.subject} onStart={startQuiz} onBack={onBack} />;
  }

  return (
    <QuizPhase
      questions={questions}
      subject={params.subject}
      settings={settings}
      onFinish={(data) => onFinish({ ...data, difficulty: diff })}
      onBack={onBack}
    />
  );
}

// ── Styles ───────────────────────────────────────────────

const st = StyleSheet.create({
  // Setup
  setupRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: C.bg },
  backBtn: { position: 'absolute', top: 16, left: 20 },
  backTxt: { fontSize: 16, fontWeight: '600', color: C.primary },
  setupIcon: { fontSize: 48, marginBottom: 4 },
  setupTitle: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 20 },
  setupCard: { width: '100%', backgroundColor: C.card, borderRadius: 20, padding: 24, alignItems: 'center', ...SHADOW },
  setupLabel: { fontSize: 15, fontWeight: '600', color: C.textMid, marginBottom: 12 },
  diffRow: { flexDirection: 'row' },
  diffBtn: {
    flex: 1, height: 42, borderRadius: 12, marginHorizontal: 4,
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
  },
  diffTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },
  countRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cBtn: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: C.primaryBg,
    alignItems: 'center', justifyContent: 'center', marginHorizontal: 3,
  },
  cBtnTxt: { fontSize: 15, fontWeight: '700', color: C.primary },
  countDisp: { alignItems: 'center', marginHorizontal: 10, minWidth: 56 },
  countNum: { fontSize: 36, fontWeight: '800', color: C.primary },
  countUnit: { fontSize: 12, color: C.textMid, marginTop: -4 },
  presetRow: { flexDirection: 'row' },
  presetBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: C.bg, marginHorizontal: 3 },
  presetOn: { backgroundColor: C.primary },
  presetTxt: { fontSize: 13, fontWeight: '600', color: C.textMid },
  presetTxtOn: { color: '#fff' },
  goBtn: {
    marginTop: 28, width: '100%', height: 54, borderRadius: 16,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW,
  },
  goBtnTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },
  hint: { marginTop: 12, fontSize: 12, color: C.textLight },

  // Quiz
  quizRoot: { flex: 1, backgroundColor: C.bg },
  qHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6,
  },
  timerBox: { backgroundColor: C.primaryBg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  timerTxt: { fontSize: 17, fontWeight: '700', color: C.primary, fontVariant: ['tabular-nums'] },
  qProg: { fontSize: 14, fontWeight: '600', color: C.textMid },
  bar: { height: 4, backgroundColor: C.border, marginHorizontal: 16, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },

  comboBox: { alignSelf: 'center', marginTop: 8, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 16, backgroundColor: C.accentBg },
  comboTxt: { fontSize: 15, fontWeight: '800', color: C.accent },

  qArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  qCard: { width: '100%', backgroundColor: C.card, borderRadius: 20, paddingVertical: 24, paddingHorizontal: 16, alignItems: 'center', ...SHADOW },
  qIdx: { fontSize: 13, fontWeight: '600', color: C.textLight, marginBottom: 10 },
  qRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  qNum: { fontSize: 40, fontWeight: '800', color: C.text },
  qOp: { fontSize: 28, fontWeight: '600', color: C.textMid, marginHorizontal: 8 },
  qDots: { fontSize: 28, fontWeight: '800', color: C.textMid, marginHorizontal: 4, letterSpacing: 2 },
  qInput: {
    minWidth: 54, height: 54, borderRadius: 14, borderWidth: 2.5,
    borderColor: C.primary, borderStyle: 'dashed', backgroundColor: C.primaryBg,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10,
  },
  qInputFilled: { borderStyle: 'solid', backgroundColor: '#fff' },
  qInputTxt: { fontSize: 40, fontWeight: '800', color: C.primary },
  qInputPh: { fontSize: 30, fontWeight: '700', color: C.textLight },

  doneBox: { alignItems: 'center' },
  doneEmoji: { fontSize: 56, marginBottom: 10 },
  doneTxt: { fontSize: 22, fontWeight: '700', color: C.success },

  qBottom: { paddingHorizontal: 16, paddingBottom: 10 },
  subBtn: { height: 52, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  subBtnOff: { backgroundColor: C.border },
  subBtnTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },
  subBtnTxtOff: { color: C.textLight },
  finishBtn: { height: 54, borderRadius: 14, backgroundColor: C.success, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  finishTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },
});
