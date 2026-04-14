import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C, RADIUS } from '../lib/theme';

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', '⌫'],
];

export default function NumberPad({ onPress, disabled }) {
  return (
    <View style={st.wrap}>
      {KEYS.map((row, ri) => (
        <View key={ri} style={st.row}>
          {row.map((k) => {
            const act = k === 'C' || k === '⌫';
            return (
              <TouchableOpacity
                key={k}
                activeOpacity={disabled ? 1 : 0.5}
                style={[st.key, act && st.keyAct, disabled && st.keyOff]}
                onPress={() => !disabled && onPress(k)}
              >
                <Text style={[st.keyTxt, act && st.keyActTxt, disabled && st.keyOffTxt]}>
                  {k === 'C' ? '清空' : k}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  key: {
    flex: 1, height: 52, marginHorizontal: 4, borderRadius: RADIUS,
    backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
  },
  keyAct: { backgroundColor: 'rgba(229,229,229,0.8)' },
  keyOff: { opacity: 0.35 },
  keyTxt: { fontSize: 22, fontWeight: '700', color: C.text },
  keyActTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },
  keyOffTxt: {},
});
