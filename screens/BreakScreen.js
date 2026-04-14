import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { C, RADIUS } from '../lib/theme';

const EYE_STEPS = [
  { label: '👆 向上看', dx: 0, dy: -1 },
  { label: '👉 向右看', dx: 1, dy: 0 },
  { label: '👇 向下看', dx: 0, dy: 1 },
  { label: '👈 向左看', dx: -1, dy: 0 },
  { label: '🔭 看远处', dx: 0, dy: 0, scale: 0.3 },
  { label: '👁️ 看近处', dx: 0, dy: 0, scale: 1.5 },
  { label: '🔄 转圈看', dx: 0, dy: 0, rotate: true },
  { label: '😌 闭眼休息', dx: 0, dy: 0, close: true },
];

const STEP_DURATION = 8000;

export default function BreakScreen({ breakMinutes, onDone }) {
  const totalSec = breakMinutes * 60;
  const [remaining, setRemaining] = useState(totalSec);
  const [stepIdx, setStepIdx] = useState(0);
  const canClose = remaining <= 0;

  const dotX = useRef(new Animated.Value(0)).current;
  const dotY = useRef(new Animated.Value(0)).current;
  const dotScale = useRef(new Animated.Value(1)).current;
  const dotRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(t); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const animateStep = useCallback((step) => {
    dotX.stopAnimation();
    dotY.stopAnimation();
    dotScale.stopAnimation();
    dotRotate.stopAnimation();

    if (step.rotate) {
      dotX.setValue(0);
      dotY.setValue(0);
      dotScale.setValue(1);
      const radius = 80;
      const dur = STEP_DURATION;
      const frames = 60;
      const perFrame = dur / frames;
      let frame = 0;
      const interval = setInterval(() => {
        frame++;
        const angle = (frame / frames) * Math.PI * 2;
        dotX.setValue(Math.cos(angle) * radius);
        dotY.setValue(Math.sin(angle) * radius);
        if (frame >= frames) clearInterval(interval);
      }, perFrame);
      return () => clearInterval(interval);
    }

    if (step.close) {
      Animated.timing(dotScale, { toValue: 0.1, duration: 2000, useNativeDriver: true }).start();
      return;
    }

    if (step.scale) {
      dotX.setValue(0);
      dotY.setValue(0);
      Animated.sequence([
        Animated.timing(dotScale, { toValue: step.scale, duration: 3000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(dotScale, { toValue: 1, duration: 3000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ]).start();
      return;
    }

    const dist = 90;
    dotScale.setValue(1);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(dotX, { toValue: step.dx * dist, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.delay(2000),
        Animated.timing(dotX, { toValue: 0, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ]),
      Animated.sequence([
        Animated.timing(dotY, { toValue: step.dy * dist, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.delay(2000),
        Animated.timing(dotY, { toValue: 0, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ]),
    ]).start();
  }, [dotX, dotY, dotScale, dotRotate]);

  useEffect(() => {
    const step = EYE_STEPS[stepIdx % EYE_STEPS.length];
    const cleanup = animateStep(step);
    const t = setTimeout(() => {
      setStepIdx((i) => i + 1);
    }, STEP_DURATION);
    return () => { clearTimeout(t); if (cleanup) cleanup(); };
  }, [stepIdx, animateStep]);

  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const step = EYE_STEPS[stepIdx % EYE_STEPS.length];

  return (
    <View style={st.root}>
      <View style={st.topArea}>
        <Text style={st.mainTitle}>😌 休息一下</Text>
        <Text style={st.subTitle}>保护眼睛，跟着圆点做眼保健操</Text>
      </View>

      <View style={st.eyeArea}>
        <View style={st.eyeBox}>
          <Animated.View
            style={[
              st.dot,
              {
                transform: [
                  { translateX: dotX },
                  { translateY: dotY },
                  { scale: dotScale },
                ],
              },
            ]}
          />
          <View style={st.crossH} />
          <View style={st.crossV} />
        </View>
        <Text style={st.stepLabel}>{step.label}</Text>
        <Text style={st.stepHint}>眼睛跟着绿色圆点移动</Text>
      </View>

      <View style={st.bottomArea}>
        <View style={st.timerBox}>
          <Text style={st.timerLabel}>{canClose ? '休息完毕!' : '剩余时间'}</Text>
          <Text style={st.timerVal}>{fmtTime(remaining)}</Text>
        </View>

        {canClose ? (
          <TouchableOpacity style={st.doneBtn} activeOpacity={0.8} onPress={onDone}>
            <Text style={st.doneTxt}>继续学习 →</Text>
          </TouchableOpacity>
        ) : (
          <View style={st.lockBox}>
            <Text style={st.lockTxt}>🔒 休息期间不可关闭</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: {
    flex: 1, backgroundColor: '#E8F5E9',
    alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 40, paddingHorizontal: 24,
  },
  topArea: { alignItems: 'center' },
  mainTitle: { fontSize: 28, fontWeight: '800', color: '#2E7D32', marginBottom: 6 },
  subTitle: { fontSize: 14, color: '#4CAF50', textAlign: 'center' },

  eyeArea: { alignItems: 'center' },
  eyeBox: {
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: '#C8E6C9', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#A5D6A7',
  },
  dot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#4CAF50',
    position: 'absolute',
  },
  crossH: {
    position: 'absolute', width: 200, height: 1,
    backgroundColor: 'rgba(76,175,80,0.2)',
  },
  crossV: {
    position: 'absolute', width: 1, height: 200,
    backgroundColor: 'rgba(76,175,80,0.2)',
  },
  stepLabel: { fontSize: 22, fontWeight: '700', color: '#2E7D32', marginTop: 20 },
  stepHint: { fontSize: 13, color: '#66BB6A', marginTop: 4 },

  bottomArea: { alignItems: 'center', width: '100%' },
  timerBox: { alignItems: 'center', marginBottom: 20 },
  timerLabel: { fontSize: 14, color: '#66BB6A', fontWeight: '600' },
  timerVal: { fontSize: 42, fontWeight: '800', color: '#2E7D32', fontVariant: ['tabular-nums'] },

  doneBtn: {
    width: '100%', height: 54, borderRadius: RADIUS,
    backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center',
  },
  doneTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },

  lockBox: {
    paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: RADIUS, backgroundColor: 'rgba(76,175,80,0.15)',
  },
  lockTxt: { fontSize: 14, color: '#66BB6A', fontWeight: '600' },
});
