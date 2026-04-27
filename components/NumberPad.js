import { useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { C } from '../lib/theme';

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', '⌫'],
];

const TACTIC_SH = { shadowColor: '#D1D9DB', shadowOffset: { width: 0, height: 4 }, shadowRadius: 0, shadowOpacity: 1, elevation: 2 };
const TACTIC_CLEAR = { shadowColor: '#F7D1D1', shadowOffset: { width: 0, height: 4 }, shadowRadius: 0, shadowOpacity: 1, elevation: 2 };

function PadKey({ k, disabled, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const isClear = k === 'C';
  const isBack = k === '⌫';

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, friction: 8 }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  }, [scale]);

  const kStyle = isClear ? st.keyClear : isBack ? st.keyBack : st.keyNum;
  const tact = isClear ? TACTIC_CLEAR : TACTIC_SH;

  return (
    <TouchableOpacity
      style={st.keyWrap}
      activeOpacity={disabled ? 1 : 0.9}
      onPress={() => !disabled && onPress(k)}
      onPressIn={disabled ? undefined : handlePressIn}
      onPressOut={disabled ? undefined : handlePressOut}
    >
      <Animated.View style={[kStyle, tact, disabled && st.keyOff, { transform: [{ scale }] }]}>
        {k === '⌫' ? (
          <MaterialIcons name="backspace" size={32} color={disabled ? C.textLight : C.text} />
        ) : (
          <Text style={[st.keyNumTxt, isClear && st.keyClearTxt]}>
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
        <View key={ri} style={[st.row, ri === 3 && st.rowLast]}>
          {row.map((k) => (
            <PadKey key={k} k={k} disabled={disabled} onPress={onPress} />
          ))}
        </View>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { width: '100%', maxWidth: 448, alignSelf: 'center', marginBottom: 0 },
  row: { flexDirection: 'row', width: '100%', marginBottom: 12, gap: 12 },
  rowLast: { marginBottom: 0 },
  keyWrap: { flex: 1, minWidth: 0 },
  keyNum: {
    width: '100%',
    height: 64,
    borderRadius: 24,
    backgroundColor: '#EEF2F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyNumTxt: { fontSize: 24, lineHeight: 32, fontWeight: '600', color: C.text, fontVariant: ['tabular-nums'] },
  keyClear: {
    width: '100%',
    height: 64,
    borderRadius: 24,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyClearTxt: { fontSize: 24, lineHeight: 32, fontWeight: '600', color: '#E53935' },
  keyBack: {
    width: '100%',
    height: 64,
    borderRadius: 24,
    backgroundColor: '#EEF2F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyOff: { opacity: 0.35 },
});
