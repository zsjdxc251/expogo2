import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { C, RADIUS } from '../lib/theme';
import { CHN_TOPICS, generateChnQuestions, getChnMaxQuestions } from '../lib/chinese';
import Feedback from '../components/Feedback';

function fmt(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

function SetupPhase({ topicKey, onStart, onBack }) {
  const topic = CHN_TOPICS[topicKey];
  const max = getChnMaxQuestions(topicKey);
  const [count, setCount] = useState(Math.min(10, max));
  const clamped = Math.min(count, max);

  const PRESETS = [5, 10, 15, 20].filter((n) => n <= max);

  return (
    <View style={st.setupRoot}>
      <TouchableOpacity style={st.backBtn} onPress={onBack}>
        <Text style={st.backTxt}>← 返回</Text>
      </TouchableOpacity>
      <Text style={st.setupIcon}>{topic.icon}</Text>
      <Text style={st.setupTitle}>{topic.label} - 练习</Text>

      <View style={st.setupCard}>
        <Text style={st.setupLabel}>选择题数</Text>
        <View style={st.countRow}>
          <TouchableOpacity style={st.cBtn} onPress={() => setCount((c) => Math.max(1, c - 5))}>
            <Text style={st.cBtnTxt}>−5</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.cBtn} onPress={() => setCount((c) => Math.max(1, c - 1))}>
            <Text style={st.cBtnTxt}>−1</Text>
          </TouchableOpacity>
          <View style={st.countDisp}>
            <Text style={[st.countNum, { color: topic.color }]}>{clamped}</Text>
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
              style={[st.presetBtn, clamped === n && { backgroundColor: topic.color }]}
              onPress={() => setCount(n)}
            >
              <Text style={[st.presetTxt, clamped === n && { color: '#fff' }]}>{n}题</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[st.goBtn, { backgroundColor: topic.color }]}
        activeOpacity={0.8}
        onPress={() => onStart(clamped)}
      >
        <Text style={st.goBtnTxt}>开始练习</Text>
      </TouchableOpacity>
      <Text style={st.hint}>共 {max} 道题可练</Text>
    </View>
  );
}

function QuizPhase({ questions, topicKey, onFinish, onBack }) {
  const topic = CHN_TOPICS[topicKey];
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState(() => new Array(questions.length).fill(null));
  const [elapsed, setElapsed] = useState(0);
  const [timing, setTiming] = useState(true);
  const [fb, setFb] = useState(null);
  const [selected, setSelected] = useState(null);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const tick = useRef(null);
  const comboAnim = useRef(new Animated.Value(1)).current;

  const q = questions[idx];
  const allDone = answers.every((a) => a !== null);

  useEffect(() => {
    if (timing) tick.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(tick.current);
  }, [timing]);

  const onSelect = useCallback((optIdx) => {
    if (fb || answers[idx] !== null) return;
    setSelected(optIdx);

    const isOk = optIdx === q.answer;
    setAnswers((prev) => { const n = [...prev]; n[idx] = optIdx; return n; });

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
  }, [fb, q, idx, combo, comboAnim, answers]);

  const onFbDone = useCallback(() => {
    setFb(null);
    setSelected(null);
    if (idx < questions.length - 1) {
      setIdx((i) => i + 1);
    } else {
      setTiming(false);
    }
  }, [idx, questions.length]);

  const handleFinish = useCallback(() => {
    setTiming(false);
    clearInterval(tick.current);
    onFinish({ questions, answers, elapsed, subject: `chn_${topicKey}`, maxCombo });
  }, [questions, answers, elapsed, topicKey, maxCombo, onFinish]);

  const pct = Math.round(((allDone ? questions.length : idx) / questions.length) * 100);
  const showCombo = combo >= 3 && !allDone;

  const optionColor = (optIdx) => {
    if (selected === null || !fb) return null;
    if (optIdx === q.answer) return C.success;
    if (optIdx === selected && selected !== q.answer) return C.error;
    return null;
  };

  return (
    <View style={st.quizRoot}>
      <View style={st.qHeader}>
        <TouchableOpacity onPress={onBack}><Text style={st.backTxt}>←</Text></TouchableOpacity>
        <View style={st.timerBox}>
          <Text style={st.timerTxt}>{fmt(elapsed)}</Text>
        </View>
        <Text style={st.qProg}>{allDone ? questions.length : idx + 1}/{questions.length}</Text>
      </View>
      <View style={st.bar}><View style={[st.barFill, { width: `${pct}%`, backgroundColor: topic.color }]} /></View>

      {showCombo && (
        <Animated.View style={[st.comboBox, { transform: [{ scale: comboAnim }] }]}>
          <Text style={st.comboTxt}>🔥 连击 x{combo}!</Text>
        </Animated.View>
      )}

      <View style={st.qArea}>
        {allDone ? (
          <View style={st.doneBox}>
            <Text style={st.doneEmoji}>🎉</Text>
            <Text style={st.doneTxt}>全部答完了!</Text>
          </View>
        ) : (
          <View style={st.qCard}>
            <Text style={st.qIdx}>第 {idx + 1} 题</Text>
            <Text style={st.qStem}>{q.stem}</Text>

            <View style={st.optGrid}>
              {q.options.map((opt, i) => {
                const bg = optionColor(i);
                const isChosen = selected === i;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      st.optBtn,
                      bg && { backgroundColor: bg + '20', borderColor: bg },
                      isChosen && !bg && { borderColor: topic.color, backgroundColor: topic.bg },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => onSelect(i)}
                    disabled={!!fb || answers[idx] !== null}
                  >
                    <View style={[st.optLabel, bg ? { backgroundColor: bg } : { backgroundColor: topic.color + '20' }]}>
                      <Text style={[st.optLabelTxt, bg && { color: '#fff' }]}>{OPTION_LABELS[i]}</Text>
                    </View>
                    <Text style={[st.optText, bg && { color: bg, fontWeight: '700' }]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {fb && q.explanation ? (
              <View style={st.explBox}>
                <Text style={st.explTxt}>💡 {q.explanation}</Text>
              </View>
            ) : null}
          </View>
        )}
        <Feedback
          type={fb}
          points={fb === 'correct' ? 10 + (combo >= 3 ? 5 : 0) : 0}
          onDone={onFbDone}
        />
      </View>

      {allDone && (
        <View style={st.qBottom}>
          <TouchableOpacity style={[st.finishBtn, { backgroundColor: topic.color }]} onPress={handleFinish} activeOpacity={0.8}>
            <Text style={st.finishTxt}>查看结果</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function ChineseQuizScreen({ topicKey, onFinish, onBack }) {
  const [phase, setPhase] = useState('setup');
  const [questions, setQuestions] = useState([]);

  const startQuiz = useCallback((count) => {
    setQuestions(generateChnQuestions(topicKey, count));
    setPhase('quiz');
  }, [topicKey]);

  if (phase === 'setup') {
    return <SetupPhase topicKey={topicKey} onStart={startQuiz} onBack={onBack} />;
  }

  return (
    <QuizPhase
      questions={questions}
      topicKey={topicKey}
      onFinish={onFinish}
      onBack={onBack}
    />
  );
}

const st = StyleSheet.create({
  setupRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: C.bg },
  backBtn: { position: 'absolute', top: 16, left: 20 },
  backTxt: { fontSize: 16, fontWeight: '600', color: C.primary },
  setupIcon: { fontSize: 48, marginBottom: 4 },
  setupTitle: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 20 },
  setupCard: { width: '100%', backgroundColor: C.card, borderRadius: RADIUS, padding: 24, alignItems: 'center' },
  setupLabel: { fontSize: 15, fontWeight: '600', color: C.textMid, marginBottom: 12 },
  countRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cBtn: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: C.primaryBg,
    alignItems: 'center', justifyContent: 'center', marginHorizontal: 3,
  },
  cBtnTxt: { fontSize: 15, fontWeight: '700', color: C.primary },
  countDisp: { alignItems: 'center', marginHorizontal: 10, minWidth: 56 },
  countNum: { fontSize: 36, fontWeight: '800' },
  countUnit: { fontSize: 12, color: C.textMid, marginTop: -4 },
  presetRow: { flexDirection: 'row' },
  presetBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: C.bg, marginHorizontal: 3 },
  presetTxt: { fontSize: 13, fontWeight: '600', color: C.textMid },
  goBtn: {
    marginTop: 28, width: '100%', height: 54, borderRadius: RADIUS,
    alignItems: 'center', justifyContent: 'center',
  },
  goBtnTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },
  hint: { marginTop: 12, fontSize: 12, color: C.textLight },

  quizRoot: { flex: 1, backgroundColor: C.bg },
  qHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6,
  },
  timerBox: { backgroundColor: C.primaryBg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  timerTxt: { fontSize: 17, fontWeight: '700', color: C.primary, fontVariant: ['tabular-nums'] },
  qProg: { fontSize: 14, fontWeight: '600', color: C.textMid },
  bar: { height: 8, backgroundColor: 'rgba(196,196,196,0.4)', marginHorizontal: 16, borderRadius: 30, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 30 },

  comboBox: { alignSelf: 'center', marginTop: 8, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 16, backgroundColor: C.accentBg },
  comboTxt: { fontSize: 15, fontWeight: '800', color: C.accent },

  qArea: { flex: 1, justifyContent: 'center', paddingHorizontal: 16 },
  qCard: { backgroundColor: C.card, borderRadius: RADIUS, padding: 20 },
  qIdx: { fontSize: 13, fontWeight: '600', color: C.textLight, marginBottom: 10, textAlign: 'center' },
  qStem: { fontSize: 20, fontWeight: '700', color: C.text, textAlign: 'center', lineHeight: 30, marginBottom: 20 },

  optGrid: {},
  optBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(229,229,229,0.5)', borderRadius: RADIUS, padding: 14, marginBottom: 10,
    borderWidth: 2, borderColor: 'transparent',
  },
  optLabel: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  optLabelTxt: { fontSize: 15, fontWeight: '800', color: C.primary },
  optText: { fontSize: 17, fontWeight: '600', color: C.text, flex: 1 },

  explBox: { backgroundColor: C.accentBg, borderRadius: 12, padding: 10, marginTop: 8 },
  explTxt: { fontSize: 13, color: C.accent, lineHeight: 20 },

  doneBox: { alignItems: 'center' },
  doneEmoji: { fontSize: 56, marginBottom: 10 },
  doneTxt: { fontSize: 22, fontWeight: '700', color: C.success },

  qBottom: { paddingHorizontal: 16, paddingBottom: 12 },
  finishBtn: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  finishTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },
});
