import { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Speech from 'expo-speech';
import { useNavigation, useRoute } from '@react-navigation/native';
import { C, RADIUS, SUBJECT_COLORS } from '../lib/theme';
import { HANZI_UNITS, getUnitChars } from '../lib/hanziData';
import { useApp } from '../lib/AppContext';
import ExitConfirmModal from '../components/ExitConfirmModal';

const sc = SUBJECT_COLORS.chinese;

const MODES = [
  { key: 'animate', label: '看笔顺', desc: '观看笔顺动画' },
  { key: 'trace', label: '描红', desc: '跟着描写' },
  { key: 'quiz', label: '默写', desc: '凭记忆写' },
];

function buildHtml(char, mode) {
  const showOutline = mode !== 'quiz';
  const showCharacter = mode === 'animate';
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{display:flex;flex-direction:column;align-items:center;justify-content:center;
       height:100vh;background:#FBF5F2;overflow:hidden;font-family:sans-serif}
  #writer{position:relative}
  #msg{margin-top:16px;font-size:18px;font-weight:700;color:#338F9B;min-height:28px;text-align:center}
  .outline-box{border:2px dashed rgba(0,0,0,0.12);border-radius:12px;padding:8px}
</style>
<script src="https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js"></script>
</head>
<body>
<div class="outline-box">
  <div id="writer"></div>
</div>
<div id="msg"></div>
<script>
var msg = document.getElementById('msg');
var mode = '${mode}';
var writer = HanziWriter.create('writer', '${char}', {
  width: 260, height: 260,
  padding: 10,
  showOutline: ${showOutline},
  showCharacter: ${showCharacter},
  strokeAnimationSpeed: 1,
  delayBetweenStrokes: 200,
  strokeColor: '#333',
  outlineColor: '#DDD',
  highlightColor: '#338F9B',
  drawingColor: '#338F9B',
  showHintAfterMisses: mode === 'quiz' ? 3 : 2,
  highlightOnComplete: true,
  charDataLoader: function(char) {
    return fetch('https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/' + char + '.json')
      .then(function(r) { return r.json(); });
  }
});

function postMsg(type, data) {
  window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:type,data:data}));
}

if (mode === 'animate') {
  msg.textContent = '观看笔顺动画...';
  writer.animateCharacter({
    onComplete: function() {
      msg.textContent = '动画完成! 点击重播或切换描红';
      postMsg('animateDone', {});
    }
  });
} else if (mode === 'trace') {
  msg.textContent = '请跟着描写...';
  var strokesDone = 0;
  var totalStrokes = 0;
  writer.quiz({
    onMistake: function(data) {
      msg.textContent = '再试一次，跟着灰色线条描';
      postMsg('mistake', {strokeNum: data.strokeNum});
    },
    onCorrectStroke: function(data) {
      strokesDone = data.strokeNum + 1;
      totalStrokes = data.totalStrokes;
      msg.textContent = '第' + strokesDone + '/' + totalStrokes + '笔 ✓';
      postMsg('correctStroke', {strokeNum: data.strokeNum, total: data.totalStrokes});
    },
    onComplete: function(data) {
      msg.textContent = '描写完成! 错误' + data.totalMistakes + '次';
      postMsg('complete', {mistakes: data.totalMistakes});
    }
  });
} else {
  msg.textContent = '请凭记忆写出这个字';
  writer.quiz({
    onMistake: function(data) {
      msg.textContent = '不对哦，再想想笔顺';
      postMsg('mistake', {strokeNum: data.strokeNum});
    },
    onCorrectStroke: function(data) {
      msg.textContent = '对了! 继续...';
      postMsg('correctStroke', {strokeNum: data.strokeNum, total: data.totalStrokes});
    },
    onComplete: function(data) {
      var perf = data.totalMistakes === 0 ? '完美!' : ('错误' + data.totalMistakes + '次');
      msg.textContent = '默写完成! ' + perf;
      postMsg('complete', {mistakes: data.totalMistakes});
    }
  });
}

document.addEventListener('message', function(e) {
  try {
    var d = JSON.parse(e.data);
    if (d.action === 'replay') {
      if (mode === 'animate') {
        writer.animateCharacter();
      } else {
        writer.quiz();
      }
      msg.textContent = mode === 'animate' ? '观看笔顺动画...' : '请开始写...';
    }
  } catch(ex){}
});
</script>
</body>
</html>`;
}

// -- Setup Phase --

function SetupPhase({ onStart, onBack }) {
  const [unitIdx, setUnitIdx] = useState(0);
  const unit = HANZI_UNITS[unitIdx];

  return (
    <ScrollView style={st.setupScroll} contentContainerStyle={st.setupRoot} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={st.backBtn} onPress={onBack}>
        <Text style={st.backTxt}>← 返回</Text>
      </TouchableOpacity>
      <Text style={st.setupIcon}>✍️</Text>
      <Text style={st.setupTitle}>看拼音写字</Text>
      <Text style={st.setupDesc}>学笔顺 → 描红 → 默写</Text>

      <View style={st.setupCard}>
        <Text style={st.setupLabel}>选择字组</Text>
        {HANZI_UNITS.map((u, i) => (
          <TouchableOpacity
            key={u.key}
            style={[st.unitBtn, unitIdx === i && { backgroundColor: sc.primary, borderColor: sc.primary }]}
            onPress={() => setUnitIdx(i)}
          >
            <Text style={st.unitIcon}>{u.icon}</Text>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[st.unitLabel, unitIdx === i && { color: '#fff' }]}>{u.label}</Text>
              <Text style={[st.unitDesc, unitIdx === i && { color: 'rgba(255,255,255,0.8)' }]}>{u.desc}</Text>
            </View>
            <Text style={[st.unitCount, unitIdx === i && { color: '#fff' }]}>{u.chars.length}字</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={st.goBtn} activeOpacity={0.8} onPress={() => onStart(unit.key)}>
        <Text style={st.goBtnTxt}>开始练习</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// -- Practice Phase --

function PracticePhase({ unitKey, onFinish, onBack }) {
  const chars = getUnitChars(unitKey);
  const [charIdx, setCharIdx] = useState(0);
  const [modeIdx, setModeIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [showDone, setShowDone] = useState(false);
  const [webKey, setWebKey] = useState(0);
  const webRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const char = chars[charIdx];
  const mode = MODES[modeIdx];
  const total = chars.length;
  const pct = Math.round((charIdx / total) * 100);

  const speak = useCallback(() => {
    if (char) Speech.speak(char.char, { language: 'zh-CN', rate: 0.8 });
  }, [char]);

  useEffect(() => { speak(); }, [charIdx, speak]);

  const onMessage = useCallback((e) => {
    try {
      const { type, data } = JSON.parse(e.nativeEvent.data);
      if (type === 'complete') {
        setResults((prev) => [
          ...prev.filter((r) => !(r.char === char.char && r.mode === mode.key)),
          { char: char.char, mode: mode.key, mistakes: data.mistakes },
        ]);
      }
    } catch {}
  }, [char, mode]);

  const replay = useCallback(() => {
    webRef.current?.postMessage(JSON.stringify({ action: 'replay' }));
  }, []);

  const animateTo = useCallback((fn) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      fn();
      setWebKey((k) => k + 1);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  const nextMode = useCallback(() => {
    if (modeIdx < MODES.length - 1) {
      animateTo(() => setModeIdx((i) => i + 1));
    } else if (charIdx < total - 1) {
      animateTo(() => { setCharIdx((i) => i + 1); setModeIdx(0); });
    } else {
      setShowDone(true);
    }
  }, [modeIdx, charIdx, total, animateTo]);

  const prevMode = useCallback(() => {
    if (modeIdx > 0) {
      animateTo(() => setModeIdx((i) => i - 1));
    } else if (charIdx > 0) {
      animateTo(() => { setCharIdx((i) => i - 1); setModeIdx(MODES.length - 1); });
    }
  }, [modeIdx, charIdx, animateTo]);

  if (showDone) {
    const perfectCount = results.filter((r) => r.mode === 'quiz' && r.mistakes === 0).length;
    return (
      <View style={st.doneRoot}>
        <Text style={st.doneEmoji}>🎉</Text>
        <Text style={st.doneTxt}>练习完成!</Text>
        <Text style={st.doneSub}>共练习 {total} 个字</Text>
        {perfectCount > 0 && (
          <Text style={st.donePerfect}>其中 {perfectCount} 个字默写零失误!</Text>
        )}
        <TouchableOpacity style={st.goBtn} onPress={() => onFinish(results)}>
          <Text style={st.goBtnTxt}>完成</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={st.practiceRoot}>
      {/* Header */}
      <View style={st.pHeader}>
        <TouchableOpacity onPress={onBack}><Text style={st.backTxt}>←</Text></TouchableOpacity>
        <Text style={st.pHeaderTitle}>第 {charIdx + 1}/{total} 字</Text>
        <View style={st.pBadge}><Text style={st.pBadgeTxt}>{mode.label}</Text></View>
      </View>
      <View style={st.bar}><View style={[st.barFill, { width: `${pct}%` }]} /></View>

      {/* Pinyin + Meaning */}
      <View style={st.infoRow}>
        <TouchableOpacity style={st.speakBtn} onPress={speak}>
          <Text style={st.speakTxt}>🔊</Text>
        </TouchableOpacity>
        <View style={st.infoCenter}>
          <Text style={st.pinyinTxt}>{char.pinyin}</Text>
          <Text style={st.meaningTxt}>{char.meaning}</Text>
        </View>
        <View style={st.modeSteps}>
          {MODES.map((m, i) => (
            <View key={m.key} style={[st.modeStep, i <= modeIdx && st.modeStepActive]}>
              <Text style={[st.modeStepTxt, i <= modeIdx && st.modeStepTxtActive]}>
                {i + 1}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* WebView */}
      <Animated.View style={[st.webWrap, { opacity: fadeAnim }]}>
        <WebView
          ref={webRef}
          key={`${char.char}-${mode.key}-${webKey}`}
          source={{ html: buildHtml(char.char, mode.key) }}
          style={st.web}
          scrollEnabled={false}
          bounces={false}
          onMessage={onMessage}
          javaScriptEnabled
          originWhitelist={['*']}
        />
      </Animated.View>

      {/* Mode description */}
      <Text style={st.modeDesc}>{mode.desc}</Text>

      {/* Nav buttons */}
      <View style={st.navRow}>
        <TouchableOpacity
          style={[st.navBtn, (charIdx === 0 && modeIdx === 0) && st.navBtnOff]}
          onPress={prevMode}
          disabled={charIdx === 0 && modeIdx === 0}
        >
          <Text style={[st.navBtnTxt, (charIdx === 0 && modeIdx === 0) && st.navBtnTxtOff]}>← 上一步</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.replayBtn} onPress={replay}>
          <Text style={st.replayTxt}>🔄 重做</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.navBtn, st.navBtnNext]} onPress={nextMode}>
          <Text style={st.navBtnTxtW}>
            {modeIdx === MODES.length - 1 && charIdx === total - 1 ? '完成 →' : '下一步 →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// -- Main export --

export default function HanziWriteScreen() {
  const route = useRoute();
  const nav = useNavigation();
  const { recordLearning } = useApp();
  const directBack = useCallback(() => nav.goBack(), [nav]);
  const [phase, setPhase] = useState('setup');
  const [unitKey, setUnitKey] = useState(null);
  const [showExit, setShowExit] = useState(false);
  const inPractice = phase === 'practice';
  const onBack = useCallback(() => { if (inPractice) setShowExit(true); else nav.goBack(); }, [inPractice, nav]);

  useEffect(() => {
    if (!inPractice) return;
    const unsub = nav.addListener('beforeRemove', (e) => {
      if (showExit) return;
      e.preventDefault();
      setShowExit(true);
    });
    return unsub;
  }, [nav, inPractice, showExit]);

  const startPractice = useCallback((key) => {
    setUnitKey(key);
    setPhase('practice');
  }, []);

  const handleFinish = useCallback(() => {
    recordLearning('chn_hanziWrite');
    nav.goBack();
  }, [recordLearning, nav]);

  if (phase === 'setup') {
    return <SetupPhase onStart={startPractice} onBack={onBack} />;
  }

  return (
    <>
      <PracticePhase unitKey={unitKey} onFinish={handleFinish} onBack={onBack} />
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
  setupTitle: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 4 },
  setupDesc: { fontSize: 15, color: C.textMid, marginBottom: 20 },
  setupCard: { width: '100%', backgroundColor: C.card, borderRadius: 20, padding: 20 },
  setupLabel: { fontSize: 15, fontWeight: '600', color: C.textMid, marginBottom: 12, textAlign: 'center' },
  unitBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg, borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 2, borderColor: C.border,
  },
  unitIcon: { fontSize: 24 },
  unitLabel: { fontSize: 15, fontWeight: '700', color: C.text },
  unitDesc: { fontSize: 11, color: C.textMid, marginTop: 1 },
  unitCount: { fontSize: 13, fontWeight: '700', color: sc.primary },
  goBtn: {
    marginTop: 24, width: '100%', height: 54, borderRadius: 16,
    backgroundColor: sc.primary, alignItems: 'center', justifyContent: 'center',
  },
  goBtnTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },

  practiceRoot: { flex: 1, backgroundColor: C.bg },
  pHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6,
  },
  pHeaderTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  pBadge: { backgroundColor: sc.bg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  pBadgeTxt: { fontSize: 13, fontWeight: '700', color: sc.primary },
  bar: { height: 6, backgroundColor: 'rgba(196,196,196,0.4)', marginHorizontal: 16, borderRadius: 30, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 30, backgroundColor: sc.primary },

  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  speakBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: sc.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  speakTxt: { fontSize: 22 },
  infoCenter: { alignItems: 'center', flex: 1 },
  pinyinTxt: { fontSize: 32, fontWeight: '800', color: sc.primary },
  meaningTxt: { fontSize: 14, color: C.textMid, marginTop: 2 },
  modeSteps: { flexDirection: 'row' },
  modeStep: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center', marginLeft: 4,
  },
  modeStepActive: { backgroundColor: sc.primary },
  modeStepTxt: { fontSize: 12, fontWeight: '700', color: C.textMid },
  modeStepTxtActive: { color: '#fff' },

  webWrap: { flex: 1, marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: '#FBF5F2' },
  web: { flex: 1, backgroundColor: 'transparent' },

  modeDesc: { fontSize: 13, color: C.textMid, textAlign: 'center', paddingVertical: 8 },

  navRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12,
  },
  navBtn: {
    flex: 1, height: 48, borderRadius: 14, backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center', marginHorizontal: 3,
  },
  navBtnOff: { opacity: 0.4 },
  navBtnNext: { backgroundColor: sc.primary },
  navBtnTxt: { fontSize: 14, fontWeight: '700', color: C.text },
  navBtnTxtOff: { color: C.textLight },
  navBtnTxtW: { fontSize: 14, fontWeight: '700', color: '#fff' },
  replayBtn: {
    height: 48, borderRadius: 14, backgroundColor: C.bg, borderWidth: 1.5, borderColor: sc.primary,
    paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', marginHorizontal: 3,
  },
  replayTxt: { fontSize: 14, fontWeight: '700', color: sc.primary },

  doneRoot: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  doneEmoji: { fontSize: 56, marginBottom: 10 },
  doneTxt: { fontSize: 24, fontWeight: '800', color: C.success, marginBottom: 4 },
  doneSub: { fontSize: 16, color: C.textMid, marginBottom: 4 },
  donePerfect: { fontSize: 15, fontWeight: '700', color: sc.primary, marginBottom: 20 },
});
