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

function generateRoomCode() {
  return String(100000 + Math.floor(Math.random() * 900000));
}

function seedFromParams(code, subject, diff, count) {
  let h = 0;
  const str = `${code}_${subject}_${diff}_${count}`;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h;
}

// ── Setup Phase ──────────────────────────────────────────

function SetupPhase({ onStartLocal, onStartRoom, onBack }) {
  const [mode, setMode] = useState(null);
  const [subjectIdx, setSubjectIdx] = useState(0);
  const [diff, setDiff] = useState('normal');
  const [count, setCount] = useState(10);
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');

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

          <TouchableOpacity style={[st.modeBtn, { borderTopWidth: 1, borderTopColor: C.border }]} onPress={() => { setMode('host'); setRoomCode(generateRoomCode()); }}>
            <Text style={st.modeIcon}>🏠</Text>
            <Text style={st.modeLabel}>创建房间</Text>
            <Text style={st.modeDesc}>生成房间码，让对方加入</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[st.modeBtn, { borderTopWidth: 1, borderTopColor: C.border }]} onPress={() => setMode('join')}>
            <Text style={st.modeIcon}>🔗</Text>
            <Text style={st.modeLabel}>加入房间</Text>
            <Text style={st.modeDesc}>输入房间码，同步对战</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (mode === 'join') {
    return (
      <ScrollView style={st.scroll} contentContainerStyle={st.setupRoot} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={st.backBtn} onPress={() => setMode(null)}>
          <Text style={st.backTxt}>← 返回</Text>
        </TouchableOpacity>
        <Text style={st.setupEmoji}>🔗</Text>
        <Text style={st.setupTitle}>加入房间</Text>
        <Text style={st.setupDesc}>输入对方的房间码和相同配置</Text>

        <View style={st.modeCard}>
          <View style={{ padding: 16 }}>
            <Text style={st.inputLabel}>房间码</Text>
            <TextInput
              style={st.roomInput}
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="输入6位房间码"
              placeholderTextColor={C.textLight}
              keyboardType="number-pad"
              maxLength={6}
            />

            <Text style={[st.inputLabel, { marginTop: 14 }]}>选择科目（须与对方一致）</Text>
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

            <Text style={st.inputLabel}>难度（须与对方一致）</Text>
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

            <Text style={st.inputLabel}>题数（须与对方一致）</Text>
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
          style={[st.goBtn, joinCode.length < 6 && { opacity: 0.4 }]}
          activeOpacity={0.8}
          disabled={joinCode.length < 6}
          onPress={() => onStartRoom(subject, diff, clamped, joinCode)}
        >
          <Text style={st.goBtnTxt}>开始对战!</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const isHost = mode === 'host';

  return (
    <ScrollView style={st.scroll} contentContainerStyle={st.setupRoot} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={st.backBtn} onPress={() => setMode(null)}>
        <Text style={st.backTxt}>← 返回</Text>
      </TouchableOpacity>
      <Text style={st.setupEmoji}>{isHost ? '🏠' : '📱'}</Text>
      <Text style={st.setupTitle}>{isHost ? '创建房间' : '同屏对战'}</Text>

      {isHost && (
        <View style={st.roomCodeBox}>
          <Text style={st.roomCodeLabel}>房间码</Text>
          <Text style={st.roomCodeVal}>{roomCode}</Text>
          <Text style={st.roomCodeHint}>让对方输入此房间码并选择相同配置</Text>
        </View>
      )}

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
        onPress={() => isHost ? onStartRoom(subject, diff, clamped, roomCode) : onStartLocal(subject, diff, clamped)}
      >
        <Text style={st.goBtnTxt}>{isHost ? '开始对战!' : '开始对战!'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Solo Battle Phase (room code mode) ───────────────────

function SoloBattlePhase({ questions, onFinish, onBack }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [input, setInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [opponentScore, setOpponentScore] = useState('');
  const [compared, setCompared] = useState(false);
  const tick = useRef(null);
  const anim = useRef(new Animated.Value(1)).current;

  const total = questions.length;

  function fmt(sec) {
    return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  }

  useEffect(() => {
    tick.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(tick.current);
  }, []);

  const checkAnswer = useCallback((q, val) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return false;
    if (typeof q.answer === 'object') return num === q.answer.quotient || num === q.answer.result;
    return num === q.answer;
  }, []);

  const submit = useCallback(() => {
    if (done || !input.trim()) return;
    const correct = checkAnswer(questions[idx], input);
    if (correct) {
      setScore((s) => s + 1);
      anim.setValue(1.2);
      Animated.spring(anim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    }
    setInput('');
    if (idx + 1 >= total) {
      setDone(true);
      clearInterval(tick.current);
    } else {
      setIdx((i) => i + 1);
    }
  }, [done, input, idx, questions, total, checkAnswer, anim]);

  const buildStem = (q) => {
    if (q.stem) return q.stem;
    const { left, right, op } = q;
    const sym = { mulForward: '×', mulBlank: '×', add: '+', subtract: '−', divide: '÷', addTwo: '+', subtractTwo: '−' }[op] || '?';
    return `${left} ${sym} ${right} = ?`;
  };

  const doCompare = () => {
    const opp = parseInt(opponentScore, 10);
    if (isNaN(opp) || opp < 0) return;
    setCompared(true);
  };

  if (compared) {
    const opp = parseInt(opponentScore, 10) || 0;
    const iWin = score > opp;
    const tie = score === opp;
    return (
      <View style={st.battleRoot}>
        <View style={st.resultBox}>
          <Text style={st.resultEmoji}>{iWin ? '🏆' : tie ? '🤝' : '🏅'}</Text>
          <Text style={st.resultTitle}>{iWin ? '你赢了!' : tie ? '平局!' : '对手赢了!'}</Text>
          <View style={st.scoreBoard}>
            <View style={st.scoreCol}>
              <Text style={st.scoreLabel}>我</Text>
              <Text style={[st.scoreVal, iWin && { color: C.success }]}>{score}/{total}</Text>
              <Text style={st.scoreTime}>用时 {fmt(elapsed)}</Text>
            </View>
            <Text style={st.vsText}>VS</Text>
            <View style={st.scoreCol}>
              <Text style={st.scoreLabel}>对手</Text>
              <Text style={[st.scoreVal, !iWin && !tie && { color: C.success }]}>{opp}/{total}</Text>
            </View>
          </View>
          <TouchableOpacity style={st.goBtn} onPress={onFinish} activeOpacity={0.8}>
            <Text style={st.goBtnTxt}>返回</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (done) {
    return (
      <View style={st.battleRoot}>
        <View style={st.resultBox}>
          <Animated.Text style={[st.resultEmoji, { transform: [{ scale: anim }] }]}>🎉</Animated.Text>
          <Text style={st.resultTitle}>答题完成!</Text>
          <Text style={[st.scoreVal, { marginBottom: 4 }]}>{score}/{total}</Text>
          <Text style={st.resultTime}>用时 {fmt(elapsed)}</Text>
          <View style={st.compareBox}>
            <Text style={st.compareLabel}>输入对方得分进行对比</Text>
            <View style={st.compareRow}>
              <TextInput
                style={st.compareInput}
                value={opponentScore}
                onChangeText={(t) => setOpponentScore(t.replace(/[^0-9]/g, ''))}
                placeholder="对方正确数"
                placeholderTextColor={C.textLight}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                style={[st.compareBtn, !opponentScore && { opacity: 0.4 }]}
                onPress={doCompare}
                disabled={!opponentScore}
              >
                <Text style={st.compareBtnTxt}>对比</Text>
              </TouchableOpacity>
            </View>
            <Text style={st.compareHint}>告诉对方你的成绩: {score}/{total}，用时 {fmt(elapsed)}</Text>
          </View>
          <TouchableOpacity style={[st.goBtn, { backgroundColor: C.card, marginTop: 12 }]} onPress={onFinish}>
            <Text style={[st.goBtnTxt, { color: C.text }]}>跳过对比，直接返回</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={st.battleRoot}>
      <View style={st.soloBar}>
        <Text style={st.soloBarTxt}>{idx + 1}/{total}</Text>
        <Animated.Text style={[st.soloBarScore, { transform: [{ scale: anim }] }]}>
          {score} 分
        </Animated.Text>
        <Text style={st.soloBarTimer}>{fmt(elapsed)}</Text>
      </View>

      <View style={st.soloContent}>
        <Text style={st.stemTxt}>{buildStem(questions[idx])}</Text>
        <View style={st.inputRow}>
          <TextInput
            style={st.ansInput}
            value={input}
            onChangeText={setInput}
            keyboardType="number-pad"
            placeholder="?"
            placeholderTextColor={C.textLight}
            autoFocus
          />
          <TouchableOpacity style={[st.submitBtn, { backgroundColor: sc.primary }]} onPress={submit}>
            <Text style={st.submitTxt}>确定</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={st.exitBtn} onPress={onBack}>
        <Text style={st.exitTxt}>退出</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Battle Phase (split screen) ──────────────────────────

function BattlePhase({ questions, onFinish, onBack }) {
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
    if (checkAnswer(questions[p1Idx], p1Input)) {
      setP1Score((s) => s + 1);
      p1Anim.setValue(1.2);
      Animated.spring(p1Anim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    }
    setP1Input('');
    setP1Idx((i) => i + 1);
  }, [p1Done, p1Input, p1Idx, questions, checkAnswer, p1Anim]);

  const p2Submit = useCallback(() => {
    if (p2Done || !p2Input.trim()) return;
    if (checkAnswer(questions[p2Idx], p2Input)) {
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
            </View>
            <Text style={st.vsText}>VS</Text>
            <View style={st.scoreCol}>
              <Text style={st.scoreLabel}>玩家2</Text>
              <Text style={[st.scoreVal, winner === 'P2' && { color: C.success }]}>{p2Score}/{total}</Text>
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
      <View style={st.centerBar}>
        <Animated.Text style={[st.centerScore, { color: '#5B7FFF', transform: [{ scale: p1Anim }] }]}>P1: {p1Score}</Animated.Text>
        <Text style={st.centerTimer}>{fmt(elapsed)}</Text>
        <Animated.Text style={[st.centerScore, { color: '#E06B6B', transform: [{ scale: p2Anim }] }]}>P2: {p2Score}</Animated.Text>
      </View>
      <View style={[st.playerHalf, { backgroundColor: 'rgba(91,127,255,0.06)' }]}>
        {p1Idx < total ? (
          <>
            <Text style={st.playerLabel}>玩家1 ({p1Idx + 1}/{total})</Text>
            <Text style={st.stemTxt}>{buildStem(questions[p1Idx])}</Text>
            <View style={st.inputRow}>
              <TextInput style={st.ansInput} value={p1Input} onChangeText={setP1Input} keyboardType="number-pad" placeholder="?" placeholderTextColor={C.textLight} />
              <TouchableOpacity style={[st.submitBtn, { backgroundColor: '#5B7FFF' }]} onPress={p1Submit}><Text style={st.submitTxt}>确定</Text></TouchableOpacity>
            </View>
          </>
        ) : <Text style={st.doneLabel}>已完成!</Text>}
      </View>
      <View style={[st.playerHalf, { backgroundColor: 'rgba(224,107,107,0.06)' }]}>
        {p2Idx < total ? (
          <>
            <Text style={st.playerLabel}>玩家2 ({p2Idx + 1}/{total})</Text>
            <Text style={st.stemTxt}>{buildStem(questions[p2Idx])}</Text>
            <View style={st.inputRow}>
              <TextInput style={st.ansInput} value={p2Input} onChangeText={setP2Input} keyboardType="number-pad" placeholder="?" placeholderTextColor={C.textLight} />
              <TouchableOpacity style={[st.submitBtn, { backgroundColor: '#E06B6B' }]} onPress={p2Submit}><Text style={st.submitTxt}>确定</Text></TouchableOpacity>
            </View>
          </>
        ) : <Text style={st.doneLabel}>已完成!</Text>}
      </View>
      <TouchableOpacity style={st.exitBtn} onPress={onBack}><Text style={st.exitTxt}>退出</Text></TouchableOpacity>
    </View>
  );
}

// ── Main ─────────────────────────────────────────────────

export default function BattleScreen() {
  const nav = useNavigation();
  const [phase, setPhase] = useState('setup');
  const [questions, setQuestions] = useState([]);
  const [battleType, setBattleType] = useState('local');
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

  const startLocal = useCallback((subject, difficulty, count) => {
    const range = DIFFICULTIES[difficulty].range;
    setQuestions(generateQuestions(subject, count, range));
    setBattleType('local');
    setPhase('battle');
  }, []);

  const startRoom = useCallback((subject, difficulty, count, code) => {
    const range = DIFFICULTIES[difficulty].range;
    const seed = seedFromParams(code, subject, difficulty, count);
    setQuestions(generateQuestions(subject, count, range, seed));
    setBattleType('room');
    setPhase('battle');
  }, []);

  if (phase === 'setup') {
    return <SetupPhase onStartLocal={startLocal} onStartRoom={startRoom} onBack={onBack} />;
  }

  return (
    <>
      {battleType === 'local' ? (
        <BattlePhase questions={questions} onFinish={directBack} onBack={onBack} />
      ) : (
        <SoloBattlePhase questions={questions} onFinish={directBack} onBack={onBack} />
      )}
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

  roomCodeBox: {
    width: '100%', alignItems: 'center', padding: 20, marginBottom: 16,
    backgroundColor: '#EDE7F6', borderRadius: 20, borderWidth: 2, borderColor: '#7E57C2',
  },
  roomCodeLabel: { fontSize: 13, fontWeight: '700', color: '#7E57C2', marginBottom: 4 },
  roomCodeVal: { fontSize: 40, fontWeight: '900', color: '#4527A0', letterSpacing: 8 },
  roomCodeHint: { fontSize: 12, color: '#7E57C2', marginTop: 6, textAlign: 'center' },

  roomInput: {
    height: 56, borderRadius: 16, backgroundColor: C.bg, paddingHorizontal: 20,
    fontSize: 28, fontWeight: '800', color: C.text, textAlign: 'center',
    borderWidth: 2, borderColor: C.border, letterSpacing: 6,
  },

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

  battleRoot: { flex: 1, backgroundColor: C.bg },
  centerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 8, backgroundColor: C.card,
  },
  centerScore: { fontSize: 18, fontWeight: '800' },
  centerTimer: { fontSize: 20, fontWeight: '800', color: C.text, fontVariant: ['tabular-nums'] },

  soloBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10, backgroundColor: C.card,
  },
  soloBarTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },
  soloBarScore: { fontSize: 22, fontWeight: '800', color: sc.primary },
  soloBarTimer: { fontSize: 15, fontWeight: '700', color: C.textMid, fontVariant: ['tabular-nums'] },

  soloContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },

  playerHalf: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  playerLabel: { fontSize: 14, fontWeight: '700', color: C.textMid, marginBottom: 8 },
  stemTxt: { fontSize: 32, fontWeight: '800', color: C.text, marginBottom: 16, textAlign: 'center' },
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

  compareBox: {
    width: '100%', marginTop: 20, padding: 16, borderRadius: 16,
    backgroundColor: C.card,
  },
  compareLabel: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 10, textAlign: 'center' },
  compareRow: { flexDirection: 'row', alignItems: 'center' },
  compareInput: {
    flex: 1, height: 48, borderRadius: 14, backgroundColor: '#fff',
    textAlign: 'center', fontSize: 22, fontWeight: '700', color: C.text,
    borderWidth: 2, borderColor: C.border,
  },
  compareBtn: {
    marginLeft: 10, height: 48, paddingHorizontal: 20, borderRadius: 14,
    backgroundColor: sc.primary, alignItems: 'center', justifyContent: 'center',
  },
  compareBtnTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
  compareHint: { fontSize: 12, color: C.textMid, marginTop: 10, textAlign: 'center' },
});
