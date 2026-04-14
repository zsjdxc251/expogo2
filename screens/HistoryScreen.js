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
  return { icon: '📝', label: subject, color: C.primary };
}

function fmt(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
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

export default function HistoryScreen() {
  const { history, buildErrorReview, saveQuizRoute } = useApp();
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

  return (
    <ScrollView style={st.root} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      <Text style={st.title}>练习记录</Text>

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

      {history.length === 0 ? (
        <View style={st.empty}>
          <Text style={st.emptyIcon}>📋</Text>
          <Text style={st.emptyTxt}>还没有练习记录</Text>
          <Text style={st.emptyDesc}>完成一次练习后这里会显示记录</Text>
        </View>
      ) : (
        history.map((h, i) => {
          const sub = getSubjectInfo(h.subject);
          return (
            <View key={h.id || i} style={st.card}>
              <View style={st.cardTop}>
                <Text style={st.cardIcon}>{sub.icon}</Text>
                <Text style={st.cardSubject}>{sub.label}</Text>
                <Text style={st.cardDate}>{fmtDate(h.date)}</Text>
              </View>
              <View style={st.cardBody}>
                <View style={st.cardStat}>
                  <Text style={[st.cardStatV, { color: C.success }]}>✓ {h.correct}/{h.total}</Text>
                  <Text style={st.cardStatL}>正确率 {h.accuracy}%</Text>
                </View>
                <View style={st.cardStat}>
                  <Text style={st.cardStatV}>⏱ {fmt(h.elapsed)}</Text>
                  <Text style={st.cardStatL}>用时</Text>
                </View>
                <View style={st.cardStat}>
                  <Text style={[st.cardStatV, { color: C.accent }]}>+{h.pointsEarned}</Text>
                  <Text style={st.cardStatL}>积分</Text>
                </View>
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
  title: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 16 },

  errBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.errorBg,
    borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: C.error + '30',
  },
  errIcon: { fontSize: 28, marginRight: 12 },
  errTitle: { fontSize: 15, fontWeight: '700', color: C.error },
  errDesc: { fontSize: 12, color: C.textMid, marginTop: 2 },
  errArrow: { fontSize: 18, color: C.error, fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTxt: { fontSize: 17, fontWeight: '600', color: C.textMid },
  emptyDesc: { fontSize: 13, color: C.textLight, marginTop: 4 },

  card: {
    backgroundColor: C.card, borderRadius: RADIUS, padding: 14, marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardIcon: { fontSize: 20, marginRight: 6 },
  cardSubject: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1 },
  cardDate: { fontSize: 12, color: C.textLight },
  cardBody: { flexDirection: 'row' },
  cardStat: { flex: 1, alignItems: 'center' },
  cardStatV: { fontSize: 15, fontWeight: '700', color: C.text },
  cardStatL: { fontSize: 11, color: C.textLight, marginTop: 2 },
});
