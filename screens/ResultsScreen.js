import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import { C, SHADOW, SUBJECTS, OP_SYMBOL } from '../lib/theme';
import { ENG_TOPICS } from '../lib/english';
import { ACH_DEFS } from '../lib/points';
import SpeakButton from '../components/SpeakButton';

function fmt(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

export default function ResultsScreen({ data, onHome, onRetry }) {
  const {
    total, correct, wrong, elapsed, pointsEarned, accuracy,
    subject, levelUp, newLevel, newAchievements = [], wrongList = [],
  } = data;

  const perfect = wrong === 0 && total > 0;
  const isEng = subject && subject.startsWith('eng');
  const engTopicObj = isEng
    ? Object.values(ENG_TOPICS).find((t) => t.key === subject)
    : null;
  const sub = engTopicObj
    ? { icon: engTopicObj.icon, label: engTopicObj.label, color: engTopicObj.color }
    : SUBJECTS[subject] || { icon: '📝', label: '错题练习', color: C.primary };

  const ptAnim = useRef(new Animated.Value(0)).current;
  const starScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(ptAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    if (levelUp) {
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
      <Text style={st.title}>练习完成!</Text>
      <View style={[st.subBadge, { backgroundColor: sub.color + '18' }]}>
        <Text style={{ color: sub.color, fontWeight: '700', fontSize: 14 }}>{sub.icon} {sub.label}</Text>
      </View>

      {perfect && (
        <View style={st.praise}>
          <Text style={st.praiseEmoji}>🏆</Text>
          <Text style={st.praiseTxt}>全部正确, 太棒了!</Text>
        </View>
      )}

      {/* Stats */}
      <View style={st.row}>
        <View style={st.stat}><Text style={st.statV}>{fmt(elapsed)}</Text><Text style={st.statL}>用时</Text></View>
        <View style={st.stat}><Text style={st.statV}>{accuracy}%</Text><Text style={st.statL}>正确率</Text></View>
      </View>
      <View style={st.row}>
        <View style={[st.stat, { borderTopColor: C.success, borderTopWidth: 3 }]}>
          <Text style={[st.statV, { color: C.success }]}>{correct}</Text><Text style={st.statL}>正确</Text>
        </View>
        <View style={[st.stat, wrong > 0 && { borderTopColor: C.error, borderTopWidth: 3 }]}>
          <Text style={[st.statV, wrong > 0 && { color: C.error }]}>{wrong}</Text><Text style={st.statL}>错误</Text>
        </View>
        <View style={st.stat}><Text style={st.statV}>{total}</Text><Text style={st.statL}>总题数</Text></View>
      </View>

      {/* Points earned */}
      <Animated.View style={[st.ptCard, { opacity: ptOpacity, transform: [{ translateY: ptTransY }] }]}>
        <Text style={st.ptLabel}>本次获得</Text>
        <Text style={st.ptVal}>+{pointsEarned} 积分 🪙</Text>
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
          <Text style={st.wrongTitle}>错题回顾</Text>
          {wrongList.map((w, i) => {
            const wIsEng = w.op && w.op.startsWith('eng');
            if (wIsEng) {
              return (
                <View key={i} style={st.wrongCard}>
                  <View style={st.wrongQRow}>
                    <Text style={[st.wrongQ, { flex: 1 }]}>{w.stem}</Text>
                    <SpeakButton text={w.stem.replace(/___/g, 'blank')} size="small" />
                  </View>
                  <View style={st.wrongRow}>
                    <Text style={st.wrongLbl}>
                      你的答案 <Text style={{ color: C.error, fontWeight: '700' }}>
                        {w.userAnswer !== null && w.userAnswer !== undefined ? w.options[w.userAnswer] : '—'}
                      </Text>
                    </Text>
                    <Text style={st.wrongLbl}>
                      正确答案 <Text style={{ color: C.success, fontWeight: '700' }}>{w.options[w.answer]}</Text>
                    </Text>
                  </View>
                  {w.explanation ? <Text style={st.wrongExpl}>💡 {w.explanation}</Text> : null}
                </View>
              );
            }
            const sym = OP_SYMBOL[w.op] || '?';
            const qStr = w.op === 'divRem'
              ? `${w.left} ÷ ${w.right} = ${w.result} ... ${w.remainder}`
              : `${w.left} ${sym} ${w.right} = ${w.result}`;
            return (
              <View key={i} style={st.wrongCard}>
                <Text style={st.wrongQ}>{qStr}</Text>
                <View style={st.wrongRow}>
                  <Text style={st.wrongLbl}>
                    你的答案 <Text style={{ color: C.error, fontWeight: '700' }}>{w.userAnswer ?? '—'}</Text>
                  </Text>
                  <Text style={st.wrongLbl}>
                    正确答案 <Text style={{ color: C.success, fontWeight: '700' }}>{w.answer}</Text>
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Buttons */}
      <TouchableOpacity style={st.homeBtn} onPress={onHome} activeOpacity={0.8}>
        <Text style={st.homeBtnTxt}>返回主页</Text>
      </TouchableOpacity>
      <TouchableOpacity style={st.retryBtn} onPress={onRetry} activeOpacity={0.8}>
        <Text style={st.retryBtnTxt}>再来一次</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: 8 },
  subBadge: { alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 14, marginBottom: 16 },

  praise: { backgroundColor: C.successBg, borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 16 },
  praiseEmoji: { fontSize: 40, marginBottom: 4 },
  praiseTxt: { fontSize: 18, fontWeight: '700', color: C.success },

  row: { flexDirection: 'row', marginBottom: 10 },
  stat: {
    flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14, alignItems: 'center',
    marginHorizontal: 4, ...SHADOW, shadowOpacity: 0.05,
  },
  statV: { fontSize: 24, fontWeight: '800', color: C.text },
  statL: { fontSize: 12, color: C.textMid, marginTop: 3 },

  ptCard: {
    backgroundColor: C.accentBg, borderRadius: 16, padding: 16, alignItems: 'center',
    marginTop: 8, marginBottom: 8,
  },
  ptLabel: { fontSize: 14, color: C.textMid },
  ptVal: { fontSize: 24, fontWeight: '800', color: C.accent, marginTop: 4 },

  lvUp: { alignItems: 'center', marginVertical: 8 },
  lvEmoji: { fontSize: 44 },
  lvTxt: { fontSize: 18, fontWeight: '700', color: C.accent, marginTop: 4 },

  achSec: { marginTop: 12 },
  achTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 8 },
  achItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
    borderRadius: 14, padding: 12, marginBottom: 8, ...SHADOW, shadowOpacity: 0.04,
  },
  achIcon: { fontSize: 28, marginRight: 12 },
  achName: { fontSize: 15, fontWeight: '700', color: C.text },
  achDesc: { fontSize: 12, color: C.textMid, marginTop: 2 },

  wrongSec: { marginTop: 16 },
  wrongTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 10 },
  wrongCard: { backgroundColor: C.errorBg, borderRadius: 14, padding: 14, marginBottom: 8 },
  wrongQRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  wrongQ: { fontSize: 17, fontWeight: '700', color: C.text },
  wrongRow: { flexDirection: 'row', justifyContent: 'space-between' },
  wrongLbl: { fontSize: 13, color: C.textMid },
  wrongExpl: { fontSize: 12, color: C.accent, marginTop: 6, backgroundColor: C.accentBg, padding: 6, borderRadius: 8 },

  homeBtn: {
    height: 54, borderRadius: 14, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center', marginTop: 16,
  },
  homeBtnTxt: { fontSize: 17, fontWeight: '700', color: '#fff' },
  retryBtn: {
    height: 48, borderRadius: 14, backgroundColor: C.card, borderWidth: 2, borderColor: C.primary,
    alignItems: 'center', justifyContent: 'center', marginTop: 10,
  },
  retryBtnTxt: { fontSize: 16, fontWeight: '700', color: C.primary },
});
