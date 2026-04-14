import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { C, RADIUS } from '../lib/theme';
import { REWARD_PER_TASK } from '../lib/dailyTasks';

const TYPE_COLORS = {
  math: '#338F9B',
  eng: '#9B7EBD',
  chn: '#EB9F4A',
  speed: '#E06B6B',
  dictation: '#7BAE8E',
};

const TYPE_ICONS = {
  math: '📐',
  eng: '📖',
  chn: '📝',
  speed: '⚡',
  dictation: '🎧',
};

export default function DailyTaskBar({ tasks }) {
  if (!tasks || tasks.length === 0) return null;

  const done = tasks.filter((t) => t.completed).length;

  return (
    <View style={st.root}>
      <View style={st.header}>
        <Text style={st.title}>📋 每日任务</Text>
        <Text style={st.count}>{done}/{tasks.length} 完成</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.scroll}>
        {tasks.map((t) => {
          const color = TYPE_COLORS[t.type] || C.primary;
          const icon = TYPE_ICONS[t.type] || '📝';
          const pct = t.target > 0 ? Math.min(100, Math.round((t.progress / t.target) * 100)) : 0;
          return (
            <View
              key={t.id}
              style={[st.card, t.completed && st.cardDone]}
            >
              <View style={st.cardTop}>
                <Text style={st.cardIcon}>{t.completed ? '✅' : icon}</Text>
                <Text style={[st.cardReward, { color }]}>+{REWARD_PER_TASK}</Text>
              </View>
              <Text style={[st.cardText, t.completed && st.cardTextDone]} numberOfLines={2}>
                {t.text}
              </Text>
              <View style={st.progressBar}>
                <View style={[st.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
              </View>
              <Text style={st.progressTxt}>{t.progress}/{t.target}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { paddingTop: 4, paddingBottom: 8 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 8,
  },
  title: { fontSize: 15, fontWeight: '700', color: C.text },
  count: { fontSize: 13, fontWeight: '600', color: C.textMid },
  scroll: { paddingHorizontal: 16 },
  card: {
    width: 140, backgroundColor: C.card, borderRadius: RADIUS - 4,
    padding: 12, marginRight: 10,
  },
  cardDone: { backgroundColor: 'rgba(123,174,142,0.15)' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardIcon: { fontSize: 20 },
  cardReward: { fontSize: 12, fontWeight: '700' },
  cardText: { fontSize: 12, fontWeight: '600', color: C.text, marginBottom: 8, lineHeight: 18 },
  cardTextDone: { textDecorationLine: 'line-through', color: C.textMid },
  progressBar: { height: 4, borderRadius: 2, backgroundColor: 'rgba(196,196,196,0.5)', overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  progressTxt: { fontSize: 10, color: C.textLight, marginTop: 3, textAlign: 'right' },
});
