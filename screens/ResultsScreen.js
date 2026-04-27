import { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { C, SUBJECTS, OP_SYMBOL, RADIUS, SUBJECT_COLORS, SHADOW } from '../lib/theme';
import { ENG_TOPICS } from '../lib/english';
import { CHN_TOPICS } from '../lib/chinese';
import { ACH_DEFS } from '../lib/points';
import { playLevelUp } from '../lib/sounds';
import { useApp } from '../lib/AppContext';
import ProgressRing from '../components/ProgressRing';
import SpeakButton from '../components/SpeakButton';

function fmt(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

function getEmojiFeedback(acc) {
  if (acc >= 100) return { text: '太棒了！全部答对！', color: '#FFD700' };
  if (acc >= 80)  return { text: '太棒了！继续保持！', color: C.success };
  if (acc >= 60)  return { text: '不错哦，继续努力！', color: C.accent };
  return { text: '没关系，再来一次吧！', color: '#8E99A4' };
}

function useCountUp(target, duration = 800) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    anim.setValue(0);
    const listener = anim.addListener(({ value }) => setDisplay(Math.round(value)));
    Animated.timing(anim, { toValue: target, duration, useNativeDriver: false }).start();
    return () => anim.removeListener(listener);
  }, [target]);

  return display;
}

export default function ResultsScreen() {
  const { quizResult: data, lastQuizRoute } = useApp();
  const nav = useNavigation();
  const onHome = useCallback(() => nav.popToTop(), [nav]);
  const onRetry = useCallback(() => {
    if (lastQuizRoute) {
      nav.replace(lastQuizRoute.routeName, lastQuizRoute.params);
    } else {
      nav.popToTop();
    }
  }, [nav, lastQuizRoute]);

  useEffect(() => {
    if (!data) nav.popToTop();
  }, [data, nav]);

  if (!data) return null;

  const {
    total = 0, correct = 0, wrong = 0, elapsed = 0, pointsEarned = 0, accuracy = 0,
    subject, levelUp, newLevel, newAchievements = [], wrongList = [], taskBonus = 0,
    isPerfect = false, perfectBonusValue = 0,
  } = data;

  const isMath = !subject?.startsWith('eng') && !subject?.startsWith('chn_');
  const isEng = subject && subject.startsWith('eng');
  const isChn = subject && subject.startsWith('chn_');
  const sc = isEng ? SUBJECT_COLORS.english : isChn ? SUBJECT_COLORS.chinese : SUBJECT_COLORS.math;

  const engTopicObj = isEng ? Object.values(ENG_TOPICS).find((t) => t.key === subject) : null;
  const chnTopicKey = isChn ? subject.replace('chn_', '') : null;
  const chnTopicObj = chnTopicKey ? CHN_TOPICS[chnTopicKey] : null;
  const sub = engTopicObj
    ? { icon: engTopicObj.icon, label: engTopicObj.label, color: engTopicObj.color }
    : chnTopicObj
    ? { icon: chnTopicObj.icon, label: chnTopicObj.label, color: chnTopicObj.color }
    : SUBJECTS[subject] || { icon: '📝', label: '错题练习', color: C.primary };

  const fb = getEmojiFeedback(accuracy);
  const accDisplay = useCountUp(accuracy, 900);
  const ptsDisplay = useCountUp(pointsEarned, 800);

  const ptAnim = useRef(new Animated.Value(0)).current;
  const starScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(ptAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    if (levelUp) {
      playLevelUp();
      Animated.sequence([
        Animated.delay(600),
        Animated.spring(starScale, { toValue: 1, friction: 3, useNativeDriver: true }),
      ]).start();
    }
  }, []);

  const ptOpacity = ptAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] });
  const ptTransY = ptAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });

  return (
    <ScrollView style={st.scroll} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      <View style={st.confettiRow}>
        <Text style={st.confetti}>✨</Text>
        <Text style={st.confetti}>⭐</Text>
        <Text style={st.confetti}>🎈</Text>
      </View>

      <Text style={st.fbTitle}>{fb.text}</Text>

      <View style={st.ringWrap}>
        <ProgressRing size={140} strokeWidth={12} progress={accuracy} color={sc.primary}>
          <Text style={[st.ringPct, { color: sc.primary }]}>{accDisplay}%</Text>
          <Text style={st.ringLabel}>正确率</Text>
        </ProgressRing>
      </View>

      <View style={st.statsRow}>
        <View style={st.statCard}>
          <MaterialIcons name="timer" size={24} color={C.primary} />
          <Text style={st.statLabel}>耗时</Text>
          <Text style={st.statVal}>{fmt(elapsed)}</Text>
        </View>
        <View style={st.statCard}>
          <MaterialIcons name="stars" size={24} color={C.accent} />
          <Text style={st.statLabel}>积分</Text>
          <Text style={st.statVal}>+{ptsDisplay}</Text>
        </View>
      </View>

      <View style={st.statsRow}>
        <View style={[st.statCard, { borderTopWidth: 3, borderTopColor: C.success }]}>
          <MaterialIcons name="check" size={24} color={C.success} />
          <Text style={[st.statVal, { color: C.success }]}>{correct}</Text>
          <Text style={st.statLabel}>答对</Text>
        </View>
        <View style={[st.statCard, wrong > 0 && { borderTopWidth: 3, borderTopColor: C.error }]}>
          <MaterialIcons name="close" size={24} color={wrong > 0 ? C.error : C.textLight} />
          <Text style={[st.statVal, wrong > 0 && { color: C.error }]}>{wrong}</Text>
          <Text style={st.statLabel}>答错</Text>
        </View>
      </View>

      {isPerfect && perfectBonusValue > 0 && (
        <View style={st.perfectBanner}>
          <Text style={st.perfectTxt}>🎉 全对奖励 +{perfectBonusValue} 积分</Text>
        </View>
      )}
      {taskBonus > 0 && (
        <View style={st.bonusBanner}>
          <Text style={st.bonusTxt}>含任务奖励 +{taskBonus}</Text>
        </View>
      )}

      {levelUp && newLevel && (
        <Animated.View style={[st.lvUp, { transform: [{ scale: starScale }] }]}>
          <Text style={st.lvEmoji}>🌟</Text>
          <Text style={st.lvTxt}>升级! Lv.{newLevel.level} {newLevel.title}</Text>
        </Animated.View>
      )}

      {newAchievements.length > 0 && (
        <View style={st.achSec}>
          <View style={st.achHeaderRow}>
            <MaterialIcons name="bolt" size={24} color={C.accent} />
            <Text style={st.achTitle}>解锁新勋章！</Text>
          </View>
          {newAchievements.map((id) => {
            const def = ACH_DEFS.find((a) => a.id === id);
            if (!def) return null;
            return (
              <View key={id} style={st.achItem}>
                <Text style={st.achIcon}>{def.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={st.achName}>{def.name}</Text>
                  <Text style={st.achDesc}>{def.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {wrongList.length > 0 && (
        <View style={st.wrongSec}>
          <Text style={st.wrongTitle}>错题回顾 ({wrongList.length}题)</Text>
          {wrongList.map((w, i) => {
            const isCharPractice = w.op === 'chn_charPractice';
            const wIsEng = w.op && (w.op.startsWith('eng') || w.op.startsWith('chn_'));
            const hasStem = w.stem || w.char;

            if (isCharPractice) {
              const display = w.char || w.stem || '?';
              const correctAns = w.pinyin || w.answer || '—';
              const userAns = (w.userAnswer !== null && w.userAnswer !== undefined && w.userAnswer !== '(错误)')
                ? w.userAnswer : '—';
              return (
                <View key={i} style={st.wrongCard}>
                  <View style={st.wrongQRow}>
                    <Text style={[st.wrongQ, { fontSize: 28 }]}>{display}</Text>
                    <SpeakButton text={display} size="small" language="zh-CN" />
                  </View>
                  <View style={st.wrongRow}>
                    <Text style={st.wrongLbl}>
                      你的答案 <Text style={{ color: C.error, fontWeight: '700' }}>{userAns}</Text>
                    </Text>
                    <Text style={st.wrongLbl}>
                      正确答案 <Text style={{ color: C.success, fontWeight: '700' }}>{correctAns}</Text>
                    </Text>
                  </View>
                </View>
              );
            }

            if (wIsEng || hasStem) {
              const stem = w.stem || w.char || '?';
              const lang = w.op?.startsWith('chn_') ? 'zh-CN' : 'en-US';
              return (
                <View key={i} style={st.wrongCard}>
                  <View style={st.wrongQRow}>
                    <Text style={[st.wrongQ, { flex: 1 }]}>{stem}</Text>
                    <SpeakButton text={stem.replace(/___/g, 'blank')} size="small" language={lang} />
                  </View>
                  <View style={st.wrongRow}>
                    <Text style={st.wrongLbl}>
                      你的答案 <Text style={{ color: C.error, fontWeight: '700' }}>
                        {w.userAnswer !== null && w.userAnswer !== undefined ? (w.options?.[w.userAnswer] ?? w.userAnswer) : '—'}
                      </Text>
                    </Text>
                    <Text style={st.wrongLbl}>
                      正确答案 <Text style={{ color: C.success, fontWeight: '700' }}>{w.options?.[w.answer] ?? w.answer}</Text>
                    </Text>
                  </View>
                  {w.explanation ? <Text style={st.wrongExpl}>💡 {w.explanation}</Text> : null}
                </View>
              );
            }

            const sym = OP_SYMBOL[w.op] || '?';
            const isDivMulti = w.op === 'divRem' || w.op === 'divReverse';
            const qStr = isDivMulti
              ? `${w.left} ÷ ${w.right} = ${w.result} ... ${w.remainder}`
              : `${w.left} ${sym} ${w.right} = ${w.result}`;

            const fmtAnswer = (ans) => {
              if (ans === null || ans === undefined) return '—';
              if (typeof ans === 'object') {
                if ('q' in ans) return `商=${ans.q}, 余=${ans.r}`;
                if ('dividend' in ans) return `被除数=${ans.dividend}, 余=${ans.remainder}`;
                return JSON.stringify(ans);
              }
              return String(ans);
            };

            return (
              <View key={i} style={st.wrongCard}>
                <Text style={st.wrongQ}>{qStr}</Text>
                <View style={st.wrongRow}>
                  <Text style={st.wrongLbl}>
                    你的答案 <Text style={{ color: C.error, fontWeight: '700' }}>{fmtAnswer(w.userAnswer)}</Text>
                  </Text>
                  <Text style={st.wrongLbl}>
                    正确答案 <Text style={{ color: C.success, fontWeight: '700' }}>{fmtAnswer(w.answer)}</Text>
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={st.btnRow}>
        <TouchableOpacity style={[st.homeBtn, { backgroundColor: sc.primary }]} onPress={onHome} activeOpacity={0.8}>
          <MaterialIcons name="home" size={20} color="#fff" />
          <Text style={st.homeBtnTxt}>返回主页</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.retryBtn, { borderColor: sc.primary }]} onPress={onRetry} activeOpacity={0.8}>
          <MaterialIcons name="replay" size={20} color={sc.primary} />
          <Text style={[st.retryBtnTxt, { color: sc.primary }]}>再来一次</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 40, alignItems: 'center' },

  confettiRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8, marginBottom: 8 },
  confetti: { fontSize: 28 },

  fbTitle: { fontSize: 22, fontWeight: '700', color: C.text, textAlign: 'center', marginBottom: 16 },

  ringWrap: { marginBottom: 24 },
  ringPct: { fontSize: 32, fontWeight: '700' },
  ringLabel: { fontSize: 12, color: C.textMid, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 10 },
  statCard: {
    flex: 1, backgroundColor: C.cardWhite, borderRadius: RADIUS, padding: 16, alignItems: 'center',
    ...SHADOW,
  },
  statVal: { fontSize: 22, fontWeight: '700', color: C.text, marginTop: 4 },
  statLabel: { fontSize: 12, color: C.textMid, marginTop: 2 },

  perfectBanner: {
    backgroundColor: 'rgba(255,215,0,0.12)', borderRadius: RADIUS, paddingVertical: 10, paddingHorizontal: 16,
    marginTop: 8, width: '100%', alignItems: 'center',
  },
  perfectTxt: { fontSize: 14, fontWeight: '700', color: '#D4A017' },
  bonusBanner: {
    backgroundColor: C.successBg, borderRadius: RADIUS, paddingVertical: 8, paddingHorizontal: 16,
    marginTop: 6, width: '100%', alignItems: 'center',
  },
  bonusTxt: { fontSize: 13, fontWeight: '600', color: C.success },

  lvUp: { alignItems: 'center', marginVertical: 12 },
  lvEmoji: { fontSize: 44 },
  lvTxt: { fontSize: 18, fontWeight: '700', color: C.accent, marginTop: 4 },

  achSec: { marginTop: 16, width: '100%' },
  achHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  achTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  achItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardWhite,
    borderRadius: RADIUS, padding: 14, marginBottom: 8,
    ...SHADOW,
  },
  achIcon: { fontSize: 28, marginRight: 12 },
  achName: { fontSize: 15, fontWeight: '700', color: C.text },
  achDesc: { fontSize: 12, color: C.textMid, marginTop: 2 },

  wrongSec: { marginTop: 20, width: '100%' },
  wrongTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 10 },
  wrongCard: { backgroundColor: C.errorBg, borderRadius: RADIUS, padding: 14, marginBottom: 8 },
  wrongQRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  wrongQ: { fontSize: 17, fontWeight: '700', color: C.text },
  wrongRow: { flexDirection: 'row', justifyContent: 'space-between' },
  wrongLbl: { fontSize: 13, color: C.textMid },
  wrongExpl: { fontSize: 12, color: C.secondary, marginTop: 6, backgroundColor: C.secondaryBg, padding: 8, borderRadius: 8 },

  btnRow: { width: '100%', gap: 10, marginTop: 24 },
  homeBtn: {
    height: 54, borderRadius: RADIUS, width: '100%',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    ...SHADOW,
  },
  homeBtnTxt: { fontSize: 17, fontWeight: '700', color: '#fff' },
  retryBtn: {
    height: 48, borderRadius: RADIUS, width: '100%', backgroundColor: C.cardWhite, borderWidth: 2,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  retryBtnTxt: { fontSize: 16, fontWeight: '700' },
});
