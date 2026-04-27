import { useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { C, SUBJECTS, RADIUS, SUBJECT_COLORS, EMOJI_MAP, SHADOW, SHADOW_SM } from '../lib/theme';
import { ENG_TOPICS, ENG_LEVELS, LEVEL_TOPIC_KEYS } from '../lib/english';
import { CHN_LEVELS, LEVEL_TOPIC_KEYS as CHN_LEVEL_KEYS, CHN_TOPICS } from '../lib/chinese';
import { getLevel, nextLevel, ACH_DEFS } from '../lib/points';
import { getCompletedCount } from '../lib/dailyTasks';
import { useApp } from '../lib/AppContext';
import PressableCard from '../components/PressableCard';
import Badge from '../components/Badge';

// showTaskAlert is replaced by in-app modal (showLockModal state)

const MATH_SUBJECTS = ['mulForward', 'mulBlank', 'add', 'subtract', 'divide', 'divRem', 'divReverse', 'addTwo', 'subtractTwo', 'mulReverse', 'compare', 'wordProblem', 'pattern'];

const SUBJECT_TABS = [
  { key: 'math', materialIcon: 'square-foot', label: '数学' },
  { key: 'english', materialIcon: 'menu-book', label: '英语' },
  { key: 'chinese', materialIcon: 'draw', label: '语文' },
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

const HEADER_BORDER = '#E0F7FA';
const SQUISH_BOTTOM = '#d99c5c';

export default function HomeScreen() {
  const { user, streak, achievements, history, dailyTasks, saveQuizRoute, visibility, rewardConfig, allTasksDone, taskConfig } = useApp();
  const locked = taskConfig.enabled && !allTasksDone;
  const vis = visibility || {};
  const nav = useNavigation();
  const { width: winW } = useWindowDimensions();
  const scrollRef = useRef(null);
  const go = useCallback((name, params) => {
    saveQuizRoute(name, params);
    nav.navigate(name, params);
  }, [nav, saveQuizRoute]);
  const guard = useCallback((fn) => (...args) => {
    if (locked) { setShowLockModal(true); return; }
    fn(...args);
  }, [locked]);
  const onSubject = useCallback((s) => {
    if (locked) {
      const cfg = taskConfig.tasks || [];
      const isTaskSubject = cfg.some((t) => t.subject === s);
      if (!isTaskSubject) { setShowLockModal(true); return; }
    }
    go('Quiz', { subject: s });
  }, [go, locked, taskConfig]);
  const onEngLearn = useCallback(guard((k) => nav.navigate('EngLearn', { topicKey: k })), [guard, nav]);
  const onEngPractice = useCallback(guard((k) => go('EngQuiz', { topicKey: k })), [guard, go]);
  const onChnLearn = useCallback(guard((k) => nav.navigate('ChnLearn', { topicKey: k })), [guard, nav]);
  const onChnPractice = useCallback(guard((k) => go('ChnQuiz', { topicKey: k })), [guard, go]);
  const onSpeedChallenge = useCallback(guard(() => go('Speed', {})), [guard, go]);
  const onDictation = useCallback(guard((m) => go('Dictation', { mode: m })), [guard, go]);

  const totalPts = user?.totalPoints || 0;
  const lv = getLevel(totalPts);
  const nxt = nextLevel(totalPts);
  const pct = nxt ? Math.round(((totalPts - lv.min) / (nxt.min - lv.min)) * 100) : 100;
  const visTabs = SUBJECT_TABS.filter((t) => vis[t.key] !== false);
  const [activeTab, setActiveTab] = useState(() => visTabs[0]?.key || 'math');
  const [openLevel, setOpenLevel] = useState('beginner');
  const [openChnLevel, setOpenChnLevel] = useState('pinyin');
  const visMath = MATH_SUBJECTS.filter((k) => vis[`math_${k}`] !== false);
  const [tasksExpanded, setTasksExpanded] = useState(true);
  const [showAch, setShowAch] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const toggleLevel = (k) => setOpenLevel(openLevel === k ? null : k);
  const toggleChnLevel = (k) => setOpenChnLevel(openChnLevel === k ? null : k);

  const sc = SUBJECT_COLORS[activeTab] || SUBJECT_COLORS.math;
  const taskDone = getCompletedCount(dailyTasks);
  const mathColW = (winW - 20 * 2 - 16) / 2;

  const navigateTask = useCallback((task) => {
    if (task.completed) return;
    const t = task.tpl;
    if (MATH_SUBJECTS.includes(t)) {
      go('Quiz', { subject: t });
    } else if (t === 'math_all') go('Quiz', { subject: 'mulForward' });
    else if (t === 'math_add') go('Quiz', { subject: 'add' });
    else if (t === 'math_mul') go('Quiz', { subject: 'mulForward' });
    else if (t === 'math_div') go('Quiz', { subject: 'divide' });
    else if (t === 'eng_learn' || t === 'eng_quiz') {
      const keys = Object.keys(ENG_TOPICS);
      if (keys.length > 0) {
        if (t === 'eng_learn') nav.navigate('EngLearn', { topicKey: keys[0] });
        else go('EngQuiz', { topicKey: keys[0] });
      }
    } else if (t === 'chn_learn' || t === 'chn_quiz') {
      const keys = Object.keys(CHN_TOPICS);
      if (keys.length > 0) {
        if (t === 'chn_learn') nav.navigate('ChnLearn', { topicKey: keys[0] });
        else go('ChnQuiz', { topicKey: keys[0] });
      }
    } else if (t === 'speed') go('Speed', {});
    else if (t === 'dictation') go('Dictation', { mode: 'eng' });
  }, [go, nav]);

  const allEngTopics = Object.keys(ENG_TOPICS);
  const allChnTopics = Object.keys(CHN_TOPICS);
  const weakMath = getWeakestTopic(history, MATH_SUBJECTS, '');
  const weakEng = getWeakestTopic(history, allEngTopics, '');
  const weakChn = getWeakestTopic(history, allChnTopics, 'chn_');

  return (
    <ScrollView ref={scrollRef} style={st.root} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      {/* 1. Top app bar + XP card */}
      <View style={st.stickyAppBar}>
        <View style={st.appBarRow}>
          <View style={st.appBarAvatar}>
            <Text style={st.appBarAvatarText} numberOfLines={1}>{user?.avatar || '🧒'}</Text>
          </View>
          <Text style={st.appBarTitle}>学习乐园</Text>
        </View>
        {nxt && (
          <View style={st.xpCard}>
            <View style={st.xpBar}>
              <View style={[st.xpFill, { width: `${pct}%` }]} />
            </View>
            <View style={st.xpMetaRow}>
              <Text style={st.xpMetaText}>Level {lv.level}</Text>
              <Text style={st.xpMetaText}>还需 {nxt.min - totalPts} XP 升级</Text>
            </View>
          </View>
        )}
      </View>

      {/* 2. User identity */}
      <View style={st.userSection}>
        <Text style={st.greeting}>Hi, {user?.name || '小探险家'}! 👋</Text>
        <View style={st.pillRow}>
          <View style={st.pillStreak}>
            <Text style={st.pillStreakText}>🔥{streak.count} 天连胜</Text>
            {locked ? <MaterialIcons name="lock" size={14} color={C.textLight} style={st.pillLock} /> : null}
          </View>
          <View style={st.pillPoints}>
            <Text style={st.pillPointsText}>💎{totalPts} 积分</Text>
            {locked ? <MaterialIcons name="lock" size={14} color={C.onPrimaryContainer} style={st.pillLock} /> : null}
          </View>
        </View>
      </View>

      {/* 3. Daily task card */}
      {dailyTasks.length > 0 && (
        <View
          style={[
            st.dailyTaskCard,
            { borderColor: locked ? C.error : HEADER_BORDER, borderWidth: locked ? 2 : 1 },
            SHADOW_SM,
          ]}
        >
          {locked && (
            <View style={st.dailyTaskLockDeco} pointerEvents="none">
              <MaterialIcons name="lock" size={100} color={C.errorContainer} style={{ opacity: 0.5, transform: [{ rotate: '12deg' }] }} />
            </View>
          )}
          <TouchableOpacity
            style={st.dailyTaskHeader}
            activeOpacity={locked ? 1 : 0.7}
            onPress={() => { if (!locked) setTasksExpanded(!tasksExpanded); }}
          >
            <View style={st.dailyTaskTitleRow}>
              <MaterialIcons
                name={locked ? 'lock' : 'assignment'}
                size={24}
                color={locked ? C.error : C.primary}
              />
              <Text style={st.dailyTaskTitle}>每日挑战</Text>
            </View>
            <View
              style={[
                st.taskCountBadge,
                { backgroundColor: taskDone === dailyTasks.length && !locked ? C.success : (locked ? C.error : sc.primary) },
              ]}
            >
              <Text style={st.taskCountBadgeTxt}>{taskDone}/{dailyTasks.length}</Text>
            </View>
            {locked && <Text style={st.dailyTaskLockTag}>🔒 未完成</Text>}
            {!locked && (
              <MaterialIcons
                name={tasksExpanded ? 'expand-more' : 'chevron-right'}
                size={22}
                color={C.textMid}
                style={st.dailyTaskChevron}
              />
            )}
          </TouchableOpacity>
          {tasksExpanded && dailyTasks.map((t) => {
            const pctVal = t.target > 0 ? Math.min(100, Math.round((t.progress / t.target) * 100)) : 0;
            const barCol = t.completed
              ? C.success
              : (locked ? C.error : sc.primary);
            return (
              <TouchableOpacity
                key={t.id}
                style={[st.taskRow, t.completed && st.taskRowDone]}
                activeOpacity={t.completed ? 1 : 0.7}
                onPress={() => navigateTask(t)}
              >
                <Text style={st.taskRowIcon}>{t.completed ? '✅' : '⬜'}</Text>
                <View style={st.taskRowBody}>
                  <View style={st.taskRowTitleLine}>
                    <Text style={[st.taskRowLabel, t.completed && st.taskRowLabelDone]}>{t.text}</Text>
                    <Text style={[st.taskRowFrac, locked && !t.completed && { color: C.error }]}>
                      {t.progress}/{t.target}
                    </Text>
                  </View>
                  <View style={st.taskRowBar}>
                    <View style={[st.taskRowBarFill, { width: `${pctVal}%`, backgroundColor: barCol }]} />
                  </View>
                </View>
                {!t.completed && (
                  <View style={st.taskGoRow}>
                    <Text style={[st.taskGoBtn, { color: locked ? C.error : sc.primary }]}>GO</Text>
                    <MaterialIcons name="arrow-forward" size={18} color={locked ? C.error : sc.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
          {tasksExpanded && locked && <Text style={st.dailyTaskHint}>完成以上任务后解锁自由练习</Text>}
        </View>
      )}

      {/* 4. Subject tab pills (horizontal) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={st.tabScrollContent}
        style={st.tabScroll}
      >
        {visTabs.map((t) => {
          const on = activeTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[st.tabPill, on ? st.tabPillOn : st.tabPillOff]}
              activeOpacity={0.7}
              onPress={() => setActiveTab(t.key)}
            >
              <MaterialIcons
                name={t.materialIcon}
                size={14}
                color={on ? C.onPrimary : C.text}
                style={st.tabPillIcon}
              />
              <Text style={[st.tabPillLabel, on && st.tabPillLabelOn]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Math */}
      {activeTab === 'math' && (
        <>
          <Text style={[st.secTitle, { color: sc.dark }]}>数学练习</Text>
          <View style={st.mathGrid}>
            {visMath.map((key) => {
              const sub = SUBJECTS[key];
              const prog = calcSubjectProgress(history, key);
              return (
                <PressableCard
                  key={key}
                  style={[
                    st.mathGridCard,
                    { width: mathColW, borderRadius: 20 },
                    SHADOW_SM,
                  ]}
                  onPress={() => onSubject(key)}
                >
                  <View style={[st.mathIconRing, { backgroundColor: sub.iconBg || C.surfaceContainerLowest }]}>
                    <MaterialIcons name={sub.icon} size={22} color={sub.iconColor || C.primary} />
                  </View>
                  <Text style={st.mathCardTitle}>{sub.label}</Text>
                  {sub.desc ? <Text style={st.mathCardDesc}>{sub.desc}</Text> : null}
                  <View style={st.mathCardFooter}>
                    <View style={st.mathBar}>
                      <View
                        style={[
                          st.mathBarFill,
                          { width: `${prog}%`, backgroundColor: sub.barColor || C.primary },
                        ]}
                      />
                    </View>
                    <Text style={st.mathPct}>{prog > 0 ? `${prog}%` : '—'}</Text>
                  </View>
                </PressableCard>
              );
            })}
            {vis.math_speed !== false && (
              <PressableCard
                style={[{ width: mathColW, borderRadius: 20 }, st.mathGridCard, SHADOW_SM]}
                onPress={onSpeedChallenge}
              >
                <View style={[st.mathIconRing, { backgroundColor: '#E3F2FD' }]}>
                  <MaterialIcons name="bolt" size={22} color={C.tertiary} />
                </View>
                <Text style={st.mathCardTitle}>口算竞速</Text>
                <Text style={st.mathCardDesc}>60秒挑战</Text>
                <View style={st.mathCardFooter}>
                  <Text style={st.mathFootNote}>🏆 挑战最高分</Text>
                </View>
              </PressableCard>
            )}
            <PressableCard
              style={[{ width: mathColW, borderRadius: 20 }, st.mathGridCard, SHADOW_SM]}
              onPress={() => { if (locked) { setShowLockModal(true); return; } nav.navigate('Battle'); }}
            >
              <View style={[st.mathIconRing, { backgroundColor: C.errorContainer }]}>
                <MaterialIcons name="sports_martial_arts" size={22} color={C.error} />
              </View>
              <Text style={st.mathCardTitle}>比赛模式</Text>
              <Text style={st.mathCardDesc}>局域网对战</Text>
              <View style={st.mathCardFooter}>
                <Text style={st.mathFootNote}>🏅 看谁算得快</Text>
              </View>
            </PressableCard>
          </View>

          {weakMath && vis[`math_${weakMath}`] !== false && (
            <TouchableOpacity style={st.recoBlock} onPress={() => onSubject(weakMath)} activeOpacity={0.85}>
              <View style={st.recoBlockHeader}>
                <MaterialIcons name="star" size={20} color={C.secondaryFixed} />
                <Text style={st.recoBlockKicker}>推荐练习</Text>
              </View>
              <Text style={st.recoBlockTitle}>{SUBJECTS[weakMath]?.label} — 正确率最低，多练练</Text>
              <Text style={st.recoBlockDesc}>针对薄弱点巩固一下，进步更快</Text>
              <View style={st.recoBlockBtn}>
                <Text style={st.recoBlockBtnText}>开始练习</Text>
                <MaterialIcons name="play-arrow" size={20} color={C.onSecondaryFixed} />
              </View>
            </TouchableOpacity>
          )}
        </>
      )}

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
                  <View style={st.mathGrid}>
                    {topicKeys.map((key) => {
                      const topic = ENG_TOPICS[key];
                      if (!topic) return null;
                      return (
                        <View
                          key={key}
                          style={[
                            st.topicCardTile,
                            { width: mathColW, borderColor: C.surfaceVariant },
                            SHADOW_SM,
                          ]}
                        >
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
                    <PressableCard
                      style={[{ width: mathColW, borderRadius: 20, borderWidth: 1, borderColor: C.surfaceVariant }, SHADOW_SM]}
                      onPress={() => onDictation('eng')}
                    >
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
          {weakEng && (
            <TouchableOpacity style={st.recoBlock} onPress={() => onEngPractice(weakEng)} activeOpacity={0.85}>
              <View style={st.recoBlockHeader}>
                <MaterialIcons name="star" size={20} color={C.secondaryFixed} />
                <Text style={st.recoBlockKicker}>推荐练习</Text>
              </View>
              <Text style={st.recoBlockTitle}>{ENG_TOPICS[weakEng]?.label} — 需要加强</Text>
              <Text style={st.recoBlockDesc}>多练这一主题，提升英语正确率</Text>
              <View style={st.recoBlockBtn}>
                <Text style={st.recoBlockBtnText}>开始练习</Text>
                <MaterialIcons name="play-arrow" size={20} color={C.onSecondaryFixed} />
              </View>
            </TouchableOpacity>
          )}
        </>
      )}

      {activeTab === 'chinese' && (
        <>
          <Text style={[st.secTitle, { color: sc.dark }]}>二年级语文下册</Text>
          <View style={st.mathGrid}>
            <PressableCard
              style={[{ width: mathColW, borderRadius: 20, borderWidth: 1, borderColor: C.surfaceVariant }, SHADOW_SM]}
              onPress={() => nav.navigate('TextbookSetup', {})}
            >
              <Text style={st.topicIcon}>📖</Text>
              <Text style={st.topicLabel}>课文学习</Text>
              <Text style={st.topicDesc}>识字表 · 写字表 · 词语表</Text>
              <TouchableOpacity style={[st.topicBtn, { backgroundColor: sc.primary, marginTop: 8, flex: 0 }]} onPress={() => nav.navigate('TextbookSetup', {})}>
                <Text style={st.topicBtnTxtW}>GO →</Text>
              </TouchableOpacity>
            </PressableCard>
            <PressableCard
              style={[{ width: mathColW, borderRadius: 20, borderWidth: 1, borderColor: C.surfaceVariant }, SHADOW_SM]}
              onPress={() => nav.navigate('TextbookSetup', { mode: 'dictation' })}
            >
              <Text style={st.topicIcon}>✏️</Text>
              <Text style={st.topicLabel}>课文听写</Text>
              <Text style={st.topicDesc}>写字表 · 词语表听写练习</Text>
              <TouchableOpacity style={[st.topicBtn, { backgroundColor: '#EB9F4A', marginTop: 8, flex: 0 }]} onPress={() => nav.navigate('TextbookSetup', { mode: 'dictation' })}>
                <Text style={st.topicBtnTxtW}>GO →</Text>
              </TouchableOpacity>
            </PressableCard>
          </View>
          <PressableCard
            style={st.recitationCard}
            onPress={() => nav.navigate('Recitation')}
          >
            <View style={st.recitationLeft}>
              <Text style={{ fontSize: 28 }}>🎙️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.topicLabel}>课文背诵</Text>
              <Text style={st.topicDesc}>古诗 · 名言 · 课文背诵闯关</Text>
            </View>
            <Text style={[st.quickGo, { color: '#9C27B0' }]}>GO →</Text>
          </PressableCard>

          <Text style={[st.secTitle, { color: sc.dark, marginTop: 20 }]}>语文知识点</Text>
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
                  <View style={st.mathGrid}>
                    {topicKeys.map((key) => {
                      const topic = CHN_TOPICS[key];
                      if (!topic) return null;
                      return (
                        <View
                          key={key}
                          style={[
                            st.topicCardTile,
                            { width: mathColW, borderColor: C.surfaceVariant },
                            SHADOW_SM,
                          ]}
                        >
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
                    <PressableCard
                      style={[{ width: mathColW, borderRadius: 20, borderWidth: 1, borderColor: C.surfaceVariant }, SHADOW_SM]}
                      onPress={() => onDictation('chn')}
                    >
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
          {weakChn && (
            <TouchableOpacity style={st.recoBlock} onPress={() => onChnPractice(weakChn)} activeOpacity={0.85}>
              <View style={st.recoBlockHeader}>
                <MaterialIcons name="star" size={20} color={C.secondaryFixed} />
                <Text style={st.recoBlockKicker}>推荐练习</Text>
              </View>
              <Text style={st.recoBlockTitle}>{CHN_TOPICS[weakChn]?.label} — 需要加强</Text>
              <Text style={st.recoBlockDesc}>多练这一主题，巩固语文基础</Text>
              <View style={st.recoBlockBtn}>
                <Text style={st.recoBlockBtnText}>开始练习</Text>
                <MaterialIcons name="play-arrow" size={20} color={C.onSecondaryFixed} />
              </View>
            </TouchableOpacity>
          )}
        </>
      )}

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

      <Modal visible={showLockModal} transparent animationType="fade">
        <View style={st.lockOverlay}>
          <View style={st.lockSheet}>
            <View style={st.lockIconWrap}>
              <MaterialIcons name="lock" size={40} color={C.error} />
            </View>
            <Text style={st.lockModalTitle}>任务未完成</Text>
            <Text style={st.lockModalDesc}>请先完成今日任务后再自由练习哦！</Text>
            <View style={st.lockBtnRow}>
              <TouchableOpacity
                style={[st.lockBtn, st.lockBtnLeft, { backgroundColor: C.cardWhite, borderWidth: 1, borderColor: C.surfaceVariant }]}
                onPress={() => setShowLockModal(false)}
              >
                <Text style={[st.lockBtnTxt, { color: C.textMid }]}>关闭</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.lockBtn, st.lockBtnRight, { backgroundColor: C.primary }]}
                onPress={() => {
                  setShowLockModal(false);
                  setTasksExpanded(true);
                  scrollRef.current?.scrollTo({ y: 0, animated: true });
                  const firstUnfinished = dailyTasks.find((t) => !t.completed);
                  if (firstUnfinished) navigateTask(firstUnfinished);
                }}
              >
                <Text style={[st.lockBtnTxt, { color: C.onPrimary }]}>去做任务</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 16 },

  stickyAppBar: {
    backgroundColor: C.headerBg,
    borderBottomWidth: 2,
    borderBottomColor: HEADER_BORDER,
    ...SHADOW,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  appBarRow: { flexDirection: 'row', alignItems: 'center' },
  appBarAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primaryContainer,
    borderWidth: 2,
    borderColor: C.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  appBarAvatarText: { fontSize: 20 },
  appBarTitle: {
    marginLeft: 12,
    fontSize: 24,
    fontWeight: '900',
    color: C.titleAccent,
  },

  xpCard: {
    marginTop: 12,
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: HEADER_BORDER,
    padding: 12,
    ...SHADOW_SM,
  },
  xpBar: { height: 8, borderRadius: 999, backgroundColor: '#E5F5F7', overflow: 'hidden' },
  xpFill: { height: 8, borderRadius: 999, backgroundColor: C.primary },
  xpMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  xpMetaText: { fontSize: 11, fontWeight: '700', color: C.primary },

  userSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  greeting: { fontSize: 20, fontWeight: '600', color: C.text, marginBottom: 12 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  pillStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pillStreakText: { fontSize: 14, fontWeight: '700', color: C.text },
  pillLock: { marginLeft: 4 },
  pillPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primaryContainer,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pillPointsText: { fontSize: 14, fontWeight: '700', color: C.onPrimaryContainer },

  dailyTaskCard: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
    padding: 20,
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  dailyTaskLockDeco: { position: 'absolute', right: -8, top: -8, zIndex: 0 },
  dailyTaskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    zIndex: 1,
  },
  dailyTaskTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  dailyTaskTitle: { fontSize: 20, fontWeight: '600', color: C.text, marginLeft: 8, flex: 1 },
  taskCountBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  taskCountBadgeTxt: { fontSize: 12, fontWeight: '700', color: C.onPrimary },
  dailyTaskLockTag: {
    fontSize: 11, fontWeight: '700', color: C.onErrorContainer,
    marginLeft: 8,
    backgroundColor: C.errorContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dailyTaskChevron: { marginLeft: 0 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: C.surfaceVariant,
    zIndex: 1,
  },
  taskRowDone: { opacity: 0.6 },
  taskRowIcon: { fontSize: 18, marginRight: 10 },
  taskRowBody: { flex: 1 },
  taskRowTitleLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  taskRowLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: C.text, marginRight: 8 },
  taskRowLabelDone: { textDecorationLine: 'line-through', color: C.textMid },
  taskRowFrac: { fontSize: 14, fontWeight: '700', color: C.textLight },
  taskRowBar: { height: 12, borderRadius: 999, backgroundColor: C.surfaceContainerHigh, overflow: 'hidden' },
  taskRowBarFill: { height: 12, borderRadius: 999 },
  taskGoRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
  taskGoBtn: { fontSize: 12, fontWeight: '800', marginRight: 0 },
  dailyTaskHint: {
    fontSize: 12,
    color: C.error,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    zIndex: 1,
  },

  tabScroll: { maxHeight: 48, marginBottom: 16, marginTop: 4 },
  tabScrollContent: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 28 },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 20,
    borderRadius: 9999,
  },
  tabPillOn: { backgroundColor: C.primary },
  tabPillOff: { backgroundColor: C.surfaceContainerLowest, borderWidth: 1, borderColor: C.surfaceVariant },
  tabPillIcon: { marginRight: 6 },
  tabPillLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  tabPillLabelOn: { color: C.onPrimary },

  recoBlock: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: C.primary,
    borderRadius: 12,
    padding: 24,
    ...SHADOW,
  },
  recoBlockHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  recoBlockKicker: {
    fontSize: 14,
    fontWeight: '700',
    color: C.secondaryFixed,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recoBlockTitle: { fontSize: 28, fontWeight: '600', color: C.onPrimary, lineHeight: 36, marginBottom: 8 },
  recoBlockDesc: { fontSize: 16, color: C.onPrimary, opacity: 0.9, marginBottom: 16, lineHeight: 22 },
  recoBlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: C.secondaryFixed,
    borderBottomWidth: 4,
    borderBottomColor: SQUISH_BOTTOM,
  },
  recoBlockBtnText: { fontSize: 16, fontWeight: '700', color: C.onSecondaryFixed, marginRight: 6 },

  secTitle: { fontSize: 20, fontWeight: '700', paddingHorizontal: 20, marginBottom: 10 },

  mathGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingHorizontal: 20, marginBottom: 12 },
  mathGridCard: {
    backgroundColor: C.cardWhite,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.surfaceVariant,
    padding: 16,
    minHeight: 140,
    justifyContent: 'flex-start',
  },
  mathIconRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  mathCardTitle: { fontSize: 16, fontWeight: '600', color: C.text, marginBottom: 4 },
  mathCardDesc: { fontSize: 12, color: C.textMid, marginBottom: 8, lineHeight: 16 },
  mathCardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  mathBar: { flex: 1, height: 6, borderRadius: 999, backgroundColor: C.surfaceContainerHigh, overflow: 'hidden' },
  mathBarFill: { height: 6, borderRadius: 999 },
  mathPct: { fontSize: 10, fontWeight: '700', color: C.text, marginLeft: 8, minWidth: 28, textAlign: 'right' },
  mathFootNote: { fontSize: 12, color: C.textMid },

  levelBlock: { marginBottom: 8, paddingHorizontal: 20 },
  levelHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardWhite, borderRadius: RADIUS, padding: 12, borderLeftWidth: 4, ...SHADOW_SM },
  levelEmoji: { fontSize: 24 },
  levelTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  levelDesc: { fontSize: 11, color: C.textMid, marginTop: 1 },
  arrow: { fontSize: 16, color: C.textMid, fontWeight: '600', marginLeft: 8 },

  topicCardTile: {
    backgroundColor: C.cardWhite,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 0,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  topicIcon: { fontSize: 26, marginBottom: 4 },
  topicLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  topicDesc: { fontSize: 10, color: C.textMid, marginTop: 1, marginBottom: 8 },
  topicBtns: { flexDirection: 'row' },
  topicBtn: { flex: 1, paddingVertical: 6, borderRadius: RADIUS, alignItems: 'center', marginHorizontal: 2 },
  topicBtnTxt: { fontSize: 11, fontWeight: '700' },
  topicBtnTxtW: { fontSize: 11, fontWeight: '700', color: C.onPrimary },

  achHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  achTitle: { fontSize: 18, fontWeight: '700', color: C.text, flex: 1 },
  achRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginBottom: 8 },
  achItem: { alignItems: 'center', width: 60, marginRight: 8, marginBottom: 8, padding: 6, borderRadius: RADIUS, backgroundColor: C.cardWhite, ...SHADOW_SM },
  achLocked: { opacity: 0.25 },
  achIcon: { fontSize: 22 },
  achName: { fontSize: 9, color: C.textMid, marginTop: 1, textAlign: 'center' },
  achNameLocked: { color: C.textLight },

  lockOverlay: { flex: 1, backgroundColor: 'rgba(24,28,29,0.45)', justifyContent: 'center', alignItems: 'center' },
  lockSheet: {
    width: '80%',
    maxWidth: 340,
    backgroundColor: C.cardWhite,
    borderRadius: RADIUS,
    padding: 24,
    alignItems: 'center',
    ...SHADOW,
  },
  lockIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.errorContainer, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  lockModalTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 6 },
  lockModalDesc: { fontSize: 14, color: C.textMid, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  lockBtnRow: { flexDirection: 'row', width: '100%' },
  lockBtnLeft: { marginRight: 6 },
  lockBtnRight: { marginLeft: 6 },
  lockBtn: { flex: 1, height: 46, borderRadius: RADIUS, alignItems: 'center', justifyContent: 'center' },
  lockBtnTxt: { fontSize: 15, fontWeight: '700' },
  quickGo: { fontSize: 14, fontWeight: '800' },
  recitationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: C.cardWhite,
    borderWidth: 1,
    borderColor: C.surfaceVariant,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
    ...SHADOW_SM,
  },
  recitationLeft: { marginRight: 12 },
});
