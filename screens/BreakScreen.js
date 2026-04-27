import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { C, RADIUS, SHADOW, SHADOW_SM } from '../lib/theme';

const EYE_STEPS = [
  { label: '向上看', icon: 'north', story: '小兔子抬头看天空的白云～', dx: 0, dy: -1 },
  { label: '向右看', icon: 'east', story: '哇，右边有一只蝴蝶飞过！', dx: 1, dy: 0 },
  { label: '向下看', icon: 'south', story: '低头看看地上的小花朵～', dx: 0, dy: 1 },
  { label: '向左看', icon: 'west', story: '左边传来小鸟的歌声～', dx: -1, dy: 0 },
  { label: '看远处', icon: 'landscape', story: '远处的山好美啊，眺望远方～', dx: 0, dy: 0, scale: 0.3 },
  { label: '看近处', icon: 'center-focus-strong', story: '近处有一颗亮晶晶的露珠！', dx: 0, dy: 0, scale: 1.5 },
  { label: '转圈看', icon: 'sync', story: '转个圈，看看四周的风景～', dx: 0, dy: 0, rotate: true },
  { label: '闭眼休息', icon: 'visibility-off', story: '闭上眼睛，听听风的声音...', dx: 0, dy: 0, close: true },
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
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -6, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
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

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: remaining / totalSec,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [remaining, totalSec]);

  const animateStep = useCallback((step) => {
    dotX.stopAnimation();
    dotY.stopAnimation();
    dotScale.stopAnimation();

    if (step.rotate) {
      dotX.setValue(0);
      dotY.setValue(0);
      dotScale.setValue(1);
      const radius = 70;
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
  const stepNum = (stepIdx % EYE_STEPS.length) + 1;

  return (
    <View style={st.root}>
      {/* Header */}
      <View style={st.headerArea}>
        <View style={st.iconRow}>
          <View style={st.iconCircle}>
            <MaterialIcons name="visibility" size={28} color={C.primary} />
          </View>
        </View>
        <Text style={st.mainTitle}>休息一下，保护眼睛！</Text>
        <Text style={st.subTitle}>跟着小兔子做眼保健操</Text>
      </View>

      {/* Eye Exercise Area */}
      <View style={st.eyeCard}>
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
            <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
              <MaterialIcons name="nutrition" size={32} color={C.primary} />
            </Animated.View>
          </Animated.View>
          <View style={st.crossH} />
          <View style={st.crossV} />
        </View>

        {/* Step Indicator */}
        <View style={st.stepRow}>
          <View style={st.stepBadge}>
            <Text style={st.stepBadgeTxt}>Step {stepNum}</Text>
          </View>
          <MaterialIcons name={step.icon} size={20} color={C.primary} style={{ marginLeft: 8 }} />
          <Text style={st.stepLabel}>{step.label}</Text>
        </View>

        <View style={st.storyBox}>
          <Text style={st.storyTxt}>{step.story}</Text>
        </View>
      </View>

      {/* Timer & Bottom */}
      <View style={st.bottomArea}>
        <View style={st.timerCard}>
          <View style={st.timerIconRow}>
            <MaterialIcons name="timer" size={20} color={C.primary} />
            <Text style={st.timerLabel}>{canClose ? '休息完毕！' : '剩余时间'}</Text>
          </View>
          <Text style={st.timerVal}>{fmtTime(remaining)}</Text>

          {/* Progress Bar */}
          <View style={st.progressTrack}>
            <Animated.View
              style={[
                st.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>

        {canClose ? (
          <View style={st.finishArea}>
            <View style={st.rewardBox}>
              <MaterialIcons name="stars" size={20} color={C.secondary} />
              <Text style={st.rewardTxt}>休息奖励 +{BREAK_REWARD} 积分</Text>
            </View>
            <TouchableOpacity style={st.doneBtn} activeOpacity={0.8} onPress={() => onDone(BREAK_REWARD)}>
              <Text style={st.doneTxt}>继续学习</Text>
              <MaterialIcons name="arrow-forward" size={20} color={C.onPrimary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={st.lockCard}>
            <View style={st.lockRow}>
              <MaterialIcons name="lock" size={18} color={C.textLight} />
              <Text style={st.lockTxt}>休息期间不可关闭</Text>
            </View>
            <Text style={st.lockSub}>完成休息可获得 {BREAK_REWARD} 积分奖励哦！</Text>
            {onParentUnlock && (
              <TouchableOpacity style={st.unlockBtn} onPress={onParentUnlock} activeOpacity={0.7}>
                <MaterialIcons name="lock-open" size={16} color={C.primary} />
                <Text style={st.unlockTxt}>家长解锁</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },

  headerArea: { alignItems: 'center', paddingTop: 8 },
  iconRow: { marginBottom: 12 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  subTitle: {
    fontSize: 14,
    color: C.textLight,
    textAlign: 'center',
  },

  eyeCard: {
    width: '100%',
    backgroundColor: C.cardWhite,
    borderRadius: RADIUS,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    ...SHADOW,
  },
  eyeBox: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: C.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,102,112,0.15)',
  },
  dot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  crossH: {
    position: 'absolute',
    width: 160,
    height: 1,
    backgroundColor: 'rgba(0,102,112,0.08)',
  },
  crossV: {
    position: 'absolute',
    width: 1,
    height: 160,
    backgroundColor: 'rgba(0,102,112,0.08)',
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  stepBadge: {
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  stepBadgeTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: C.onPrimary,
    letterSpacing: 0.3,
  },
  stepLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
    marginLeft: 6,
  },

  storyBox: {
    marginTop: 10,
    backgroundColor: C.primaryBg,
    borderRadius: RADIUS,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  storyTxt: {
    fontSize: 13,
    color: C.primary,
    textAlign: 'center',
    lineHeight: 20,
  },

  bottomArea: { alignItems: 'center', width: '100%' },

  timerCard: {
    width: '100%',
    backgroundColor: C.cardWhite,
    borderRadius: RADIUS,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    ...SHADOW_SM,
  },
  timerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timerLabel: {
    fontSize: 13,
    color: C.textLight,
    fontWeight: '600',
    marginLeft: 6,
  },
  timerVal: {
    fontSize: 40,
    fontWeight: '800',
    color: C.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: C.surfaceContainerHigh,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: C.primary,
  },

  finishArea: { width: '100%', alignItems: 'center' },
  rewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.secondaryBg,
    borderRadius: RADIUS,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
  },
  rewardTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: C.secondary,
    marginLeft: 8,
  },

  doneBtn: {
    width: '100%',
    height: 52,
    borderRadius: RADIUS,
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  doneTxt: {
    fontSize: 16,
    fontWeight: '700',
    color: C.onPrimary,
  },

  lockCard: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: RADIUS,
    backgroundColor: C.surfaceContainerLow,
    alignItems: 'center',
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  lockTxt: {
    fontSize: 14,
    color: C.textLight,
    fontWeight: '600',
    marginLeft: 6,
  },
  lockSub: {
    fontSize: 12,
    color: C.textLight,
    marginTop: 2,
  },
  unlockBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS,
    borderWidth: 1.5,
    borderColor: C.primary,
    gap: 6,
  },
  unlockTxt: {
    fontSize: 13,
    color: C.primary,
    fontWeight: '600',
  },
});
