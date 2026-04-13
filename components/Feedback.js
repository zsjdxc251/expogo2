import { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { C } from '../lib/theme';

export default function Feedback({ type, points, onDone }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!type) { anim.setValue(0); return; }
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1, duration: 700, useNativeDriver: true,
    }).start(() => onDone && onDone());
  }, [type]);

  if (!type) return null;

  const ok = type === 'correct';
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

  return (
    <Animated.View style={[st.overlay, { opacity }]} pointerEvents="none">
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
});
