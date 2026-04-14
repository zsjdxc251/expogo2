import { View, StyleSheet } from 'react-native';
import { C } from '../lib/theme';

export default function ProgressRing({
  size = 80, strokeWidth = 8, progress = 0, color = C.primary, children,
}) {
  const radius = size / 2;
  const clamp = Math.min(100, Math.max(0, progress));
  const angle = (clamp / 100) * 360;

  const base = {
    width: size,
    height: size,
    borderRadius: radius,
    borderWidth: strokeWidth,
    borderColor: 'rgba(0,0,0,0.06)',
  };

  const half = {
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: radius,
    borderWidth: strokeWidth,
    borderColor: 'transparent',
  };

  const rightAngle = Math.min(angle, 180);
  const leftAngle = Math.max(0, angle - 180);

  return (
    <View style={[st.wrap, { width: size, height: size }]}>
      <View style={base} />
      {/* Right half (0-180 deg) */}
      <View style={[st.clipRight, { width: radius, height: size, left: radius }]}>
        <View
          style={[
            half,
            { borderTopColor: color, borderRightColor: color, left: -radius },
            { transform: [{ rotate: `${rightAngle}deg` }] },
          ]}
        />
      </View>
      {/* Left half (180-360 deg) */}
      {angle > 180 && (
        <View style={[st.clipLeft, { width: radius, height: size, left: 0 }]}>
          <View
            style={[
              half,
              { borderBottomColor: color, borderLeftColor: color },
              { transform: [{ rotate: `${leftAngle}deg` }] },
            ]}
          />
        </View>
      )}
      <View style={[st.center, { width: size - strokeWidth * 2, height: size - strokeWidth * 2, borderRadius: (size - strokeWidth * 2) / 2 }]}>
        {children}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  clipRight: { position: 'absolute', top: 0, overflow: 'hidden' },
  clipLeft: { position: 'absolute', top: 0, overflow: 'hidden' },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
