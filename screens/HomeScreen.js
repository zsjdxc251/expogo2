import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { C, SUBJECTS, RADIUS } from '../lib/theme';
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
      {/* ── Figma-style Header Bar ── */}
      <View style={st.headerBar}>
        <View style={st.headerItem}>
          <Text style={st.headerEmoji}>🔥</Text>
          <Text style={st.headerValOrange}>{streak.count}</Text>
        </View>
        <View style={st.headerItem}>
          <Text style={st.headerEmoji}>💎</Text>
          <Text style={st.headerValTeal}>{user.totalPoints} XP</Text>
        </View>
        <View style={st.headerItem}>
          <Text style={st.headerEmoji}>❤️</Text>
          <Text style={st.headerValOrange}>∞</Text>
        </View>
      </View>

      {/* ── User greeting ── */}
      <View style={st.userRow}>
        <Text style={st.avatar}>{user.avatar}</Text>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={st.greeting}>你好, {user.name}!</Text>
          <View style={st.levelBadge}>
            <Text style={st.levelBadgeTxt}>⭐ Lv.{lv.level} {lv.title}</Text>
          </View>
        </View>
      </View>

      {nxt && (
        <View style={st.xpWrap}>
          <Text style={st.xpLabel}>距离 Lv.{nxt.level}</Text>
          <View style={st.xpBar}>
            <View style={[st.xpFill, { width: `${pct}%` }]} />
          </View>
          <Text style={st.xpRemain}>{nxt.min - user.totalPoints} 分</Text>
        </View>
      )}

      {/* ── Math Section ── */}
      <View style={st.secRow}>
        <Text style={st.secTitle}>📐 数学练习</Text>
        <View style={st.secRight}>
          <Text style={st.crownIcon}>👑</Text>
          <Text style={st.secScore}>{MATH_SUBJECTS.length} 科</Text>
        </View>
      </View>

      <View style={st.grid}>
        {MATH_SUBJECTS.map((key) => {
          const sub = SUBJECTS[key];
          return (
            <TouchableOpacity
              key={key}
              style={st.card}
              activeOpacity={0.7}
              onPress={() => onSubject(key)}
            >
              <Text style={st.cardIcon}>{sub.icon}</Text>
              <Text style={st.cardTitle}>{sub.label}</Text>
              {sub.desc ? <Text style={st.cardDesc}>{sub.desc}</Text> : null}
              <View style={st.cardProgressWrap}>
                <View style={st.cardProgress}>
                  <View style={[st.cardProgressFill, { width: '40%', backgroundColor: sub.color }]} />
                </View>
                <Text style={st.crownSmall}>👑</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── English Section - 3 Levels ── */}
      <View style={st.secRow}>
        <Text style={st.secTitle}>📚 英语学习</Text>
        <View style={st.secRight}>
          <Text style={st.crownIcon}>👑</Text>
          <Text style={st.secScore}>30 题</Text>
        </View>
      </View>

      {ENG_LEVELS.map((lvl) => {
        const isOpen = openLevel === lvl.key;
        const topicKeys = LEVEL_TOPIC_KEYS[lvl.key] || [];
        return (
          <View key={lvl.key} style={st.levelBlock}>
            <TouchableOpacity
              style={st.levelHeader}
              activeOpacity={0.7}
              onPress={() => toggleLevel(lvl.key)}
            >
              <Text style={st.levelEmoji}>{lvl.badge}</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={st.levelTitle}>{lvl.label}</Text>
                <Text style={st.levelDesc}>{lvl.desc} · {topicKeys.length} 主题</Text>
              </View>
              <View style={st.levelProgress}>
                <View style={[st.levelProgressFill, { width: '30%', backgroundColor: lvl.color }]} />
              </View>
              <Text style={st.crownSmall}>👑</Text>
              <Text style={st.levelArrow}>{isOpen ? '▾' : '▸'}</Text>
            </TouchableOpacity>

            {isOpen && (
              <View style={st.grid}>
                {topicKeys.map((key) => {
                  const topic = ENG_TOPICS[key];
                  if (!topic) return null;
                  return (
                    <View key={key} style={st.engCard}>
                      <Text style={st.engCardIcon}>{topic.icon}</Text>
                      <Text style={st.engCardLabel}>{topic.label}</Text>
                      <Text style={st.engCardDesc}>{topic.desc}</Text>
                      <View style={st.engBtns}>
                        <TouchableOpacity
                          style={[st.engBtn, { backgroundColor: 'rgba(51,143,155,0.15)' }]}
                          activeOpacity={0.7}
                          onPress={() => onEngLearn(key)}
                        >
                          <Text style={[st.engBtnTxt, { color: C.primary }]}>📖 学习</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[st.engBtn, { backgroundColor: C.primary }]}
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

      {/* ── Achievements ── */}
      <View style={st.secRow}>
        <Text style={st.secTitle}>🏆 成就</Text>
      </View>
      <View style={st.achRow}>
        {ACH_DEFS.map((a) => {
          const unlocked = !!achievements[a.id];
          return (
            <View key={a.id} style={[st.achItem, !unlocked && st.achLocked]}>
              <Text style={st.achIcon}>{a.icon}</Text>
              <Text style={[st.achName, !unlocked && st.achNameLocked]} numberOfLines={1}>{a.name}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 16 },

  // Figma-style header bar
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: C.headerBg, paddingVertical: 14, paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerItem: { flexDirection: 'row', alignItems: 'center' },
  headerEmoji: { fontSize: 22, marginRight: 4 },
  headerValOrange: { fontSize: 20, fontWeight: '700', color: C.accent },
  headerValTeal: { fontSize: 20, fontWeight: '700', color: C.primary },

  // User greeting
  userRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8 },
  avatar: { fontSize: 42 },
  greeting: { fontSize: 20, fontWeight: '700', color: C.text },
  levelBadge: {
    alignSelf: 'flex-start', backgroundColor: C.accentBg,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginTop: 4,
  },
  levelBadgeTxt: { fontSize: 12, fontWeight: '700', color: C.accent },

  // XP progress
  xpWrap: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20,
  },
  xpLabel: { fontSize: 11, color: C.textLight, marginRight: 8 },
  xpBar: {
    flex: 1, height: 8, borderRadius: 30, backgroundColor: 'rgba(196,196,196,0.4)',
    overflow: 'hidden',
  },
  xpFill: { height: 8, borderRadius: 30, backgroundColor: C.gold },
  xpRemain: { fontSize: 11, color: C.textLight, marginLeft: 8 },

  // Section header (Figma style)
  secRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 12, marginTop: 4,
  },
  secTitle: { fontSize: 24, fontWeight: '700', color: C.text },
  secRight: { flexDirection: 'row', alignItems: 'center' },
  crownIcon: { fontSize: 20, marginRight: 4 },
  secScore: { fontSize: 16, color: C.textMid },

  // 2-column grid
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 20,
  },

  // Math card (Figma translucent gray, tall)
  card: {
    width: '48%', backgroundColor: C.card, borderRadius: RADIUS,
    padding: 16, marginBottom: 12, minHeight: 160,
    justifyContent: 'space-between',
  },
  cardIcon: { fontSize: 36, marginBottom: 6 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  cardDesc: { fontSize: 13, color: C.textMid, marginTop: 2 },
  cardProgressWrap: {
    flexDirection: 'row', alignItems: 'center', marginTop: 12,
  },
  cardProgress: {
    flex: 1, height: 8, borderRadius: 30, backgroundColor: 'rgba(196,196,196,0.5)',
    overflow: 'hidden',
  },
  cardProgressFill: { height: 8, borderRadius: 30 },
  crownSmall: { fontSize: 14, marginLeft: 4 },

  // Level block
  levelBlock: { marginBottom: 10, paddingHorizontal: 20 },
  levelHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: RADIUS, padding: 14,
  },
  levelEmoji: { fontSize: 28 },
  levelTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  levelDesc: { fontSize: 12, color: C.textMid, marginTop: 2 },
  levelProgress: {
    width: 60, height: 8, borderRadius: 30, backgroundColor: 'rgba(196,196,196,0.5)',
    overflow: 'hidden', marginRight: 4,
  },
  levelProgressFill: { height: 8, borderRadius: 30 },
  levelArrow: { fontSize: 18, color: C.textMid, fontWeight: '600', marginLeft: 6 },

  // English topic card
  engCard: {
    width: '48%', backgroundColor: C.card, borderRadius: RADIUS,
    padding: 14, marginBottom: 12, minHeight: 160,
    justifyContent: 'space-between',
  },
  engCardIcon: { fontSize: 30, marginBottom: 4 },
  engCardLabel: { fontSize: 15, fontWeight: '700', color: C.text },
  engCardDesc: { fontSize: 11, color: C.textMid, marginTop: 2, marginBottom: 10 },
  engBtns: { flexDirection: 'row' },
  engBtn: {
    flex: 1, paddingVertical: 7, borderRadius: 12, alignItems: 'center',
    justifyContent: 'center', marginHorizontal: 2,
  },
  engBtnTxt: { fontSize: 12, fontWeight: '700' },
  engBtnTxtW: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Achievements
  achRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20 },
  achItem: {
    alignItems: 'center', width: 64, marginRight: 8, marginBottom: 8, padding: 8,
    borderRadius: 14, backgroundColor: C.card,
  },
  achLocked: { opacity: 0.3 },
  achIcon: { fontSize: 24 },
  achName: { fontSize: 10, color: C.textMid, marginTop: 2, textAlign: 'center' },
  achNameLocked: { color: C.textLight },
});
