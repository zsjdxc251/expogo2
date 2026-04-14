import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C, SUBJECTS, RADIUS } from '../lib/theme';
import { ENG_TOPICS, ENG_LEVELS, LEVEL_TOPIC_KEYS } from '../lib/english';
import { CHN_LEVELS, LEVEL_TOPIC_KEYS as CHN_LEVEL_KEYS, CHN_TOPICS } from '../lib/chinese';
import { getLevel, nextLevel, ACH_DEFS } from '../lib/points';
import { useApp } from '../lib/AppContext';
import DailyTaskBar from '../components/DailyTaskBar';

const MATH_SUBJECTS = ['mulForward', 'mulBlank', 'add', 'subtract', 'divide', 'divRem', 'divReverse'];

const SUBJECT_TABS = [
  { key: 'math', icon: '📐', label: '数学' },
  { key: 'english', icon: '📖', label: '英语' },
  { key: 'chinese', icon: '📝', label: '语文' },
];

function calcSubjectProgress(history, subject) {
  const recs = history.filter((h) => h.subject === subject);
  if (recs.length === 0) return 0;
  const avgAcc = recs.reduce((s, h) => s + (h.accuracy || 0), 0) / recs.length;
  return Math.round(avgAcc);
}

function calcLevelProgress(history, topicKeys, prefix) {
  if (!topicKeys || topicKeys.length === 0) return 0;
  let total = 0;
  let count = 0;
  topicKeys.forEach((k) => {
    const sub = prefix ? `${prefix}${k}` : k;
    const recs = history.filter((h) => h.subject === sub);
    if (recs.length > 0) {
      count++;
      total += recs.reduce((s, h) => s + (h.accuracy || 0), 0) / recs.length;
    }
  });
  if (count === 0) return 0;
  return Math.round(total / topicKeys.length);
}

export default function HomeScreen() {
  const { user, streak, achievements, history, dailyTasks, saveQuizRoute } = useApp();
  const nav = useNavigation();
  const go = useCallback((name, params) => {
    saveQuizRoute(name, params);
    nav.navigate(name, params);
  }, [nav, saveQuizRoute]);
  const onSubject = useCallback((s) => go('Quiz', { subject: s }), [go]);
  const onEngLearn = useCallback((k) => nav.navigate('EngLearn', { topicKey: k }), [nav]);
  const onEngPractice = useCallback((k) => go('EngQuiz', { topicKey: k }), [go]);
  const onChnLearn = useCallback((k) => nav.navigate('ChnLearn', { topicKey: k }), [nav]);
  const onChnPractice = useCallback((k) => go('ChnQuiz', { topicKey: k }), [go]);
  const onSpeedChallenge = useCallback(() => go('Speed', {}), [go]);
  const onDictation = useCallback((m) => go('Dictation', { mode: m }), [go]);
  const lv = getLevel(user.totalPoints);
  const nxt = nextLevel(user.totalPoints);
  const pct = nxt ? Math.round(((user.totalPoints - lv.min) / (nxt.min - lv.min)) * 100) : 100;
  const [activeTab, setActiveTab] = useState('math');
  const [openLevel, setOpenLevel] = useState('beginner');
  const [openChnLevel, setOpenChnLevel] = useState('pinyin');
  const toggleLevel = (k) => setOpenLevel(openLevel === k ? null : k);
  const toggleChnLevel = (k) => setOpenChnLevel(openChnLevel === k ? null : k);

  return (
    <ScrollView style={st.root} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      {/* Header Bar */}
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

      {/* User greeting */}
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

      {/* Daily Tasks */}
      <DailyTaskBar tasks={dailyTasks} />

      {/* Subject Switcher */}
      <View style={st.tabRow}>
        {SUBJECT_TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[st.tabBtn, activeTab === t.key && st.tabBtnOn]}
            activeOpacity={0.7}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[st.tabIcon, activeTab === t.key && st.tabIconOn]}>{t.icon}</Text>
            <Text style={[st.tabLabel, activeTab === t.key && st.tabLabelOn]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Math Content ── */}
      {activeTab === 'math' && (
        <>
          <View style={st.secRow}>
            <Text style={st.secTitle}>数学练习</Text>
            <View style={st.secRight}>
              <Text style={st.crownIcon}>👑</Text>
              <Text style={st.secScore}>{MATH_SUBJECTS.length} 科</Text>
            </View>
          </View>
          <View style={st.grid}>
            {MATH_SUBJECTS.map((key) => {
              const sub = SUBJECTS[key];
              const prog = calcSubjectProgress(history || [], key);
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
                      <View style={[st.cardProgressFill, { width: `${prog}%`, backgroundColor: sub.color }]} />
                    </View>
                    <Text style={st.crownSmall}>{prog > 0 ? `${prog}%` : '👑'}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {onSpeedChallenge && (
              <TouchableOpacity style={st.card} activeOpacity={0.7} onPress={onSpeedChallenge}>
                <Text style={st.cardIcon}>⚡</Text>
                <Text style={st.cardTitle}>口算竞速</Text>
                <Text style={st.cardDesc}>60秒挑战</Text>
                <View style={st.cardProgressWrap}>
                  <View style={st.cardProgress}>
                    <View style={[st.cardProgressFill, { width: '0%', backgroundColor: '#EB9F4A' }]} />
                  </View>
                  <Text style={st.crownSmall}>🏆</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      {/* ── English Content ── */}
      {activeTab === 'english' && (
        <>
          <View style={st.secRow}>
            <Text style={st.secTitle}>英语学习</Text>
            <View style={st.secRight}>
              <Text style={st.crownIcon}>👑</Text>
              <Text style={st.secScore}>{(history || []).filter((h) => h.subject && !h.subject.startsWith('chn_') && !MATH_SUBJECTS.includes(h.subject)).length} 次练习</Text>
            </View>
          </View>
          {ENG_LEVELS.map((lvl) => {
            const isOpen = openLevel === lvl.key;
            const topicKeys = LEVEL_TOPIC_KEYS[lvl.key] || [];
            const engProg = calcLevelProgress(history || [], topicKeys, '');
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
                    <View style={[st.levelProgressFill, { width: `${engProg}%`, backgroundColor: lvl.color }]} />
                  </View>
                  <Text style={st.crownSmall}>{engProg > 0 ? `${engProg}%` : '👑'}</Text>
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
                    {onDictation && (
                      <TouchableOpacity
                        style={st.engCard}
                        activeOpacity={0.7}
                        onPress={() => onDictation('eng')}
                      >
                        <Text style={st.engCardIcon}>🎧</Text>
                        <Text style={st.engCardLabel}>听写模式</Text>
                        <Text style={st.engCardDesc}>听发音选拼写</Text>
                        <View style={[st.engBtn, { backgroundColor: C.primary, marginTop: 8 }]}>
                          <Text style={st.engBtnTxtW}>🎧 开始听写</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </>
      )}

      {/* ── Chinese Content ── */}
      {activeTab === 'chinese' && (
        <>
          <View style={st.secRow}>
            <Text style={st.secTitle}>语文学习</Text>
            <View style={st.secRight}>
              <Text style={st.crownIcon}>👑</Text>
              <Text style={st.secScore}>{(history || []).filter((h) => h.subject && h.subject.startsWith('chn_')).length} 次练习</Text>
            </View>
          </View>
          {CHN_LEVELS.map((lvl) => {
            const isOpen = openChnLevel === lvl.key;
            const topicKeys = CHN_LEVEL_KEYS[lvl.key] || [];
            const chnProg = calcLevelProgress(history || [], topicKeys, 'chn_');
            return (
              <View key={lvl.key} style={st.levelBlock}>
                <TouchableOpacity
                  style={st.levelHeader}
                  activeOpacity={0.7}
                  onPress={() => toggleChnLevel(lvl.key)}
                >
                  <Text style={st.levelEmoji}>{lvl.badge}</Text>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={st.levelTitle}>{lvl.label}</Text>
                    <Text style={st.levelDesc}>{lvl.desc} · {topicKeys.length} 主题</Text>
                  </View>
                  <View style={st.levelProgress}>
                    <View style={[st.levelProgressFill, { width: `${chnProg}%`, backgroundColor: lvl.color }]} />
                  </View>
                  <Text style={st.crownSmall}>{chnProg > 0 ? `${chnProg}%` : '👑'}</Text>
                  <Text style={st.levelArrow}>{isOpen ? '▾' : '▸'}</Text>
                </TouchableOpacity>
                {isOpen && (
                  <View style={st.grid}>
                    {topicKeys.map((key) => {
                      const topic = CHN_TOPICS[key];
                      if (!topic) return null;
                      return (
                        <View key={key} style={st.engCard}>
                          <Text style={st.engCardIcon}>{topic.icon}</Text>
                          <Text style={st.engCardLabel}>{topic.label}</Text>
                          <Text style={st.engCardDesc}>{topic.desc}</Text>
                          <View style={st.engBtns}>
                            <TouchableOpacity
                              style={[st.engBtn, { backgroundColor: 'rgba(235,159,74,0.15)' }]}
                              activeOpacity={0.7}
                              onPress={() => onChnLearn(key)}
                            >
                              <Text style={[st.engBtnTxt, { color: C.accent }]}>📖 学习</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[st.engBtn, { backgroundColor: C.accent }]}
                              activeOpacity={0.7}
                              onPress={() => onChnPractice(key)}
                            >
                              <Text style={st.engBtnTxtW}>✏️ 练习</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                    {onDictation && (
                      <TouchableOpacity
                        style={st.engCard}
                        activeOpacity={0.7}
                        onPress={() => onDictation('chn')}
                      >
                        <Text style={st.engCardIcon}>🎧</Text>
                        <Text style={st.engCardLabel}>听写模式</Text>
                        <Text style={st.engCardDesc}>听拼音选汉字</Text>
                        <View style={[st.engBtn, { backgroundColor: C.accent, marginTop: 8 }]}>
                          <Text style={st.engBtnTxtW}>🎧 开始听写</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </>
      )}

      {/* Achievements */}
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

  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: C.headerBg, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 16,
  },
  headerItem: { flexDirection: 'row', alignItems: 'center' },
  headerEmoji: { fontSize: 22, marginRight: 4 },
  headerValOrange: { fontSize: 20, fontWeight: '700', color: C.accent },
  headerValTeal: { fontSize: 20, fontWeight: '700', color: C.primary },

  userRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8 },
  avatar: { fontSize: 42 },
  greeting: { fontSize: 20, fontWeight: '700', color: C.text },
  levelBadge: {
    alignSelf: 'flex-start', backgroundColor: C.accentBg,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginTop: 4,
  },
  levelBadgeTxt: { fontSize: 12, fontWeight: '700', color: C.accent },

  xpWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  xpLabel: { fontSize: 11, color: C.textLight, marginRight: 8 },
  xpBar: { flex: 1, height: 8, borderRadius: 30, backgroundColor: 'rgba(196,196,196,0.4)', overflow: 'hidden' },
  xpFill: { height: 8, borderRadius: 30, backgroundColor: C.gold },
  xpRemain: { fontSize: 11, color: C.textLight, marginLeft: 8 },

  // Subject switcher tabs
  tabRow: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 16,
    backgroundColor: C.card, borderRadius: RADIUS, padding: 4,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: RADIUS - 4,
  },
  tabBtnOn: { backgroundColor: C.primary },
  tabIcon: { fontSize: 18, marginRight: 4, opacity: 0.6 },
  tabIconOn: { opacity: 1 },
  tabLabel: { fontSize: 15, fontWeight: '600', color: C.textMid },
  tabLabelOn: { color: '#fff', fontWeight: '700' },

  secRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 12, marginTop: 4,
  },
  secTitle: { fontSize: 22, fontWeight: '700', color: C.text },
  secRight: { flexDirection: 'row', alignItems: 'center' },
  crownIcon: { fontSize: 20, marginRight: 4 },
  secScore: { fontSize: 16, color: C.textMid },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 20,
  },

  card: {
    width: '48%', backgroundColor: C.card, borderRadius: RADIUS,
    padding: 16, marginBottom: 12, minHeight: 150, justifyContent: 'space-between',
  },
  cardIcon: { fontSize: 36, marginBottom: 6 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  cardDesc: { fontSize: 12, color: C.textMid, marginTop: 2 },
  cardProgressWrap: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  cardProgress: { flex: 1, height: 8, borderRadius: 30, backgroundColor: 'rgba(196,196,196,0.5)', overflow: 'hidden' },
  cardProgressFill: { height: 8, borderRadius: 30 },
  crownSmall: { fontSize: 14, marginLeft: 4 },

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

  engCard: {
    width: '48%', backgroundColor: C.card, borderRadius: RADIUS,
    padding: 14, marginBottom: 12, minHeight: 150, justifyContent: 'space-between',
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
