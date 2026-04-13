import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';

// ─── Theme ───────────────────────────────────────────────

const C = {
  primary: '#6C5CE7',
  primaryDark: '#5A4BD1',
  primaryBg: '#F0EDFF',
  success: '#00B894',
  successBg: '#E6FFF8',
  error: '#E17055',
  errorBg: '#FFF0EC',
  bg: '#F5F6FA',
  card: '#FFFFFF',
  text: '#2D3436',
  textMid: '#636E72',
  textLight: '#B2BEC3',
  border: '#E8E8E8',
  shadow: '#6C5CE7',
};

// ─── Utilities ───────────────────────────────────────────

const QUESTION_POOL_SIZE = 64; // 8×8 combinations (2-9)

function generateQuestions(count) {
  const pool = [];
  for (let a = 2; a <= 9; a++) {
    for (let b = 2; b <= 9; b++) {
      pool.push({ a, answer: b, product: a * b });
    }
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

function fmt(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// ─── NumberPad ───────────────────────────────────────────

const PAD_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', '⌫'],
];

function NumberPad({ onPress, disabled }) {
  return (
    <View style={s.padWrap}>
      {PAD_KEYS.map((row, ri) => (
        <View key={ri} style={s.padRow}>
          {row.map((k) => {
            const isAction = k === 'C' || k === '⌫';
            return (
              <TouchableOpacity
                key={k}
                activeOpacity={disabled ? 1 : 0.5}
                style={[
                  s.padKey,
                  isAction && s.padKeyAction,
                  disabled && s.padKeyOff,
                ]}
                onPress={() => !disabled && onPress(k)}
              >
                <Text
                  style={[
                    s.padKeyTxt,
                    isAction && s.padKeyActionTxt,
                    disabled && s.padKeyOffTxt,
                  ]}
                >
                  {k === 'C' ? '清空' : k}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── SetupScreen ─────────────────────────────────────────

const PRESETS = [10, 20, 30, 64];

function SetupScreen({ count, setCount, onStart }) {
  return (
    <View style={s.setupRoot}>
      <View style={s.setupTop}>
        <Text style={s.setupIcon}>✖️</Text>
        <Text style={s.setupTitle}>乘法口诀练习</Text>
        <Text style={s.setupSub}>2 ~ 9 乘法填空 · 不含 1</Text>
      </View>

      <View style={s.setupCard}>
        <Text style={s.setupLabel}>选择练习题数</Text>

        <View style={s.countRow}>
          <TouchableOpacity
            style={s.countBtn}
            onPress={() => setCount((c) => Math.max(1, c - 5))}
          >
            <Text style={s.countBtnTxt}>−5</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.countBtn}
            onPress={() => setCount((c) => Math.max(1, c - 1))}
          >
            <Text style={s.countBtnTxt}>−1</Text>
          </TouchableOpacity>
          <View style={s.countDisplay}>
            <Text style={s.countNum}>{count}</Text>
            <Text style={s.countUnit}>题</Text>
          </View>
          <TouchableOpacity
            style={s.countBtn}
            onPress={() => setCount((c) => Math.min(QUESTION_POOL_SIZE, c + 1))}
          >
            <Text style={s.countBtnTxt}>+1</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.countBtn}
            onPress={() => setCount((c) => Math.min(QUESTION_POOL_SIZE, c + 5))}
          >
            <Text style={s.countBtnTxt}>+5</Text>
          </TouchableOpacity>
        </View>

        <View style={s.presetRow}>
          {PRESETS.map((n) => (
            <TouchableOpacity
              key={n}
              style={[s.presetBtn, count === n && s.presetBtnOn]}
              onPress={() => setCount(n)}
            >
              <Text style={[s.presetTxt, count === n && s.presetTxtOn]}>
                {n}题
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={s.startBtn} onPress={onStart} activeOpacity={0.8}>
        <Text style={s.startBtnTxt}>开始练习</Text>
      </TouchableOpacity>

      <Text style={s.setupHint}>
        共可出 {QUESTION_POOL_SIZE} 道不重复题目
      </Text>
    </View>
  );
}

// ─── QuizScreen ──────────────────────────────────────────

function QuizScreen({
  question,
  idx,
  total,
  input,
  elapsed,
  done,
  answered,
  onKey,
  onSubmit,
  onFinish,
}) {
  const answeredCount = done ? total : idx;
  const pct = Math.round((answeredCount / total) * 100);

  return (
    <View style={s.quizRoot}>
      {/* ── header ── */}
      <View style={s.qHeader}>
        <View style={s.timerBox}>
          <Text style={s.timerTxt}>{fmt(elapsed)}</Text>
        </View>
        <Text style={s.qProgress}>
          {done ? `${total}/${total}` : `${idx + 1}/${total}`}
        </Text>
      </View>

      {/* ── progress bar ── */}
      <View style={s.bar}>
        <View style={[s.barFill, { width: `${pct}%` }]} />
      </View>

      {/* ── question area ── */}
      <View style={s.qArea}>
        {done ? (
          <View style={s.doneBox}>
            <Text style={s.doneEmoji}>🎉</Text>
            <Text style={s.doneTxt}>全部答完了！</Text>
          </View>
        ) : (
          <View style={s.qCard}>
            <Text style={s.qIndex}>第 {idx + 1} 题</Text>
            <View style={s.qRow}>
              <Text style={s.qNum}>{question.a}</Text>
              <Text style={s.qOp}>×</Text>
              <View style={[s.qInput, input ? s.qInputFilled : null]}>
                <Text style={input ? s.qInputTxt : s.qInputPh}>
                  {input || '?'}
                </Text>
              </View>
              <Text style={s.qOp}>=</Text>
              <Text style={s.qNum}>{question.product}</Text>
            </View>
          </View>
        )}
      </View>

      {/* ── pad + button ── */}
      <View style={s.qBottom}>
        {!done && <NumberPad onPress={onKey} disabled={answered} />}
        {done ? (
          <TouchableOpacity
            style={s.finishBtn}
            onPress={onFinish}
            activeOpacity={0.8}
          >
            <Text style={s.finishBtnTxt}>结束练习并批改</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.submitBtn, !input && s.submitBtnOff]}
            onPress={onSubmit}
            disabled={!input || answered}
            activeOpacity={0.8}
          >
            <Text style={[s.submitBtnTxt, !input && s.submitBtnOffTxt]}>
              确认
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── ResultsScreen ───────────────────────────────────────

function ResultsScreen({ data, elapsed, onReset }) {
  const pct = data.total ? Math.round((data.correct / data.total) * 100) : 0;
  const perfect = data.wrong === 0;

  return (
    <ScrollView
      style={s.resScroll}
      contentContainerStyle={s.resContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.resTitle}>练习结果</Text>

      {perfect && (
        <View style={s.praise}>
          <Text style={s.praiseEmoji}>🏆</Text>
          <Text style={s.praiseTxt}>全部正确，太棒了！</Text>
        </View>
      )}

      <View style={s.statsGrid}>
        <View style={s.statCard}>
          <Text style={s.statVal}>{fmt(elapsed)}</Text>
          <Text style={s.statLbl}>用时</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statVal}>{pct}%</Text>
          <Text style={s.statLbl}>正确率</Text>
        </View>
      </View>

      <View style={s.statsGrid}>
        <View style={[s.statCard, { borderTopColor: C.success, borderTopWidth: 3 }]}>
          <Text style={[s.statVal, { color: C.success }]}>{data.correct}</Text>
          <Text style={s.statLbl}>正确</Text>
        </View>
        <View
          style={[
            s.statCard,
            data.wrong > 0 && { borderTopColor: C.error, borderTopWidth: 3 },
          ]}
        >
          <Text style={[s.statVal, data.wrong > 0 && { color: C.error }]}>
            {data.wrong}
          </Text>
          <Text style={s.statLbl}>错误</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statVal}>{data.total}</Text>
          <Text style={s.statLbl}>总题数</Text>
        </View>
      </View>

      {data.wrongList.length > 0 && (
        <View style={s.wrongSec}>
          <Text style={s.wrongTitle}>错题回顾</Text>
          {data.wrongList.map((w, i) => (
            <View key={i} style={s.wrongItem}>
              <Text style={s.wrongQ}>{w.question}</Text>
              <View style={s.wrongRow}>
                <Text style={s.wrongLbl}>
                  你的答案{' '}
                  <Text style={{ color: C.error, fontWeight: '700' }}>
                    {w.userAnswer ?? '未作答'}
                  </Text>
                </Text>
                <Text style={s.wrongLbl}>
                  正确答案{' '}
                  <Text style={{ color: C.success, fontWeight: '700' }}>
                    {w.correctAnswer}
                  </Text>
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={s.resetBtn} onPress={onReset} activeOpacity={0.8}>
        <Text style={s.resetBtnTxt}>重新练习</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── App ─────────────────────────────────────────────────

export default function App() {
  const [phase, setPhase] = useState('setup');
  const [qCount, setQCount] = useState(20);
  const [questions, setQuestions] = useState([]);
  const [curIdx, setCurIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [input, setInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [timing, setTiming] = useState(false);
  const tick = useRef(null);

  useEffect(() => {
    if (timing) {
      tick.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    }
    return () => clearInterval(tick.current);
  }, [timing]);

  const start = useCallback(() => {
    const qs = generateQuestions(qCount);
    setQuestions(qs);
    setAnswers(new Array(qCount).fill(null));
    setCurIdx(0);
    setInput('');
    setElapsed(0);
    setTiming(true);
    setPhase('quiz');
  }, [qCount]);

  const onKey = useCallback((k) => {
    if (k === 'C') return setInput('');
    if (k === '⌫') return setInput((v) => v.slice(0, -1));
    setInput((v) => (v.length < 2 ? v + k : v));
  }, []);

  const onSubmit = useCallback(() => {
    if (!input) return;
    const val = parseInt(input, 10);
    setAnswers((prev) => {
      const next = [...prev];
      next[curIdx] = val;
      return next;
    });
    setInput('');
    if (curIdx < questions.length - 1) {
      setCurIdx((i) => i + 1);
    } else {
      setTiming(false);
    }
  }, [input, curIdx, questions.length]);

  const onFinish = useCallback(() => {
    setTiming(false);
    setPhase('results');
  }, []);

  const onReset = useCallback(() => {
    setTiming(false);
    clearInterval(tick.current);
    setPhase('setup');
  }, []);

  const allDone = useMemo(
    () => answers.length > 0 && answers.every((a) => a !== null),
    [answers],
  );

  const results = useMemo(() => {
    if (phase !== 'results') return null;
    let correct = 0;
    const wrongList = [];
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) {
        correct++;
      } else {
        wrongList.push({
          question: `${q.a} × □ = ${q.product}`,
          userAnswer: answers[i],
          correctAnswer: q.answer,
        });
      }
    });
    return { total: questions.length, correct, wrong: questions.length - correct, wrongList };
  }, [phase, questions, answers]);

  const root = (children) => (
    <SafeAreaView style={s.root}>
      <View style={s.inner}>{children}</View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );

  if (phase === 'setup') {
    return root(
      <SetupScreen count={qCount} setCount={setQCount} onStart={start} />,
    );
  }

  if (phase === 'quiz') {
    return root(
      <QuizScreen
        question={questions[curIdx]}
        idx={curIdx}
        total={questions.length}
        input={input}
        elapsed={elapsed}
        done={allDone}
        answered={answers[curIdx] !== null}
        onKey={onKey}
        onSubmit={onSubmit}
        onFinish={onFinish}
      />,
    );
  }

  return root(
    <ResultsScreen data={results} elapsed={elapsed} onReset={onReset} />,
  );
}

// ─── Styles ──────────────────────────────────────────────

const SHADOW = {
  shadowColor: C.shadow,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingTop: Platform.OS === 'android' ? 36 : 0,
  },

  // ── Setup ──────────────────────────────────────────

  setupRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  setupTop: { alignItems: 'center', marginBottom: 32 },
  setupIcon: { fontSize: 48, marginBottom: 8 },
  setupTitle: { fontSize: 28, fontWeight: '800', color: C.text },
  setupSub: { fontSize: 14, color: C.textMid, marginTop: 6 },
  setupCard: {
    width: '100%',
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...SHADOW,
  },
  setupLabel: { fontSize: 16, fontWeight: '600', color: C.textMid, marginBottom: 16 },
  countRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  countBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  countBtnTxt: { fontSize: 16, fontWeight: '700', color: C.primary },
  countDisplay: { alignItems: 'center', marginHorizontal: 12, minWidth: 64 },
  countNum: { fontSize: 40, fontWeight: '800', color: C.primary },
  countUnit: { fontSize: 13, color: C.textMid, marginTop: -4 },
  presetRow: { flexDirection: 'row' },
  presetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.bg,
    marginHorizontal: 4,
  },
  presetBtnOn: { backgroundColor: C.primary },
  presetTxt: { fontSize: 14, fontWeight: '600', color: C.textMid },
  presetTxtOn: { color: '#fff' },
  startBtn: {
    marginTop: 32,
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW,
  },
  startBtnTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },
  setupHint: { marginTop: 16, fontSize: 12, color: C.textLight },

  // ── Quiz ───────────────────────────────────────────

  quizRoot: { flex: 1 },
  qHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primaryBg,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerTxt: { fontSize: 18, fontWeight: '700', color: C.primary, fontVariant: ['tabular-nums'] },
  qProgress: { fontSize: 15, fontWeight: '600', color: C.textMid },
  bar: {
    height: 4,
    backgroundColor: C.border,
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: { height: 4, backgroundColor: C.primary, borderRadius: 2 },

  qArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  qCard: {
    width: '100%',
    backgroundColor: C.card,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    ...SHADOW,
  },
  qIndex: { fontSize: 14, fontWeight: '600', color: C.textLight, marginBottom: 12 },
  qRow: { flexDirection: 'row', alignItems: 'center' },
  qNum: { fontSize: 42, fontWeight: '800', color: C.text },
  qOp: { fontSize: 30, fontWeight: '600', color: C.textMid, marginHorizontal: 10 },
  qInput: {
    minWidth: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: C.primary,
    borderStyle: 'dashed',
    backgroundColor: C.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  qInputFilled: { borderStyle: 'solid', backgroundColor: '#fff' },
  qInputTxt: { fontSize: 42, fontWeight: '800', color: C.primary },
  qInputPh: { fontSize: 32, fontWeight: '700', color: C.textLight },

  doneBox: { alignItems: 'center' },
  doneEmoji: { fontSize: 56, marginBottom: 12 },
  doneTxt: { fontSize: 22, fontWeight: '700', color: C.success },

  qBottom: { paddingHorizontal: 16, paddingBottom: Platform.OS === 'android' ? 16 : 8 },

  // ── Number Pad ─────────────────────────────────────

  padWrap: { marginBottom: 10 },
  padRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  padKey: {
    flex: 1,
    height: 52,
    marginHorizontal: 4,
    borderRadius: 14,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW,
    shadowOpacity: 0.05,
  },
  padKeyAction: { backgroundColor: C.bg },
  padKeyOff: { opacity: 0.4 },
  padKeyTxt: { fontSize: 22, fontWeight: '700', color: C.text },
  padKeyActionTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },
  padKeyOffTxt: {},

  submitBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnOff: { backgroundColor: C.border },
  submitBtnTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },
  submitBtnOffTxt: { color: C.textLight },
  finishBtn: {
    height: 56,
    borderRadius: 14,
    backgroundColor: C.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  finishBtnTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },

  // ── Results ────────────────────────────────────────

  resScroll: { flex: 1 },
  resContent: { padding: 20, paddingBottom: 40 },
  resTitle: { fontSize: 26, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: 16 },

  praise: {
    backgroundColor: C.successBg,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  praiseEmoji: { fontSize: 44, marginBottom: 8 },
  praiseTxt: { fontSize: 20, fontWeight: '700', color: C.success },

  statsGrid: { flexDirection: 'row', marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    ...SHADOW,
    shadowOpacity: 0.05,
  },
  statVal: { fontSize: 28, fontWeight: '800', color: C.text },
  statLbl: { fontSize: 13, color: C.textMid, marginTop: 4 },

  wrongSec: { marginTop: 12, marginBottom: 20 },
  wrongTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 12 },
  wrongItem: {
    backgroundColor: C.errorBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  wrongQ: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 8 },
  wrongRow: { flexDirection: 'row', justifyContent: 'space-between' },
  wrongLbl: { fontSize: 14, color: C.textMid },

  resetBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  resetBtnTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },
});
