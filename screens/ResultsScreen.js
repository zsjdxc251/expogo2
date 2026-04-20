import { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C, SUBJECTS, OP_SYMBOL, RADIUS, SUBJECT_COLORS } from '../lib/theme';
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
  if (acc >= 100) return { emoji: '🏆', text: '全部答对！你太棒了，给你一个大大的赞！👍', color: '#FFD700' };
  if (acc >= 80)  return { emoji: '🌟', text: '非常棒！再加把劲就能全对啦！', color: C.success };
  if (acc >= 60)  return { emoji: '💪', text: '不错哦，继续努力你会更厉害的！', color: C.accent };
  return { emoji: '🤗', text: '没关系，错误是进步的阶梯，再来一次吧！', color: '#8E99A4' };
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
  const thumbScale = useRef(new Animated.Value(0)).current;
  const thumbRotate = useRef(new Animated.Value(0)).current;
  const thumbOpacity = useRef(new Animated.Value(0)).current;
  const showThumb = accuracy >= 100 && total > 0;

  useEffect(() => {
    Animated.timing(ptAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    if (levelUp) {
      playLevelUp();
      Animated.sequence([
        Animated.delay(600),
        Animated.spring(starScale, { toValue: 1, friction: 3, useNativeDriver: true }),
      ]).start();
    }
    if (showThumb) {
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.spring(thumbScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
          Animated.timing(thumbOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(thumbRotate, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(thumbRotate, { toValue: -1, duration: 200, useNativeDriver: true }),
          Animated.timing(thumbRotate, { toValue: 0.5, duration: 150, useNativeDriver: true }),
          Animated.timing(thumbRotate, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, []);

  const ptOpacity = ptAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] });
  const ptTransY = ptAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });

  return (
    <ScrollView style={st.scroll} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      {/* Big accuracy ring */}
      <View style={st.ringWrap}>
        <ProgressRing size={120} strokeWidth={10} progress={accuracy} color={sc.primary}>
          <Text style={[st.ringPct, { color: sc.primary }]}>{accDisplay}%</Text>
        </ProgressRing>
      </View>

      {/* Emoji feedback */}
      <View style={[st.fbBanner, { backgroundColor: fb.color + '15' }]}>
        <Text style={st.fbEmoji}>{fb.emoji}</Text>
        <Text style={[st.fbText, { color: fb.color }]}>{fb.text}</Text>
      </View>

      {showThumb && (
        <Animated.View style={[st.thumbWrap, {
          opacity: thumbOpacity,
          transform: [
            { scale: thumbScale },
            { rotate: thumbRotate.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-15deg', '0deg', '15deg'] }) },
          ],
        }]}>
          <Text style={st.thumbEmoji}>👍</Text>
        </Animated.View>
      )}

      <View style={[st.subBadge, { backgroundColor: sub.color + '18' }]}>
        <Text style={{ color: sub.color, fontWeight: '700', fontSize: 14 }}>{sub.icon} {sub.label}</Text>
      </View>

      {/* Stats */}
      <View style={st.row}>
        <View style={st.stat}><Text style={st.statV}>{fmt(elapsed)}</Text><Text style={st.statL}>用时</Text></View>
        <View style={[st.stat, { borderTopColor: C.success, borderTopWidth: 3 }]}>
          <Text style={[st.statV, { color: C.success }]}>{correct}</Text><Text style={st.statL}>正确</Text>
        </View>
        <View style={[st.stat, wrong > 0 ? { borderTopColor: C.error, borderTopWidth: 3 } : null]}>
          <Text style={[st.statV, wrong > 0 ? { color: C.error } : null]}>{wrong}</Text><Text style={st.statL}>错误</Text>
        </View>
      </View>

      {/* Points earned (animated) */}
      <Animated.View style={[st.ptCard, isPerfect && st.ptCardPerfect, { opacity: ptOpacity, transform: [{ translateY: ptTransY }] }]}>
        <Text style={st.ptLabel}>本次获得</Text>
        <Text style={st.ptVal}>+{ptsDisplay} 积分 🪙</Text>
        {isPerfect && perfectBonusValue > 0 && (
          <View style={st.perfectRow}>
            <Text style={st.perfectTxt}>🎉 全对奖励 +{perfectBonusValue} 积分</Text>
          </View>
        )}
        {taskBonus > 0 && <Text style={st.ptBonus}>含任务奖励 +{taskBonus}</Text>}
      </Animated.View>

      {/* Level up */}
      {levelUp && newLevel && (
        <Animated.View style={[st.lvUp, { transform: [{ scale: starScale }] }]}>
          <Text style={st.lvEmoji}>🌟</Text>
          <Text style={st.lvTxt}>升级! Lv.{newLevel.level} {newLevel.title}</Text>
        </Animated.View>
      )}

      {/* New achievements */}
      {newAchievements.length > 0 && (
        <View style={st.achSec}>
          <Text style={st.achTitle}>新成就解锁!</Text>
          {newAchievements.map((id) => {
            const def = ACH_DEFS.find((a) => a.id === id);
            if (!def) return null;
            return (
              <View key={id} style={st.achItem}>
                <Text style={st.achIcon}>{def.icon}</Text>
                <View>
                  <Text style={st.achName}>{def.name}</Text>
                  <Text style={st.achDesc}>{def.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Wrong list */}
      {wrongList.length > 0 && (
        <View style={st.wrongSec}>
          <Text style={st.wrongTitle}>错题回顾 ({wrongList.length}题)</Text>
          {wrongList.map((w, i) => {
            const wIsEng = w.op && (w.op.startsWith('eng') || w.op.startsWith('chn_'));
            if (wIsEng) {
              return (
                <View key={i} style={st.wrongCard}>
                  <View style={st.wrongQRow}>
                    <Text style={[st.wrongQ, { flex: 1 }]}>{w.stem}</Text>
                    <SpeakButton
                      text={w.stem.replace(/___/g, 'blank')}
                      size="small"
                      language={w.op.startsWith('chn_') ? 'zh-CN' : 'en-US'}
                    />
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

      {/* Buttons */}
      <TouchableOpacity style={[st.homeBtn, { backgroundColor: sc.primary }]} onPress={onHome} activeOpacity={0.8}>
        <Text style={st.homeBtnTxt}>返回主页</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[st.retryBtn, { borderColor: sc.primary }]} onPress={onRetry} activeOpacity={0.8}>
        <Text style={[st.retryBtnTxt, { color: sc.primary }]}>再来一次</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 40, alignItems: 'center' },

  ringWrap: { marginTop: 8, marginBottom: 16 },
  ringPct: { fontSize: 28, fontWeight: '800' },

  fbBanner: { borderRadius: 16, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center', marginBottom: 12, width: '100%' },
  fbEmoji: { fontSize: 36, marginBottom: 4 },
  fbText: { fontSize: 17, fontWeight: '700', textAlign: 'center' },

  thumbWrap: { marginBottom: 8 },
  thumbEmoji: { fontSize: 72 },

  subBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 14, marginBottom: 16 },

  row: { flexDirection: 'row', marginBottom: 10, width: '100%' },
  stat: {
    flex: 1, backgroundColor: C.cardWhite, borderRadius: RADIUS, padding: 14, alignItems: 'center',
    marginHorizontal: 4,
  },
  statV: { fontSize: 22, fontWeight: '800', color: C.text },
  statL: { fontSize: 11, color: C.textMid, marginTop: 3 },

  ptCard: {
    backgroundColor: C.accentBg, borderRadius: 16, padding: 16, alignItems: 'center',
    marginTop: 4, marginBottom: 8, width: '100%',
  },
  ptLabel: { fontSize: 14, color: C.textMid },
  ptVal: { fontSize: 24, fontWeight: '800', color: C.accent, marginTop: 4 },
  ptCardPerfect: { borderWidth: 2, borderColor: '#FFD700' },
  perfectRow: { backgroundColor: 'rgba(255,215,0,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4, marginTop: 6 },
  perfectTxt: { fontSize: 14, fontWeight: '700', color: '#D4A017' },
  ptBonus: { fontSize: 12, color: C.success, marginTop: 2, fontWeight: '600' },

  lvUp: { alignItems: 'center', marginVertical: 8 },
  lvEmoji: { fontSize: 44 },
  lvTxt: { fontSize: 18, fontWeight: '700', color: C.accent, marginTop: 4 },

  achSec: { marginTop: 12, width: '100%' },
  achTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 8 },
  achItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardWhite,
    borderRadius: RADIUS, padding: 12, marginBottom: 8,
  },
  achIcon: { fontSize: 28, marginRight: 12 },
  achName: { fontSize: 15, fontWeight: '700', color: C.text },
  achDesc: { fontSize: 12, color: C.textMid, marginTop: 2 },

  wrongSec: { marginTop: 16, width: '100%' },
  wrongTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 10 },
  wrongCard: { backgroundColor: C.errorBg, borderRadius: 14, padding: 14, marginBottom: 8 },
  wrongQRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  wrongQ: { fontSize: 17, fontWeight: '700', color: C.text },
  wrongRow: { flexDirection: 'row', justifyContent: 'space-between' },
  wrongLbl: { fontSize: 13, color: C.textMid },
  wrongExpl: { fontSize: 12, color: C.accent, marginTop: 6, backgroundColor: C.accentBg, padding: 6, borderRadius: 8 },

  homeBtn: {
    height: 54, borderRadius: 14, width: '100%',
    alignItems: 'center', justifyContent: 'center', marginTop: 16,
  },
  homeBtnTxt: { fontSize: 17, fontWeight: '700', color: '#fff' },
  retryBtn: {
    height: 48, borderRadius: 14, width: '100%', backgroundColor: C.cardWhite, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginTop: 10,
  },
  retryBtnTxt: { fontSize: 16, fontWeight: '700' },
});
