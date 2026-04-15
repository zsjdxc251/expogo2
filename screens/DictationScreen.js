import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import * as Speech from 'expo-speech';
import { useNavigation, useRoute } from '@react-navigation/native';
import { C, RADIUS } from '../lib/theme';
import { ENG_TOPIC_KEYS, ENG_TOPICS, generateEngQuestions } from '../lib/english';
import { CHN_TOPICS, generateChnQuestions } from '../lib/chinese';
import { useApp } from '../lib/AppContext';
import Feedback from '../components/Feedback';
import ExitConfirmModal from '../components/ExitConfirmModal';
import { shuffle } from '../lib/questions';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

function generateDictationQuestions(mode, count) {
  if (mode === 'eng') {
    const keys = ENG_TOPIC_KEYS.slice(0, 6);
    let pool = [];
    keys.forEach((k) => {
      const qs = generateEngQuestions(k, 10);
      pool.push(...qs.map((q) => ({
        ...q,
        speakText: q.options[q.answer],
        speakLang: 'en-US',
        dictStem: '听发音，选择正确的答案',
      })));
    });
    return shuffle(pool).slice(0, Math.min(count, pool.length));
  }

  const chnKeys = Object.keys(CHN_TOPICS).slice(0, 5);
  let pool = [];
  chnKeys.forEach((k) => {
    const qs = generateChnQuestions(k, 10);
    pool.push(...qs.map((q) => ({
      ...q,
      speakText: q.options[q.answer],
      speakLang: 'zh-CN',
      dictStem: '听发音，选择正确的答案',
    })));
  });
  return shuffle(pool).slice(0, Math.min(count, pool.length));
}

function fmt(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

function SetupPhase({ mode, onStart, onBack }) {
  const isEng = mode === 'eng';
  const [count, setCount] = useState(10);
  const max = 30;
  const clamped = Math.min(count, max);
  const PRESETS = [5, 10, 15, 20];

  return (
    <View style={st.setupRoot}>
      <TouchableOpacity style={st.backBtn} onPress={onBack}>
        <Text style={st.backTxt}>← 返回</Text>
      </TouchableOpacity>
      <Text style={st.setupIcon}>🎧</Text>
      <Text style={st.setupTitle}>{isEng ? '英语听写' : '语文听写'}</Text>
      <Text style={st.setupDesc}>听发音，选择正确答案</Text>

      <View style={st.setupCard}>
        <Text style={st.setupLabel}>选择题数</Text>
        <View style={st.countRow}>
          <TouchableOpacity style={st.cBtn} onPress={() => setCount((c) => Math.max(1, c - 5))}>
            <Text style={st.cBtnTxt}>−5</Text>
          </TouchableOpacity>
          <View style={st.countDisp}>
            <Text style={[st.countNum, { color: isEng ? C.primary : C.accent }]}>{clamped}</Text>
            <Text style={st.countUnit}>题</Text>
          </View>
          <TouchableOpacity style={st.cBtn} onPress={() => setCount((c) => Math.min(max, c + 5))}>
            <Text style={st.cBtnTxt}>+5</Text>
          </TouchableOpacity>
        </View>
        <View style={st.presetRow}>
          {PRESETS.map((n) => (
            <TouchableOpacity
              key={n}
              style={[st.presetBtn, clamped === n && { backgroundColor: isEng ? C.primary : C.accent }]}
              onPress={() => setCount(n)}
            >
              <Text style={[st.presetTxt, clamped === n && { color: '#fff' }]}>{n}题</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[st.goBtn, { backgroundColor: isEng ? C.primary : C.accent }]}
        activeOpacity={0.8}
        onPress={() => onStart(clamped)}
      >
        <Text style={st.goBtnTxt}>开始听写</Text>
      </TouchableOpacity>
    </View>
  );
}

function QuizPhase({ questions, mode, onFinish, onBack }) {
  const isEng = mode === 'eng';
  const color = isEng ? C.primary : C.accent;
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState(() => new Array(questions.length).fill(null));
  const [elapsed, setElapsed] = useState(0);
  const [timing, setTiming] = useState(true);
  const [fb, setFb] = useState(null);
  const [selected, setSelected] = useState(null);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const tick = useRef(null);
  const comboAnim = useRef(new Animated.Value(1)).current;

  const q = questions[idx];
  const allDone = answers.every((a) => a !== null);

  useEffect(() => {
    if (timing) tick.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(tick.current);
  }, [timing]);

  const speakWord = useCallback(() => {
    if (!q || speaking) return;
    setSpeaking(true);
    Speech.speak(q.speakText || q.options?.[q.answer] || '', {
      language: q.speakLang || (isEng ? 'en-US' : 'zh-CN'),
      rate: isEng ? 0.8 : 0.9,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [q, speaking, isEng]);

  useEffect(() => {
    if (q && !allDone && !fb) {
      setTimeout(speakWord, 400);
    }
  }, [idx, q, allDone, fb, speakWord]);

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
    onFinish({
      questions,
      answers,
      elapsed,
      subject: isEng ? 'dictation_eng' : 'dictation_chn',
      maxCombo,
    });
  }, [questions, answers, elapsed, isEng, maxCombo, onFinish]);

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
      <View style={st.bar}><View style={[st.barFill, { width: `${pct}%`, backgroundColor: color }]} /></View>

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
            <Text style={st.dictLabel}>🎧 听发音，选择正确答案</Text>

            <TouchableOpacity
              style={[st.speakBtn, { backgroundColor: color }]}
              activeOpacity={0.7}
              onPress={speakWord}
              disabled={speaking}
            >
              <Text style={st.speakTxt}>{speaking ? '🔊 播放中...' : '🔊 点击播放'}</Text>
            </TouchableOpacity>

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
                      isChosen && !bg && { borderColor: color, backgroundColor: color + '15' },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => onSelect(i)}
                    disabled={!!fb || answers[idx] !== null}
                  >
                    <View style={[st.optLabel, bg ? { backgroundColor: bg } : { backgroundColor: color + '20' }]}>
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
          combo={combo}
          onDone={onFbDone}
        />
      </View>

      {allDone && (
        <View style={st.qBottom}>
          <TouchableOpacity style={[st.finishBtn, { backgroundColor: color }]} onPress={handleFinish} activeOpacity={0.8}>
            <Text style={st.finishTxt}>查看结果</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function DictationScreen() {
  const route = useRoute();
  const nav = useNavigation();
  const { finishQuiz } = useApp();
  const mode = route.params?.mode || 'eng';
  const directBack = useCallback(() => nav.goBack(), [nav]);

  const handleFinish = useCallback(async (data) => {
    await finishQuiz(data);
    nav.replace('Results');
  }, [finishQuiz, nav]);

  const [phase, setPhase] = useState('setup');
  const [questions, setQuestions] = useState([]);
  const [showExit, setShowExit] = useState(false);
  const inQuiz = phase === 'quiz';
  const onBack = useCallback(() => { if (inQuiz) setShowExit(true); else nav.goBack(); }, [inQuiz, nav]);

  useEffect(() => {
    if (!inQuiz) return;
    const unsub = nav.addListener('beforeRemove', (e) => {
      if (!showExit) { e.preventDefault(); setShowExit(true); }
    });
    return unsub;
  }, [nav, inQuiz, showExit]);

  const startQuiz = useCallback((count) => {
    setQuestions(generateDictationQuestions(mode, count));
    setPhase('quiz');
  }, [mode]);

  if (phase === 'setup') {
    return <SetupPhase mode={mode} onStart={startQuiz} onBack={onBack} />;
  }

  return (
    <>
      <QuizPhase
        questions={questions}
        mode={mode}
        onFinish={handleFinish}
        onBack={onBack}
      />
      <ExitConfirmModal visible={showExit} onCancel={() => setShowExit(false)} onConfirm={directBack} />
    </>
  );
}

const st = StyleSheet.create({
  setupRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: C.bg },
  backBtn: { position: 'absolute', top: 16, left: 20 },
  backTxt: { fontSize: 16, fontWeight: '600', color: C.primary },
  setupIcon: { fontSize: 48, marginBottom: 4 },
  setupTitle: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 4 },
  setupDesc: { fontSize: 15, color: C.textMid, marginBottom: 16 },
  setupCard: { width: '100%', backgroundColor: C.card, borderRadius: RADIUS, padding: 24, alignItems: 'center' },
  setupLabel: { fontSize: 15, fontWeight: '600', color: C.textMid, marginBottom: 12 },
  countRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cBtn: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: C.primaryBg,
    alignItems: 'center', justifyContent: 'center', marginHorizontal: 3,
  },
  cBtnTxt: { fontSize: 15, fontWeight: '700', color: C.primary },
  countDisp: { alignItems: 'center', marginHorizontal: 16, minWidth: 56 },
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
  dictLabel: { fontSize: 16, fontWeight: '700', color: C.text, textAlign: 'center', marginBottom: 16 },

  speakBtn: {
    alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 20, marginBottom: 20,
  },
  speakTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },

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
