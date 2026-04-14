import { useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { RADIUS, SHADOW } from '../lib/theme';

export default function PressableCard({ style, onPress, disabled, children }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, friction: 8 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
    >
      <Animated.View style={[st.card, style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

const st = StyleSheet.create({
  card: {
    borderRadius: RADIUS,
    padding: 16,
    ...SHADOW,
  },
});
