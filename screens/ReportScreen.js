import { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C, RADIUS, SUBJECT_COLORS, SHADOW } from '../lib/theme';
import { useApp } from '../lib/AppContext';

const MATH_SUBS = [
  'mulForward', 'mulBlank', 'add', 'subtract', 'divide', 'divRem', 'divReverse',
  'addTwo', 'subtractTwo', 'mulReverse', 'compare', 'wordProblem', 'pattern', 'multiply',
];

function getWeekRange(weeksAgo = 0) {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1 - weeksAgo * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

function categorize(subject) {
  if (subject === 'speed') return 'math';
  if (MATH_SUBS.includes(subject)) return 'math';
  if (subject?.startsWith('chn_')) return 'chinese';
  if (subject && !MATH_SUBS.includes(subject) && subject !== 'review') return 'english';
  return 'other';
}

function filterHistoryInRange(history, start, end) {
  return history.filter((h) => {
    const d = new Date(h.date);
    return d >= start && d <= end;
  });
}

function aggregateWeek(rows) {
  let totalQ = 0;
  let totalCorrect = 0;
  let totalElapsed = 0;
  const daySet = new Set();
  const byCat = {
    math: { total: 0, correct: 0 },
    english: { total: 0, correct: 0 },
    chinese: { total: 0, correct: 0 },
  };

  rows.forEach((h) => {
    const t = h.total || 0;
    const c = h.correct || 0;
    totalQ += t;
    totalCorrect += c;
    totalElapsed += h.elapsed || 0;
    const dayKey = new Date(h.date).toDateString();
    daySet.add(dayKey);

    const cat = categorize(h.subject);
    if (byCat[cat]) {
      byCat[cat].total += t;
      byCat[cat].correct += c;
    }
  });

  const acc = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;
  ['math', 'english', 'chinese'].forEach((k) => {
    const { total, correct } = byCat[k];
    byCat[k].acc = total > 0 ? Math.round((correct / total) * 100) : 0;
  });

  return {
    totalQ,
    acc,
    studyDays: daySet.size,
    totalElapsed,
    byCat,
  };
}

function fmtDuration(totalSec) {
  const s = Math.round(totalSec || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}小时${m}分`;
  if (m > 0) return `${m}分${sec}秒`;
  return `${sec}秒`;
}

function CmpLine({ label, cur, prev, higherIsBetter }) {
  const diff = cur - prev;
  let arrow = '—';
  let color = C.textMid;
  if (diff !== 0) {
    const improved = higherIsBetter ? diff > 0 : diff < 0;
    arrow = improved ? '↑' : '↓';
    color = improved ? C.success : C.error;
  }
  return (
    <View style={st.cmpRow}>
      <Text style={st.cmpLabel}>{label}</Text>
      <Text style={st.cmpVals}>
        本周 <Text style={st.cmpNum}>{cur}</Text>
        {' · '}
        上周 <Text style={st.cmpNum}>{prev}</Text>
      </Text>
      <Text style={[st.cmpArrow, { color }]}>{arrow}</Text>
    </View>
  );
}

export default function ReportScreen() {
  const { history } = useApp();
  const nav = useNavigation();

  const thisWeek = useMemo(() => getWeekRange(0), []);
  const lastWeek = useMemo(() => getWeekRange(1), []);

  const thisRows = useMemo(
    () => filterHistoryInRange(history, thisWeek.start, thisWeek.end),
    [history, thisWeek.start, thisWeek.end],
  );
  const lastRows = useMemo(
    () => filterHistoryInRange(history, lastWeek.start, lastWeek.end),
    [history, lastWeek.start, lastWeek.end],
  );

  const cur = useMemo(() => aggregateWeek(thisRows), [thisRows]);
  const prev = useMemo(() => aggregateWeek(lastRows), [lastRows]);

  const maxBar = useMemo(() => {
    const m = Math.max(cur.byCat.math.total, cur.byCat.english.total, cur.byCat.chinese.total, 1);
    return m;
  }, [cur.byCat]);

  const subjectRows = [
    { key: 'math', label: '数学', emoji: '📐', sc: SUBJECT_COLORS.math },
    { key: 'english', label: '英语', emoji: '📖', sc: SUBJECT_COLORS.english },
    { key: 'chinese', label: '语文', emoji: '📝', sc: SUBJECT_COLORS.chinese },
  ];

  return (
    <ScrollView style={st.root} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => nav.goBack()} hitSlop={12}>
          <Text style={st.backTxt}>← 返回</Text>
        </TouchableOpacity>
        <Text style={st.title}>📊 学习报告</Text>
        <View style={st.headerSpacer} />
      </View>

      <View style={[st.card, st.cardShadow]}>
        <Text style={st.cardTitle}>本周概览</Text>
        <View style={st.summaryGrid}>
          <View style={st.summaryCell}>
            <Text style={st.summaryNum}>{cur.totalQ}</Text>
            <Text style={st.summaryLbl}>做题总数</Text>
          </View>
          <View style={st.summaryCell}>
            <Text style={[st.summaryNum, { color: C.primary }]}>{cur.acc}%</Text>
            <Text style={st.summaryLbl}>平均正确率</Text>
          </View>
          <View style={st.summaryCell}>
            <Text style={[st.summaryNum, { color: C.accent }]}>{cur.studyDays}</Text>
            <Text style={st.summaryLbl}>学习天数</Text>
          </View>
          <View style={st.summaryCell}>
            <Text style={st.summaryNum}>{fmtDuration(cur.totalElapsed)}</Text>
            <Text style={st.summaryLbl}>总用时</Text>
          </View>
        </View>
      </View>

      <Text style={st.secLabel}>科目分析（本周）</Text>
      <View style={[st.card, st.cardShadow]}>
        {subjectRows.map((row) => {
          const agg = cur.byCat[row.key];
          const pct = maxBar > 0 ? (agg.total / maxBar) * 100 : 0;
          return (
            <View key={row.key} style={st.subBlock}>
              <View style={st.subHead}>
                <Text style={st.subEmoji}>{row.emoji}</Text>
                <Text style={[st.subName, { color: row.sc.dark }]}>{row.label}</Text>
                <Text style={st.subStat}>
                  {agg.total} 题 · {agg.acc}%
                </Text>
              </View>
              <View style={st.barTrack}>
                <View style={[st.barFill, { width: `${pct}%`, backgroundColor: row.sc.primary }]} />
              </View>
            </View>
          );
        })}
      </View>

      <Text style={st.secLabel}>进步对比</Text>
      <View style={[st.card, st.cardShadow]}>
        <Text style={st.vsHint}>vs 上周</Text>
        <CmpLine label="做题数" cur={cur.totalQ} prev={prev.totalQ} higherIsBetter />
        <View style={st.divider} />
        <CmpLine label="正确率" cur={cur.acc} prev={prev.acc} higherIsBetter />
        <View style={st.divider} />
        <CmpLine label="学习天数" cur={cur.studyDays} prev={prev.studyDays} higherIsBetter />
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 28 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backTxt: { fontSize: 16, fontWeight: '700', color: C.primary },
  title: { fontSize: 20, fontWeight: '800', color: C.text },
  headerSpacer: { width: 56 },

  secLabel: { fontSize: 14, fontWeight: '700', color: C.textMid, marginBottom: 8, marginTop: 4 },

  card: {
    backgroundColor: C.cardWhite,
    borderRadius: RADIUS,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardShadow: { ...SHADOW },

  cardTitle: { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 12 },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  summaryCell: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
    alignItems: 'center',
  },
  summaryNum: { fontSize: 20, fontWeight: '800', color: C.text },
  summaryLbl: { fontSize: 11, color: C.textMid, marginTop: 4, fontWeight: '600' },

  subBlock: { marginBottom: 14 },
  subHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  subEmoji: { fontSize: 18, marginRight: 6 },
  subName: { fontSize: 15, fontWeight: '800', flex: 1 },
  subStat: { fontSize: 13, fontWeight: '700', color: C.textMid },
  barTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: C.card,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 6 },

  vsHint: { fontSize: 13, fontWeight: '700', color: C.textMid, marginBottom: 10 },
  cmpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  cmpLabel: { width: 72, fontSize: 14, fontWeight: '700', color: C.text },
  cmpVals: { flex: 1, fontSize: 13, color: C.textLight },
  cmpNum: { fontWeight: '800', color: C.text },
  cmpArrow: { fontSize: 18, fontWeight: '800', width: 28, textAlign: 'right' },
  divider: { height: 1, backgroundColor: C.border },
});
