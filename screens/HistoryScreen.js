import { useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C, SUBJECTS, RADIUS } from '../lib/theme';
import { ENG_TOPICS } from '../lib/english';
import { CHN_TOPICS } from '../lib/chinese';
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
  if (subject === 'speed') return { icon: '⚡', label: '口算竞速', color: '#EB9F4A' };
  if (subject === 'dictation_eng') return { icon: '🎧', label: '英语听写', color: '#338F9B' };
  if (subject === 'dictation_chn') return { icon: '🎧', label: '语文听写', color: '#EB9F4A' };
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

const REASON_ICONS = {
  '兑现奖励': '🎁', '做家务': '🧹', '课外阅读': '📚',
  '表现优秀': '⭐', '违规扣分': '⚠️', '其他': '📝',
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

  return (
    <ScrollView style={st.root} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      <Text style={st.title}>积分记录</Text>

      <View style={st.summaryCard}>
        <Text style={st.summaryLabel}>当前积分</Text>
        <Text style={st.summaryPts}>{totalPts}</Text>
      </View>

      {errorCount > 0 && (
        <TouchableOpacity style={st.errBtn} activeOpacity={0.8} onPress={onErrorReview}>
          <Text style={st.errIcon}>📖</Text>
          <View style={{ flex: 1 }}>
            <Text style={st.errTitle}>错题本</Text>
            <Text style={st.errDesc}>共 {errorCount} 道错题，点击重新练习</Text>
          </View>
          <Text style={st.errArrow}>→</Text>
        </TouchableOpacity>
      )}

      {pointsLog.length === 0 ? (
        <View style={st.empty}>
          <Text style={st.emptyIcon}>💎</Text>
          <Text style={st.emptyTxt}>还没有积分记录</Text>
          <Text style={st.emptyDesc}>完成练习或家长手动调整后这里会显示记录</Text>
        </View>
      ) : (
        pointsLog.map((e) => {
          const isQuiz = e.source === 'quiz';
          const sub = isQuiz ? getSubjectInfo(e.subject) : null;
          const icon = isQuiz ? sub.icon : (REASON_ICONS[e.reason] || '📝');
          const isAdd = e.type === 'add';
          return (
            <View key={e.id} style={st.card}>
              <View style={st.cardLeft}>
                <Text style={st.cardIcon}>{icon}</Text>
              </View>
              <View style={st.cardCenter}>
                <Text style={st.cardReason}>
                  {isQuiz ? (sub?.label || '练习') : e.reason}
                </Text>
                {e.note ? <Text style={st.cardNote}>{e.note}</Text> : null}
                <Text style={st.cardDate}>{fmtDate(e.date)}</Text>
              </View>
              <View style={st.cardRight}>
                <Text style={[st.cardPts, { color: isAdd ? C.success : C.error }]}>
                  {isAdd ? '+' : '-'}{e.amount}
                </Text>
                <Text style={st.cardBalance}>余额 {e.balance}</Text>
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
  title: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 12 },

  summaryCard: {
    backgroundColor: C.primaryBg, borderRadius: RADIUS, padding: 16,
    alignItems: 'center', marginBottom: 14, borderWidth: 1.5, borderColor: C.primary + '30',
  },
  summaryLabel: { fontSize: 13, fontWeight: '600', color: C.textMid },
  summaryPts: { fontSize: 36, fontWeight: '800', color: C.primary, marginTop: 2 },

  errBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.errorBg,
    borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: C.error + '30',
  },
  errIcon: { fontSize: 28, marginRight: 12 },
  errTitle: { fontSize: 15, fontWeight: '700', color: C.error },
  errDesc: { fontSize: 12, color: C.textMid, marginTop: 2 },
  errArrow: { fontSize: 18, color: C.error, fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTxt: { fontSize: 17, fontWeight: '600', color: C.textMid },
  emptyDesc: { fontSize: 13, color: C.textLight, marginTop: 4, textAlign: 'center' },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: RADIUS, padding: 14, marginBottom: 8,
  },
  cardLeft: { marginRight: 12 },
  cardIcon: { fontSize: 24 },
  cardCenter: { flex: 1 },
  cardReason: { fontSize: 15, fontWeight: '700', color: C.text },
  cardNote: { fontSize: 12, color: C.textMid, marginTop: 1 },
  cardDate: { fontSize: 11, color: C.textLight, marginTop: 3 },
  cardRight: { alignItems: 'flex-end' },
  cardPts: { fontSize: 18, fontWeight: '800' },
  cardBalance: { fontSize: 11, color: C.textLight, marginTop: 2 },
});
