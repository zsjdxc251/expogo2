import { useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { C, SUBJECTS, RADIUS, SUBJECT_COLORS, EMOJI_MAP, SHADOW } from '../lib/theme';
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
  { key: 'chinese', materialIcon: 'edit', label: '语文' },
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
  const { user, streak, achievements, history, dailyTasks, saveQuizRoute, visibility, rewardConfig, allTasksDone, taskConfig } = useApp();
  const locked = taskConfig.enabled && !allTasksDone;
  const vis = visibility || {};
  const nav = useNavigation();
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
      {/* Header — greeting + streak / points pills */}
      <View style={st.header}>
        <View style={st.headerLeft}>
          <Text style={st.avatar}>{user?.avatar || '🧒'}</Text>
          <View style={st.headerInfo}>
            <Text style={st.greeting}>Hi, {user?.name || '小探险家'}! 👋</Text>
            <Badge text={`Lv.${lv.level} ${lv.title}`} color={sc.primary} icon="⭐" />
          </View>
        </View>
        <View style={st.headerRight}>
          <View style={[st.statPill, st.statPillFirst]}>
            <Text style={st.statEmoji}>🔥</Text>
            <Text style={st.statVal}>{streak.count}天连胜</Text>
            {locked ? <MaterialIcons name="lock" size={14} color={C.textLight} style={st.statLock} /> : null}
          </View>
          <View style={st.statPill}>
            <Text style={st.statEmoji}>💎</Text>
            <Text style={[st.statVal, { color: sc.primary }]}>{totalPts}积分</Text>
            {locked ? <MaterialIcons name="lock" size={14} color={C.textLight} style={st.statLock} /> : null}
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

      {/* Inline Daily Tasks */}
      {dailyTasks.length > 0 && (
        <View style={[st.inlineTaskBox, locked && { borderColor: C.error }]}>
          <TouchableOpacity
            style={st.inlineTaskHeader}
            activeOpacity={locked ? 1 : 0.7}
            onPress={() => { if (!locked) setTasksExpanded(!tasksExpanded); }}
          >
            <View style={st.inlineTaskTitleRow}>
              <MaterialIcons name="assignment" size={20} color={C.primary} />
              <Text style={st.inlineTaskTitle}>今日任务</Text>
            </View>
            <View style={[st.taskPillBadge, { backgroundColor: taskDone === dailyTasks.length ? C.success : sc.primary }]}>
              <Text style={st.taskPillCount}>{taskDone}/{dailyTasks.length}</Text>
            </View>
            {locked && <Text style={st.inlineLockTag}>🔒 未完成</Text>}
            {!locked && (
              <MaterialIcons name={tasksExpanded ? 'expand-more' : 'chevron-right'} size={22} color={C.textMid} style={st.inlineTaskChevron} />
            )}
          </TouchableOpacity>
          {tasksExpanded && dailyTasks.map((t) => {
            const pctVal = t.target > 0 ? Math.min(100, Math.round((t.progress / t.target) * 100)) : 0;
            return (
              <TouchableOpacity
                key={t.id}
                style={[st.inlineTaskItem, t.completed && st.taskItemDone]}
                activeOpacity={t.completed ? 1 : 0.7}
                onPress={() => navigateTask(t)}
              >
                <Text style={st.taskItemIcon}>{t.completed ? '✅' : '⬜'}</Text>
                <View style={{ flex: 1 }}>
                  <View style={st.taskItemTitleRow}>
                    <Text style={[st.taskItemText, t.completed && st.taskItemTextDone]}>{t.text}</Text>
                    <Text style={st.taskItemFrac}>{t.progress}/{t.target}</Text>
                  </View>
                  <View style={st.taskBar}>
                    <View style={[st.taskBarFill, { width: `${pctVal}%`, backgroundColor: t.completed ? C.success : sc.primary }]} />
                  </View>
                </View>
                {!t.completed && (
                  <View style={st.taskGoRow}>
                    <Text style={[st.taskGoBtn, { color: sc.primary }]}>GO</Text>
                    <MaterialIcons name="arrow-forward" size={18} color={sc.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
          {tasksExpanded && locked && <Text style={st.inlineLockHint}>完成以上任务后解锁自由练习</Text>}
        </View>
      )}

      {/* Subject tabs */}
      <View style={st.tabRow}>
        {visTabs.map((t) => {
          const tsc = SUBJECT_COLORS[t.key];
          const on = activeTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[st.tabBtn, on && { ...st.tabBtnOn, backgroundColor: C.cardWhite }]}
              activeOpacity={0.7}
              onPress={() => setActiveTab(t.key)}
            >
              <MaterialIcons
                name={t.materialIcon}
                size={20}
                color={on ? tsc.primary : C.textLight}
                style={st.tabMIcon}
              />
              <Text style={[st.tabLabel, on && { color: tsc.primary, fontWeight: '700' }]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Smart Quick Start */}
      {activeTab === 'math' && weakMath && vis[`math_${weakMath}`] !== false && (
        <TouchableOpacity style={st.recoCard} onPress={() => onSubject(weakMath)} activeOpacity={0.8}>
          <View style={st.recoRow}>
            <MaterialIcons name="star" size={22} color={C.accent} style={st.recoStar} />
            <View style={st.recoTextCol}>
              <Text style={st.recoSectionLabel}>推荐练习</Text>
              <Text style={st.recoTitle}>{SUBJECTS[weakMath]?.label} — 正确率最低，多练练</Text>
            </View>
            <View style={st.recoCta}>
              <Text style={[st.recoCtaText, { color: sc.primary }]}>开始练习</Text>
              <MaterialIcons name="play-arrow" size={22} color={sc.primary} />
            </View>
          </View>
        </TouchableOpacity>
      )}
      {activeTab === 'english' && weakEng && (
        <TouchableOpacity style={st.recoCard} onPress={() => onEngPractice(weakEng)} activeOpacity={0.8}>
          <View style={st.recoRow}>
            <MaterialIcons name="star" size={22} color={C.accent} style={st.recoStar} />
            <View style={st.recoTextCol}>
              <Text style={st.recoSectionLabel}>推荐练习</Text>
              <Text style={st.recoTitle}>{ENG_TOPICS[weakEng]?.label} — 需要加强</Text>
            </View>
            <View style={st.recoCta}>
              <Text style={[st.recoCtaText, { color: sc.primary }]}>开始练习</Text>
              <MaterialIcons name="play-arrow" size={22} color={sc.primary} />
            </View>
          </View>
        </TouchableOpacity>
      )}
      {activeTab === 'chinese' && weakChn && (
        <TouchableOpacity style={st.recoCard} onPress={() => onChnPractice(weakChn)} activeOpacity={0.8}>
          <View style={st.recoRow}>
            <MaterialIcons name="star" size={22} color={C.accent} style={st.recoStar} />
            <View style={st.recoTextCol}>
              <Text style={st.recoSectionLabel}>推荐练习</Text>
              <Text style={st.recoTitle}>{CHN_TOPICS[weakChn]?.label} — 需要加强</Text>
            </View>
            <View style={st.recoCta}>
              <Text style={[st.recoCtaText, { color: sc.primary }]}>开始练习</Text>
              <MaterialIcons name="play-arrow" size={22} color={sc.primary} />
            </View>
          </View>
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
                  <View style={st.cardTopRow}>
                    <Text style={st.cardIconEmoji}>{EMOJI_MAP[sub.icon] || '📐'}</Text>
                    <MaterialIcons name="arrow-forward" size={20} color={C.textLight} />
                  </View>
                  <Text style={st.cardTitle}>{sub.label}</Text>
                  {sub.desc ? <Text style={st.cardDesc}>{sub.desc}</Text> : null}
                  <View style={st.cardBot}>
                    <View style={st.cardBar}><View style={[st.cardBarFill, { width: `${prog}%`, backgroundColor: sc.primary }]} /></View>
                    <Text style={[st.cardPct, { color: sc.primary }]}>{prog > 0 ? `${prog}%` : '—'}</Text>
                  </View>
                </PressableCard>
              );
            })}
            {vis.math_speed !== false && (
              <PressableCard style={[st.card, { borderTopColor: C.accent }]} onPress={onSpeedChallenge}>
                <View style={st.cardTopRow}>
                  <Text style={st.cardIconEmoji}>⚡</Text>
                  <MaterialIcons name="arrow-forward" size={20} color={C.textLight} />
                </View>
                <Text style={st.cardTitle}>口算竞速</Text>
                <Text style={st.cardDesc}>60秒挑战</Text>
                <View style={st.cardBot}>
                  <Text style={st.cardFootNote}>🏆 挑战最高分</Text>
                </View>
              </PressableCard>
            )}
            <PressableCard
              style={[st.card, { borderTopColor: C.error }]}
              onPress={() => { if (locked) { setShowLockModal(true); return; } nav.navigate('Battle'); }}
            >
              <View style={st.cardTopRow}>
                <Text style={st.cardIconEmoji}>⚔️</Text>
                <MaterialIcons name="arrow-forward" size={20} color={C.textLight} />
              </View>
              <Text style={st.cardTitle}>比赛模式</Text>
              <Text style={st.cardDesc}>局域网对战</Text>
              <View style={st.cardBot}>
                <Text style={st.cardFootNote}>🏅 看谁算得快</Text>
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
                        <View key={key} style={[st.topicCard, st.topicCardShadow, { borderTopColor: sc.primary }]}>
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
          <Text style={[st.secTitle, { color: sc.dark }]}>二年级语文下册</Text>
          <View style={st.grid}>
            <PressableCard
              style={[st.topicCard, { borderTopColor: sc.primary }]}
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
              style={[st.topicCard, { borderTopColor: '#EB9F4A' }]}
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
                  <View style={st.grid}>
                    {topicKeys.map((key) => {
                      const topic = CHN_TOPICS[key];
                      if (!topic) return null;
                      return (
                        <View key={key} style={[st.topicCard, st.topicCardShadow, { borderTopColor: sc.primary }]}>
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

      {/* Lock Modal — custom styled */}
      <Modal visible={showLockModal} transparent animationType="fade">
        <View style={st.lockOverlay}>
          <View style={st.lockSheet}>
            <View style={st.lockIconWrap}>
              <MaterialIcons name="lock" size={40} color={C.primary} />
            </View>
            <Text style={st.lockModalTitle}>任务未完成</Text>
            <Text style={st.lockModalDesc}>请先完成今日任务后再自由练习哦！</Text>
            <View style={st.lockBtnRow}>
              <TouchableOpacity
                style={[st.lockBtn, st.lockBtnLeft, { backgroundColor: C.cardWhite, borderWidth: 1, borderColor: C.border }]}
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

  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  avatar: { fontSize: 32 },
  headerInfo: { marginLeft: 10, flex: 1 },
  greeting: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' },
  statPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceContainer,
    borderRadius: RADIUS, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: C.border, marginLeft: 6,
  },
  statPillFirst: { marginLeft: 0 },
  statEmoji: { fontSize: 14, marginRight: 3 },
  statVal: { fontSize: 12, fontWeight: '700', color: C.text, maxWidth: 120 },
  statLock: { marginLeft: 4 },

  xpWrap: { paddingHorizontal: 20, marginTop: 2, marginBottom: 8 },
  xpBar: { height: 8, borderRadius: 4, backgroundColor: C.border, overflow: 'hidden' },
  xpFill: { height: 8, borderRadius: 4 },
  xpTxt: { fontSize: 10, color: C.textLight, marginTop: 2, textAlign: 'right' },

  taskPill: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 12, paddingVertical: 10, paddingHorizontal: 14, borderRadius: RADIUS, borderWidth: 1, borderColor: C.border, backgroundColor: C.cardWhite },
  taskPillIcon: { fontSize: 16, marginRight: 6 },
  taskPillTxt: { flex: 1, fontSize: 14, fontWeight: '600', color: C.text },
  taskPillBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS },
  taskPillCount: { fontSize: 12, fontWeight: '700', color: C.onPrimary },
  taskPillDone: { fontSize: 16, marginLeft: 6 },

  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 14, backgroundColor: C.surfaceContainer, borderRadius: RADIUS, padding: 4 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: RADIUS - 2 },
  tabBtnOn: { ...SHADOW, borderRadius: RADIUS - 2 },
  tabMIcon: { marginRight: 4 },
  tabLabel: { fontSize: 14, fontWeight: '600', color: C.textLight },

  recoCard: {
    marginHorizontal: 20, marginBottom: 14, backgroundColor: C.cardWhite, borderRadius: RADIUS, padding: 14,
    borderWidth: 1, borderColor: C.border, ...SHADOW,
  },
  recoRow: { flexDirection: 'row', alignItems: 'center' },
  recoStar: { marginRight: 10 },
  recoTextCol: { flex: 1, minWidth: 0 },
  recoSectionLabel: { fontSize: 11, fontWeight: '800', color: C.primary, marginBottom: 2 },
  recoTitle: { fontSize: 14, fontWeight: '600', color: C.text, lineHeight: 20 },
  recoCta: { flexDirection: 'row', alignItems: 'center', marginLeft: 6 },
  recoCtaText: { fontSize: 13, fontWeight: '800', marginRight: 2 },
  quickGo: { fontSize: 14, fontWeight: '800' },

  secTitle: { fontSize: 20, fontWeight: '700', paddingHorizontal: 20, marginBottom: 10 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },

  card: { width: '48%', backgroundColor: C.cardWhite, borderTopWidth: 3, padding: 14, marginBottom: 10, minHeight: 120 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardIconEmoji: { fontSize: 28 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  cardDesc: { fontSize: 11, color: C.textMid, marginTop: 2 },
  cardFootNote: { fontSize: 12, color: C.textMid },
  cardBot: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  cardBar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: C.border, overflow: 'hidden' },
  cardBarFill: { height: 8, borderRadius: 4 },
  cardPct: { fontSize: 11, fontWeight: '700', marginLeft: 6 },

  levelBlock: { marginBottom: 8, paddingHorizontal: 20 },
  levelHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardWhite, borderRadius: RADIUS, padding: 12, borderLeftWidth: 4, ...SHADOW },
  levelEmoji: { fontSize: 24 },
  levelTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  levelDesc: { fontSize: 11, color: C.textMid, marginTop: 1 },
  arrow: { fontSize: 16, color: C.textMid, fontWeight: '600', marginLeft: 8 },

  topicCard: { width: '48%', backgroundColor: C.cardWhite, borderRadius: RADIUS, borderTopWidth: 3, padding: 12, marginBottom: 10, minHeight: 140, justifyContent: 'space-between' },
  topicCardShadow: { ...SHADOW },
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
  achItem: { alignItems: 'center', width: 60, marginRight: 8, marginBottom: 8, padding: 6, borderRadius: RADIUS, backgroundColor: C.cardWhite, ...SHADOW },
  achLocked: { opacity: 0.25 },
  achIcon: { fontSize: 22 },
  achName: { fontSize: 9, color: C.textMid, marginTop: 1, textAlign: 'center' },
  achNameLocked: { color: C.textLight },

  lockOverlay: { flex: 1, backgroundColor: 'rgba(24,28,29,0.45)', justifyContent: 'center', alignItems: 'center' },
  lockSheet: {
    width: '80%', maxWidth: 340, backgroundColor: C.cardWhite, borderRadius: RADIUS, padding: 24,
    alignItems: 'center', ...SHADOW,
  },
  lockIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.primaryBg, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  lockModalTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 6 },
  lockModalDesc: { fontSize: 14, color: C.textMid, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  lockBtnRow: { flexDirection: 'row', width: '100%' },
  lockBtnLeft: { marginRight: 6 },
  lockBtnRight: { marginLeft: 6 },
  lockBtn: { flex: 1, height: 46, borderRadius: RADIUS, alignItems: 'center', justifyContent: 'center' },
  lockBtnTxt: { fontSize: 15, fontWeight: '700' },

  taskItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardWhite, borderRadius: RADIUS, padding: 12, marginBottom: 8 },
  taskItemDone: { opacity: 0.6 },
  taskItemIcon: { fontSize: 18, marginRight: 10 },
  taskItemTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
  taskItemText: { flex: 1, fontSize: 14, fontWeight: '600', color: C.text, marginRight: 8 },
  taskItemTextDone: { textDecorationLine: 'line-through', color: C.textMid },
  taskItemFrac: { fontSize: 12, fontWeight: '800', color: C.textLight },
  taskBar: { height: 8, borderRadius: 4, backgroundColor: C.border, overflow: 'hidden' },
  taskBarFill: { height: 8, borderRadius: 4 },
  taskGoRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
  taskGoBtn: { fontSize: 12, fontWeight: '800', marginRight: 0 },
  taskItemReward: { fontSize: 13, fontWeight: '700', color: C.gold, marginLeft: 8 },
  inlineTaskBox: {
    marginHorizontal: 20, marginBottom: 14, padding: 14, borderRadius: RADIUS, backgroundColor: C.cardWhite,
    borderWidth: 1, borderColor: C.border, ...SHADOW,
  },
  inlineTaskHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
  },
  inlineTaskTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  inlineTaskTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginLeft: 8, flex: 1 },
  inlineTaskChevron: { marginLeft: 0 },
  inlineLockTag: {
    fontSize: 11, fontWeight: '700', color: C.error, marginLeft: 8,
    backgroundColor: C.errorBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS,
  },
  inlineTaskItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceContainerLow, borderRadius: RADIUS, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: C.border,
  },
  inlineLockHint: {
    fontSize: 12, color: C.error, fontWeight: '600', textAlign: 'center', marginTop: 4,
  },

  recitationCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 12,
    padding: 14, borderRadius: RADIUS, backgroundColor: C.cardWhite,
    borderLeftWidth: 4, borderLeftColor: '#9C27B0', ...SHADOW,
  },
  recitationLeft: { marginRight: 12 },
});
