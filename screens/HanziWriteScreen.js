import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import * as Speech from 'expo-speech';
import { useNavigation } from '@react-navigation/native';
import { C, RADIUS, SUBJECT_COLORS } from '../lib/theme';
import {
  HANZI_UNITS, getMaxQuestions,
  genAssembleQuestions, genHalfQuestions, genPinyinPickQuestions, genMixedQuestions,
} from '../lib/hanziData';
import { useApp } from '../lib/AppContext';
import Feedback from '../components/Feedback';
import ExitConfirmModal from '../components/ExitConfirmModal';

const sc = SUBJECT_COLORS.chinese;

const Q_MODES = [
  { key: 'mixed', label: '综合', desc: '混合全部题型' },
  { key: 'assemble', label: '拼字', desc: '选部件组装汉字' },
  { key: 'half', label: '找另一半', desc: '给一半选另一半' },
  { key: 'pinyinPick', label: '选字', desc: '看拼音选汉字' },
];

const GEN_MAP = {
  mixed: genMixedQuestions,
  assemble: genAssembleQuestions,
  half: genHalfQuestions,
  pinyinPick: genPinyinPickQuestions,
};

// ── Setup ────────────────────────────────────────────────

function SetupPhase({ onStart, onBack }) {
  const [unitIdx, setUnitIdx] = useState(0);
  const [modeIdx, setModeIdx] = useState(0);
  const [count, setCount] = useState(10);

  const unit = HANZI_UNITS[unitIdx];
  const max = getMaxQuestions(unit.key);
  const clamped = Math.min(count, max);

  useEffect(() => { if (count > max) setCount(max); }, [unitIdx]);

  const PRESETS = [5, 8, 10].filter((n) => n <= max).concat(max > 10 ? [max] : []);

  return (
    <ScrollView style={st.scroll} contentContainerStyle={st.setupRoot} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={st.backBtn} onPress={onBack}>
        <Text style={st.backTxt}>← 返回</Text>
      </TouchableOpacity>
      <Text style={st.setupEmoji}>✍️</Text>
      <Text style={st.setupTitle}>看拼音写字</Text>
      <Text style={st.setupDesc}>选部件拼出正确的汉字</Text>

      <View style={st.card}>
        <Text style={st.label}>选择字组</Text>
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
            <Text style={[st.unitCount, unitIdx === i && { color: '#fff' }]}>{u.chars.length}字</Text>
          </TouchableOpacity>
        ))}

        <Text style={[st.label, { marginTop: 18 }]}>题目类型</Text>
        <View style={st.modeRow}>
          {Q_MODES.map((m, i) => (
            <TouchableOpacity
              key={m.key}
              style={[st.modeBtn, modeIdx === i && st.modeBtnOn]}
              onPress={() => setModeIdx(i)}
            >
              <Text style={[st.modeLbl, modeIdx === i && { color: '#fff' }]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={st.modeDesc}>{Q_MODES[modeIdx].desc}</Text>

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

      <TouchableOpacity style={st.goBtn} activeOpacity={0.8} onPress={() => onStart(unit.key, Q_MODES[modeIdx].key, clamped)}>
        <Text style={st.goBtnTxt}>开始练习</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Assemble question (select parts) ─────────────────────

function AssembleQ({ q, onAnswer, disabled }) {
  const [picked, setPicked] = useState([]);

  const toggle = (part) => {
    if (disabled) return;
    setPicked((prev) => prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part]);
  };

  const submit = () => {
    if (disabled || picked.length === 0) return;
    const sorted = [...picked].sort();
    const correct = [...q.correctParts].sort();
    const isOk = sorted.length === correct.length && sorted.every((v, i) => v === correct[i]);
    onAnswer(isOk, picked);
  };

  useEffect(() => { setPicked([]); }, [q]);

  return (
    <View style={st.qBody}>
      <Text style={st.qLabel}>选出正确的部件拼成这个字</Text>
      <View style={st.pinyinBubble}>
        <Text style={st.pinyinBig}>{q.pinyin}</Text>
        <Text style={st.meaningSmall}>{q.meaning}</Text>
      </View>

      {picked.length > 0 && (
        <View style={st.assemblePreview}>
          {picked.map((p, i) => (
            <TouchableOpacity key={i} style={st.previewChip} onPress={() => toggle(p)}>
              <Text style={st.previewTxt}>{p}</Text>
            </TouchableOpacity>
          ))}
          <Text style={st.assembleArrow}> → </Text>
          <Text style={st.assembleResult}>?</Text>
        </View>
      )}

      <View style={st.partsGrid}>
        {q.options.map((part, i) => {
          const on = picked.includes(part);
          return (
            <TouchableOpacity
              key={i}
              style={[st.partBtn, on && st.partBtnOn]}
              onPress={() => toggle(part)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <Text style={[st.partTxt, on && st.partTxtOn]}>{part}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!disabled && (
        <TouchableOpacity
          style={[st.submitBtn, picked.length === 0 && st.submitOff]}
          onPress={submit}
          disabled={picked.length === 0}
        >
          <Text style={[st.submitTxt, picked.length === 0 && { color: C.textLight }]}>确认拼字</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Half question (pick the other half) ──────────────────

function HalfQ({ q, onAnswer, disabled }) {
  return (
    <View style={st.qBody}>
      <Text style={st.qLabel}>
        {q.showFirst ? '已有左边，选右边的部件' : '已有右边，选左边的部件'}
      </Text>
      <View style={st.pinyinBubble}>
        <Text style={st.pinyinBig}>{q.pinyin}</Text>
        <Text style={st.meaningSmall}>{q.meaning}</Text>
      </View>

      <View style={st.halfRow}>
        {q.showFirst ? (
          <>
            <View style={st.givenBox}><Text style={st.givenTxt}>{q.givenPart}</Text></View>
            <Text style={st.plusSign}>+</Text>
            <View style={[st.givenBox, st.missingBox]}><Text style={st.missingTxt}>?</Text></View>
          </>
        ) : (
          <>
            <View style={[st.givenBox, st.missingBox]}><Text style={st.missingTxt}>?</Text></View>
            <Text style={st.plusSign}>+</Text>
            <View style={st.givenBox}><Text style={st.givenTxt}>{q.givenPart}</Text></View>
          </>
        )}
        <Text style={st.equalsSign}>=</Text>
        <View style={st.resultBox}><Text style={st.resultCharSmall}>{q.char}</Text></View>
      </View>

      <View style={st.optGrid4}>
        {q.options.map((opt, i) => (
          <TouchableOpacity
            key={i}
            style={st.opt4Btn}
            onPress={() => !disabled && onAnswer(i === q.answer, i)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text style={st.opt4Txt}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── PinyinPick question ──────────────────────────────────

function PinyinPickQ({ q, onAnswer, disabled }) {
  return (
    <View style={st.qBody}>
      <Text style={st.qLabel}>看拼音，选出正确的汉字</Text>
      <View style={st.pinyinBubble}>
        <Text style={st.pinyinBig}>{q.pinyin}</Text>
      </View>

      <View style={st.optGrid4}>
        {q.options.map((opt, i) => (
          <TouchableOpacity
            key={i}
            style={st.charOptBtn}
            onPress={() => !disabled && onAnswer(i === q.answer, i)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text style={st.charOptTxt}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Quiz Phase ───────────────────────────────────────────

function QuizPhase({ questions, onFinish, onBack }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState(() => new Array(questions.length).fill(null));
  const [elapsed, setElapsed] = useState(0);
  const [timing, setTiming] = useState(true);
  const [fb, setFb] = useState(null);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const tick = useRef(null);
  const comboAnim = useRef(new Animated.Value(1)).current;

  const q = questions[idx];
  const answered = answers[idx] !== null;
  const allDone = answers.every((a) => a !== null);

  function fmt(sec) {
    return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  }

  useEffect(() => {
    if (timing) tick.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(tick.current);
  }, [timing]);

  useEffect(() => {
    if (q?.pinyin) Speech.speak(q.char || q.pinyin, { language: 'zh-CN', rate: 0.8 });
    setShowHint(false);
  }, [idx]);

  const handleAnswer = useCallback((isOk, val) => {
    if (fb || answered) return;
    setAnswers((prev) => { const n = [...prev]; n[idx] = { isOk, val }; return n; });
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
      setShowHint(true);
    }
    setFb(isOk ? 'correct' : 'wrong');
  }, [fb, answered, idx, combo, comboAnim]);

  const onFbDone = useCallback(() => {
    setFb(null);
    setShowHint(false);
    if (idx < questions.length - 1) setIdx((i) => i + 1);
    else setTiming(false);
  }, [idx, questions.length]);

  const handleFinish = useCallback(() => {
    setTiming(false);
    clearInterval(tick.current);
    const correct = answers.filter((a) => a?.isOk).length;
    const total = questions.length;
    const wrong = total - correct;
    const wrongList = questions
      .map((qq, i) => ({ ...qq, userAnswer: answers[i]?.val }))
      .filter((_, i) => !answers[i]?.isOk);
    onFinish({
      questions, answers: answers.map((a) => a?.isOk ? a.val : null),
      elapsed, subject: 'chn_hanziWrite', maxCombo,
      total, correct, wrong, wrongList,
    });
  }, [questions, answers, elapsed, maxCombo, onFinish]);

  const pct = Math.round(((allDone ? questions.length : idx) / questions.length) * 100);
  const showCombo = combo >= 3 && !allDone;

  const renderQ = () => {
    if (!q) return null;
    const disabled = !!fb || answered;
    if (q.type === 'assemble') return <AssembleQ q={q} onAnswer={handleAnswer} disabled={disabled} />;
    if (q.type === 'half') return <HalfQ q={q} onAnswer={handleAnswer} disabled={disabled} />;
    if (q.type === 'pinyinPick') return <PinyinPickQ q={q} onAnswer={handleAnswer} disabled={disabled} />;
    return null;
  };

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
          </View>
        ) : (
          <View style={st.qCard}>
            <Text style={st.qIdx}>第 {idx + 1} 题</Text>
            <TouchableOpacity
              style={st.speakRow}
              onPress={() => Speech.speak(q.char || q.pinyin, { language: 'zh-CN', rate: 0.8 })}
            >
              <Text style={st.speakIcon}>🔊</Text>
              <Text style={st.speakLabel}>听发音</Text>
            </TouchableOpacity>

            {renderQ()}

            {showHint && q.hint && (
              <View style={st.hintBox}>
                <Text style={st.hintTxt}>💡 {q.hint}</Text>
              </View>
            )}
            {fb === 'correct' && (
              <View style={st.correctReveal}>
                <Text style={st.revealChar}>{q.char}</Text>
                {q.hint && <Text style={st.revealHint}>{q.hint}</Text>}
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

  const startQuiz = useCallback((unitKey, mode, count) => {
    const gen = GEN_MAP[mode] || genMixedQuestions;
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
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14,
    backgroundColor: C.bg, marginBottom: 6, borderWidth: 2, borderColor: C.border,
  },
  unitRowOn: { backgroundColor: sc.primary, borderColor: sc.primary },
  unitIcon: { fontSize: 22 },
  unitLabel: { fontSize: 15, fontWeight: '700', color: C.text },
  unitDesc: { fontSize: 11, color: C.textMid, marginTop: 1 },
  unitCount: { fontSize: 13, fontWeight: '700', color: sc.primary },

  modeRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 6 },
  modeBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14,
    backgroundColor: C.bg, marginHorizontal: 3, borderWidth: 1.5, borderColor: C.border,
  },
  modeBtnOn: { backgroundColor: sc.primary, borderColor: sc.primary },
  modeLbl: { fontSize: 13, fontWeight: '700', color: C.text },
  modeDesc: { fontSize: 12, color: C.textLight, textAlign: 'center', marginBottom: 4 },

  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  cBtn: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: sc.bg,
    alignItems: 'center', justifyContent: 'center', marginHorizontal: 8,
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
  qIdx: { fontSize: 13, fontWeight: '600', color: C.textLight, marginBottom: 4 },

  speakRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  speakIcon: { fontSize: 20, marginRight: 4 },
  speakLabel: { fontSize: 13, color: sc.primary, fontWeight: '600' },

  // Question body (shared)
  qBody: { width: '100%', alignItems: 'center' },
  qLabel: { fontSize: 14, color: C.textMid, fontWeight: '600', marginBottom: 10, textAlign: 'center' },

  pinyinBubble: {
    alignItems: 'center', backgroundColor: sc.bg, borderRadius: 20,
    paddingVertical: 10, paddingHorizontal: 28, marginBottom: 14,
  },
  pinyinBig: { fontSize: 36, fontWeight: '800', color: sc.primary },
  meaningSmall: { fontSize: 13, color: sc.dark, marginTop: 2 },

  // Assemble
  assemblePreview: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, flexWrap: 'wrap',
  },
  previewChip: {
    backgroundColor: sc.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
    marginHorizontal: 3, marginVertical: 2,
  },
  previewTxt: { fontSize: 22, fontWeight: '800', color: '#fff' },
  assembleArrow: { fontSize: 20, color: C.textMid, fontWeight: '700', marginHorizontal: 4 },
  assembleResult: { fontSize: 28, fontWeight: '800', color: C.textMid },

  partsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 14 },
  partBtn: {
    minWidth: 64, height: 64, borderRadius: 16, backgroundColor: C.cardWhite,
    alignItems: 'center', justifyContent: 'center', margin: 6,
    borderWidth: 2.5, borderColor: C.border,
  },
  partBtnOn: { borderColor: sc.primary, backgroundColor: sc.bg },
  partTxt: { fontSize: 28, fontWeight: '700', color: C.text },
  partTxtOn: { color: sc.primary },

  submitBtn: {
    paddingVertical: 12, paddingHorizontal: 36, borderRadius: 14,
    backgroundColor: sc.primary,
  },
  submitOff: { backgroundColor: C.border },
  submitTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Half
  halfRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  givenBox: {
    width: 60, height: 60, borderRadius: 14, backgroundColor: sc.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  givenTxt: { fontSize: 30, fontWeight: '800', color: sc.primary },
  missingBox: { borderWidth: 2.5, borderColor: sc.primary, borderStyle: 'dashed', backgroundColor: 'rgba(255,255,255,0.5)' },
  missingTxt: { fontSize: 28, fontWeight: '700', color: C.textLight },
  plusSign: { fontSize: 24, fontWeight: '800', color: C.textMid, marginHorizontal: 8 },
  equalsSign: { fontSize: 24, fontWeight: '800', color: C.textMid, marginHorizontal: 8 },
  resultBox: {
    width: 60, height: 60, borderRadius: 14, backgroundColor: C.accentBg,
    alignItems: 'center', justifyContent: 'center',
  },
  resultCharSmall: { fontSize: 30, fontWeight: '800', color: C.accent },

  optGrid4: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  opt4Btn: {
    width: 72, height: 72, borderRadius: 16, backgroundColor: C.cardWhite,
    alignItems: 'center', justifyContent: 'center', margin: 6,
    borderWidth: 2, borderColor: C.border,
  },
  opt4Txt: { fontSize: 30, fontWeight: '700', color: C.text },

  // PinyinPick
  charOptBtn: {
    width: 80, height: 80, borderRadius: 18, backgroundColor: C.cardWhite,
    alignItems: 'center', justifyContent: 'center', margin: 8,
    borderWidth: 2.5, borderColor: C.border,
  },
  charOptTxt: { fontSize: 36, fontWeight: '800', color: C.text },

  // Hint & reveal
  hintBox: { backgroundColor: C.accentBg, borderRadius: 12, padding: 10, marginTop: 10, width: '100%' },
  hintTxt: { fontSize: 14, color: C.accent, lineHeight: 22, textAlign: 'center', fontWeight: '600' },
  correctReveal: { alignItems: 'center', marginTop: 10 },
  revealChar: { fontSize: 48, fontWeight: '800', color: C.success },
  revealHint: { fontSize: 13, color: C.textMid, marginTop: 4 },

  // Done
  doneBox: { alignItems: 'center', paddingVertical: 40 },
  doneEmoji: { fontSize: 56, marginBottom: 10 },
  doneTxt: { fontSize: 22, fontWeight: '700', color: C.success },

  bottomBar: { paddingHorizontal: 16, paddingBottom: 12 },
  finishBtn: { height: 54, borderRadius: 14, backgroundColor: sc.primary, alignItems: 'center', justifyContent: 'center' },
  finishTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },
});
