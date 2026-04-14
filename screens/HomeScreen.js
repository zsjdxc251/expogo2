import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { C, SHADOW, SUBJECTS } from '../lib/theme';
import { ENG_TOPICS, ENG_LEVELS, LEVEL_TOPIC_KEYS } from '../lib/english';
import { getLevel, nextLevel, ACH_DEFS } from '../lib/points';

const MATH_SUBJECTS = ['mulForward', 'mulBlank', 'add', 'subtract', 'divide', 'divRem'];

export default function HomeScreen({ user, streak, achievements, onSubject, onEngLearn, onEngPractice }) {
  const lv = getLevel(user.totalPoints);
  const nxt = nextLevel(user.totalPoints);
  const pct = nxt ? Math.round(((user.totalPoints - lv.min) / (nxt.min - lv.min)) * 100) : 100;

  const [openLevel, setOpenLevel] = useState('beginner');
  const toggleLevel = (k) => setOpenLevel(openLevel === k ? null : k);

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

      {/* Math section */}
      <View style={st.secHeader}>
        <Text style={st.secEmoji}>📐</Text>
        <Text style={st.secTitle}>数学练习</Text>
      </View>
      <View style={st.grid}>
        {MATH_SUBJECTS.map((key) => {
          const sub = SUBJECTS[key];
          return (
            <TouchableOpacity
              key={key}
              style={[st.mathCard, { borderLeftColor: sub.color, borderLeftWidth: 4 }]}
              activeOpacity={0.7}
              onPress={() => onSubject(key)}
            >
              <Text style={st.cardIcon}>{sub.icon}</Text>
              <Text style={st.cardLabel}>{sub.label}</Text>
              {sub.desc ? <Text style={st.cardDesc}>{sub.desc}</Text> : null}
              <Text style={[st.cardGo, { color: sub.color }]}>开始 →</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* English section - 3 levels */}
      <View style={st.secHeader}>
        <Text style={st.secEmoji}>📚</Text>
        <Text style={st.secTitle}>英语学习</Text>
      </View>

      {ENG_LEVELS.map((lvl) => {
        const isOpen = openLevel === lvl.key;
        const topicKeys = LEVEL_TOPIC_KEYS[lvl.key] || [];
        return (
          <View key={lvl.key} style={st.levelBlock}>
            <TouchableOpacity
              style={[st.levelHeader, { borderLeftColor: lvl.color, borderLeftWidth: 4 }]}
              activeOpacity={0.7}
              onPress={() => toggleLevel(lvl.key)}
            >
              <Text style={st.levelBadge}>{lvl.badge}</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={st.levelTitle}>{lvl.label}</Text>
                <Text style={st.levelDesc}>{lvl.desc} · {topicKeys.length} 个主题</Text>
              </View>
              <Text style={st.levelArrow}>{isOpen ? '▾' : '▸'}</Text>
            </TouchableOpacity>

            {isOpen && (
              <View style={st.engGrid}>
                {topicKeys.map((key) => {
                  const topic = ENG_TOPICS[key];
                  if (!topic) return null;
                  return (
                    <View key={key} style={[st.engCard, { borderTopColor: topic.color, borderTopWidth: 3 }]}>
                      <Text style={st.engIcon}>{topic.icon}</Text>
                      <Text style={st.engLabel}>{topic.label}</Text>
                      <Text style={st.engDesc}>{topic.desc}</Text>
                      <View style={st.engBtns}>
                        <TouchableOpacity
                          style={[st.engBtn, { backgroundColor: topic.bg }]}
                          activeOpacity={0.7}
                          onPress={() => onEngLearn(key)}
                        >
                          <Text style={[st.engBtnTxt, { color: topic.color }]}>📖 学习</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[st.engBtn, { backgroundColor: topic.color }]}
                          activeOpacity={0.7}
                          onPress={() => onEngPractice(key)}
                        >
                          <Text style={st.engBtnTxtW}>✏️ 练习</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      {/* Achievements */}
      <View style={[st.secHeader, { marginTop: 8 }]}>
        <Text style={st.secEmoji}>🏆</Text>
        <Text style={st.secTitle}>成就</Text>
      </View>
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
    backgroundColor: C.card, borderRadius: 22, padding: 18, marginBottom: 20, ...SHADOW,
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
  xpFill: { height: 6, borderRadius: 3, backgroundColor: C.gold },
  xpTxt: { fontSize: 10, color: C.textLight, marginTop: 2 },

  secHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  secEmoji: { fontSize: 20, marginRight: 6 },
  secTitle: { fontSize: 18, fontWeight: '700', color: C.text },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  mathCard: {
    width: '48%', backgroundColor: C.card, borderRadius: 20, padding: 16, marginBottom: 12,
    ...SHADOW, shadowOpacity: 0.05,
  },
  cardIcon: { fontSize: 32, marginBottom: 8 },
  cardLabel: { fontSize: 16, fontWeight: '700', color: C.text },
  cardDesc: { fontSize: 12, color: C.textMid, marginTop: 2 },
  cardGo: { fontSize: 13, fontWeight: '600', marginTop: 8 },

  levelBlock: { marginBottom: 14 },
  levelHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    ...SHADOW, shadowOpacity: 0.04,
  },
  levelBadge: { fontSize: 26 },
  levelTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  levelDesc: { fontSize: 12, color: C.textMid, marginTop: 2 },
  levelArrow: { fontSize: 18, color: C.textMid, fontWeight: '600' },

  engGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    marginTop: 10, paddingLeft: 4, paddingRight: 4,
  },
  engCard: {
    width: '48%', backgroundColor: C.card, borderRadius: 18, padding: 14, marginBottom: 12,
    ...SHADOW, shadowOpacity: 0.05,
  },
  engIcon: { fontSize: 28, marginBottom: 4 },
  engLabel: { fontSize: 15, fontWeight: '700', color: C.text },
  engDesc: { fontSize: 11, color: C.textMid, marginTop: 2, marginBottom: 10 },
  engBtns: { flexDirection: 'row' },
  engBtn: {
    flex: 1, paddingVertical: 7, borderRadius: 12, alignItems: 'center',
    justifyContent: 'center', marginHorizontal: 2,
  },
  engBtnTxt: { fontSize: 12, fontWeight: '700' },
  engBtnTxtW: { fontSize: 12, fontWeight: '700', color: '#fff' },

  achRow: { flexDirection: 'row', flexWrap: 'wrap' },
  achItem: {
    alignItems: 'center', width: 64, marginRight: 8, marginBottom: 8, padding: 6,
    borderRadius: 14, backgroundColor: C.card,
  },
  achLocked: { opacity: 0.3 },
  achIcon: { fontSize: 24 },
  achName: { fontSize: 10, color: C.textMid, marginTop: 2, textAlign: 'center' },
  achNameLocked: { color: C.textLight },
});
