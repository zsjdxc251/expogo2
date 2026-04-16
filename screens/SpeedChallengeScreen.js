import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C, DIFFICULTIES, RADIUS } from '../lib/theme';
import { generateQuestions } from '../lib/questions';
import { playCorrect, playWrong, playCombo } from '../lib/sounds';
import { useApp } from '../lib/AppContext';
import NumberPad from '../components/NumberPad';
import ExitConfirmModal from '../components/ExitConfirmModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOTAL_TIME = 60;
const BEST_KEY = '@speed_best';

function fmt(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

function SetupPhase({ onStart, onBack, bestRecord, allowedDiffs }) {
  const diffs = allowedDiffs && allowedDiffs.length > 0 ? allowedDiffs : ['easy', 'normal', 'hard'];
  const [diff, setDiff] = useState(diffs.includes('easy') ? 'easy' : diffs[0]);

  return (
    <View style={st.setupRoot}>
      <TouchableOpacity style={st.backBtn} onPress={onBack}>
        <Text style={st.backTxt}>← 返回</Text>
      </TouchableOpacity>
      <Text style={st.setupIcon}>⚡</Text>
      <Text style={st.setupTitle}>口算竞速</Text>
      <Text style={st.setupDesc}>60秒内尽可能多答对！</Text>

      {bestRecord > 0 && (
        <View style={st.bestBox}>
          <Text style={st.bestTxt}>🏆 历史最佳: {bestRecord} 题</Text>
        </View>
      )}

      <View style={st.setupCard}>
        <Text style={st.setupLabel}>选择难度</Text>
        <View style={st.diffRow}>
          {Object.values(DIFFICULTIES).filter((d) => diffs.includes(d.key)).map((d) => (
            <TouchableOpacity
              key={d.key}
              style={[st.diffBtn, diff === d.key && { backgroundColor: d.color }]}
              onPress={() => setDiff(d.key)}
            >
              <Text style={[st.diffTxt, diff === d.key && { color: '#fff' }]}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={st.goBtn} activeOpacity={0.8} onPress={() => onStart(diff)}>
        <Text style={st.goBtnTxt}>开始挑战!</Text>
      </TouchableOpacity>
    </View>
  );
}

function RacingPhase({ questions, onComplete, onBack }) {
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [remaining, setRemaining] = useState(TOTAL_TIME);
  const [input, setInput] = useState('');
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState(null);
  const tick = useRef(null);
  const comboAnim = useRef(new Animated.Value(1)).current;
  const doneRef = useRef(false);
  const stateRef = useRef({ correct: 0, combo: 0 });

  stateRef.current = { correct, combo };

  const q = idx < questions.length ? questions[idx] : null;
  const finished = remaining <= 0 || idx >= questions.length;

  const completeOnce = useCallback((c, cb) => {
    if (doneRef.current) return;
    doneRef.current = true;
    clearInterval(tick.current);
    onComplete(c, cb);
  }, [onComplete]);

  useEffect(() => {
    tick.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(tick.current);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(tick.current);
  }, []);

  useEffect(() => {
    if (remaining <= 0) {
      const { correct: c, combo: cb } = stateRef.current;
      completeOnce(c, cb);
    }
  }, [remaining, completeOnce]);

  const onKey = useCallback((k) => {
    if (finished || doneRef.current) return;
    if (k === 'C') { setInput(''); return; }
    if (k === '⌫') { setInput((v) => v.slice(0, -1)); return; }
    const next = input.length < 4 ? input + k : input;
    setInput(next);

    if (!q) return;
    const digits = String(q.answer).length;
    if (next.length >= digits) {
      const val = parseInt(next, 10);
      const isOk = val === q.answer;
      let newCorrect = correct;
      let newCombo = combo;
      if (isOk) {
        playCorrect();
        newCorrect = correct + 1;
        newCombo = combo + 1;
        setCorrect(newCorrect);
        setCombo(newCombo);
        if (newCombo >= 3) {
          playCombo();
          comboAnim.setValue(1.4);
          Animated.spring(comboAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
        }
        setFlash('ok');
      } else {
        playWrong();
        newCombo = 0;
        setCombo(0);
        setFlash('err');
      }
      setTimeout(() => {
        setFlash(null);
        setInput('');
        if (idx < questions.length - 1) {
          setIdx((i) => i + 1);
        } else {
          completeOnce(newCorrect, newCombo);
        }
      }, 300);
    }
  }, [input, q, idx, combo, correct, finished, questions.length, completeOnce, comboAnim]);

  const pct = Math.round((remaining / TOTAL_TIME) * 100);
  const timerColor = remaining <= 10 ? C.error : remaining <= 20 ? C.accent : C.primary;

  if (!q) return null;

  const { display, op } = q;
  const opSym = { mulForward: '×', mulBlank: '×', add: '+', subtract: '−', divide: '÷' }[op] || '?';
  const parts = [];
  if (q.missingPos === 'left') {
    parts.push({ type: 'input' }, { type: 'op', val: opSym }, { type: 'num', val: display.right }, { type: 'op', val: '=' }, { type: 'num', val: display.result });
  } else if (q.missingPos === 'right') {
    parts.push({ type: 'num', val: display.left }, { type: 'op', val: opSym }, { type: 'input' }, { type: 'op', val: '=' }, { type: 'num', val: display.result });
  } else {
    parts.push({ type: 'num', val: display.left }, { type: 'op', val: opSym }, { type: 'num', val: display.right }, { type: 'op', val: '=' }, { type: 'input' });
  }

  return (
    <View style={st.raceRoot}>
      <View style={st.raceHeader}>
        <TouchableOpacity onPress={onBack}><Text style={st.backTxt}>✕</Text></TouchableOpacity>
        <View style={[st.timerPill, { borderColor: timerColor }]}>
          <Text style={[st.timerTxt, { color: timerColor }]}>{fmt(remaining)}</Text>
        </View>
        <Text style={st.scoreTxt}>✓ {correct}</Text>
      </View>
      <View style={[st.timerBar, { backgroundColor: timerColor + '20' }]}>
        <View style={[st.timerBarFill, { width: `${pct}%`, backgroundColor: timerColor }]} />
      </View>

      {combo >= 3 && (
        <Animated.View style={[st.comboBox, { transform: [{ scale: comboAnim }] }]}>
          <Text style={st.comboTxt}>🔥 x{combo}</Text>
        </Animated.View>
      )}

      <View style={[st.qArea, flash === 'ok' && st.flashOk, flash === 'err' && st.flashErr]}>
        <View style={st.qRow}>
          {parts.map((p, i) => (
            p.type === 'input' ? (
              <View key={i} style={[st.qInput, input && st.qInputFilled]}>
                <Text style={input ? st.qInputTxt : st.qInputPh}>{input || '?'}</Text>
              </View>
            ) : p.type === 'op' ? (
              <Text key={i} style={st.qOp}>{p.val}</Text>
            ) : (
              <Text key={i} style={st.qNum}>{p.val}</Text>
            )
          ))}
        </View>
      </View>

      <View style={st.padArea}>
        <NumberPad onPress={onKey} disabled={finished} />
      </View>
    </View>
  );
}

function ResultPhase({ correct, best, onRetry, onBack }) {
  const isNewBest = correct >= best;
  return (
    <View style={st.resultRoot}>
      <Text style={st.resultEmoji}>{isNewBest ? '🏆' : '⚡'}</Text>
      <Text style={st.resultTitle}>{isNewBest ? '新纪录!' : '挑战完成!'}</Text>
      <View style={st.resultCard}>
        <View style={st.resultRow}>
          <Text style={st.resultLabel}>答对题数</Text>
          <Text style={[st.resultVal, { color: C.success }]}>{correct}</Text>
        </View>
        <View style={st.resultRow}>
          <Text style={st.resultLabel}>历史最佳</Text>
          <Text style={[st.resultVal, { color: C.accent }]}>{Math.max(correct, best)}</Text>
        </View>
      </View>
      <TouchableOpacity style={st.goBtn} activeOpacity={0.8} onPress={onRetry}>
        <Text style={st.goBtnTxt}>再来一次</Text>
      </TouchableOpacity>
      <TouchableOpacity style={st.backBtnLg} activeOpacity={0.8} onPress={onBack}>
        <Text style={st.backBtnTxt}>返回主页</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function SpeedChallengeScreen() {
  const nav = useNavigation();
  const { finishQuiz, visibility } = useApp();
  const directBack = useCallback(() => nav.goBack(), [nav]);
  const finishedRef = useRef(false);

  const [phase, setPhase] = useState('setup');
  const [showExit, setShowExit] = useState(false);
  const inRace = phase === 'race';
  const onBack = useCallback(() => { if (inRace) setShowExit(true); else nav.goBack(); }, [inRace, nav]);

  useEffect(() => {
    if (!inRace) return;
    const unsub = nav.addListener('beforeRemove', (e) => {
      if (finishedRef.current || showExit) return;
      e.preventDefault();
      setShowExit(true);
    });
    return unsub;
  }, [nav, inRace, showExit]);
  const [questions, setQuestions] = useState([]);
  const [diff, setDiff] = useState('easy');
  const [result, setResult] = useState(null);
  const [best, setBest] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(BEST_KEY).then((v) => v && setBest(parseInt(v, 10)));
  }, []);

  const onStart = useCallback((d) => {
    setDiff(d);
    const range = DIFFICULTIES[d].range;
    const subjects = ['add', 'subtract', 'mulForward'];
    const qs = [];
    subjects.forEach((s) => {
      qs.push(...generateQuestions(s, 40, range));
    });
    qs.sort(() => Math.random() - 0.5);
    setQuestions(qs);
    setPhase('race');
  }, []);

  const onComplete = useCallback(async (correct, maxCombo) => {
    finishedRef.current = true;
    let newBest = best;
    if (correct > best) {
      newBest = correct;
      setBest(newBest);
      await AsyncStorage.setItem(BEST_KEY, String(newBest));
    }
    setResult({ correct, best: newBest });
    setPhase('result');

    await finishQuiz({
      questions: questions.slice(0, Math.min(correct + 5, questions.length)),
      answers: questions.slice(0, Math.min(correct + 5, questions.length)).map((q, i) => i < correct ? q.answer : null),
      elapsed: TOTAL_TIME,
      subject: 'speed',
      difficulty: diff,
      maxCombo,
    });
  }, [best, questions, diff, finishQuiz]);

  const onRetry = useCallback(() => {
    setResult(null);
    setPhase('setup');
  }, []);

  if (phase === 'setup') {
    return <SetupPhase onStart={onStart} onBack={onBack} bestRecord={best} allowedDiffs={visibility?.allowedDifficulties} />;
  }

  if (phase === 'race' && !result) {
    return (
      <>
        <RacingPhase questions={questions} onComplete={onComplete} onBack={onBack} />
        <ExitConfirmModal visible={showExit} onCancel={() => setShowExit(false)} onConfirm={directBack} />
      </>
    );
  }

  if (result) {
    return <ResultPhase correct={result.correct} best={result.best} onRetry={onRetry} onBack={onBack} />;
  }

  return null;
}

const st = StyleSheet.create({
  setupRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: C.bg },
  backBtn: { position: 'absolute', top: 16, left: 20 },
  backTxt: { fontSize: 16, fontWeight: '600', color: C.primary },
  setupIcon: { fontSize: 56, marginBottom: 4 },
  setupTitle: { fontSize: 28, fontWeight: '800', color: C.text, marginBottom: 4 },
  setupDesc: { fontSize: 15, color: C.textMid, marginBottom: 16 },
  bestBox: { backgroundColor: C.accentBg, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 16 },
  bestTxt: { fontSize: 16, fontWeight: '700', color: C.accent },
  setupCard: { width: '100%', backgroundColor: C.card, borderRadius: RADIUS, padding: 24, alignItems: 'center', marginBottom: 16 },
  setupLabel: { fontSize: 15, fontWeight: '600', color: C.textMid, marginBottom: 12 },
  diffRow: { flexDirection: 'row' },
  diffBtn: {
    flex: 1, height: 42, borderRadius: 12, marginHorizontal: 4,
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
  },
  diffTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },
  goBtn: {
    width: '100%', height: 54, borderRadius: 16,
    backgroundColor: '#EB9F4A', alignItems: 'center', justifyContent: 'center',
  },
  goBtnTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },

  raceRoot: { flex: 1, backgroundColor: C.bg },
  raceHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6,
  },
  timerPill: { borderWidth: 2, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 4 },
  timerTxt: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  scoreTxt: { fontSize: 18, fontWeight: '700', color: C.success },
  timerBar: { height: 6, marginHorizontal: 16, borderRadius: 3, overflow: 'hidden' },
  timerBarFill: { height: 6, borderRadius: 3 },
  comboBox: { alignSelf: 'center', marginTop: 8, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 16, backgroundColor: C.accentBg },
  comboTxt: { fontSize: 15, fontWeight: '800', color: C.accent },

  qArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  flashOk: { backgroundColor: 'rgba(123,174,142,0.08)' },
  flashErr: { backgroundColor: 'rgba(224,107,107,0.08)' },
  qRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  qNum: { fontSize: 40, fontWeight: '800', color: C.text },
  qOp: { fontSize: 28, fontWeight: '600', color: C.textMid, marginHorizontal: 8 },
  qInput: {
    minWidth: 60, height: 64, borderRadius: 14, borderWidth: 2.5,
    borderColor: C.border, borderStyle: 'dashed', backgroundColor: 'rgba(229,229,229,0.3)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10,
  },
  qInputFilled: { borderStyle: 'solid', backgroundColor: '#fff', borderColor: C.primary },
  qInputTxt: { fontSize: 38, fontWeight: '800', color: C.primary },
  qInputPh: { fontSize: 30, fontWeight: '700', color: C.textLight },

  padArea: { paddingHorizontal: 16, paddingBottom: 10 },

  resultRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: C.bg },
  resultEmoji: { fontSize: 64, marginBottom: 8 },
  resultTitle: { fontSize: 28, fontWeight: '800', color: C.text, marginBottom: 20 },
  resultCard: { width: '100%', backgroundColor: C.card, borderRadius: RADIUS, padding: 24, marginBottom: 24 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resultLabel: { fontSize: 16, color: C.textMid, fontWeight: '600' },
  resultVal: { fontSize: 32, fontWeight: '800' },
  backBtnLg: {
    width: '100%', height: 48, borderRadius: 14, backgroundColor: C.card, borderWidth: 2, borderColor: C.primary,
    alignItems: 'center', justifyContent: 'center', marginTop: 10,
  },
  backBtnTxt: { fontSize: 16, fontWeight: '700', color: C.primary },
});
