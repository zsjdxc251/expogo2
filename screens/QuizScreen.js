import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { C, SHADOW, RADIUS, SUBJECTS, DIFFICULTIES, OP_SYMBOL, SUBJECT_COLORS } from '../lib/theme';
import { generateQuestions, getMaxQuestions } from '../lib/questions';
import { useApp } from '../lib/AppContext';
import NumberPad from '../components/NumberPad';
import Feedback from '../components/Feedback';
import ExitConfirmModal from '../components/ExitConfirmModal';

function fmt(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

const TIMER_PRESETS = [
  { label: '60秒', value: 60 },
  { label: '120秒', value: 120 },
  { label: '180秒', value: 180 },
  { label: '300秒', value: 300 },
];

// ── Setup Phase ──────────────────────────────────────────

function SetupPhase({ subject, onStart, onBack, allowedDiffs }) {
  const sub = SUBJECTS[subject] || { icon: '📝', label: subject || '练习', color: C.primary };
  const sc = SUBJECT_COLORS.math;
  const diffs = allowedDiffs && allowedDiffs.length > 0 ? allowedDiffs : ['easy', 'normal', 'hard'];
  const [diff, setDiff] = useState(diffs.includes('normal') ? 'normal' : diffs[0]);
  const [count, setCount] = useState(20);
  const [timerMode, setTimerMode] = useState('countup');
  const [countdownSec, setCountdownSec] = useState(300);
  const max = getMaxQuestions(subject, DIFFICULTIES[diff]?.range);
  const clamped = Math.min(count, max);

  useEffect(() => { if (count > max) setCount(max); }, [diff]);

  const PRESETS = [10, 20, 30].filter((n) => n <= max).concat(max > 30 ? [max] : []);

  return (
    <ScrollView style={st.setupScroll} contentContainerStyle={st.setupRoot} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={st.backBtn} onPress={onBack} activeOpacity={0.7}>
        <MaterialIcons name="arrow-back" size={22} color={C.primary} />
        <Text style={st.backTxt}>返回</Text>
      </TouchableOpacity>
      <Text style={st.setupIcon}>{sub.icon}</Text>
      <Text style={st.setupTitle}>{sub.label}</Text>

      <View style={[st.setupCard, SHADOW]}>
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

        {/* Timer mode */}
        <Text style={[st.setupLabel, { marginTop: 20 }]}>计时模式</Text>
        <View style={st.diffRow}>
          <TouchableOpacity
            style={[st.diffBtn, timerMode === 'countup' && { backgroundColor: sc.primary }]}
            onPress={() => setTimerMode('countup')}
          >
            <Text style={[st.diffTxt, timerMode === 'countup' && { color: '#fff' }]}>⏱ 计时</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.diffBtn, timerMode === 'countdown' && { backgroundColor: C.error }]}
            onPress={() => setTimerMode('countdown')}
          >
            <Text style={[st.diffTxt, timerMode === 'countdown' && { color: '#fff' }]}>⏳ 倒计时</Text>
          </TouchableOpacity>
        </View>
        {timerMode === 'countdown' && (
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <View style={st.presetRow}>
              {TIMER_PRESETS.map((tp) => (
                <TouchableOpacity
                  key={tp.value}
                  style={[st.presetBtn, countdownSec === tp.value && { backgroundColor: C.error }]}
                  onPress={() => setCountdownSec(tp.value)}
                >
                  <Text style={[st.presetTxt, countdownSec === tp.value && { color: '#fff' }]}>{tp.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={st.cdInputRow}>
              <TouchableOpacity style={st.cBtn} onPress={() => setCountdownSec((v) => Math.max(10, v - 30))}>
                <Text style={st.cBtnTxt}>−30</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.cBtn} onPress={() => setCountdownSec((v) => Math.max(10, v - 10))}>
                <Text style={st.cBtnTxt}>−10</Text>
              </TouchableOpacity>
              <View style={st.cdInputWrap}>
                <TextInput
                  style={st.cdInput}
                  keyboardType="number-pad"
                  value={String(countdownSec)}
                  onChangeText={(t) => {
                    const n = parseInt(t, 10);
                    if (!isNaN(n) && n >= 0) setCountdownSec(n);
                    else if (t === '') setCountdownSec(0);
                  }}
                  maxLength={4}
                  selectTextOnFocus
                />
                <Text style={st.cdUnit}>秒</Text>
              </View>
              <TouchableOpacity style={st.cBtn} onPress={() => setCountdownSec((v) => Math.min(3600, v + 10))}>
                <Text style={st.cBtnTxt}>+10</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.cBtn} onPress={() => setCountdownSec((v) => Math.min(3600, v + 30))}>
                <Text style={st.cBtnTxt}>+30</Text>
              </TouchableOpacity>
            </View>
            <Text style={st.cdHint}>= {Math.floor(countdownSec / 60)} 分 {countdownSec % 60} 秒</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={st.goBtn}
        activeOpacity={0.8}
        onPress={() => onStart(diff, clamped, timerMode, countdownSec)}
      >
        <Text style={st.goBtnTxt}>开始答题</Text>
      </TouchableOpacity>
      <Text style={st.hint}>本难度最多 {max} 道不重复题</Text>
    </ScrollView>
  );
}

// ── Quiz Phase ───────────────────────────────────────────

function QuizPhase({ questions, subject, settings, timerMode, countdownSec, onFinish, onBack }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState(() => new Array(questions.length).fill(null));
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(countdownSec || 300);
  const [timing, setTiming] = useState(true);
  const [fb, setFb] = useState(null);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [errStreak, setErrStreak] = useState(0);
  const [hint, setHint] = useState(null);
  const [timeUp, setTimeUp] = useState(false);
  const tick = useRef(null);
  const autoRef = useRef(null);
  const comboAnim = useRef(new Animated.Value(1)).current;

  const q = questions[idx];
  const isMulti = !!q?.multiInput;
  const isMCQ = !!q?.mcq;
  const hasStem = !!q?.stem && !isMCQ;
  const answered = answers[idx] !== null;
  const allDone = answers.every((a) => a !== null) || timeUp;
  const opSym = OP_SYMBOL[q?.op] || '?';
  const isCountdown = timerMode === 'countdown';

  const [inputA, setInputA] = useState('');
  const [inputB, setInputB] = useState('');
  const [focus, setFocus] = useState('a');
  const [selectedOpt, setSelectedOpt] = useState(null);

  useEffect(() => {
    if (!timing) return;
    tick.current = setInterval(() => {
      if (isCountdown) {
        setRemaining((r) => {
          if (r <= 1) {
            clearInterval(tick.current);
            setTiming(false);
            setTimeUp(true);
            return 0;
          }
          return r - 1;
        });
      }
      setElapsed((t) => t + 1);
    }, 1000);
    return () => clearInterval(tick.current);
  }, [timing, isCountdown]);

  // Auto-finish when countdown reaches 0
  const answersRef = useRef(answers);
  answersRef.current = answers;
  useEffect(() => {
    if (timeUp) {
      clearInterval(tick.current);
      onFinish({ questions, answers: answersRef.current, elapsed, subject, maxCombo });
    }
  }, [timeUp]);

  const displayTime = isCountdown ? remaining : elapsed;
  const timerDanger = isCountdown && remaining > 0 && remaining <= (countdownSec * 0.2);

  const checkAnswer = useCallback((val, answer) => {
    if (typeof answer === 'object' && answer !== null) {
      return Object.keys(answer).every((k) => val?.[k] === answer[k]);
    }
    return val === answer;
  }, []);

  const genHint = useCallback((question) => {
    if (!question) return null;
    const { op, left, right, result, remainder } = question;
    if (op === 'divRem') return `${left} ÷ ${right} = ${result} 余 ${remainder}，因为 ${right} × ${result} = ${right * result}，${left} - ${right * result} = ${remainder}`;
    if (op === 'divReverse') return `${right} × ${result} = ${right * result}，最大余数 = ${right} - 1 = ${right - 1}，被除数 = ${right * result} + ${right - 1} = ${left}`;
    if (op === 'divide') return `${left} ÷ ${right} = ${result}，因为 ${right} × ${result} = ${left}`;
    if (op === 'mulForward' || op === 'mulBlank') return `${left} × ${right} = ${left * right}`;
    if (op === 'add') return `${left} + ${right} = ${left + right}`;
    if (op === 'subtract') return `${left} - ${right} = ${left - right}`;
    return null;
  }, []);

  const ENCOURAGE = [
    '没关系，错误是学习的好朋友！',
    '加油！再想想看～',
    '不要灰心，慢慢来！',
    '每次错误都是进步的机会！',
  ];

  const doSubmit = useCallback(
    (val) => {
      if (fb) return;
      const isOk = checkAnswer(val, q.answer);
      setAnswers((prev) => { const n = [...prev]; n[idx] = val; return n; });
      if (isOk) {
        const next = combo + 1;
        setCombo(next);
        setMaxCombo((m) => Math.max(m, next));
        setErrStreak(0);
        setHint(null);
        if (next >= 3) {
          comboAnim.setValue(1.4);
          Animated.spring(comboAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
        }
      } else {
        setCombo(0);
        const newErr = errStreak + 1;
        setErrStreak(newErr);
        setHint(genHint(q));
      }
      setFb(isOk ? 'correct' : 'wrong');
    },
    [fb, q, idx, combo, comboAnim, checkAnswer, errStreak, genHint],
  );

  const onSubmit = useCallback(() => {
    if (fb || answered) return;
    if (isMulti) {
      if (!inputA || !inputB) return;
      if (q.op === 'divRem') {
        doSubmit({ q: parseInt(inputA, 10), r: parseInt(inputB, 10) });
      } else if (q.op === 'divReverse') {
        doSubmit({ dividend: parseInt(inputA, 10), remainder: parseInt(inputB, 10) });
      }
    } else {
      if (!inputA) return;
      doSubmit(parseInt(inputA, 10));
    }
  }, [inputA, inputB, fb, answered, doSubmit, isMulti, q]);

  const onKey = useCallback(
    (k) => {
      if (fb || answered) return;
      const setter = focus === 'a' ? setInputA : setInputB;
      if (k === 'C') { setter(''); return; }
      if (k === '⌫') { setter((v) => v.slice(0, -1)); return; }
      setter((v) => (v.length < 3 ? v + k : v));
    },
    [fb, answered, focus],
  );

  const onMCQSelect = useCallback((optIdx) => {
    if (fb || answered) return;
    setSelectedOpt(optIdx);
    doSubmit(optIdx);
  }, [fb, answered, doSubmit]);

  useEffect(() => {
    if (!settings?.autoSubmit || fb || answered || !q) return;
    if (isMulti) {
      const ans = q.answer;
      const keysArr = Object.keys(ans);
      const digitsA = String(ans[keysArr[0]]).length;
      const digitsB = String(ans[keysArr[1]]).length;
      if (!inputA || inputA.length < digitsA || !inputB || inputB.length < digitsB) return;
      autoRef.current = setTimeout(() => {
        if (q.op === 'divRem') {
          doSubmit({ q: parseInt(inputA, 10), r: parseInt(inputB, 10) });
        } else if (q.op === 'divReverse') {
          doSubmit({ dividend: parseInt(inputA, 10), remainder: parseInt(inputB, 10) });
        }
      }, 350);
    } else {
      if (!inputA) return;
      const digits = String(q.answer).length;
      if (inputA.length < digits) return;
      autoRef.current = setTimeout(() => {
        doSubmit(parseInt(inputA, 10));
      }, 250);
    }
    return () => clearTimeout(autoRef.current);
  }, [inputA, inputB, settings?.autoSubmit, fb, answered, doSubmit, q, isMulti]);

  const onFbDone = useCallback(() => {
    setFb(null);
    setHint(null);
    setInputA('');
    setInputB('');
    setFocus('a');
    setSelectedOpt(null);
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

  const renderInputBox = (field, label) => {
    const val = field === 'a' ? inputA : inputB;
    const isFocused = focus === field;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setFocus(field)}
        style={[st.qInput, val ? st.qInputFilled : null, isFocused && st.qInputFocus]}
      >
        <Text style={st.qInputLabel}>{label}</Text>
        <Text style={val ? st.qInputTxt : st.qInputPh}>{val || '?'}</Text>
      </TouchableOpacity>
    );
  };

  const SingleInputBox = (
    <TouchableOpacity activeOpacity={1} style={[st.qInput, inputA ? st.qInputFilled : null, st.qInputFocus]}>
      <Text style={inputA ? st.qInputTxt : st.qInputPh}>{inputA || '?'}</Text>
    </TouchableOpacity>
  );

  const renderQuestion = () => {
    if (!q) return null;

    if (q.op === 'divRem') {
      return (
        <View style={st.qRow}>
          <Text style={st.qNum}>{q.display.left}</Text>
          <Text style={st.qOp}>÷</Text>
          <Text style={st.qNum}>{q.display.right}</Text>
          <Text style={st.qOp}>=</Text>
          {renderInputBox('a', '商')}
          <Text style={st.qDots}>...</Text>
          {renderInputBox('b', '余')}
        </View>
      );
    }

    if (q.op === 'divReverse') {
      return (
        <View style={st.qRow}>
          {renderInputBox('a', '被除数')}
          <Text style={st.qOp}>÷</Text>
          <Text style={st.qNum}>{q.display.right}</Text>
          <Text style={st.qOp}>=</Text>
          <Text style={st.qNum}>{q.display.result}</Text>
          <Text style={st.qDots}>...</Text>
          {renderInputBox('b', '余')}
        </View>
      );
    }

    return (
      <View style={st.qRow}>
        {q.missingPos === 'left' ? SingleInputBox : <Text style={st.qNum}>{q.display.left}</Text>}
        <Text style={st.qOp}>{opSym}</Text>
        {q.missingPos === 'right' ? SingleInputBox : <Text style={st.qNum}>{q.display.right}</Text>}
        <Text style={st.qOp}>=</Text>
        {q.missingPos === 'result' ? SingleInputBox : <Text style={st.qNum}>{q.display.result}</Text>}
      </View>
    );
  };

  return (
    <View style={st.quizRoot}>
      <View style={st.qHeader}>
        <TouchableOpacity onPress={onBack} style={st.qHeaderBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <View style={st.progBadge}>
          <Text style={st.progBadgeTxt}>{allDone ? questions.length : idx + 1}/{questions.length}</Text>
        </View>
        <View style={[st.timerBox, timerDanger && st.timerDanger]}>
          <MaterialIcons name="timer" size={20} color={timerDanger ? C.error : C.primary} style={st.timerIcon} />
          <Text style={[st.timerTxt, timerDanger && st.timerTxtDanger]}>{fmt(displayTime)}</Text>
        </View>
      </View>
      <View style={st.bar}><View style={[st.barFill, { width: `${pct}%`, backgroundColor: C.primary }]} /></View>

      {showCombo && (
        <Animated.View style={[st.comboBox, { transform: [{ scale: comboAnim }] }]}>
          <Text style={st.comboTxt}>🔥 连击 x{combo}!</Text>
        </Animated.View>
      )}

      <View style={st.qArea}>
        {allDone ? (
          <View style={st.doneBox}>
            <Text style={st.doneEmoji}>{timeUp ? '⏰' : '🎉'}</Text>
            <Text style={st.doneTxt}>{timeUp ? '时间到!' : '全部答完了!'}</Text>
          </View>
        ) : isMCQ ? (
          <View style={[st.qCard, SHADOW]}>
            <MaterialIcons name="calculate" size={32} color={C.primary} style={st.qCardIcon} />
            <Text style={st.qIdx}>第 {idx + 1} 题</Text>
            <Text style={st.stemTxt}>{q.stem}</Text>
            <View style={st.mcqGrid}>
              {q.options.map((opt, oi) => {
                const sel = selectedOpt === oi;
                const isCorrectOpt = oi === q.answer;
                const showResult = fb !== null;
                const optStyle = showResult
                  ? isCorrectOpt ? st.mcqCorrect : sel ? st.mcqWrong : st.mcqOpt
                  : sel ? st.mcqSelected : st.mcqOpt;
                return (
                  <TouchableOpacity
                    key={oi}
                    style={[st.mcqOpt, optStyle]}
                    activeOpacity={0.7}
                    disabled={!!fb || answered}
                    onPress={() => onMCQSelect(oi)}
                  >
                    <Text style={[st.mcqOptTxt, showResult && isCorrectOpt && { color: '#fff' }, showResult && sel && !isCorrectOpt && { color: '#fff' }]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {fb === 'wrong' && hint && (
              <View style={st.hintBox}><Text style={st.hintTxt}>💡 {hint}</Text></View>
            )}
          </View>
        ) : hasStem ? (
          <View style={[st.qCard, SHADOW]}>
            <MaterialIcons name="calculate" size={32} color={C.primary} style={st.qCardIcon} />
            <Text style={st.qIdx}>第 {idx + 1} 题</Text>
            <Text style={st.stemTxt}>{q.stem}</Text>
            <View style={st.qRow}>
              <Text style={st.qOp}>答案:</Text>
              {SingleInputBox}
            </View>
            {fb === 'wrong' && hint && (
              <View style={st.hintBox}><Text style={st.hintTxt}>💡 {hint}</Text></View>
            )}
            {errStreak >= 3 && (
              <View style={st.encourageBox}>
                <Text style={st.encourageTxt}>{ENCOURAGE[errStreak % ENCOURAGE.length]}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={[st.qCard, SHADOW]}>
            <MaterialIcons name="calculate" size={32} color={C.primary} style={st.qCardIcon} />
            <Text style={st.qIdx}>第 {idx + 1} 题</Text>
            {isMulti && (
              <Text style={st.qHint}>
                {q.op === 'divReverse' ? '求最大被除数和余数' : '填写商和余数'}
              </Text>
            )}
            {renderQuestion()}
            {isMulti && (
              <View style={st.focusHint}>
                <Text style={st.focusHintTxt}>
                  点击输入框切换 · 当前填写: {focus === 'a' ? (q.op === 'divReverse' ? '被除数' : '商') : '余数'}
                </Text>
              </View>
            )}
            {fb === 'wrong' && hint && (
              <View style={st.hintBox}>
                <Text style={st.hintTxt}>💡 {hint}</Text>
              </View>
            )}
            {errStreak >= 3 && (
              <View style={st.encourageBox}>
                <Text style={st.encourageTxt}>{ENCOURAGE[errStreak % ENCOURAGE.length]}</Text>
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

      <View style={st.qBottom}>
        {!allDone && !isMCQ && <NumberPad onPress={onKey} disabled={!!fb || answered} />}
        {allDone ? (
          <TouchableOpacity style={st.finishBtn} onPress={handleFinish} activeOpacity={0.8}>
            <Text style={st.finishTxt}>查看结果</Text>
          </TouchableOpacity>
        ) : !settings?.autoSubmit ? (
          <TouchableOpacity
            style={[st.subBtn, (isMulti ? (!inputA || !inputB || !!fb) : (!inputA || !!fb)) && st.subBtnOff]}
            onPress={onSubmit}
            disabled={isMulti ? (!inputA || !inputB || !!fb || answered) : (!inputA || !!fb || answered)}
            activeOpacity={0.8}
          >
            <Text style={[st.subBtnTxt, (isMulti ? (!inputA || !inputB || !!fb) : (!inputA || !!fb)) && st.subBtnTxtOff]}>提交答案</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

// ── Main Export ───────────────────────────────────────────

export default function QuizScreen() {
  const route = useRoute();
  const nav = useNavigation();
  const { settings, finishQuiz, visibility } = useApp();
  const allowedDiffs = visibility?.allowedDifficulties;
  const params = route.params || {};
  const directBack = useCallback(() => nav.goBack(), [nav]);
  const finishedRef = useRef(false);

  const [phase, setPhase] = useState(params.isReview ? 'quiz' : 'setup');
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
  const [questions, setQuestions] = useState(params.questions || []);
  const [diff, setDiff] = useState(params.difficulty || 'normal');
  const [timerMode, setTimerMode] = useState('countup');
  const [countdownSec, setCountdownSec] = useState(300);

  const startQuiz = useCallback(
    (difficulty, count, tMode, cdSec) => {
      setDiff(difficulty);
      setTimerMode(tMode || 'countup');
      setCountdownSec(cdSec || 300);
      const range = DIFFICULTIES[difficulty].range;
      setQuestions(generateQuestions(params.subject, count, range));
      setPhase('quiz');
    },
    [params.subject],
  );

  const handleFinish = useCallback(async (data) => {
    finishedRef.current = true;
    await finishQuiz({ ...data, difficulty: diff });
    nav.replace('Results');
  }, [finishQuiz, diff, nav]);

  if (phase === 'setup') {
    return <SetupPhase subject={params.subject} onStart={startQuiz} onBack={onBack} allowedDiffs={allowedDiffs} />;
  }

  return (
    <>
      <QuizPhase
        questions={questions}
        subject={params.subject}
        settings={settings}
        timerMode={timerMode}
        countdownSec={countdownSec}
        onFinish={handleFinish}
        onBack={onBack}
      />
      <ExitConfirmModal visible={showExit} onCancel={() => setShowExit(false)} onConfirm={directBack} />
    </>
  );
}

// ── Styles ───────────────────────────────────────────────

const st = StyleSheet.create({
  setupScroll: { flex: 1, backgroundColor: C.bg },
  setupRoot: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 12, paddingVertical: 4, paddingRight: 8 },
  backTxt: { fontSize: 16, fontWeight: '600', color: C.primary, marginLeft: 2 },
  setupIcon: { fontSize: 48, marginBottom: 4 },
  setupTitle: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 20 },
  setupCard: { width: '100%', backgroundColor: C.cardWhite, borderRadius: RADIUS, padding: 24, alignItems: 'center' },
  setupLabel: { fontSize: 15, fontWeight: '600', color: C.textMid, marginBottom: 12 },
  diffRow: { flexDirection: 'row' },
  diffBtn: {
    flex: 1, height: 42, borderRadius: RADIUS, marginHorizontal: 4,
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
  },
  diffTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },
  countRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cBtn: {
    width: 40, height: 40, borderRadius: RADIUS, backgroundColor: C.primaryBg,
    alignItems: 'center', justifyContent: 'center', marginHorizontal: 3,
  },
  cBtnTxt: { fontSize: 15, fontWeight: '700', color: C.primary },
  countDisp: { alignItems: 'center', marginHorizontal: 10, minWidth: 56 },
  countNum: { fontSize: 36, fontWeight: '800', color: C.primary },
  countUnit: { fontSize: 12, color: C.textMid, marginTop: -4 },
  presetRow: { flexDirection: 'row' },
  presetBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS, backgroundColor: C.bg, marginHorizontal: 3, borderWidth: 1, borderColor: C.border },
  presetOn: { backgroundColor: C.primary, borderColor: C.primary },
  presetTxt: { fontSize: 13, fontWeight: '600', color: C.textMid },
  presetTxtOn: { color: '#fff' },
  cdInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  cdInputWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 6 },
  cdInput: {
    width: 64, height: 40, borderRadius: RADIUS, backgroundColor: C.cardWhite, borderWidth: 1.5, borderColor: C.error,
    textAlign: 'center', fontSize: 20, fontWeight: '800', color: C.error,
  },
  cdUnit: { fontSize: 14, fontWeight: '600', color: C.textMid, marginLeft: 4 },
  cdHint: { fontSize: 11, color: C.textLight, marginTop: 6 },

  goBtn: {
    marginTop: 28, width: '100%', height: 54, borderRadius: RADIUS,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  goBtnTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },
  hint: { marginTop: 12, fontSize: 12, color: C.textLight },

  quizRoot: { flex: 1, backgroundColor: C.bg },
  qHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6,
  },
  timerBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.primaryBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS },
  timerDanger: { backgroundColor: C.errorBg },
  timerIcon: { marginRight: 4 },
  qHeaderBack: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  timerTxt: { fontSize: 16, fontWeight: '700', color: C.primary, fontVariant: ['tabular-nums'] },
  timerTxtDanger: { color: C.error },
  progBadge: { paddingHorizontal: 4, paddingVertical: 2 },
  progBadgeTxt: { fontSize: 16, fontWeight: '800', color: C.primary, fontVariant: ['tabular-nums'] },
  bar: { height: 6, backgroundColor: C.card, marginHorizontal: 16, borderRadius: RADIUS, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: RADIUS },

  comboBox: { alignSelf: 'center', marginTop: 6, marginBottom: 4, paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS, backgroundColor: C.accentBg },
  comboTxt: { fontSize: 15, fontWeight: '800', color: C.accent },

  qArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  qCard: { width: '100%', backgroundColor: C.cardWhite, borderRadius: RADIUS, paddingVertical: 28, paddingHorizontal: 16, alignItems: 'center' },
  qCardIcon: { marginBottom: 8 },
  qIdx: { fontSize: 13, fontWeight: '600', color: C.textLight, marginBottom: 6 },
  qHint: { fontSize: 12, color: C.primary, fontWeight: '600', marginBottom: 10, backgroundColor: C.primaryBg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  qRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  qNum: { fontSize: 40, fontWeight: '800', color: C.text },
  qOp: { fontSize: 26, fontWeight: '600', color: C.textMid, marginHorizontal: 6 },
  qDots: { fontSize: 26, fontWeight: '800', color: C.textMid, marginHorizontal: 4, letterSpacing: 2 },
  qInput: {
    minWidth: 56, height: 62, borderRadius: RADIUS, borderWidth: 2.5,
    borderColor: C.border, borderStyle: 'dashed', backgroundColor: C.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8,
  },
  qInputFilled: { borderStyle: 'solid', backgroundColor: '#fff' },
  qInputFocus: { borderColor: C.primary, borderStyle: 'solid', backgroundColor: C.primaryBg },
  qInputLabel: { fontSize: 9, color: C.textLight, fontWeight: '600', position: 'absolute', top: 2 },
  qInputTxt: { fontSize: 38, fontWeight: '800', color: C.primary },
  qInputPh: { fontSize: 28, fontWeight: '700', color: C.textLight },
  focusHint: { marginTop: 10 },
  focusHintTxt: { fontSize: 11, color: C.textLight },
  hintBox: { marginTop: 10, backgroundColor: C.accentBg, borderRadius: 10, padding: 10 },
  hintTxt: { fontSize: 13, color: C.accent, lineHeight: 20 },
  encourageBox: { marginTop: 8, backgroundColor: C.successBg, borderRadius: 10, padding: 8 },
  encourageTxt: { fontSize: 13, color: C.success, fontWeight: '600', textAlign: 'center' },

  stemTxt: { fontSize: 20, fontWeight: '700', color: C.text, textAlign: 'center', lineHeight: 30, marginBottom: 16 },
  mcqGrid: { width: '100%' },
  mcqOpt: {
    width: '100%', paddingVertical: 14, paddingHorizontal: 18,
    borderRadius: RADIUS, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.cardWhite, marginBottom: 10,
  },
  mcqSelected: { borderColor: C.primary, backgroundColor: C.primaryBg },
  mcqCorrect: { borderColor: C.success, backgroundColor: C.success },
  mcqWrong: { borderColor: C.error, backgroundColor: C.error },
  mcqOptTxt: { fontSize: 17, fontWeight: '600', color: C.text, textAlign: 'center' },

  doneBox: { alignItems: 'center' },
  doneEmoji: { fontSize: 56, marginBottom: 10 },
  doneTxt: { fontSize: 22, fontWeight: '700', color: C.success },

  qBottom: { width: '100%', paddingHorizontal: 16, paddingBottom: 10 },
  subBtn: { width: '100%', height: 52, marginTop: 8, borderRadius: RADIUS, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  subBtnOff: { backgroundColor: C.border },
  subBtnTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },
  subBtnTxtOff: { color: C.textLight },
  finishBtn: { width: '100%', height: 54, borderRadius: RADIUS, backgroundColor: C.success, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  finishTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },
});
