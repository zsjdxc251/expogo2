import { useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { C, SUBJECTS, RADIUS, SHADOW } from '../lib/theme';
import { ENG_TOPICS } from '../lib/english';
import { CHN_TOPICS } from '../lib/chinese';
import { getLevel } from '../lib/points';
import { useApp } from '../lib/AppContext';

function getSubjectInfo(subject) {
  if (SUBJECTS[subject]) return SUBJECTS[subject];
  if (ENG_TOPICS[subject]) {
    const t = ENG_TOPICS[subject];
    return { icon: t.icon, label: t.label, color: t.color };
  }
  const chnKey = subject && subject.startsWith('chn_') ? subject.slice(4) : null;
  if (chnKey && CHN_TOPICS[chnKey]) {
    const t = CHN_TOPICS[chnKey];
    return { icon: t.icon, label: t.label, color: t.color };
  }
  if (subject === 'speed') return { icon: '⚡', label: '口算竞速', color: '#FF8C42' };
  if (subject === 'dictation_eng') return { icon: '🎧', label: '英语听写', color: '#006670' };
  if (subject === 'dictation_chn') return { icon: '🎧', label: '语文听写', color: '#FF8C42' };
  if (subject === 'chn_charPractice') return { icon: '📝', label: '看字选拼音', color: '#4CAF7D' };
  return { icon: '📝', label: subject || '其他', color: C.primary };
}

function fmtDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const same = d.toDateString() === now.toDateString();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (same) return `今天 ${hh}:${mm}`;
  const m = d.getMonth() + 1;
  const dd = d.getDate();
  return `${m}/${dd} ${hh}:${mm}`;
}

const SOURCE_ICONS = {
  quiz: 'quiz',
  '兑现奖励': 'redeem',
  '做家务': 'cleaning-services',
  '课外阅读': 'menu-book',
  '表现优秀': 'star',
  '违规扣分': 'warning',
  '其他': 'edit',
};

export default function HistoryScreen() {
  const { user, pointsLog, history, buildErrorReview, saveQuizRoute } = useApp();
  const nav = useNavigation();

  const onErrorReview = useCallback(() => {
    const params = buildErrorReview();
    if (params) {
      saveQuizRoute('Quiz', params);
      nav.navigate('Quiz', params);
    }
  }, [buildErrorReview, nav, saveQuizRoute]);

  const errorCount = history.reduce(
    (sum, h) => sum + (h.wrongList ? h.wrongList.length : 0), 0,
  );

  const totalPts = user?.totalPoints || 0;
  const lv = getLevel(totalPts);

  return (
    <ScrollView style={st.root} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      <Text style={st.title}>积分历史</Text>

      <View style={st.summaryCard}>
        <MaterialIcons name="stars" size={32} color={C.primary} />
        <Text style={st.summaryLabel}>当前积分</Text>
        <Text style={st.summaryPts}>{totalPts.toLocaleString()}</Text>
        <Text style={st.summaryLevel}>等级 {lv.level}</Text>
      </View>

      {errorCount > 0 && (
        <TouchableOpacity style={st.errBtn} activeOpacity={0.8} onPress={onErrorReview}>
          <View style={st.errIconWrap}>
            <MaterialIcons name="assignment-late" size={24} color={C.error} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.errTitle}>错题复习</Text>
            <Text style={st.errDesc}>还有 {errorCount} 道错题待复习</Text>
          </View>
          <TouchableOpacity style={st.errGoBtn} onPress={onErrorReview}>
            <Text style={st.errGoBtnTxt}>立即复习</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {pointsLog.length > 0 && (
        <Text style={st.secTitle}>收支明细</Text>
      )}

      {pointsLog.length === 0 ? (
        <View style={st.empty}>
          <MaterialIcons name="diamond" size={48} color={C.outlineVariant} />
          <Text style={st.emptyTxt}>还没有积分记录</Text>
          <Text style={st.emptyDesc}>完成练习或家长手动调整后这里会显示记录</Text>
        </View>
      ) : (
        pointsLog.map((e) => {
          const isQuiz = e.source === 'quiz';
          const sub = isQuiz ? getSubjectInfo(e.subject) : null;
          const iconName = isQuiz ? 'quiz' : (SOURCE_ICONS[e.reason] || 'edit');
          const isAdd = e.type === 'add';
          return (
            <View key={e.id} style={st.card}>
              <View style={[st.cardIconWrap, { backgroundColor: isAdd ? 'rgba(76,175,125,0.10)' : 'rgba(186,26,26,0.08)' }]}>
                <MaterialIcons name={iconName} size={22} color={isAdd ? C.success : C.error} />
              </View>
              <View style={st.cardCenter}>
                <Text style={st.cardReason}>
                  {isQuiz ? (sub?.label || '练习') : e.reason}
                </Text>
                {isQuiz && e.reason && (
                  <Text style={st.cardDetail}>{e.reason}</Text>
                )}
                {e.note ? <Text style={st.cardNote}>{e.note}</Text> : null}
                <Text style={st.cardDate}>{fmtDate(e.date)}</Text>
              </View>
              <View style={st.cardRight}>
                <Text style={[st.cardPts, { color: isAdd ? C.success : C.error }]}>
                  {isAdd ? '+' : '-'}{e.amount}
                </Text>
                <Text style={st.cardBalance}>余额: {e.balance.toLocaleString()}</Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 16 },

  summaryCard: {
    backgroundColor: C.cardWhite, borderRadius: RADIUS, padding: 24,
    alignItems: 'center', marginBottom: 16,
    ...SHADOW,
  },
  summaryLabel: { fontSize: 14, fontWeight: '600', color: C.textMid, marginTop: 8 },
  summaryPts: { fontSize: 36, fontWeight: '700', color: C.text, marginTop: 4 },
  summaryLevel: { fontSize: 14, color: C.textLight, marginTop: 4 },

  errBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardWhite,
    borderRadius: RADIUS, padding: 16, marginBottom: 16,
    ...SHADOW,
  },
  errIconWrap: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: C.errorContainer,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  errTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  errDesc: { fontSize: 13, color: C.textMid, marginTop: 2 },
  errGoBtn: {
    backgroundColor: C.error, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
  },
  errGoBtnTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },

  secTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 12 },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTxt: { fontSize: 17, fontWeight: '600', color: C.textMid, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: C.textLight, marginTop: 4, textAlign: 'center' },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.cardWhite, borderRadius: RADIUS, padding: 14, marginBottom: 8,
    ...SHADOW,
  },
  cardIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  cardCenter: { flex: 1 },
  cardReason: { fontSize: 15, fontWeight: '600', color: C.text },
  cardDetail: { fontSize: 12, fontWeight: '600', color: C.success, marginTop: 2 },
  cardNote: { fontSize: 12, color: C.textMid, marginTop: 1 },
  cardDate: { fontSize: 12, color: C.textLight, marginTop: 3 },
  cardRight: { alignItems: 'flex-end' },
  cardPts: { fontSize: 18, fontWeight: '700' },
  cardBalance: { fontSize: 11, color: C.textLight, marginTop: 2 },
});
