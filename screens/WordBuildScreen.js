import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import * as Speech from 'expo-speech';
import { useNavigation, useRoute } from '@react-navigation/native';
import { C, RADIUS, SUBJECT_COLORS } from '../lib/theme';
import { HANZI_UNITS, genWordSelectQuestions, genWordFillQuestions, getMaxWordQuestions } from '../lib/hanziData';
import { useApp } from '../lib/AppContext';
import Feedback from '../components/Feedback';
import ExitConfirmModal from '../components/ExitConfirmModal';

const sc = SUBJECT_COLORS.chinese;
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const Q_TYPES = [
  { key: 'wordFill', label: '填字组词', desc: '选字填空组成词语', icon: '🧩' },
  { key: 'wordSelect', label: '选词辨别', desc: '选出正确的词语', icon: '🔍' },
];

// -- Setup --

function SetupPhase({ onStart, onBack }) {
  const [unitIdx, setUnitIdx] = useState(0);
  const [typeIdx, setTypeIdx] = useState(0);
  const [count, setCount] = useState(10);

  const unit = HANZI_UNITS[unitIdx];
  const qType = Q_TYPES[typeIdx];
  const max = getMaxWordQuestions(unit.key, qType.key);
  const clamped = Math.min(count, max);

  useEffect(() => { if (count > max) setCount(max); }, [unitIdx, typeIdx]);

  const PRESETS = [5, 10, 15, 20].filter((n) => n <= max);

  return (
    <ScrollView style={st.setupScroll} contentContainerStyle={st.setupRoot} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={st.backBtn} onPress={onBack}>
        <Text style={st.backTxt}>← 返回</Text>
      </TouchableOpacity>
      <Text style={st.setupIcon}>✏️</Text>
      <Text style={st.setupTitle}>组词练习</Text>

      <View style={st.setupCard}>
        <Text style={st.setupLabel}>选择字组</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.hScroll}>
          {HANZI_UNITS.map((u, i) => (
            <TouchableOpacity
              key={u.key}
              style={[st.chip, unitIdx === i && st.chipActive]}
              onPress={() => setUnitIdx(i)}
            >
              <Text style={[st.chipTxt, unitIdx === i && st.chipTxtActive]}>{u.icon} {u.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[st.setupLabel, { marginTop: 16 }]}>练习类型</Text>
        <View style={st.typeRow}>
          {Q_TYPES.map((t, i) => (
            <TouchableOpacity
              key={t.key}
              style={[st.typeBtn, typeIdx === i && { backgroundColor: sc.primary, borderColor: sc.primary }]}
              onPress={() => setTypeIdx(i)}
            >
              <Text style={st.typeIcon}>{t.icon}</Text>
              <Text style={[st.typeLabel, typeIdx === i && { color: '#fff' }]}>{t.label}</Text>
              <Text style={[st.typeDesc, typeIdx === i && { color: 'rgba(255,255,255,0.8)' }]}>{t.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[st.setupLabel, { marginTop: 16 }]}>选择题数</Text>
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
              style={[st.presetBtn, clamped === n && { backgroundColor: sc.primary }]}
              onPress={() => setCount(n)}
            >
              <Text style={[st.presetTxt, clamped === n && { color: '#fff' }]}>{n}题</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={st.goBtn}
        activeOpacity={0.8}
        onPress={() => onStart(unit.key, qType.key, clamped)}
      >
        <Text style={st.goBtnTxt}>开始练习</Text>
      </TouchableOpacity>
      <Text style={st.hint}>共 {max} 道题可练</Text>
    </ScrollView>
  );
}

// -- Quiz Phase --

function QuizPhase({ questions, qType, onFinish, onBack }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState(() => new Array(questions.length).fill(null));
  const [elapsed, setElapsed] = useState(0);
  const [timing, setTiming] = useState(true);
  const [fb, setFb] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedMulti, setSelectedMulti] = useState([]);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const tick = useRef(null);
  const comboAnim = useRef(new Animated.Value(1)).current;

  const q = questions[idx];
  const allDone = answers.every((a) => a !== null);
  const isMulti = q?.multiSelect;

  function fmt(sec) {
    return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  }

  useEffect(() => {
    if (timing) tick.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(tick.current);
  }, [timing]);

  useEffect(() => {
    if (q?.targetChar) {
      Speech.speak(q.targetChar, { language: 'zh-CN', rate: 0.8 });
    }
  }, [idx]);

  const checkMulti = useCallback((sel) => {
    if (!q) return false;
    const correct = q.answer;
    return correct.length === sel.length && correct.every((i) => sel.includes(i));
  }, [q]);

  const handleCombo = useCallback((isOk) => {
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
  }, [combo, comboAnim]);

  const onSelectSingle = useCallback((optIdx) => {
    if (fb || answers[idx] !== null) return;
    setSelected(optIdx);
    const isOk = optIdx === q.answer;
    setAnswers((prev) => { const n = [...prev]; n[idx] = optIdx; return n; });
    handleCombo(isOk);
    setFb(isOk ? 'correct' : 'wrong');
  }, [fb, q, idx, answers, handleCombo]);

  const toggleMulti = useCallback((optIdx) => {
    if (fb || answers[idx] !== null) return;
    setSelectedMulti((prev) =>
      prev.includes(optIdx) ? prev.filter((i) => i !== optIdx) : [...prev, optIdx],
    );
  }, [fb, answers, idx]);

  const confirmMulti = useCallback(() => {
    if (fb || answers[idx] !== null || selectedMulti.length === 0) return;
    const isOk = checkMulti(selectedMulti);
    setAnswers((prev) => { const n = [...prev]; n[idx] = selectedMulti; return n; });
    handleCombo(isOk);
    setFb(isOk ? 'correct' : 'wrong');
  }, [fb, answers, idx, selectedMulti, checkMulti, handleCombo]);

  const onFbDone = useCallback(() => {
    setFb(null);
    setSelected(null);
    setSelectedMulti([]);
    if (idx < questions.length - 1) {
      setIdx((i) => i + 1);
    } else {
      setTiming(false);
    }
  }, [idx, questions.length]);

  const handleFinish = useCallback(() => {
    setTiming(false);
    clearInterval(tick.current);
    onFinish({ questions, answers, elapsed, subject: `chn_${qType}`, maxCombo });
  }, [questions, answers, elapsed, qType, maxCombo, onFinish]);

  const pct = Math.round(((allDone ? questions.length : idx) / questions.length) * 100);
  const showCombo = combo >= 3 && !allDone;

  const optionColor = (optIdx) => {
    if (!fb) return null;
    if (isMulti) {
      const correct = q.answer;
      if (correct.includes(optIdx)) return C.success;
      if (selectedMulti.includes(optIdx)) return C.error;
      return null;
    }
    if (optIdx === q.answer) return C.success;
    if (optIdx === selected && selected !== q.answer) return C.error;
    return null;
  };

  return (
    <View style={st.quizRoot}>
      <View style={st.qHeader}>
        <TouchableOpacity onPress={onBack}><Text style={st.backTxt}>←</Text></TouchableOpacity>
        <View style={st.timerBox}><Text style={st.timerTxt}>{fmt(elapsed)}</Text></View>
        <Text style={st.qProg}>{allDone ? questions.length : idx + 1}/{questions.length}</Text>
      </View>
      <View style={st.bar}><View style={[st.barFill, { width: `${pct}%`, backgroundColor: sc.primary }]} /></View>

      {showCombo && (
        <Animated.View style={[st.comboBox, { transform: [{ scale: comboAnim }] }]}>
          <Text style={st.comboTxt}>🔥 连击 x{combo}!</Text>
        </Animated.View>
      )}

      <View style={st.qArea}>
        {allDone ? (
          <View style={st.doneBox}>
            <Text style={st.doneEmoji}>🎉</Text>
            <Text style={st.doneTxt2}>全部答完了!</Text>
          </View>
        ) : (
          <View style={st.qCard}>
            <Text style={st.qIdx}>第 {idx + 1} 题</Text>

            {q.targetChar && (
              <TouchableOpacity style={st.charBubble} onPress={() => Speech.speak(q.targetChar, { language: 'zh-CN', rate: 0.8 })}>
                <Text style={st.charBubbleTxt}>{q.targetChar}</Text>
                <Text style={st.charPinyin}>{q.pinyin}</Text>
              </TouchableOpacity>
            )}

            <Text style={st.qStem}>{q.stem}</Text>
            {isMulti && <Text style={st.multiHint}>（多选题，选完后点确认）</Text>}

            <View style={st.optGrid}>
              {q.options.map((opt, i) => {
                const bg = optionColor(i);
                const isChosen = isMulti ? selectedMulti.includes(i) : selected === i;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      st.optBtn,
                      bg && { backgroundColor: bg + '20', borderColor: bg },
                      isChosen && !bg && { borderColor: sc.primary, backgroundColor: sc.bg },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => isMulti ? toggleMulti(i) : onSelectSingle(i)}
                    disabled={!!fb || answers[idx] !== null}
                  >
                    <View style={[st.optLabel, bg ? { backgroundColor: bg } : { backgroundColor: sc.primary + '20' }]}>
                      <Text style={[st.optLabelTxt, bg && { color: '#fff' }]}>{OPTION_LABELS[i]}</Text>
                    </View>
                    <Text style={[st.optText, bg && { color: bg, fontWeight: '700' }]}>{opt}</Text>
                    {isMulti && isChosen && !fb && <Text style={st.checkMark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            {isMulti && !fb && answers[idx] === null && (
              <TouchableOpacity
                style={[st.confirmBtn, selectedMulti.length === 0 && st.confirmBtnOff]}
                onPress={confirmMulti}
                disabled={selectedMulti.length === 0}
              >
                <Text style={[st.confirmTxt, selectedMulti.length === 0 && { color: C.textLight }]}>确认选择</Text>
              </TouchableOpacity>
            )}

            {fb === 'wrong' && (
              <View style={st.explBox}>
                <Text style={st.explTxt}>
                  💡 正确答案：{isMulti
                    ? q.correctOptions.join('、')
                    : q.options[q.answer]
                  }
                </Text>
              </View>
            )}
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
          <TouchableOpacity style={st.finishBtn} onPress={handleFinish} activeOpacity={0.8}>
            <Text style={st.finishTxt}>查看结果</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// -- Main --

export default function WordBuildScreen() {
  const route = useRoute();
  const nav = useNavigation();
  const { finishQuiz } = useApp();
  const directBack = useCallback(() => nav.goBack(), [nav]);
  const finishedRef = useRef(false);

  const [phase, setPhase] = useState('setup');
  const [questions, setQuestions] = useState([]);
  const [qType, setQType] = useState('wordFill');
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

  const startQuiz = useCallback((unitKey, type, count) => {
    setQType(type);
    const gen = type === 'wordSelect' ? genWordSelectQuestions : genWordFillQuestions;
    setQuestions(gen(unitKey, count));
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
      <QuizPhase questions={questions} qType={qType} onFinish={handleFinish} onBack={onBack} />
      <ExitConfirmModal visible={showExit} onCancel={() => setShowExit(false)} onConfirm={directBack} />
    </>
  );
}

const st = StyleSheet.create({
  setupScroll: { flex: 1, backgroundColor: C.bg },
  setupRoot: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 12 },
  backTxt: { fontSize: 16, fontWeight: '600', color: sc.primary },
  setupIcon: { fontSize: 48, marginBottom: 4 },
  setupTitle: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 20 },
  setupCard: { width: '100%', backgroundColor: C.card, borderRadius: 20, padding: 20 },
  setupLabel: { fontSize: 15, fontWeight: '600', color: C.textMid, marginBottom: 10, textAlign: 'center' },
  hScroll: { marginBottom: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
    backgroundColor: C.bg, marginRight: 8, borderWidth: 1.5, borderColor: C.border,
  },
  chipActive: { backgroundColor: sc.primary, borderColor: sc.primary },
  chipTxt: { fontSize: 13, fontWeight: '700', color: C.text },
  chipTxtActive: { color: '#fff' },

  typeRow: { flexDirection: 'row' },
  typeBtn: {
    flex: 1, alignItems: 'center', padding: 12, borderRadius: 14,
    backgroundColor: C.bg, marginHorizontal: 4, borderWidth: 2, borderColor: C.border,
  },
  typeIcon: { fontSize: 24, marginBottom: 4 },
  typeLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  typeDesc: { fontSize: 10, color: C.textMid, marginTop: 2, textAlign: 'center' },

  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cBtn: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: sc.bg,
    alignItems: 'center', justifyContent: 'center', marginHorizontal: 3,
  },
  cBtnTxt: { fontSize: 15, fontWeight: '700', color: sc.primary },
  countDisp: { alignItems: 'center', marginHorizontal: 10, minWidth: 56 },
  countNum: { fontSize: 36, fontWeight: '800', color: sc.primary },
  countUnit: { fontSize: 12, color: C.textMid, marginTop: -4 },
  presetRow: { flexDirection: 'row', justifyContent: 'center' },
  presetBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: C.bg, marginHorizontal: 3 },
  presetTxt: { fontSize: 13, fontWeight: '600', color: C.textMid },

  goBtn: {
    marginTop: 24, width: '100%', height: 54, borderRadius: 16,
    backgroundColor: sc.primary, alignItems: 'center', justifyContent: 'center',
  },
  goBtnTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },
  hint: { marginTop: 10, fontSize: 12, color: C.textLight },

  quizRoot: { flex: 1, backgroundColor: C.bg },
  qHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6,
  },
  timerBox: { backgroundColor: sc.bg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  timerTxt: { fontSize: 17, fontWeight: '700', color: sc.primary, fontVariant: ['tabular-nums'] },
  qProg: { fontSize: 14, fontWeight: '600', color: C.textMid },
  bar: { height: 8, backgroundColor: 'rgba(196,196,196,0.4)', marginHorizontal: 16, borderRadius: 30, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 30 },

  comboBox: { alignSelf: 'center', marginTop: 8, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 16, backgroundColor: C.accentBg },
  comboTxt: { fontSize: 15, fontWeight: '800', color: C.accent },

  qArea: { flex: 1, justifyContent: 'center', paddingHorizontal: 16 },
  qCard: { backgroundColor: C.card, borderRadius: RADIUS, padding: 20, alignItems: 'center' },
  qIdx: { fontSize: 13, fontWeight: '600', color: C.textLight, marginBottom: 10 },

  charBubble: {
    alignItems: 'center', backgroundColor: sc.bg, borderRadius: 20,
    paddingVertical: 10, paddingHorizontal: 24, marginBottom: 12,
  },
  charBubbleTxt: { fontSize: 44, fontWeight: '800', color: sc.primary },
  charPinyin: { fontSize: 14, color: sc.dark, marginTop: 2, fontWeight: '600' },

  qStem: { fontSize: 20, fontWeight: '700', color: C.text, textAlign: 'center', lineHeight: 30, marginBottom: 12 },
  multiHint: { fontSize: 12, color: C.accent, marginBottom: 10, fontWeight: '600' },

  optGrid: { width: '100%' },
  optBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(229,229,229,0.5)', borderRadius: RADIUS, padding: 14, marginBottom: 10,
    borderWidth: 2, borderColor: 'transparent',
  },
  optLabel: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  optLabelTxt: { fontSize: 15, fontWeight: '800', color: sc.primary },
  optText: { fontSize: 17, fontWeight: '600', color: C.text, flex: 1 },
  checkMark: { fontSize: 18, fontWeight: '800', color: sc.primary },

  confirmBtn: {
    marginTop: 4, paddingVertical: 12, paddingHorizontal: 32,
    borderRadius: 14, backgroundColor: sc.primary,
  },
  confirmBtnOff: { backgroundColor: C.border },
  confirmTxt: { fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },

  explBox: { backgroundColor: C.accentBg, borderRadius: 12, padding: 10, marginTop: 8, width: '100%' },
  explTxt: { fontSize: 13, color: C.accent, lineHeight: 20, textAlign: 'center' },

  doneBox: { alignItems: 'center' },
  doneEmoji: { fontSize: 56, marginBottom: 10 },
  doneTxt2: { fontSize: 22, fontWeight: '700', color: C.success },

  qBottom: { paddingHorizontal: 16, paddingBottom: 12 },
  finishBtn: { height: 54, borderRadius: 14, backgroundColor: sc.primary, alignItems: 'center', justifyContent: 'center' },
  finishTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },
});
