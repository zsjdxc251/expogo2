import { useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C, SUBJECTS, RADIUS, SUBJECT_COLORS } from '../lib/theme';
import { ENG_TOPICS, ENG_LEVELS, LEVEL_TOPIC_KEYS } from '../lib/english';
import { CHN_LEVELS, LEVEL_TOPIC_KEYS as CHN_LEVEL_KEYS, CHN_TOPICS } from '../lib/chinese';
import { getLevel, nextLevel, ACH_DEFS } from '../lib/points';
import { getCompletedCount } from '../lib/dailyTasks';
import { useApp } from '../lib/AppContext';
import PressableCard from '../components/PressableCard';
import ProgressRing from '../components/ProgressRing';
import Badge from '../components/Badge';

const MATH_SUBJECTS = ['mulForward', 'mulBlank', 'add', 'subtract', 'divide', 'divRem', 'divReverse', 'addTwo', 'subtractTwo', 'mulReverse', 'compare', 'wordProblem', 'pattern'];

const SUBJECT_TABS = [
  { key: 'math', icon: '📐', label: '数学' },
  { key: 'english', icon: '📖', label: '英语' },
  { key: 'chinese', icon: '📝', label: '语文' },
];

function calcOverallProgress(history, subjects, prefix) {
  let total = 0, count = 0;
  subjects.forEach((k) => {
    const sub = prefix ? `${prefix}${k}` : k;
    const recs = (history || []).filter((h) => h.subject === sub);
    if (recs.length > 0) {
      count++;
      total += recs.reduce((s, h) => s + (h.accuracy || 0), 0) / recs.length;
    }
  });
  if (count === 0) return 0;
  return Math.round(total / subjects.length);
}

function calcSubjectProgress(history, subject) {
  const recs = (history || []).filter((h) => h.subject === subject);
  if (recs.length === 0) return 0;
  return Math.round(recs.reduce((s, h) => s + (h.accuracy || 0), 0) / recs.length);
}

function calcLevelProgress(history, topicKeys, prefix) {
  return calcOverallProgress(history, topicKeys, prefix);
}

function getWeakestTopic(history, subjects, prefix) {
  let worst = null, worstAcc = 101;
  subjects.forEach((k) => {
    const sub = prefix ? `${prefix}${k}` : k;
    const recs = (history || []).filter((h) => h.subject === sub);
    if (recs.length > 0) {
      const avg = recs.reduce((s, h) => s + (h.accuracy || 0), 0) / recs.length;
      if (avg < worstAcc) { worstAcc = avg; worst = k; }
    }
  });
  return worst;
}

export default function HomeScreen() {
  const { user, streak, achievements, history, dailyTasks, saveQuizRoute, visibility } = useApp();
  const vis = visibility || {};
  const nav = useNavigation();
  const scrollRef = useRef(null);
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

  const totalPts = user?.totalPoints || 0;
  const lv = getLevel(totalPts);
  const nxt = nextLevel(totalPts);
  const pct = nxt ? Math.round(((totalPts - lv.min) / (nxt.min - lv.min)) * 100) : 100;
  const visTabs = SUBJECT_TABS.filter((t) => vis[t.key] !== false);
  const [activeTab, setActiveTab] = useState(() => visTabs[0]?.key || 'math');
  const [openLevel, setOpenLevel] = useState('beginner');
  const [openChnLevel, setOpenChnLevel] = useState('pinyin');
  const visMath = MATH_SUBJECTS.filter((k) => vis[`math_${k}`] !== false);
  const [showTasks, setShowTasks] = useState(false);
  const [showAch, setShowAch] = useState(false);
  const toggleLevel = (k) => setOpenLevel(openLevel === k ? null : k);
  const toggleChnLevel = (k) => setOpenChnLevel(openChnLevel === k ? null : k);

  const sc = SUBJECT_COLORS[activeTab] || SUBJECT_COLORS.math;
  const taskDone = getCompletedCount(dailyTasks);

  const allEngTopics = Object.keys(ENG_TOPICS);
  const allChnTopics = Object.keys(CHN_TOPICS);
  const mathProg = calcOverallProgress(history, MATH_SUBJECTS, '');
  const engProg = calcOverallProgress(history, allEngTopics, '');
  const chnProg = calcOverallProgress(history, allChnTopics, 'chn_');

  const weakMath = getWeakestTopic(history, MATH_SUBJECTS, '');
  const weakEng = getWeakestTopic(history, allEngTopics, '');
  const weakChn = getWeakestTopic(history, allChnTopics, 'chn_');

  return (
    <ScrollView ref={scrollRef} style={st.root} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      {/* Compact Header */}
      <View style={st.header}>
        <View style={st.headerLeft}>
          <Text style={st.avatar}>{user?.avatar || '🧒'}</Text>
          <View style={st.headerInfo}>
            <Text style={st.name}>{user?.name || '同学'}</Text>
            <Badge text={`Lv.${lv.level} ${lv.title}`} color={sc.primary} icon="⭐" />
          </View>
        </View>
        <View style={st.headerRight}>
          <View style={st.statPill}>
            <Text style={st.statEmoji}>🔥</Text>
            <Text style={st.statVal}>{streak.count}</Text>
          </View>
          <View style={st.statPill}>
            <Text style={st.statEmoji}>💎</Text>
            <Text style={[st.statVal, { color: sc.primary }]}>{totalPts}</Text>
          </View>
        </View>
      </View>

      {/* XP bar */}
      {nxt && (
        <View style={st.xpWrap}>
          <View style={st.xpBar}>
            <View style={[st.xpFill, { width: `${pct}%`, backgroundColor: sc.primary }]} />
          </View>
          <Text style={st.xpTxt}>还需 {nxt.min - totalPts} XP 升级</Text>
        </View>
      )}

      {/* Daily task pill */}
      <TouchableOpacity style={[st.taskPill, { borderColor: sc.primary }]} activeOpacity={0.7} onPress={() => setShowTasks(true)}>
        <Text style={st.taskPillIcon}>📋</Text>
        <Text style={st.taskPillTxt}>今日任务</Text>
        <View style={[st.taskPillBadge, { backgroundColor: sc.primary }]}>
          <Text style={st.taskPillCount}>{taskDone}/{dailyTasks.length}</Text>
        </View>
        {taskDone === dailyTasks.length && dailyTasks.length > 0 && <Text style={st.taskPillDone}>✅</Text>}
      </TouchableOpacity>

      {/* Three big subject cards */}
      <View style={st.subjectRow}>
        {[
          { key: 'math', icon: '📐', label: '数学', prog: mathProg, sc: SUBJECT_COLORS.math },
          { key: 'english', icon: '📖', label: '英语', prog: engProg, sc: SUBJECT_COLORS.english },
          { key: 'chinese', icon: '📝', label: '语文', prog: chnProg, sc: SUBJECT_COLORS.chinese },
        ].filter((s) => vis[s.key] !== false).map((s) => (
          <PressableCard
            key={s.key}
            style={[st.subjectCard, { backgroundColor: s.sc.bg, borderColor: activeTab === s.key ? s.sc.primary : 'transparent' }]}
            onPress={() => setActiveTab(s.key)}
          >
            <ProgressRing size={56} strokeWidth={5} progress={s.prog} color={s.sc.primary}>
              <Text style={st.subjectRingTxt}>{s.prog}%</Text>
            </ProgressRing>
            <Text style={st.subjectIcon}>{s.icon}</Text>
            <Text style={[st.subjectLabel, { color: s.sc.dark }]}>{s.label}</Text>
          </PressableCard>
        ))}
      </View>

      {/* Subject tabs */}
      <View style={st.tabRow}>
        {visTabs.map((t) => {
          const tsc = SUBJECT_COLORS[t.key];
          const on = activeTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[st.tabBtn, on && { backgroundColor: tsc.primary }]}
              activeOpacity={0.7}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[st.tabIcon, on && st.tabIconOn]}>{t.icon}</Text>
              <Text style={[st.tabLabel, on && st.tabLabelOn]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Smart Quick Start */}
      {activeTab === 'math' && weakMath && vis[`math_${weakMath}`] !== false && (
        <TouchableOpacity style={[st.quickStart, { backgroundColor: sc.bg, borderLeftColor: sc.primary }]} onPress={() => onSubject(weakMath)}>
          <Text style={st.quickIcon}>🎯</Text>
          <View style={{ flex: 1 }}>
            <Text style={st.quickTitle}>推荐练习</Text>
            <Text style={st.quickDesc}>{SUBJECTS[weakMath]?.label} — 正确率最低，多练练</Text>
          </View>
          <Text style={[st.quickGo, { color: sc.primary }]}>GO →</Text>
        </TouchableOpacity>
      )}
      {activeTab === 'english' && weakEng && (
        <TouchableOpacity style={[st.quickStart, { backgroundColor: sc.bg, borderLeftColor: sc.primary }]} onPress={() => onEngPractice(weakEng)}>
          <Text style={st.quickIcon}>🎯</Text>
          <View style={{ flex: 1 }}>
            <Text style={st.quickTitle}>推荐练习</Text>
            <Text style={st.quickDesc}>{ENG_TOPICS[weakEng]?.label} — 需要加强</Text>
          </View>
          <Text style={[st.quickGo, { color: sc.primary }]}>GO →</Text>
        </TouchableOpacity>
      )}
      {activeTab === 'chinese' && weakChn && (
        <TouchableOpacity style={[st.quickStart, { backgroundColor: sc.bg, borderLeftColor: sc.primary }]} onPress={() => onChnPractice(weakChn)}>
          <Text style={st.quickIcon}>🎯</Text>
          <View style={{ flex: 1 }}>
            <Text style={st.quickTitle}>推荐练习</Text>
            <Text style={st.quickDesc}>{CHN_TOPICS[weakChn]?.label} — 需要加强</Text>
          </View>
          <Text style={[st.quickGo, { color: sc.primary }]}>GO →</Text>
        </TouchableOpacity>
      )}

      {/* Math content */}
      {activeTab === 'math' && (
        <>
          <Text style={[st.secTitle, { color: sc.dark }]}>数学练习</Text>
          <View style={st.grid}>
            {visMath.map((key) => {
              const sub = SUBJECTS[key];
              const prog = calcSubjectProgress(history, key);
              return (
                <PressableCard key={key} style={[st.card, { borderTopColor: sc.primary }]} onPress={() => onSubject(key)}>
                  <Text style={st.cardIcon}>{sub.icon}</Text>
                  <Text style={st.cardTitle}>{sub.label}</Text>
                  {sub.desc ? <Text style={st.cardDesc}>{sub.desc}</Text> : null}
                  <View style={st.cardBot}>
                    <View style={st.cardBar}><View style={[st.cardBarFill, { width: `${prog}%`, backgroundColor: sc.primary }]} /></View>
                    <Text style={[st.cardPct, { color: sc.primary }]}>{prog > 0 ? `${prog}%` : '—'}</Text>
                  </View>
                </PressableCard>
              );
            })}
            <PressableCard style={[st.card, { borderTopColor: '#EB9F4A' }]} onPress={onSpeedChallenge}>
              <Text style={st.cardIcon}>⚡</Text>
              <Text style={st.cardTitle}>口算竞速</Text>
              <Text style={st.cardDesc}>60秒挑战</Text>
              <View style={st.cardBot}>
                <Text style={{ fontSize: 12, color: C.textMid }}>🏆 挑战最高分</Text>
              </View>
            </PressableCard>
          </View>
        </>
      )}

      {/* English content */}
      {activeTab === 'english' && (
        <>
          <Text style={[st.secTitle, { color: sc.dark }]}>英语学习</Text>
          {ENG_LEVELS.map((lvl) => {
            const isOpen = openLevel === lvl.key;
            const topicKeys = LEVEL_TOPIC_KEYS[lvl.key] || [];
            const lProg = calcLevelProgress(history, topicKeys, '');
            return (
              <View key={lvl.key} style={st.levelBlock}>
                <TouchableOpacity style={[st.levelHeader, { borderLeftColor: sc.primary }]} activeOpacity={0.7} onPress={() => toggleLevel(lvl.key)}>
                  <Text style={st.levelEmoji}>{lvl.badge}</Text>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={st.levelTitle}>{lvl.label}</Text>
                    <Text style={st.levelDesc}>{topicKeys.length} 主题</Text>
                  </View>
                  <Badge text={lProg > 0 ? `${lProg}%` : '未开始'} color={sc.primary} />
                  <Text style={st.arrow}>{isOpen ? '▾' : '▸'}</Text>
                </TouchableOpacity>
                {isOpen && (
                  <View style={st.grid}>
                    {topicKeys.map((key) => {
                      const topic = ENG_TOPICS[key];
                      if (!topic) return null;
                      return (
                        <View key={key} style={[st.topicCard, { borderTopColor: sc.primary }]}>
                          <Text style={st.topicIcon}>{topic.icon}</Text>
                          <Text style={st.topicLabel}>{topic.label}</Text>
                          <Text style={st.topicDesc}>{topic.desc}</Text>
                          <View style={st.topicBtns}>
                            <TouchableOpacity style={[st.topicBtn, { backgroundColor: sc.bg }]} onPress={() => onEngLearn(key)}>
                              <Text style={[st.topicBtnTxt, { color: sc.primary }]}>📖 学习</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[st.topicBtn, { backgroundColor: sc.primary }]} onPress={() => onEngPractice(key)}>
                              <Text style={st.topicBtnTxtW}>✏️ 练习</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                    <PressableCard style={[st.topicCard, { borderTopColor: sc.primary }]} onPress={() => onDictation('eng')}>
                      <Text style={st.topicIcon}>🎧</Text>
                      <Text style={st.topicLabel}>听写模式</Text>
                      <Text style={st.topicDesc}>听发音选拼写</Text>
                      <TouchableOpacity style={[st.topicBtn, { backgroundColor: sc.primary, marginTop: 8, flex: 0 }]} onPress={() => onDictation('eng')}>
                        <Text style={st.topicBtnTxtW}>🎧 开始</Text>
                      </TouchableOpacity>
                    </PressableCard>
                  </View>
                )}
              </View>
            );
          })}
        </>
      )}

      {/* Chinese content */}
      {activeTab === 'chinese' && (
        <>
          <Text style={[st.secTitle, { color: sc.dark }]}>语文学习</Text>
          {CHN_LEVELS.map((lvl) => {
            const isOpen = openChnLevel === lvl.key;
            const topicKeys = CHN_LEVEL_KEYS[lvl.key] || [];
            const lProg = calcLevelProgress(history, topicKeys, 'chn_');
            return (
              <View key={lvl.key} style={st.levelBlock}>
                <TouchableOpacity style={[st.levelHeader, { borderLeftColor: sc.primary }]} activeOpacity={0.7} onPress={() => toggleChnLevel(lvl.key)}>
                  <Text style={st.levelEmoji}>{lvl.badge}</Text>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={st.levelTitle}>{lvl.label}</Text>
                    <Text style={st.levelDesc}>{topicKeys.length} 主题</Text>
                  </View>
                  <Badge text={lProg > 0 ? `${lProg}%` : '未开始'} color={sc.primary} />
                  <Text style={st.arrow}>{isOpen ? '▾' : '▸'}</Text>
                </TouchableOpacity>
                {isOpen && (
                  <View style={st.grid}>
                    {topicKeys.map((key) => {
                      const topic = CHN_TOPICS[key];
                      if (!topic) return null;
                      return (
                        <View key={key} style={[st.topicCard, { borderTopColor: sc.primary }]}>
                          <Text style={st.topicIcon}>{topic.icon}</Text>
                          <Text style={st.topicLabel}>{topic.label}</Text>
                          <Text style={st.topicDesc}>{topic.desc}</Text>
                          <View style={st.topicBtns}>
                            <TouchableOpacity style={[st.topicBtn, { backgroundColor: sc.bg }]} onPress={() => onChnLearn(key)}>
                              <Text style={[st.topicBtnTxt, { color: sc.primary }]}>📖 学习</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[st.topicBtn, { backgroundColor: sc.primary }]} onPress={() => onChnPractice(key)}>
                              <Text style={st.topicBtnTxtW}>✏️ 练习</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                    <PressableCard style={[st.topicCard, { borderTopColor: sc.primary }]} onPress={() => onDictation('chn')}>
                      <Text style={st.topicIcon}>🎧</Text>
                      <Text style={st.topicLabel}>听写模式</Text>
                      <Text style={st.topicDesc}>听拼音选汉字</Text>
                      <TouchableOpacity style={[st.topicBtn, { backgroundColor: sc.primary, marginTop: 8, flex: 0 }]} onPress={() => onDictation('chn')}>
                        <Text style={st.topicBtnTxtW}>🎧 开始</Text>
                      </TouchableOpacity>
                    </PressableCard>
                  </View>
                )}
              </View>
            );
          })}
        </>
      )}

      {/* Achievements collapsed */}
      <TouchableOpacity style={st.achHeader} onPress={() => setShowAch(!showAch)}>
        <Text style={st.achTitle}>🏆 成就</Text>
        <Badge text={`${Object.keys(achievements).length}/${ACH_DEFS.length}`} color={C.gold} />
        <Text style={st.arrow}>{showAch ? '▾' : '▸'}</Text>
      </TouchableOpacity>
      {showAch && (
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
      )}

      {/* Daily Task Modal */}
      <Modal visible={showTasks} transparent animationType="slide">
        <View style={st.modalOverlay}>
          <View style={st.modalSheet}>
            <View style={st.modalHandle} />
            <Text style={st.modalTitle}>📋 今日任务</Text>
            {taskDone === dailyTasks.length && dailyTasks.length > 0 && (
              <Text style={st.modalCelebrate}>今日任务全部完成! 🎉</Text>
            )}
            {dailyTasks.map((t) => (
              <View key={t.id} style={[st.taskItem, t.completed && st.taskItemDone]}>
                <Text style={st.taskItemIcon}>{t.completed ? '✅' : '⬜'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[st.taskItemText, t.completed && st.taskItemTextDone]}>{t.text}</Text>
                  <View style={st.taskBar}>
                    <View style={[st.taskBarFill, { width: `${t.target > 0 ? Math.min(100, (t.progress / t.target) * 100) : 0}%`, backgroundColor: sc.primary }]} />
                  </View>
                </View>
                <Text style={st.taskItemReward}>+20</Text>
              </View>
            ))}
            <TouchableOpacity style={[st.modalClose, { backgroundColor: sc.primary }]} onPress={() => setShowTasks(false)}>
              <Text style={st.modalCloseTxt}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 16 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { fontSize: 36 },
  headerInfo: { marginLeft: 10 },
  name: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  statPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, marginLeft: 6 },
  statEmoji: { fontSize: 14, marginRight: 3 },
  statVal: { fontSize: 14, fontWeight: '700', color: C.text },

  xpWrap: { paddingHorizontal: 20, marginTop: 4, marginBottom: 8 },
  xpBar: { height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  xpFill: { height: 6, borderRadius: 3 },
  xpTxt: { fontSize: 10, color: C.textLight, marginTop: 2, textAlign: 'right' },

  taskPill: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 12, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5, backgroundColor: C.cardWhite },
  taskPillIcon: { fontSize: 16, marginRight: 6 },
  taskPillTxt: { flex: 1, fontSize: 14, fontWeight: '600', color: C.text },
  taskPillBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  taskPillCount: { fontSize: 12, fontWeight: '700', color: '#fff' },
  taskPillDone: { fontSize: 16, marginLeft: 6 },

  subjectRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12 },
  subjectCard: { flex: 1, marginHorizontal: 4, alignItems: 'center', paddingVertical: 14, borderWidth: 2, backgroundColor: '#fff' },
  subjectRingTxt: { fontSize: 11, fontWeight: '700', color: C.text },
  subjectIcon: { fontSize: 22, marginTop: 6 },
  subjectLabel: { fontSize: 13, fontWeight: '700', marginTop: 2 },

  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 14, backgroundColor: C.card, borderRadius: RADIUS, padding: 3 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: RADIUS - 3 },
  tabIcon: { fontSize: 16, marginRight: 3, opacity: 0.6 },
  tabIconOn: { opacity: 1 },
  tabLabel: { fontSize: 14, fontWeight: '600', color: C.textMid },
  tabLabelOn: { color: '#fff', fontWeight: '700' },

  quickStart: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 14, padding: 12, borderRadius: 14, borderLeftWidth: 4 },
  quickIcon: { fontSize: 24, marginRight: 10 },
  quickTitle: { fontSize: 13, fontWeight: '700', color: C.text },
  quickDesc: { fontSize: 11, color: C.textMid, marginTop: 1 },
  quickGo: { fontSize: 14, fontWeight: '800' },

  secTitle: { fontSize: 20, fontWeight: '700', paddingHorizontal: 20, marginBottom: 10 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },

  card: { width: '48%', backgroundColor: C.cardWhite, borderTopWidth: 3, padding: 14, marginBottom: 10, minHeight: 120 },
  cardIcon: { fontSize: 30, marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  cardDesc: { fontSize: 11, color: C.textMid, marginTop: 1 },
  cardBot: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  cardBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  cardBarFill: { height: 6, borderRadius: 3 },
  cardPct: { fontSize: 11, fontWeight: '700', marginLeft: 6 },

  levelBlock: { marginBottom: 8, paddingHorizontal: 20 },
  levelHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardWhite, borderRadius: RADIUS, padding: 12, borderLeftWidth: 4 },
  levelEmoji: { fontSize: 24 },
  levelTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  levelDesc: { fontSize: 11, color: C.textMid, marginTop: 1 },
  arrow: { fontSize: 16, color: C.textMid, fontWeight: '600', marginLeft: 8 },

  topicCard: { width: '48%', backgroundColor: C.cardWhite, borderRadius: RADIUS, borderTopWidth: 3, padding: 12, marginBottom: 10, minHeight: 140, justifyContent: 'space-between' },
  topicIcon: { fontSize: 26, marginBottom: 4 },
  topicLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  topicDesc: { fontSize: 10, color: C.textMid, marginTop: 1, marginBottom: 8 },
  topicBtns: { flexDirection: 'row' },
  topicBtn: { flex: 1, paddingVertical: 6, borderRadius: 10, alignItems: 'center', marginHorizontal: 2 },
  topicBtnTxt: { fontSize: 11, fontWeight: '700' },
  topicBtnTxtW: { fontSize: 11, fontWeight: '700', color: '#fff' },

  achHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  achTitle: { fontSize: 18, fontWeight: '700', color: C.text, flex: 1 },
  achRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginBottom: 8 },
  achItem: { alignItems: 'center', width: 60, marginRight: 8, marginBottom: 8, padding: 6, borderRadius: 12, backgroundColor: C.cardWhite },
  achLocked: { opacity: 0.25 },
  achIcon: { fontSize: 22 },
  achName: { fontSize: 9, color: C.textMid, marginTop: 1, textAlign: 'center' },
  achNameLocked: { color: C.textLight },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, maxHeight: '70%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 12 },
  modalCelebrate: { fontSize: 16, fontWeight: '700', color: C.success, textAlign: 'center', marginBottom: 12 },
  taskItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardWhite, borderRadius: 14, padding: 12, marginBottom: 8 },
  taskItemDone: { opacity: 0.6 },
  taskItemIcon: { fontSize: 18, marginRight: 10 },
  taskItemText: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 4 },
  taskItemTextDone: { textDecorationLine: 'line-through', color: C.textMid },
  taskBar: { height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  taskBarFill: { height: 4, borderRadius: 2 },
  taskItemReward: { fontSize: 13, fontWeight: '700', color: C.gold, marginLeft: 8 },
  modalClose: { marginTop: 12, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  modalCloseTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
