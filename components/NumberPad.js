import { useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { C, RADIUS } from '../lib/theme';

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', '⌫'],
];

function PadKey({ k, disabled, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const act = k === 'C' || k === '⌫';

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, friction: 8 }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  }, [scale]);

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.7}
      onPress={() => !disabled && onPress(k)}
      onPressIn={disabled ? undefined : handlePressIn}
      onPressOut={disabled ? undefined : handlePressOut}
    >
      <Animated.View style={[st.key, act && st.keyAct, disabled && st.keyOff, { transform: [{ scale }] }]}>
        {k === '⌫' ? (
          <MaterialIcons name="backspace" size={24} color={disabled ? C.textLight : C.textMid} />
        ) : (
          <Text style={[st.keyTxt, act && st.keyActTxt, disabled && st.keyOffTxt]}>
            {k === 'C' ? 'C' : k}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function NumberPad({ onPress, disabled }) {
  return (
    <View style={st.wrap}>
      {KEYS.map((row, ri) => (
        <View key={ri} style={st.row}>
          {row.map((k) => (
            <PadKey key={k} k={k} disabled={disabled} onPress={onPress} />
          ))}
        </View>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  key: {
    width: 90, height: 52, marginHorizontal: 4, borderRadius: RADIUS,
    backgroundColor: C.cardWhite, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  keyAct: { backgroundColor: C.surfaceContainerLow, borderColor: C.outlineVariant },
  keyOff: { opacity: 0.35 },
  keyTxt: { fontSize: 24, fontWeight: '700', color: C.text },
  keyActTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },
  keyOffTxt: {},
});
