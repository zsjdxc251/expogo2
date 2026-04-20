import { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Rect, Line, Polyline, Circle, Text as SvgText, G } from 'react-native-svg';
import { C, RADIUS, SUBJECTS, SUBJECT_COLORS, SHADOW } from '../lib/theme';
import { ENG_TOPICS } from '../lib/english';
import { CHN_TOPICS } from '../lib/chinese';
import { useApp } from '../lib/AppContext';

const SCREEN_W = Dimensions.get('window').width;
const PAD = 20;
const CHART_W = SCREEN_W - PAD * 2 - 32;

const MATH_SUBS = ['mulForward', 'mulBlank', 'add', 'subtract', 'divide', 'divRem', 'divReverse', 'addTwo', 'subtractTwo', 'mulReverse', 'compare', 'wordProblem', 'pattern', 'multiply'];

function categorize(subject) {
  if (MATH_SUBS.includes(subject)) return 'math';
  if (subject?.startsWith('chn_')) return 'chinese';
  if (subject && !MATH_SUBS.includes(subject) && subject !== 'speed' && subject !== 'review') return 'english';
  return 'other';
}

function toLocalDateStr(d) {
  const x = d instanceof Date ? d : new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(toLocalDateStr(d));
  }
  return days;
}

const WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function getDayLabel(dateStr) {
  const d = new Date(dateStr.replace(/-/g, '/'));
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getWeekdayLabel(dateStr) {
  const d = new Date(dateStr.replace(/-/g, '/'));
  return WEEK_LABELS[d.getDay()];
}

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

function aggregateByDay(history, lastDays, catFilter) {
  const byDay = {};
  lastDays.forEach((day) => {
    byDay[day] = { total: 0, correct: 0 };
  });
  history.forEach((h) => {
    const day = toLocalDateStr(h.date);
    if (!byDay[day]) return;
    const cat = categorize(h.subject);
    if (catFilter && cat !== catFilter) return;
    byDay[day].total += h.total || 0;
    byDay[day].correct += h.correct || 0;
  });
  return lastDays.map((day) => {
    const { total, correct } = byDay[day];
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { day, total, correct, acc };
  });
}

function MiniTrend({ color, points }) {
  const w = 108;
  const h = 40;
  const pad = 4;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const n = points.length;
  const coords = points.map((pct, i) => {
    const x = n <= 1 ? pad + innerW / 2 : pad + (i / (n - 1)) * innerW;
    const y = pad + innerH - (Math.min(100, Math.max(0, pct)) / 100) * innerH;
    return `${x},${y}`;
  });
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Line x1={pad} y1={pad + innerH} x2={pad + innerW} y2={pad + innerH} stroke={C.border} strokeWidth={1} />
      <Polyline points={coords.join(' ')} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((pct, i) => {
        const x = n <= 1 ? pad + innerW / 2 : pad + (i / (n - 1)) * innerW;
        const y = pad + innerH - (Math.min(100, Math.max(0, pct)) / 100) * innerH;
        return <Circle key={i} cx={x} cy={y} r={3} fill={color} />;
      })}
    </Svg>
  );
}

function VolumeBarChart({ days, volumes }) {
  const chartH = 100;
  const labelH = 34;
  const barTop = 4;
  const barZoneH = chartH - barTop;
  const maxV = Math.max(1, ...volumes);
  const n = days.length;
  const gap = 5;
  const barW = (CHART_W - gap * (n + 1)) / n;

  return (
    <Svg width={CHART_W} height={chartH + labelH}>
      {days.map((dayStr, i) => {
        const v = volumes[i];
        const bh = (v / maxV) * barZoneH;
        const x = gap + i * (barW + gap);
        const y = barTop + barZoneH - bh;
        return (
          <G key={dayStr}>
            <Rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(bh, v > 0 ? 3 : 0)}
              rx={5}
              fill={C.primary}
              opacity={v > 0 ? 0.88 : 0.12}
            />
            <SvgText x={x + barW / 2} y={chartH + 14} fontSize={9} fill={C.textMid} textAnchor="middle">
              {getWeekdayLabel(dayStr)}
            </SvgText>
            <SvgText x={x + barW / 2} y={chartH + 28} fontSize={8} fill={C.textLight} textAnchor="middle">
              {getDayLabel(dayStr)}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

export default function StatsScreen() {
  const { history } = useApp();
  const nav = useNavigation();

  const last7 = useMemo(() => getLast7Days(), []);

  const overview = useMemo(() => {
    let totalQ = 0;
    let totalCorrect = 0;
    const daySet = new Set();
    history.forEach((h) => {
      totalQ += h.total || 0;
      totalCorrect += h.correct || 0;
      daySet.add(toLocalDateStr(h.date));
    });
    const acc = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;
    return { totalQ, acc, practiceDays: daySet.size };
  }, [history]);

  const catAgg = useMemo(() => {
    const cats = { math: { total: 0, correct: 0 }, english: { total: 0, correct: 0 }, chinese: { total: 0, correct: 0 } };
    history.forEach((h) => {
      const c = categorize(h.subject);
      if (cats[c]) {
        cats[c].total += h.total || 0;
        cats[c].correct += h.correct || 0;
      }
    });
    Object.keys(cats).forEach((k) => {
      const { total, correct } = cats[k];
      cats[k].acc = total > 0 ? Math.round((correct / total) * 100) : 0;
    });
    return cats;
  }, [history]);

  const trendMath = useMemo(() => aggregateByDay(history, last7, 'math').map((d) => d.acc), [history, last7]);
  const trendEng = useMemo(() => aggregateByDay(history, last7, 'english').map((d) => d.acc), [history, last7]);
  const trendChn = useMemo(() => aggregateByDay(history, last7, 'chinese').map((d) => d.acc), [history, last7]);

  const barVolumes = useMemo(() => {
    return last7.map((day) => {
      let sum = 0;
      history.forEach((h) => {
        if (toLocalDateStr(h.date) === day) sum += h.total || 0;
      });
      return sum;
    });
  }, [history, last7]);

  const weakSubjects = useMemo(() => {
    const map = {};
    history.forEach((h) => {
      const sub = h.subject;
      if (!sub || sub === 'review' || sub === 'speed') return;
      if (!map[sub]) map[sub] = { total: 0, correct: 0 };
      map[sub].total += h.total || 0;
      map[sub].correct += h.correct || 0;
    });
    return Object.entries(map)
      .map(([subject, { total, correct }]) => ({
        subject,
        total,
        acc: total > 0 ? Math.round((correct / total) * 100) : 0,
        info: getSubjectInfo(subject),
      }))
      .sort((a, b) => a.acc - b.acc);
  }, [history]);

  const catCards = [
    { key: 'math', label: '数学', emoji: '📐', sc: SUBJECT_COLORS.math, trend: trendMath, agg: catAgg.math },
    { key: 'english', label: '英语', emoji: '📖', sc: SUBJECT_COLORS.english, trend: trendEng, agg: catAgg.english },
    { key: 'chinese', label: '语文', emoji: '📝', sc: SUBJECT_COLORS.chinese, trend: trendChn, agg: catAgg.chinese },
  ];

  return (
    <ScrollView style={st.root} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => nav.goBack()} hitSlop={12}>
          <Text style={st.backTxt}>← 返回</Text>
        </TouchableOpacity>
        <Text style={st.title}>学习统计</Text>
        <View style={st.headerSpacer} />
      </View>

      <View style={[st.card, st.overviewCard]}>
        <Text style={st.overviewEmoji}>🌟</Text>
        <View style={st.overviewRow}>
          <View style={st.overviewCell}>
            <Text style={st.overviewNum}>{overview.totalQ}</Text>
            <Text style={st.overviewLbl}>做题总数</Text>
          </View>
          <View style={st.overviewSep} />
          <View style={st.overviewCell}>
            <Text style={[st.overviewNum, { color: C.primary }]}>{overview.acc}%</Text>
            <Text style={st.overviewLbl}>总正确率</Text>
          </View>
          <View style={st.overviewSep} />
          <View style={st.overviewCell}>
            <Text style={[st.overviewNum, { color: C.accent }]}>{overview.practiceDays}</Text>
            <Text style={st.overviewLbl}>练习天数</Text>
          </View>
        </View>
      </View>

      <Text style={st.secTitle}>三科概览</Text>
      <View style={st.catRow}>
        {catCards.map((c) => (
          <View key={c.key} style={[st.catCard, { borderColor: c.sc.primary + '55' }]}>
            <Text style={st.catEmoji}>{c.emoji}</Text>
            <Text style={[st.catName, { color: c.sc.dark }]}>{c.label}</Text>
            <Text style={st.catStat}>
              {c.agg.total} 题 · {c.agg.acc}%
            </Text>
            <MiniTrend color={c.sc.primary} points={c.trend} />
          </View>
        ))}
      </View>

      <View style={[st.card, st.chartCard]}>
        <Text style={st.chartTitle}>📅 近7天做题量</Text>
        <VolumeBarChart days={last7} volumes={barVolumes} />
      </View>

      <Text style={st.secTitle}>薄弱知识点</Text>
      <Text style={st.secHint}>按正确率从低到高 · 多练会变强哦 💪</Text>
      {weakSubjects.length === 0 ? (
        <View style={st.emptyWeak}>
          <Text style={st.emptyEmoji}>🎉</Text>
          <Text style={st.emptyTxt}>还没有足够的数据，快去练习吧！</Text>
        </View>
      ) : (
        weakSubjects.map((row) => (
          <View key={row.subject} style={st.weakRow}>
            <Text style={st.weakIcon}>{row.info.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={st.weakName} numberOfLines={1}>{row.info.label}</Text>
              <Text style={st.weakSub}>{row.total} 题</Text>
            </View>
            <View style={[st.weakBadge, { backgroundColor: row.info.color + '22' }]}>
              <Text style={[st.weakAcc, { color: row.info.color }]}>{row.acc}%</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: PAD, paddingBottom: 28 },
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

  card: {
    backgroundColor: C.cardWhite,
    borderRadius: RADIUS,
    padding: 16,
    marginBottom: 14,
    ...SHADOW,
  },
  overviewCard: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.primary + '28',
    backgroundColor: C.primaryBg,
  },
  overviewEmoji: { fontSize: 32, marginBottom: 8 },
  overviewRow: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-between' },
  overviewCell: { flex: 1, alignItems: 'center' },
  overviewSep: { width: 1, height: 36, backgroundColor: C.border },
  overviewNum: { fontSize: 22, fontWeight: '800', color: C.text },
  overviewLbl: { fontSize: 11, color: C.textMid, marginTop: 4, fontWeight: '600' },

  secTitle: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 8, marginTop: 4 },
  secHint: { fontSize: 12, color: C.textMid, marginBottom: 10, marginTop: -4 },

  catRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  catCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: C.cardWhite,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1.5,
    ...SHADOW,
  },
  catEmoji: { fontSize: 22, marginBottom: 2 },
  catName: { fontSize: 12, fontWeight: '800' },
  catStat: { fontSize: 10, color: C.textMid, marginTop: 2, marginBottom: 4, fontWeight: '600' },

  chartCard: { paddingVertical: 12, paddingHorizontal: 12, overflow: 'hidden', alignItems: 'center' },
  chartTitle: { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 8, alignSelf: 'flex-start', width: '100%' },

  weakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cardWhite,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    ...SHADOW,
  },
  weakIcon: { fontSize: 26, marginRight: 10 },
  weakName: { fontSize: 15, fontWeight: '700', color: C.text },
  weakSub: { fontSize: 11, color: C.textMid, marginTop: 2 },
  weakBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  weakAcc: { fontSize: 15, fontWeight: '800' },

  emptyWeak: { alignItems: 'center', padding: 24, backgroundColor: C.card, borderRadius: RADIUS },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyTxt: { fontSize: 14, color: C.textMid, fontWeight: '600' },
});
