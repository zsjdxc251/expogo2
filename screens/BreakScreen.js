import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { C, RADIUS } from '../lib/theme';

const EYE_STEPS = [
  { label: '👆 向上看', story: '🐰 小兔子抬头看天空的白云～', dx: 0, dy: -1 },
  { label: '👉 向右看', story: '🐰 哇，右边有一只蝴蝶飞过！', dx: 1, dy: 0 },
  { label: '👇 向下看', story: '🐰 低头看看地上的小花朵～', dx: 0, dy: 1 },
  { label: '👈 向左看', story: '🐰 左边传来小鸟的歌声～', dx: -1, dy: 0 },
  { label: '🔭 看远处', story: '🐰 远处的山好美啊，眺望远方～', dx: 0, dy: 0, scale: 0.3 },
  { label: '👁️ 看近处', story: '🐰 近处有一颗亮晶晶的露珠！', dx: 0, dy: 0, scale: 1.5 },
  { label: '🔄 转圈看', story: '🐰 转个圈，看看四周的风景～', dx: 0, dy: 0, rotate: true },
  { label: '😌 闭眼休息', story: '🐰 闭上眼睛，听听风的声音...', dx: 0, dy: 0, close: true },
];

const STEP_DURATION = 8000;
const BREAK_REWARD = 10;

export default function BreakScreen({ breakMinutes, onDone }) {
  const totalSec = breakMinutes * 60;
  const [remaining, setRemaining] = useState(totalSec);
  const [stepIdx, setStepIdx] = useState(0);
  const canClose = remaining <= 0;

  const dotX = useRef(new Animated.Value(0)).current;
  const dotY = useRef(new Animated.Value(0)).current;
  const dotScale = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -8, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

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
  }, [dotX, dotY, dotScale]);

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
        <Animated.Text style={[st.rabbit, { transform: [{ translateY: bounceAnim }] }]}>
          🐰
        </Animated.Text>
        <Text style={st.mainTitle}>小兔子带你做眼操</Text>
        <Text style={st.subTitle}>跟着小兔子一起保护眼睛吧！</Text>
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
          >
            <Text style={st.dotEmoji}>🥕</Text>
          </Animated.View>
          <View style={st.crossH} />
          <View style={st.crossV} />
        </View>
        <Text style={st.stepLabel}>{step.label}</Text>
        <View style={st.storyBox}>
          <Text style={st.storyTxt}>{step.story}</Text>
        </View>
      </View>

      <View style={st.bottomArea}>
        <View style={st.timerBox}>
          <Text style={st.timerLabel}>{canClose ? '🎉 休息完毕！' : '剩余时间'}</Text>
          <Text style={st.timerVal}>{fmtTime(remaining)}</Text>
        </View>

        {canClose ? (
          <View>
            <View style={st.rewardBox}>
              <Text style={st.rewardTxt}>🪙 休息奖励 +{BREAK_REWARD} 积分</Text>
            </View>
            <TouchableOpacity style={st.doneBtn} activeOpacity={0.8} onPress={() => onDone(BREAK_REWARD)}>
              <Text style={st.doneTxt}>继续学习 →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={st.lockBox}>
            <Text style={st.lockTxt}>🔒 休息期间不可关闭</Text>
            <Text style={st.lockSub}>完成休息可获得 {BREAK_REWARD} 积分奖励哦！</Text>
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
  rabbit: { fontSize: 48, marginBottom: 4 },
  mainTitle: { fontSize: 24, fontWeight: '800', color: '#2E7D32', marginBottom: 4 },
  subTitle: { fontSize: 14, color: '#4CAF50', textAlign: 'center' },

  eyeArea: { alignItems: 'center' },
  eyeBox: {
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: '#C8E6C9', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#A5D6A7',
  },
  dot: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
    position: 'absolute',
  },
  dotEmoji: { fontSize: 28 },
  crossH: {
    position: 'absolute', width: 180, height: 1,
    backgroundColor: 'rgba(76,175,80,0.15)',
  },
  crossV: {
    position: 'absolute', width: 1, height: 180,
    backgroundColor: 'rgba(76,175,80,0.15)',
  },
  stepLabel: { fontSize: 20, fontWeight: '700', color: '#2E7D32', marginTop: 16 },
  storyBox: {
    marginTop: 8, backgroundColor: 'rgba(76,175,80,0.12)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 8,
  },
  storyTxt: { fontSize: 14, color: '#388E3C', textAlign: 'center', lineHeight: 22 },

  bottomArea: { alignItems: 'center', width: '100%' },
  timerBox: { alignItems: 'center', marginBottom: 16 },
  timerLabel: { fontSize: 15, color: '#66BB6A', fontWeight: '600' },
  timerVal: { fontSize: 42, fontWeight: '800', color: '#2E7D32', fontVariant: ['tabular-nums'] },

  rewardBox: {
    backgroundColor: 'rgba(235,159,74,0.15)', borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 8, marginBottom: 12, alignItems: 'center',
  },
  rewardTxt: { fontSize: 16, fontWeight: '700', color: '#EB9F4A' },

  doneBtn: {
    width: '100%', height: 54, borderRadius: RADIUS,
    backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center',
  },
  doneTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },

  lockBox: {
    paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: RADIUS, backgroundColor: 'rgba(76,175,80,0.15)', alignItems: 'center',
  },
  lockTxt: { fontSize: 14, color: '#66BB6A', fontWeight: '600' },
  lockSub: { fontSize: 12, color: '#81C784', marginTop: 4 },
});
