import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { C, SUBJECTS, DIFFICULTIES, OP_SYMBOL, SUBJECT_COLORS } from '../lib/theme';
import { generateQuestions, getMaxQuestions } from '../lib/questions';
import { useApp } from '../lib/AppContext';
import NumberPad from '../components/NumberPad';
import Feedback from '../components/Feedback';
import ExitConfirmModal from '../components/ExitConfirmModal';
import ADVENTURE_LEVELS from '../lib/adventureLevels';

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

function SetupPhase({ subject, onStart, onBack, allowedDiffs, onAdventure, onChallenge }) {
  const sub = SUBJECTS[subject] || { icon: '📝', label: subject || '练习', color: C.primary };
  const sc = SUBJECT_COLORS.math;
  const diffs = allowedDiffs && allowedDiffs.length > 0 ? allowedDiffs : ['easy', 'normal', 'hard'];
  const [diff, setDiff] = useState(diffs.includes('normal') ? 'normal' : diffs[0]);
  const [count, setCount] = useState(20);
  const [timerMode, setTimerMode] = useState('countup');
  const [countdownSec, setCountdownSec] = useState(300);
  const [gameMode, setGameMode] = useState('normal');
  const max = getMaxQuestions(subject, DIFFICULTIES[diff]?.range);
  const clamped = Math.min(count, max);

  useEffect(() => { if (count > max) setCount(max); }, [diff]);

  const PRESETS = [10, 20, 30].filter((n) => n <= max).concat(max > 30 ? [max] : []);

  return (
    <ScrollView style={st.setupScroll} contentContainerStyle={st.setupRoot} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={st.backBtn} onPress={onBack}>
        <Text style={st.backTxt}>← 返回</Text>
      </TouchableOpacity>
      <Text style={st.setupIcon}>{sub.icon}</Text>
      <Text style={st.setupTitle}>{sub.label}</Text>

      <View style={st.modeRow}>
        {[
          { key: 'normal', label: '📝 普通' },
          { key: 'adventure', label: '🗺️ 闯关' },
          { key: 'challenge', label: '⚡ 挑战' },
        ].map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[st.modeTab, gameMode === m.key && st.modeTabOn]}
            onPress={() => setGameMode(m.key)}
          >
            <Text style={[st.modeTabTxt, gameMode === m.key && st.modeTabTxtOn]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {gameMode === 'adventure' && (
        <>
          <View style={st.advModeCard}>
            <Text style={st.advModeEmoji}>🗺️</Text>
            <Text style={st.advModeTitle}>闯关模式</Text>
            <Text style={st.advModeDesc}>进入闯关模式，按关卡顺序挑战！</Text>
          </View>
          <TouchableOpacity style={st.goBtn} activeOpacity={0.8} onPress={onAdventure}>
            <Text style={st.goBtnTxt}>进入闯关</Text>
          </TouchableOpacity>
        </>
      )}

      {gameMode === 'challenge' && (
        <>
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
          <View style={st.advModeCard}>
            <Text style={st.advModeEmoji}>⚡</Text>
            <Text style={st.advModeTitle}>挑战模式</Text>
            <Text style={st.advModeDesc}>限时挑战，3条生命，连击加分！</Text>
          </View>
          <TouchableOpacity style={st.goBtn} activeOpacity={0.8} onPress={() => onChallenge(diff)}>
            <Text style={st.goBtnTxt}>开始挑战</Text>
          </TouchableOpacity>
        </>
      )}

      {gameMode === 'normal' && (
      <>
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
      </>
      )}
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
  const sub = SUBJECTS[subject] || { icon: '📝', label: '错题练习', color: C.primary };
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
        <TouchableOpacity onPress={onBack}><Text style={st.backTxt}>←</Text></TouchableOpacity>
        <View style={[st.timerBox, timerDanger && st.timerDanger]}>
          <Text style={[st.timerTxt, timerDanger && st.timerTxtDanger]}>{fmt(displayTime)}</Text>
        </View>
        <View style={st.progBadge}>
          <Text style={st.progBadgeTxt}>{allDone ? questions.length : idx + 1}/{questions.length}</Text>
        </View>
      </View>
      <View style={st.bar}><View style={[st.barFill, { width: `${pct}%`, backgroundColor: sub.color }]} /></View>

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
          <View style={st.qCard}>
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
          <View style={st.qCard}>
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
          <View style={st.qCard}>
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
            <Text style={[st.subBtnTxt, (isMulti ? (!inputA || !inputB || !!fb) : (!inputA || !!fb)) && st.subBtnTxtOff]}>确认</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

// ── Adventure select ─────────────────────────────────────

function AdventureSelectPhase({ subject, onBack, onStartLevel, adventureProgress }) {
  const sub = SUBJECTS[subject] || { icon: '📝', label: subject || '练习', color: C.primary };
  const sc = SUBJECT_COLORS.math;
  return (
    <ScrollView style={st.advScroll} contentContainerStyle={st.advRoot} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={st.backBtn} onPress={onBack}>
        <Text style={st.backTxt}>← 返回</Text>
      </TouchableOpacity>
      <Text style={st.advTitle}>🗺️ 闯关</Text>
      <Text style={st.advDesc}>{sub.label} · 按顺序解锁关卡</Text>
      {ADVENTURE_LEVELS.map((level) => {
        const unlocked = level.id === 1 || (adventureProgress[level.id - 1] || 0) >= 1;
        const starsEarned = adventureProgress[level.id] || 0;
        const starStr = `${'★'.repeat(starsEarned)}${'☆'.repeat(Math.max(0, 3 - starsEarned))}`;
        return (
          <TouchableOpacity
            key={level.id}
            style={[st.advCard, { borderLeftColor: sc.primary }, !unlocked && st.advCardLocked]}
            disabled={!unlocked}
            activeOpacity={0.75}
            onPress={() => unlocked && onStartLevel(level)}
          >
            <View style={[st.advBadge, { backgroundColor: sc.primary }]}>
              <Text style={st.advBadgeNum}>{level.id}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={st.advLevelTitle}>{level.title}</Text>
              <Text style={st.advLevelDesc}>{level.desc}</Text>
              <Text style={st.advStars}>{unlocked ? starStr : '未解锁'}</Text>
            </View>
            {unlocked ? <Text style={[st.advGo, { color: sc.primary }]}>开始 ›</Text> : null}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ── Challenge Phase ──────────────────────────────────────

function ChallengePhase({ subject, difficulty, onFinish, onBack, highScore, onUpdateHighScore, settings }) {
  const range = DIFFICULTIES[difficulty].range;
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [questionTimer, setQuestionTimer] = useState(10);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [idx, setIdx] = useState(0);
  const [questions, setQuestions] = useState(() => generateQuestions(subject, 20, range));
  const [answers, setAnswers] = useState(() => new Array(20).fill(null));
  const [gameOver, setGameOver] = useState(false);
  const [fb, setFb] = useState(null);
  const [inputA, setInputA] = useState('');
  const [inputB, setInputB] = useState('');
  const [focus, setFocus] = useState('a');
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [hint, setHint] = useState(null);
  const [errStreak, setErrStreak] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [lastFbPoints, setLastFbPoints] = useState(10);
  const pendingGameOverRef = useRef(false);
  const gameOverIdxRef = useRef(0);
  const timeUpIdxRef = useRef(-1);
  const answersRef = useRef([]);
  const questionsRef = useRef([]);
  const elapsedRef = useRef(0);
  const comboAnim = useRef(new Animated.Value(1)).current;

  const sc = SUBJECT_COLORS.math;

  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);

  useEffect(() => {
    setAnswers((prev) => {
      if (prev.length >= questions.length) return prev;
      return [...prev, ...new Array(questions.length - prev.length).fill(null)];
    });
  }, [questions.length]);

  useEffect(() => {
    if (gameOver || fb) return;
    setQuestions((prev) => {
      if (prev.length === 0 || idx !== prev.length - 5) return prev;
      const more = generateQuestions(subject, 20, range);
      return [...prev, ...more];
    });
  }, [idx, gameOver, fb, subject, range]);

  useEffect(() => {
    if (gameOver) return;
    setQuestionTimer(10);
    timeUpIdxRef.current = -1;
  }, [idx, gameOver]);

  useEffect(() => {
    if (gameOver) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [gameOver]);

  const checkAnswer = useCallback((val, answer) => {
    if (typeof answer === 'object' && answer !== null) {
      return val !== null && typeof val === 'object' &&
        Object.keys(answer).every((k) => val[k] === answer[k]);
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

  const handleTimeUp = useCallback(() => {
    if (fb || gameOver) return;
    const i = idx;
    const cq = questions[i];
    if (!cq) return;
    if (timeUpIdxRef.current === i) return;
    timeUpIdxRef.current = i;
    setAnswers((prev) => {
      const n = [...prev];
      while (n.length <= i) n.push(null);
      n[i] = null;
      return n;
    });
    setCombo(0);
    setLives((L) => {
      const n = L - 1;
      if (n <= 0) pendingGameOverRef.current = true;
      return n;
    });
    setHint(genHint(cq));
    setFb('wrong');
  }, [fb, gameOver, questions, idx, genHint]);

  useEffect(() => {
    if (gameOver || fb) return;
    const id = setInterval(() => {
      setQuestionTimer((s) => {
        if (s <= 1) {
          handleTimeUp();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [gameOver, fb, idx, handleTimeUp]);

  const q = questions[idx];
  const isMulti = !!q?.multiInput;
  const isMCQ = !!q?.mcq;
  const hasStem = !!q?.stem && !isMCQ;
  const answered = answers[idx] !== null;
  const opSym = OP_SYMBOL[q?.op] || '?';
  const showCombo = combo >= 3 && !gameOver && !fb;

  const doSubmit = useCallback(
    (val) => {
      if (fb || gameOver) return;
      const cq = questions[idx];
      if (!cq) return;
      const isOk = checkAnswer(val, cq.answer);
      setAnswers((prev) => {
        const n = [...prev];
        while (n.length <= idx) n.push(null);
        n[idx] = val;
        return n;
      });
      if (isOk) {
        const next = combo + 1;
        setCombo(next);
        setMaxCombo((m) => Math.max(m, next));
        setErrStreak(0);
        setHint(null);
        let pts = 10;
        if (next >= 3) pts += 5;
        if (next >= 5) pts += 10;
        setLastFbPoints(pts);
        setScore((s) => s + pts);
        if (next >= 3) {
          comboAnim.setValue(1.4);
          Animated.spring(comboAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
        }
        setFb('correct');
      } else {
        setCombo(0);
        const newErr = errStreak + 1;
        setErrStreak(newErr);
        setHint(genHint(cq));
        setLives((L) => {
          const n = L - 1;
          if (n <= 0) pendingGameOverRef.current = true;
          return n;
        });
        setFb('wrong');
      }
    },
    [fb, gameOver, questions, idx, combo, comboAnim, checkAnswer, errStreak, genHint],
  );

  const onSubmit = useCallback(() => {
    if (fb || answered || gameOver) return;
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
  }, [inputA, inputB, fb, answered, doSubmit, isMulti, q, gameOver]);

  const onKey = useCallback(
    (k) => {
      if (fb || answered || gameOver) return;
      const setter = focus === 'a' ? setInputA : setInputB;
      if (k === 'C') { setter(''); return; }
      if (k === '⌫') { setter((v) => v.slice(0, -1)); return; }
      setter((v) => (v.length < 3 ? v + k : v));
    },
    [fb, answered, focus, gameOver],
  );

  const onMCQSelect = useCallback((optIdx) => {
    if (fb || answered || gameOver) return;
    setSelectedOpt(optIdx);
    doSubmit(optIdx);
  }, [fb, answered, doSubmit, gameOver]);

  const onFbDone = useCallback(() => {
    setFb(null);
    setHint(null);
    setInputA('');
    setInputB('');
    setFocus('a');
    setSelectedOpt(null);
    if (pendingGameOverRef.current) {
      pendingGameOverRef.current = false;
      gameOverIdxRef.current = idx;
      setGameOver(true);
      return;
    }
    setIdx((i) => i + 1);
  }, [idx]);

  const resetChallenge = useCallback(() => {
    setLives(3);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setIdx(0);
    setElapsed(0);
    setGameOver(false);
    setFb(null);
    setInputA('');
    setInputB('');
    setHint(null);
    setErrStreak(0);
    pendingGameOverRef.current = false;
    timeUpIdxRef.current = -1;
    const batch = generateQuestions(subject, 20, range);
    setQuestions(batch);
    setAnswers(new Array(batch.length).fill(null));
    setQuestionTimer(10);
  }, [subject, range]);

  const handleGameOverFinish = useCallback(() => {
    const end = gameOverIdxRef.current;
    onFinish({
      questions: questionsRef.current.slice(0, end + 1),
      answers: answersRef.current.slice(0, end + 1),
      elapsed: elapsedRef.current,
      subject,
      maxCombo,
    });
  }, [subject, maxCombo, onFinish]);

  useEffect(() => {
    if (gameOver) onUpdateHighScore(score);
  }, [gameOver, score, onUpdateHighScore]);

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

  const timerPct = Math.min(1, questionTimer / 10);
  const timerColor = questionTimer <= 3 ? C.error : sc.primary;

  if (gameOver) {
    const isNew = score > highScore;
    return (
      <View style={st.challengeRoot}>
        <View style={st.qHeader}>
          <TouchableOpacity onPress={onBack}><Text style={st.backTxt}>←</Text></TouchableOpacity>
          <Text style={st.challengeScore}>挑战结束</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={st.gameOverBox}>
          <Text style={st.gameOverEmoji}>🏆</Text>
          <Text style={st.gameOverTitle}>游戏结束</Text>
          <Text style={st.gameOverScore}>{score}</Text>
          <Text style={st.gameOverHs}>历史最高：{Math.max(highScore, score)}</Text>
          {isNew && score > 0 ? <Text style={st.gameOverNew}>🎉 新纪录！</Text> : null}
          <View style={st.gameOverBtns}>
            <TouchableOpacity style={st.goBtn} onPress={resetChallenge} activeOpacity={0.8}>
              <Text style={st.goBtnTxt}>再来一次</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.goBtn, { marginTop: 10, backgroundColor: C.success }]} onPress={handleGameOverFinish} activeOpacity={0.8}>
              <Text style={st.goBtnTxt}>查看结果</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={st.challengeRoot}>
      <View style={st.qHeader}>
        <TouchableOpacity onPress={onBack}><Text style={st.backTxt}>←</Text></TouchableOpacity>
        <Text style={st.challengeScore}>{score} 分</Text>
        <View style={st.progBadge}>
          <Text style={st.progBadgeTxt}>{fmt(elapsed)}</Text>
        </View>
      </View>
      <View style={st.livesRow}>
        {[0, 1, 2].map((i) => (
          <Text key={i} style={st.heartTxt}>{i < lives ? '❤️' : '🖤'}</Text>
        ))}
      </View>
      <View style={st.qTimerBar}>
        <View style={[st.qTimerFill, { width: `${timerPct * 100}%`, backgroundColor: timerColor }]} />
      </View>
      {showCombo && (
        <Animated.View style={[st.comboBox, { transform: [{ scale: comboAnim }] }]}>
          <Text style={st.comboTxt}>🔥 连击 x{combo}!</Text>
        </Animated.View>
      )}
      <View style={st.qArea}>
        {!q ? (
          <Text style={st.advDesc}>加载中…</Text>
        ) : isMCQ ? (
          <View style={st.qCard}>
            <Text style={st.qIdx}>第 {idx + 1} 题 · 挑战</Text>
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
          <View style={st.qCard}>
            <Text style={st.qIdx}>第 {idx + 1} 题 · 挑战</Text>
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
          <View style={st.qCard}>
            <Text style={st.qIdx}>第 {idx + 1} 题 · 挑战</Text>
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
          points={fb === 'correct' ? lastFbPoints : 0}
          combo={combo}
          onDone={onFbDone}
        />
      </View>
      <View style={st.qBottom}>
        {!isMCQ && <NumberPad onPress={onKey} disabled={!!fb || answered} />}
        {!settings?.autoSubmit ? (
          <TouchableOpacity
            style={[st.subBtn, (isMulti ? (!inputA || !inputB || !!fb) : (!inputA || !!fb)) && st.subBtnOff]}
            onPress={onSubmit}
            disabled={isMulti ? (!inputA || !inputB || !!fb || answered) : (!inputA || !!fb || answered)}
            activeOpacity={0.8}
          >
            <Text style={[st.subBtnTxt, (isMulti ? (!inputA || !inputB || !!fb) : (!inputA || !!fb)) && st.subBtnTxtOff]}>确认</Text>
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
  const {
    settings, finishQuiz, visibility,
    adventureProgress, challengeHighScore, updateChallengeHighScore,
  } = useApp();
  const allowedDiffs = visibility?.allowedDifficulties;
  const params = route.params || {};
  const directBack = useCallback(() => nav.goBack(), [nav]);
  const finishedRef = useRef(false);

  const [phase, setPhase] = useState(params.isReview ? 'quiz' : 'setup');
  const [showExit, setShowExit] = useState(false);
  const [adventureLevel, setAdventureLevel] = useState(null);
  const inQuiz = phase === 'quiz' || phase === 'challenge';
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

  const startAdventure = useCallback(() => setPhase('adventure-select'), []);

  const startAdventureLevel = useCallback((level) => {
    setAdventureLevel(level);
    const range = DIFFICULTIES[level.difficulty].range;
    setQuestions(generateQuestions(level.subject, level.count, range));
    setDiff(level.difficulty);
    setTimerMode('countup');
    setPhase('quiz');
  }, []);

  const startChallenge = useCallback((difficulty) => {
    setDiff(difficulty);
    setPhase('challenge');
  }, []);

  const handleFinish = useCallback(async (data) => {
    finishedRef.current = true;
    const result = await finishQuiz({ ...data, difficulty: diff, adventureLevel });
    if (adventureLevel && result) setAdventureLevel(null);
    nav.replace('Results');
  }, [finishQuiz, diff, nav, adventureLevel]);

  if (phase === 'setup') {
    return (
      <SetupPhase
        subject={params.subject}
        onStart={startQuiz}
        onBack={onBack}
        allowedDiffs={allowedDiffs}
        onAdventure={startAdventure}
        onChallenge={startChallenge}
      />
    );
  }

  if (phase === 'adventure-select') {
    return (
      <AdventureSelectPhase
        subject={params.subject}
        onBack={() => setPhase('setup')}
        onStartLevel={startAdventureLevel}
        adventureProgress={adventureProgress}
      />
    );
  }

  if (phase === 'challenge') {
    return (
      <>
        <ChallengePhase
          subject={params.subject}
          difficulty={diff}
          onFinish={handleFinish}
          onBack={onBack}
          highScore={challengeHighScore}
          onUpdateHighScore={updateChallengeHighScore}
          settings={settings}
        />
        <ExitConfirmModal visible={showExit} onCancel={() => setShowExit(false)} onConfirm={directBack} />
      </>
    );
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
  backBtn: { alignSelf: 'flex-start', marginBottom: 12 },
  backTxt: { fontSize: 16, fontWeight: '600', color: C.primary },
  setupIcon: { fontSize: 48, marginBottom: 4 },
  setupTitle: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 20 },
  setupCard: { width: '100%', backgroundColor: C.card, borderRadius: 20, padding: 24, alignItems: 'center' },
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
  cdInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  cdInputWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 6 },
  cdInput: {
    width: 64, height: 40, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.error,
    textAlign: 'center', fontSize: 20, fontWeight: '800', color: C.error,
  },
  cdUnit: { fontSize: 14, fontWeight: '600', color: C.textMid, marginLeft: 4 },
  cdHint: { fontSize: 11, color: C.textLight, marginTop: 6 },

  goBtn: {
    marginTop: 28, width: '100%', height: 54, borderRadius: 16,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  goBtnTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },
  hint: { marginTop: 12, fontSize: 12, color: C.textLight },

  quizRoot: { flex: 1, backgroundColor: C.bg },
  qHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6,
  },
  timerBox: { backgroundColor: C.primaryBg, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 16 },
  timerDanger: { backgroundColor: C.errorBg },
  timerTxt: { fontSize: 18, fontWeight: '700', color: C.primary, fontVariant: ['tabular-nums'] },
  timerTxtDanger: { color: C.error },
  progBadge: { backgroundColor: C.primaryBg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14 },
  progBadgeTxt: { fontSize: 14, fontWeight: '700', color: C.primary },
  bar: { height: 6, backgroundColor: 'rgba(196,196,196,0.4)', marginHorizontal: 16, borderRadius: 30, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 30 },

  comboBox: { alignSelf: 'center', marginTop: 8, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 16, backgroundColor: C.accentBg },
  comboTxt: { fontSize: 15, fontWeight: '800', color: C.accent },

  qArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  qCard: { width: '100%', backgroundColor: C.card, borderRadius: 20, paddingVertical: 24, paddingHorizontal: 16, alignItems: 'center' },
  qIdx: { fontSize: 13, fontWeight: '600', color: C.textLight, marginBottom: 6 },
  qHint: { fontSize: 12, color: C.primary, fontWeight: '600', marginBottom: 10, backgroundColor: C.primaryBg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  qRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  qNum: { fontSize: 40, fontWeight: '800', color: C.text },
  qOp: { fontSize: 26, fontWeight: '600', color: C.textMid, marginHorizontal: 6 },
  qDots: { fontSize: 26, fontWeight: '800', color: C.textMid, marginHorizontal: 4, letterSpacing: 2 },
  qInput: {
    minWidth: 56, height: 62, borderRadius: 14, borderWidth: 2.5,
    borderColor: C.border, borderStyle: 'dashed', backgroundColor: 'rgba(229,229,229,0.3)',
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
    borderRadius: 16, borderWidth: 2, borderColor: C.border,
    backgroundColor: C.cardWhite, marginBottom: 10,
  },
  mcqSelected: { borderColor: C.primary, backgroundColor: C.primaryBg },
  mcqCorrect: { borderColor: C.success, backgroundColor: C.success },
  mcqWrong: { borderColor: C.error, backgroundColor: C.error },
  mcqOptTxt: { fontSize: 17, fontWeight: '600', color: C.text, textAlign: 'center' },

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

  modeRow: { flexDirection: 'row', marginBottom: 20, backgroundColor: C.card, borderRadius: 14, padding: 3, width: '100%' },
  modeTab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  modeTabOn: { backgroundColor: SUBJECT_COLORS.math.primary },
  modeTabTxt: { fontSize: 14, fontWeight: '700', color: C.textMid },
  modeTabTxtOn: { color: '#fff' },

  advScroll: { flex: 1, backgroundColor: C.bg },
  advRoot: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  advTitle: { fontSize: 22, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: 4 },
  advDesc: { fontSize: 13, color: C.textMid, textAlign: 'center', marginBottom: 20 },
  advCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: C.cardWhite, borderRadius: 16, marginBottom: 10,
    borderLeftWidth: 4,
  },
  advCardLocked: { opacity: 0.4 },
  advBadge: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  advBadgeNum: { color: '#fff', fontSize: 18, fontWeight: '800' },
  advLevelTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  advLevelDesc: { fontSize: 12, color: C.textMid, marginTop: 2 },
  advStars: { fontSize: 16, marginTop: 2 },
  advGo: { fontSize: 14, fontWeight: '700' },

  challengeRoot: { flex: 1, backgroundColor: C.bg },
  livesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  heartTxt: { fontSize: 24, marginHorizontal: 2 },
  challengeScore: { fontSize: 20, fontWeight: '800', color: SUBJECT_COLORS.math.primary },
  qTimerBar: { height: 6, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: 16, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  qTimerFill: { height: 6, borderRadius: 3 },
  gameOverBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  gameOverEmoji: { fontSize: 64, marginBottom: 12 },
  gameOverTitle: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 8 },
  gameOverScore: { fontSize: 48, fontWeight: '900', color: SUBJECT_COLORS.math.primary, marginBottom: 4 },
  gameOverHs: { fontSize: 14, color: C.textMid, marginBottom: 4 },
  gameOverNew: { fontSize: 16, fontWeight: '700', color: C.accent, marginBottom: 20 },
  gameOverBtns: { width: '100%', gap: 10 },
  advModeCard: { width: '100%', backgroundColor: C.card, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  advModeEmoji: { fontSize: 40, marginBottom: 8 },
  advModeTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 4 },
  advModeDesc: { fontSize: 13, color: C.textMid, textAlign: 'center', lineHeight: 20 },
});
