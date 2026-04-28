import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RADIUS } from '../lib/theme';

const rabbitImg = require('../assets/rabbit_eye_rest.png');

const GREEN = '#4CAF50';
const GREEN_BG = '#E8F5E9';
const GREEN_LIGHT = 'rgba(76,175,80,0.15)';
const GREEN_BORDER = 'rgba(76,175,80,0.20)';
const GREEN_DASH = 'rgba(76,175,80,0.40)';
const GREEN_10 = 'rgba(76,175,80,0.10)';
const TEXT_DARK = '#181c1d';
const TEXT_MID = '#3e494a';
const AMBER_BG = '#ffb05a';
const AMBER_TEXT = '#744300';

const EYE_STEPS = [
  { label: 'Step 1: Look up 👆', story: '小兔子抬头看天空的白云～', dx: 0, dy: -1 },
  { label: 'Step 2: Look right 👉', story: '哇，右边有一只蝴蝶飞过！', dx: 1, dy: 0 },
  { label: 'Step 3: Look down 👇', story: '低头看看地上的小花朵～', dx: 0, dy: 1 },
  { label: 'Step 4: Look left 👈', story: '左边传来小鸟的歌声～', dx: -1, dy: 0 },
  { label: 'Step 5: Look far 🔭', story: '远处的山好美啊，眺望远方～', dx: 0, dy: 0, scale: 0.3 },
  { label: 'Step 6: Look close 👁️', story: '近处有一颗亮晶晶的露珠！', dx: 0, dy: 0, scale: 1.5 },
  { label: 'Step 7: Circle 🔄', story: '转个圈，看看四周的风景～', dx: 0, dy: 0, rotate: true },
  { label: 'Step 8: Close eyes 😌', story: '闭上眼睛，听听风的声音...', dx: 0, dy: 0, close: true },
];

const STEP_DURATION = 8000;
const BREAK_REWARD = 10;

export default function BreakScreen({ breakMinutes, onDone, onParentUnlock }) {
  const totalSec = breakMinutes * 60;
  const [remaining, setRemaining] = useState(totalSec);
  const [stepIdx, setStepIdx] = useState(0);
  const canClose = remaining <= 0;

  const dotX = useRef(new Animated.Value(0)).current;
  const dotY = useRef(new Animated.Value(0)).current;
  const dotScale = useRef(new Animated.Value(1)).current;

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
      const radius = 70;
      const frames = 60;
      const perFrame = STEP_DURATION / frames;
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

    const dist = 80;
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
    const t = setTimeout(() => setStepIdx((i) => i + 1), STEP_DURATION);
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
      <View style={st.content}>
        {/* Header */}
        <View style={st.headerArea}>
          <Text style={st.mainTitle}>休息一下，保护眼睛！</Text>
          <Text style={st.subTitle}>跟着小兔子做眼保健操</Text>
        </View>

        {/* Eye Exercise Circle */}
        <View style={st.eyeCircle}>
          {/* Rabbit background image */}
          <Image source={rabbitImg} style={st.rabbitBg} resizeMode="cover" />

          {/* Carrot target */}
          <Animated.View
            style={[
              st.carrotTarget,
              {
                transform: [
                  { translateX: dotX },
                  { translateY: dotY },
                  { scale: dotScale },
                ],
              },
            ]}
          >
            <View style={st.carrotBubble}>
              <Text style={st.carrotEmoji}>🥕</Text>
            </View>
          </Animated.View>

          {/* Inner dashed circle */}
          <View style={st.innerDashed}>
            <MaterialIcons name="visibility" size={48} color={GREEN_DASH} />
          </View>
        </View>

        {/* Instruction Card */}
        <View style={st.instrCard}>
          <View style={st.instrBar} />
          <Text style={st.instrTitle}>{step.label}</Text>
          <Text style={st.instrDesc}>{step.story}</Text>
        </View>

        {/* Timer Pill */}
        <View style={st.timerPill}>
          <MaterialIcons name="timer" size={22} color={GREEN} />
          <Text style={st.timerTxt}>{fmtTime(remaining)}</Text>
        </View>

        {canClose && (
          <View style={st.finishArea}>
            <View style={st.rewardBox}>
              <MaterialIcons name="stars" size={20} color={AMBER_TEXT} />
              <Text style={st.rewardTxt}>休息奖励 +{BREAK_REWARD} 积分</Text>
            </View>
            <TouchableOpacity style={st.doneBtn} activeOpacity={0.8} onPress={() => onDone(BREAK_REWARD)}>
              <Text style={st.doneTxt}>继续学习</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Parent Unlock - fixed bottom */}
      {!canClose && onParentUnlock && (
        <TouchableOpacity style={st.unlockBtn} onPress={onParentUnlock} activeOpacity={0.7}>
          <MaterialIcons name="lock" size={20} color={TEXT_MID} />
          <Text style={st.unlockTxt}>家长解锁</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: GREEN_BG,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 80,
  },

  headerArea: { alignItems: 'center', marginBottom: 32 },
  mainTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: GREEN,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 52,
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: TEXT_MID,
    lineHeight: 28,
  },

  eyeCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: GREEN_BORDER,
    shadowColor: 'rgba(76,175,80,0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 6,
    marginBottom: 24,
    overflow: 'hidden',
  },
  rabbitBg: {
    position: 'absolute',
    width: 272,
    height: 272,
    borderRadius: 136,
    opacity: 0.35,
  },

  carrotTarget: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  carrotBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AMBER_BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  carrotEmoji: {
    fontSize: 24,
  },

  innerDashed: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: GREEN_DASH,
    alignItems: 'center',
    justifyContent: 'center',
  },

  instrCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: 'rgba(76,175,80,0.10)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 24,
    overflow: 'hidden',
  },
  instrBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: GREEN,
  },
  instrTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: TEXT_DARK,
    lineHeight: 36,
    marginBottom: 8,
    textAlign: 'center',
  },
  instrDesc: {
    fontSize: 18,
    fontWeight: '400',
    color: TEXT_MID,
    lineHeight: 28,
    textAlign: 'center',
  },

  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN_10,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
    marginBottom: 24,
  },
  timerTxt: {
    fontSize: 20,
    fontWeight: '600',
    color: GREEN,
    fontVariant: ['tabular-nums'],
  },

  finishArea: { width: '100%', maxWidth: 400, alignItems: 'center' },
  rewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,176,90,0.15)',
    borderRadius: RADIUS,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  rewardTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: AMBER_TEXT,
  },
  doneBtn: {
    width: '100%',
    height: 52,
    borderRadius: RADIUS,
    backgroundColor: GREEN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  doneTxt: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },

  unlockBtn: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e0e3e4',
    borderRadius: 999,
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 8,
    minHeight: 48,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  unlockTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_MID,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
