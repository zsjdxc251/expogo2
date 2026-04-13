import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { C, SHADOW, SUBJECTS } from '../lib/theme';
import { getLevel, nextLevel, ACH_DEFS } from '../lib/points';

const SUBJECT_LIST = ['multiply', 'add', 'subtract', 'divide', 'divRem'];

export default function HomeScreen({ user, streak, achievements, onSubject }) {
  const lv = getLevel(user.totalPoints);
  const nxt = nextLevel(user.totalPoints);
  const pct = nxt ? Math.round(((user.totalPoints - lv.min) / (nxt.min - lv.min)) * 100) : 100;

  return (
    <ScrollView style={st.root} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={st.header}>
        <View style={st.userRow}>
          <Text style={st.avatar}>{user.avatar}</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={st.greeting}>你好, {user.name}!</Text>
            <View style={st.badgeRow}>
              <View style={[st.badge, { backgroundColor: C.accentBg }]}>
                <Text style={st.badgeTxt}>⭐ Lv.{lv.level} {lv.title}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={st.statsRow}>
          <View style={st.statItem}>
            <Text style={st.statIcon}>🪙</Text>
            <Text style={st.statVal}>{user.totalPoints}</Text>
            <Text style={st.statLbl}>积分</Text>
          </View>
          <View style={st.statItem}>
            <Text style={st.statIcon}>🔥</Text>
            <Text style={st.statVal}>{streak.count}</Text>
            <Text style={st.statLbl}>连续天数</Text>
          </View>
          {nxt && (
            <View style={[st.statItem, { flex: 2 }]}>
              <Text style={st.statLbl}>距离 Lv.{nxt.level}</Text>
              <View style={st.xpBar}>
                <View style={[st.xpFill, { width: `${pct}%` }]} />
              </View>
              <Text style={st.xpTxt}>{nxt.min - user.totalPoints} 分</Text>
            </View>
          )}
        </View>
      </View>

      {/* Subjects */}
      <Text style={st.secTitle}>今天要挑战什么?</Text>
      <View style={st.grid}>
        {SUBJECT_LIST.map((key) => {
          const sub = SUBJECTS[key];
          return (
            <TouchableOpacity
              key={key}
              style={[st.card, { borderLeftColor: sub.color, borderLeftWidth: 4 }]}
              activeOpacity={0.7}
              onPress={() => onSubject(key)}
            >
              <Text style={st.cardIcon}>{sub.icon}</Text>
              <Text style={st.cardLabel}>{sub.label}</Text>
              <Text style={[st.cardGo, { color: sub.color }]}>开始 →</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Achievements */}
      <Text style={st.secTitle}>成就</Text>
      <View style={st.achRow}>
        {ACH_DEFS.map((a) => {
          const unlocked = !!achievements[a.id];
          return (
            <View key={a.id} style={[st.achItem, !unlocked && st.achLocked]}>
              <Text style={st.achIcon}>{a.icon}</Text>
              <Text style={[st.achName, !unlocked && st.achNameLocked]} numberOfLines={1}>
                {a.name}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 16 },

  header: {
    backgroundColor: C.card, borderRadius: 20, padding: 18, marginBottom: 20, ...SHADOW,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: { fontSize: 44 },
  greeting: { fontSize: 20, fontWeight: '700', color: C.text },
  badgeRow: { flexDirection: 'row', marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeTxt: { fontSize: 12, fontWeight: '700', color: C.accent },

  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statIcon: { fontSize: 20 },
  statVal: { fontSize: 20, fontWeight: '800', color: C.text, marginTop: 2 },
  statLbl: { fontSize: 11, color: C.textLight, marginTop: 1 },
  xpBar: {
    width: '90%', height: 6, borderRadius: 3, backgroundColor: C.border,
    marginTop: 4, overflow: 'hidden',
  },
  xpFill: { height: 6, borderRadius: 3, backgroundColor: C.accent },
  xpTxt: { fontSize: 10, color: C.textLight, marginTop: 2 },

  secTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 12 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  card: {
    width: '48%', backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12,
    ...SHADOW, shadowOpacity: 0.05,
  },
  cardIcon: { fontSize: 32, marginBottom: 8 },
  cardLabel: { fontSize: 16, fontWeight: '700', color: C.text },
  cardGo: { fontSize: 13, fontWeight: '600', marginTop: 8 },

  achRow: { flexDirection: 'row', flexWrap: 'wrap' },
  achItem: {
    alignItems: 'center', width: 64, marginRight: 8, marginBottom: 8, padding: 6,
    borderRadius: 12, backgroundColor: C.card,
  },
  achLocked: { opacity: 0.3 },
  achIcon: { fontSize: 24 },
  achName: { fontSize: 10, color: C.textMid, marginTop: 2, textAlign: 'center' },
  achNameLocked: { color: C.textLight },
});
