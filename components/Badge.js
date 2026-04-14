import { View, Text, StyleSheet } from 'react-native';
import { C } from '../lib/theme';

export default function Badge({ text, color = C.primary, icon }) {
  return (
    <View style={[st.pill, { backgroundColor: color + '1A' }]}>
      {icon ? <Text style={st.icon}>{icon}</Text> : null}
      <Text style={[st.text, { color }]}>{text}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  icon: { fontSize: 12, marginRight: 4 },
  text: { fontSize: 12, fontWeight: '700' },
});
