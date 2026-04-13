import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C } from '../lib/theme';

const TABS = [
  { key: 'home',     icon: '🏠', label: '主页' },
  { key: 'history',  icon: '📋', label: '记录' },
  { key: 'settings', icon: '⚙️', label: '设置' },
];

export default function TabBar({ active, onChange }) {
  return (
    <View style={st.bar}>
      {TABS.map((t) => {
        const on = active === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            style={st.tab}
            activeOpacity={0.7}
            onPress={() => onChange(t.key)}
          >
            <Text style={st.icon}>{t.icon}</Text>
            <Text style={[st.label, on && st.labelOn]}>{t.label}</Text>
            {on && <View style={st.dot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  bar: {
    flexDirection: 'row', backgroundColor: C.card, paddingBottom: 8, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  icon: { fontSize: 22 },
  label: { fontSize: 11, color: C.textLight, marginTop: 2 },
  labelOn: { color: C.primary, fontWeight: '700' },
  dot: {
    width: 5, height: 5, borderRadius: 3, backgroundColor: C.primary, marginTop: 3,
  },
});
