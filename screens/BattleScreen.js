import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C, RADIUS, SUBJECTS, DIFFICULTIES, SUBJECT_COLORS } from '../lib/theme';
import { generateQuestions, getMaxQuestions } from '../lib/questions';
import ExitConfirmModal from '../components/ExitConfirmModal';

const sc = SUBJECT_COLORS.math;

const BATTLE_SUBJECTS = [
  'mulForward', 'mulBlank', 'add', 'subtract', 'divide', 'addTwo', 'subtractTwo',
];

// ── Setup Phase ──────────────────────────────────────────

function SetupPhase({ onStart, onBack }) {
  const [mode, setMode] = useState(null);
  const [subjectIdx, setSubjectIdx] = useState(0);
  const [diff, setDiff] = useState('normal');
  const [count, setCount] = useState(10);

  const subject = BATTLE_SUBJECTS[subjectIdx];
  const range = DIFFICULTIES[diff].range;
  const max = getMaxQuestions(subject, range);
  const clamped = Math.min(count, max);

  if (!mode) {
    return (
      <ScrollView style={st.scroll} contentContainerStyle={st.setupRoot} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={st.backBtn} onPress={onBack}>
          <Text style={st.backTxt}>← 返回</Text>
        </TouchableOpacity>
        <Text style={st.setupEmoji}>⚔️</Text>
        <Text style={st.setupTitle}>比赛模式</Text>
        <Text style={st.setupDesc}>两人对战，看谁算得快!</Text>

        <View style={st.modeCard}>
          <TouchableOpacity style={st.modeBtn} onPress={() => setMode('local')}>
            <Text style={st.modeIcon}>📱</Text>
            <Text style={st.modeLabel}>同屏对战</Text>
            <Text style={st.modeDesc}>两人同一台设备，上下分屏</Text>
          </TouchableOpacity>

          <View style={[st.modeBtn, { borderTopWidth: 1, borderTopColor: C.border, opacity: 0.45 }]}>
            <Text style={st.modeIcon}>🌐</Text>
            <Text style={st.modeLabel}>联网对战</Text>
            <Text style={st.modeDesc}>敬请期待，即将上线</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={st.scroll} contentContainerStyle={st.setupRoot} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={st.backBtn} onPress={() => setMode(null)}>
        <Text style={st.backTxt}>← 返回</Text>
      </TouchableOpacity>
      <Text style={st.setupEmoji}>📱</Text>
      <Text style={st.setupTitle}>同屏对战</Text>

      <View style={st.modeCard}>
        <View style={{ padding: 16 }}>
          <Text style={st.inputLabel}>选择科目</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
            {BATTLE_SUBJECTS.map((k, i) => (
              <TouchableOpacity
                key={k}
                style={[st.chip, subjectIdx === i && st.chipOn]}
                onPress={() => setSubjectIdx(i)}
              >
                <Text style={[st.chipTxt, subjectIdx === i && { color: '#fff' }]}>
                  {SUBJECTS[k]?.icon} {SUBJECTS[k]?.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={st.inputLabel}>难度</Text>
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            {Object.values(DIFFICULTIES).map((d) => (
              <TouchableOpacity
                key={d.key}
                style={[st.chip, diff === d.key && { backgroundColor: d.color, borderColor: d.color }]}
                onPress={() => setDiff(d.key)}
              >
                <Text style={[st.chipTxt, diff === d.key && { color: '#fff' }]}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={st.inputLabel}>题数: {clamped}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
            {[5, 10, 15, 20].filter((n) => n <= max).map((n) => (
              <TouchableOpacity
                key={n}
                style={[st.chip, clamped === n && st.chipOn]}
                onPress={() => setCount(n)}
              >
                <Text style={[st.chipTxt, clamped === n && { color: '#fff' }]}>{n}题</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={st.goBtn}
        activeOpacity={0.8}
        onPress={() => onStart(subject, diff, clamped)}
      >
        <Text style={st.goBtnTxt}>开始对战!</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Battle Phase (split screen) ──────────────────────────

function BattlePhase({ questions, subject, onFinish, onBack }) {
  const [p1Idx, setP1Idx] = useState(0);
  const [p2Idx, setP2Idx] = useState(0);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [p1Input, setP1Input] = useState('');
  const [p2Input, setP2Input] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [winner, setWinner] = useState(null);
  const tick = useRef(null);
  const p1Anim = useRef(new Animated.Value(1)).current;
  const p2Anim = useRef(new Animated.Value(1)).current;

  const total = questions.length;
  const p1Done = p1Idx >= total;
  const p2Done = p2Idx >= total;

  function fmt(sec) {
    return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  }

  useEffect(() => {
    tick.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(tick.current);
  }, []);

  useEffect(() => {
    if ((p1Done || p2Done) && !finished) {
      setFinished(true);
      clearInterval(tick.current);
      if (p1Done && !p2Done) setWinner('P1');
      else if (p2Done && !p1Done) setWinner('P2');
      else setWinner(p1Score >= p2Score ? 'P1' : 'P2');
    }
  }, [p1Done, p2Done, finished, p1Score, p2Score]);

  const checkAnswer = useCallback((q, input) => {
    const num = parseInt(input, 10);
    if (isNaN(num)) return false;
    if (typeof q.answer === 'object') return num === q.answer.quotient || num === q.answer.result;
    return num === q.answer;
  }, []);

  const p1Submit = useCallback(() => {
    if (p1Done || !p1Input.trim()) return;
    const correct = checkAnswer(questions[p1Idx], p1Input);
    if (correct) {
      setP1Score((s) => s + 1);
      p1Anim.setValue(1.2);
      Animated.spring(p1Anim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    }
    setP1Input('');
    setP1Idx((i) => i + 1);
  }, [p1Done, p1Input, p1Idx, questions, checkAnswer, p1Anim]);

  const p2Submit = useCallback(() => {
    if (p2Done || !p2Input.trim()) return;
    const correct = checkAnswer(questions[p2Idx], p2Input);
    if (correct) {
      setP2Score((s) => s + 1);
      p2Anim.setValue(1.2);
      Animated.spring(p2Anim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    }
    setP2Input('');
    setP2Idx((i) => i + 1);
  }, [p2Done, p2Input, p2Idx, questions, checkAnswer, p2Anim]);

  const buildStem = (q) => {
    if (q.stem) return q.stem;
    const { left, right, op } = q;
    const sym = { mulForward: '×', mulBlank: '×', add: '+', subtract: '−', divide: '÷', addTwo: '+', subtractTwo: '−' }[op] || '?';
    return `${left} ${sym} ${right} = ?`;
  };

  if (finished) {
    return (
      <View style={st.battleRoot}>
        <View style={st.resultBox}>
          <Text style={st.resultEmoji}>{winner === 'P1' ? '🏆' : '🏅'}</Text>
          <Text style={st.resultTitle}>{winner === 'P1' ? '玩家1 胜利!' : winner === 'P2' ? '玩家2 胜利!' : '平局!'}</Text>
          <View style={st.scoreBoard}>
            <View style={st.scoreCol}>
              <Text style={st.scoreLabel}>玩家1</Text>
              <Text style={[st.scoreVal, winner === 'P1' && { color: C.success }]}>{p1Score}/{total}</Text>
              <Text style={st.scoreTime}>{p1Done ? '完成' : `做到第${p1Idx}题`}</Text>
            </View>
            <Text style={st.vsText}>VS</Text>
            <View style={st.scoreCol}>
              <Text style={st.scoreLabel}>玩家2</Text>
              <Text style={[st.scoreVal, winner === 'P2' && { color: C.success }]}>{p2Score}/{total}</Text>
              <Text style={st.scoreTime}>{p2Done ? '完成' : `做到第${p2Idx}题`}</Text>
            </View>
          </View>
          <Text style={st.resultTime}>用时 {fmt(elapsed)}</Text>
          <TouchableOpacity style={st.goBtn} onPress={onFinish} activeOpacity={0.8}>
            <Text style={st.goBtnTxt}>返回</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={st.battleRoot}>
      {/* Center bar */}
      <View style={st.centerBar}>
        <Animated.Text style={[st.centerScore, { color: '#5B7FFF', transform: [{ scale: p1Anim }] }]}>
          P1: {p1Score}
        </Animated.Text>
        <Text style={st.centerTimer}>{fmt(elapsed)}</Text>
        <Animated.Text style={[st.centerScore, { color: '#E06B6B', transform: [{ scale: p2Anim }] }]}>
          P2: {p2Score}
        </Animated.Text>
      </View>

      {/* Player 1 (top half) */}
      <View style={[st.playerHalf, { backgroundColor: 'rgba(91,127,255,0.06)' }]}>
        {p1Idx < total ? (
          <>
            <Text style={st.playerLabel}>玩家1 ({p1Idx + 1}/{total})</Text>
            <Text style={st.stemTxt}>{buildStem(questions[p1Idx])}</Text>
            <View style={st.inputRow}>
              <TextInput
                style={st.ansInput}
                value={p1Input}
                onChangeText={setP1Input}
                keyboardType="number-pad"
                placeholder="?"
                placeholderTextColor={C.textLight}
              />
              <TouchableOpacity style={[st.submitBtn, { backgroundColor: '#5B7FFF' }]} onPress={p1Submit}>
                <Text style={st.submitTxt}>确定</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={st.doneLabel}>✅ 已完成!</Text>
        )}
      </View>

      {/* Player 2 (bottom half) */}
      <View style={[st.playerHalf, { backgroundColor: 'rgba(224,107,107,0.06)' }]}>
        {p2Idx < total ? (
          <>
            <Text style={st.playerLabel}>玩家2 ({p2Idx + 1}/{total})</Text>
            <Text style={st.stemTxt}>{buildStem(questions[p2Idx])}</Text>
            <View style={st.inputRow}>
              <TextInput
                style={st.ansInput}
                value={p2Input}
                onChangeText={setP2Input}
                keyboardType="number-pad"
                placeholder="?"
                placeholderTextColor={C.textLight}
              />
              <TouchableOpacity style={[st.submitBtn, { backgroundColor: '#E06B6B' }]} onPress={p2Submit}>
                <Text style={st.submitTxt}>确定</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={st.doneLabel}>✅ 已完成!</Text>
        )}
      </View>

      <TouchableOpacity style={st.exitBtn} onPress={onBack}>
        <Text style={st.exitTxt}>退出</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main ─────────────────────────────────────────────────

export default function BattleScreen() {
  const nav = useNavigation();
  const [phase, setPhase] = useState('setup');
  const [questions, setQuestions] = useState([]);
  const [showExit, setShowExit] = useState(false);
  const inBattle = phase === 'battle';

  const directBack = useCallback(() => nav.goBack(), [nav]);
  const onBack = useCallback(() => {
    if (inBattle) setShowExit(true);
    else nav.goBack();
  }, [inBattle, nav]);

  useEffect(() => {
    if (!inBattle) return;
    const unsub = nav.addListener('beforeRemove', (e) => {
      if (showExit) return;
      e.preventDefault();
      setShowExit(true);
    });
    return unsub;
  }, [nav, inBattle, showExit]);

  const startBattle = useCallback((subject, difficulty, count) => {
    const range = DIFFICULTIES[difficulty].range;
    setQuestions(generateQuestions(subject, count, range));
    setPhase('battle');
  }, []);

  if (phase === 'setup') {
    return <SetupPhase onStart={startBattle} onBack={onBack} />;
  }

  return (
    <>
      <BattlePhase
        questions={questions}
        onFinish={directBack}
        onBack={onBack}
      />
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
  setupTitle: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 4 },
  setupDesc: { fontSize: 14, color: C.textMid, marginBottom: 18 },

  modeCard: { width: '100%', backgroundColor: C.card, borderRadius: 20, overflow: 'hidden' },
  modeBtn: { padding: 18, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  modeIcon: { fontSize: 28, marginRight: 12 },
  modeLabel: { fontSize: 16, fontWeight: '700', color: C.text, flex: 1 },
  modeDesc: { fontSize: 12, color: C.textMid, width: '100%', marginTop: 2, marginLeft: 40 },

  inputLabel: { fontSize: 14, fontWeight: '600', color: C.textMid, marginBottom: 6 },

  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
    backgroundColor: C.bg, marginRight: 6, marginBottom: 6,
    borderWidth: 1.5, borderColor: C.border,
  },
  chipOn: { backgroundColor: sc.primary, borderColor: sc.primary },
  chipTxt: { fontSize: 12, fontWeight: '600', color: C.textMid },

  goBtn: {
    marginTop: 24, width: '100%', height: 54, borderRadius: 16,
    backgroundColor: sc.primary, alignItems: 'center', justifyContent: 'center',
  },
  goBtnTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },

  // Battle
  battleRoot: { flex: 1, backgroundColor: C.bg },
  centerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 8, backgroundColor: C.card,
  },
  centerScore: { fontSize: 18, fontWeight: '800' },
  centerTimer: { fontSize: 20, fontWeight: '800', color: C.text, fontVariant: ['tabular-nums'] },

  playerHalf: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20,
  },
  playerLabel: { fontSize: 14, fontWeight: '700', color: C.textMid, marginBottom: 8 },
  stemTxt: { fontSize: 32, fontWeight: '800', color: C.text, marginBottom: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  ansInput: {
    width: 100, height: 50, borderRadius: 14, backgroundColor: '#fff',
    textAlign: 'center', fontSize: 24, fontWeight: '700', color: C.text,
    borderWidth: 2, borderColor: C.border,
  },
  submitBtn: {
    marginLeft: 12, height: 50, paddingHorizontal: 20, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  submitTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
  doneLabel: { fontSize: 24, fontWeight: '700', color: C.success },

  exitBtn: {
    position: 'absolute', top: 10, right: 14,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: C.card,
  },
  exitTxt: { fontSize: 13, fontWeight: '600', color: C.textMid },

  // Results
  resultBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  resultEmoji: { fontSize: 56, marginBottom: 8 },
  resultTitle: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 20 },
  scoreBoard: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  scoreCol: { alignItems: 'center', width: 100 },
  scoreLabel: { fontSize: 16, fontWeight: '700', color: C.textMid, marginBottom: 4 },
  scoreVal: { fontSize: 28, fontWeight: '800', color: C.text },
  scoreTime: { fontSize: 12, color: C.textLight, marginTop: 2 },
  vsText: { fontSize: 20, fontWeight: '800', color: C.textMid, marginHorizontal: 16 },
  resultTime: { fontSize: 14, color: C.textMid, marginBottom: 20 },
});
