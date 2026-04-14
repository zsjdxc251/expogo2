import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C, RADIUS } from '../lib/theme';

const TABS = [
  { key: 'home',     icon: '🏠', label: '主页' },
  { key: 'history',  icon: '📋', label: '记录' },
  { key: 'settings', icon: '🔒', label: '家长' },
];

export default function TabBar({ active, onChange }) {
  return (
    <View style={st.outer}>
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
              <Text style={[st.icon, on && st.iconOn]}>{t.icon}</Text>
              <Text style={[st.label, on && st.labelOn]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  outer: { paddingHorizontal: 20, paddingBottom: 6 },
  bar: {
    flexDirection: 'row', backgroundColor: C.navBg,
    paddingBottom: 10, paddingTop: 10,
    borderRadius: RADIUS,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  icon: { fontSize: 22, opacity: 0.6 },
  iconOn: { opacity: 1 },
  label: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontWeight: '500' },
  labelOn: { color: '#fff', fontWeight: '700' },
});
