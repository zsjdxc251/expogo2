import { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { C } from '../lib/theme';
import { playCorrect, playWrong, playCombo } from '../lib/sounds';

const PARTICLE_COUNT = 8;

function comboTier(combo) {
  if (combo >= 10) return { label: '🌈 RAINBOW!', colors: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6'] };
  if (combo >= 5) return { label: '⚡ LIGHTNING!', colors: ['#FFD93D', '#FFB347', '#FF6B6B'] };
  if (combo >= 3) return { label: '🔥 FIRE!', colors: ['#FF6B6B', '#FF8E53', '#FFD93D'] };
  return null;
}

export default function Feedback({ type, points, combo, onDone }) {
  const anim = useRef(new Animated.Value(0)).current;

  const p0x = useRef(new Animated.Value(0)).current;
  const p0y = useRef(new Animated.Value(0)).current;
  const p0o = useRef(new Animated.Value(0)).current;
  const p1x = useRef(new Animated.Value(0)).current;
  const p1y = useRef(new Animated.Value(0)).current;
  const p1o = useRef(new Animated.Value(0)).current;
  const p2x = useRef(new Animated.Value(0)).current;
  const p2y = useRef(new Animated.Value(0)).current;
  const p2o = useRef(new Animated.Value(0)).current;
  const p3x = useRef(new Animated.Value(0)).current;
  const p3y = useRef(new Animated.Value(0)).current;
  const p3o = useRef(new Animated.Value(0)).current;
  const p4x = useRef(new Animated.Value(0)).current;
  const p4y = useRef(new Animated.Value(0)).current;
  const p4o = useRef(new Animated.Value(0)).current;
  const p5x = useRef(new Animated.Value(0)).current;
  const p5y = useRef(new Animated.Value(0)).current;
  const p5o = useRef(new Animated.Value(0)).current;
  const p6x = useRef(new Animated.Value(0)).current;
  const p6y = useRef(new Animated.Value(0)).current;
  const p6o = useRef(new Animated.Value(0)).current;
  const p7x = useRef(new Animated.Value(0)).current;
  const p7y = useRef(new Animated.Value(0)).current;
  const p7o = useRef(new Animated.Value(0)).current;

  const particles = [
    { x: p0x, y: p0y, o: p0o },
    { x: p1x, y: p1y, o: p1o },
    { x: p2x, y: p2y, o: p2o },
    { x: p3x, y: p3y, o: p3o },
    { x: p4x, y: p4y, o: p4o },
    { x: p5x, y: p5y, o: p5o },
    { x: p6x, y: p6y, o: p6o },
    { x: p7x, y: p7y, o: p7o },
  ];

  useEffect(() => {
    if (!type) { anim.setValue(0); return; }
    anim.setValue(0);

    if (type === 'correct') {
      playCorrect();
      if (combo >= 3) playCombo();
      particles.forEach((p) => {
        const angle = Math.random() * Math.PI * 2;
        const dist = 50 + Math.random() * 70;
        p.x.setValue(0);
        p.y.setValue(0);
        p.o.setValue(1);
        Animated.parallel([
          Animated.timing(p.x, { toValue: Math.cos(angle) * dist, duration: 600, useNativeDriver: true }),
          Animated.timing(p.y, { toValue: Math.sin(angle) * dist, duration: 600, useNativeDriver: true }),
          Animated.timing(p.o, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]).start();
      });
    } else {
      playWrong();
    }

    Animated.timing(anim, {
      toValue: 1, duration: 800, useNativeDriver: true,
    }).start(() => onDone && onDone());
  }, [type]);

  if (!type) return null;

  const ok = type === 'correct';
  const tier = ok ? comboTier(combo || 0) : null;
  const opacity = anim.interpolate({
    inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0],
  });
  const scale = ok
    ? anim.interpolate({ inputRange: [0, 0.25, 0.45, 1], outputRange: [0.3, 1.25, 1, 1] })
    : anim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.8, 1, 1] });
  const tx = ok ? 0 : anim.interpolate({
    inputRange:  [0,  0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 1],
    outputRange: [0, -14,  14,  -10, 10,  -5,  0,   0],
  });
  const ptY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -40] });
  const ptOp = anim.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0, 1, 1, 0] });

  const tierColors = tier ? tier.colors : ['#FFD93D'];

  return (
    <Animated.View style={[st.overlay, { opacity }]} pointerEvents="none">
      {ok && particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            st.particle,
            {
              backgroundColor: tierColors[i % tierColors.length],
              transform: [{ translateX: p.x }, { translateY: p.y }],
              opacity: p.o,
            },
          ]}
        />
      ))}
      <Animated.View
        style={[
          st.badge, ok ? st.okBg : st.errBg,
          { transform: [{ scale }, { translateX: tx }] },
        ]}
      >
        <Text style={st.sym}>{ok ? '✓' : '✗'}</Text>
      </Animated.View>
      {ok && points > 0 && (
        <Animated.Text
          style={[st.pts, { opacity: ptOp, transform: [{ translateY: ptY }] }]}
        >
          +{points}
        </Animated.Text>
      )}
      {tier && (
        <Animated.Text
          style={[st.tierLabel, { opacity: ptOp, transform: [{ translateY: ptY }] }]}
        >
          {tier.label}
        </Animated.Text>
      )}
    </Animated.View>
  );
}

const st = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center', zIndex: 50,
  },
  badge: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  okBg: { backgroundColor: C.success },
  errBg: { backgroundColor: C.error },
  sym: { fontSize: 40, color: '#fff', fontWeight: '800' },
  pts: { fontSize: 22, fontWeight: '800', color: C.accent, marginTop: 8 },
  tierLabel: { fontSize: 18, fontWeight: '800', color: C.accent, marginTop: 4 },
  particle: {
    position: 'absolute',
    width: 10, height: 10, borderRadius: 5,
  },
});
