import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { C, SUBJECTS, RADIUS, OP_SYMBOL } from '../lib/theme';
import { ENG_TOPICS } from '../lib/english';
import { CHN_TOPICS } from '../lib/chinese';
import { shuffle } from '../lib/questions';
import { useApp } from '../lib/AppContext';

const MASTERED_KEY = '@learnpark_mastered_errors';
const ERROR_CARD_BG = 'rgba(255, 183, 77, 0.15)';

const MATH_SUBS = ['mulForward', 'mulBlank', 'add', 'subtract', 'divide', 'divRem', 'divReverse', 'addTwo', 'subtractTwo', 'mulReverse', 'compare', 'wordProblem', 'pattern', 'multiply'];

function categorize(subject) {
  if (MATH_SUBS.includes(subject)) return 'math';
  if (subject?.startsWith('chn_')) return 'chinese';
  if (subject && !MATH_SUBS.includes(subject) && subject !== 'speed' && subject !== 'review') return 'english';
  return 'other';
}

function makeQuestionKey(q) {
  if (!q) return '';
  return `${q.left}-${q.op}-${q.right}-${q.missingPos}`;
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

function fmtAnswer(ans) {
  if (ans === null || ans === undefined) return '—';
  if (typeof ans === 'object') {
    if ('q' in ans) return `商=${ans.q}, 余=${ans.r}`;
    if ('dividend' in ans) return `被除数=${ans.dividend}, 余=${ans.remainder}`;
    return JSON.stringify(ans);
  }
  return String(ans);
}

function ErrorCardBody({ w, strike }) {
  const tx = strike ? st.strikeText : null;
  const wIsEng = w.op && (String(w.op).startsWith('eng') || String(w.op).startsWith('chn_'));
  if (wIsEng) {
    return (
      <>
        <Text style={[st.errQ, tx]}>{w.stem}</Text>
        <View style={st.errAnsRow}>
          <Text style={[st.errLbl, tx]}>
            你的答案{' '}
            <Text style={st.errWrong}>
              {w.userAnswer !== null && w.userAnswer !== undefined ? (w.options?.[w.userAnswer] ?? w.userAnswer) : '—'}
            </Text>
          </Text>
        </View>
        <View style={st.errAnsRow}>
          <Text style={[st.errLbl, tx]}>
            正确答案 <Text style={st.errRight}>{w.options?.[w.answer] ?? w.answer}</Text>
          </Text>
        </View>
        {w.explanation ? <Text style={[st.errExpl, tx]}>💡 {w.explanation}</Text> : null}
      </>
    );
  }
  const sym = OP_SYMBOL[w.op] || '?';
  const isDivMulti = w.op === 'divRem' || w.op === 'divReverse';
  const qStr = isDivMulti
    ? `${w.left} ÷ ${w.right} = ${w.result} ... ${w.remainder}`
    : `${w.left} ${sym} ${w.right} = ${w.result}`;
  return (
    <>
      <Text style={[st.errQ, tx]}>{qStr}</Text>
      <View style={st.errAnsRow}>
        <Text style={[st.errLbl, tx]}>
          你的答案 <Text style={st.errWrong}>{fmtAnswer(w.userAnswer)}</Text>
        </Text>
      </View>
      <View style={st.errAnsRow}>
        <Text style={[st.errLbl, tx]}>
          正确答案 <Text style={st.errRight}>{fmtAnswer(w.answer)}</Text>
        </Text>
      </View>
    </>
  );
}

const REASON_ICONS = {
  '兑现奖励': '🎁', '做家务': '🧹', '课外阅读': '📚',
  '表现优秀': '⭐', '违规扣分': '⚠️', '其他': '📝',
};

const FILTER_CHIPS = [
  { key: 'all', label: '全部' },
  { key: 'math', label: '数学' },
  { key: 'english', label: '英语' },
  { key: 'chinese', label: '语文' },
];

export default function HistoryScreen() {
  const { user, pointsLog, history, saveQuizRoute } = useApp();
  const nav = useNavigation();

  const [tab, setTab] = useState('points');
  const [filter, setFilter] = useState('all');
  const [mastered, setMastered] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(MASTERED_KEY);
        if (raw) setMastered(JSON.parse(raw));
      } catch (e) {
        console.warn('load mastered errors', e);
      }
    })();
  }, []);

  const dedupedErrors = useMemo(() => {
    const seen = new Set();
    const out = [];
    history.forEach((h) => {
      const subj = h.subject;
      (h.wrongList || []).forEach((q) => {
        const k = makeQuestionKey(q);
        if (seen.has(k)) return;
        seen.add(k);
        out.push({ q, subject: subj, key: k });
      });
    });
    return out;
  }, [history]);

  const filteredErrors = useMemo(() => {
    if (filter === 'all') return dedupedErrors;
    return dedupedErrors.filter((e) => categorize(e.subject) === filter);
  }, [dedupedErrors, filter]);

  const toggleMastered = useCallback((key) => {
    setMastered((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      AsyncStorage.setItem(MASTERED_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const onFocusReview = useCallback(() => {
    const unmastered = dedupedErrors.filter((e) => !mastered[e.key]);
    if (unmastered.length === 0) return;
    const questions = shuffle(unmastered.map((e) => e.q));
    const params = { questions, subject: 'review', isReview: true };
    saveQuizRoute('Quiz', params);
    nav.navigate('Quiz', params);
  }, [dedupedErrors, mastered, nav, saveQuizRoute]);

  const errorCount = history.reduce(
    (sum, h) => sum + (h.wrongList ? h.wrongList.length : 0),
    0,
  );

  const totalPts = user?.totalPoints || 0;

  const unmasteredCount = useMemo(
    () => dedupedErrors.filter((e) => !mastered[e.key]).length,
    [dedupedErrors, mastered],
  );

  return (
    <ScrollView style={st.root} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      <View style={st.tabBar}>
        <TouchableOpacity
          style={[st.tab, tab === 'points' && st.tabOn]}
          onPress={() => setTab('points')}
          activeOpacity={0.85}
        >
          <Text style={[st.tabTxt, tab === 'points' && st.tabTxtOn]}>积分记录</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.tab, tab === 'errors' && st.tabOn]}
          onPress={() => setTab('errors')}
          activeOpacity={0.85}
        >
          <Text style={[st.tabTxt, tab === 'errors' && st.tabTxtOn]}>
            错题本 {errorCount > 0 ? `(${dedupedErrors.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'points' && (
        <>
          <Text style={st.title}>积分记录</Text>

          <View style={st.summaryCard}>
            <Text style={st.summaryLabel}>当前积分</Text>
            <Text style={st.summaryPts}>{totalPts}</Text>
          </View>

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
                    {isQuiz && e.reason && (
                      <Text style={st.cardDetail}>✓ {e.reason}</Text>
                    )}
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
        </>
      )}

      {tab === 'errors' && (
        <>
          <Text style={st.title}>错题本</Text>
          <Text style={st.errIntro}>共收录 {dedupedErrors.length} 道不重复错题 · 加油消化它们 💪</Text>

          <View style={st.chipRow}>
            {FILTER_CHIPS.map((c) => {
              const on = filter === c.key;
              return (
                <TouchableOpacity
                  key={c.key}
                  style={[st.chip, on && st.chipOn]}
                  onPress={() => setFilter(c.key)}
                  activeOpacity={0.85}
                >
                  <Text style={[st.chipTxt, on && st.chipTxtOn]}>{c.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {filteredErrors.length === 0 ? (
            <View style={st.empty}>
              <Text style={st.emptyIcon}>✨</Text>
              <Text style={st.emptyTxt}>这里没有错题</Text>
              <Text style={st.emptyDesc}>太棒了，继续保持！</Text>
            </View>
          ) : (
            filteredErrors.map(({ q, subject, key }) => {
              const info = getSubjectInfo(subject);
              const isMastered = !!mastered[key];
              return (
                <View key={key} style={[st.errCard, isMastered && st.errCardMastered]}>
                  <View style={st.errCardTop}>
                    <View style={[st.subBadge, { backgroundColor: info.color + '22' }]}>
                      <Text style={[st.subBadgeTxt, { color: info.color }, isMastered && st.strikeText]}>
                        {info.icon} {info.label}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[st.masterBtn, isMastered && st.masterBtnOn]}
                      onPress={() => toggleMastered(key)}
                      activeOpacity={0.8}
                    >
                      <Text style={[st.masterBtnTxt, isMastered && st.masterBtnTxtOn]}>
                        {isMastered ? '✓ 已掌握' : '已掌握？'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <ErrorCardBody w={q} strike={isMastered} />
                </View>
              );
            })
          )}

          {dedupedErrors.length > 0 && (
            <TouchableOpacity
              style={[st.focusBtn, unmasteredCount === 0 && st.focusBtnOff]}
              onPress={onFocusReview}
              disabled={unmasteredCount === 0}
              activeOpacity={0.88}
            >
              <Text style={st.focusIcon}>🎯</Text>
              <View style={{ flex: 1 }}>
                <Text style={st.focusTitle}>重点复习</Text>
                <Text style={st.focusDesc}>
                  {unmasteredCount > 0
                    ? `还有 ${unmasteredCount} 道未标记掌握，开始闯关`
                    : '全部已掌握，真棒！'}
                </Text>
              </View>
              <Text style={st.focusArrow}>→</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 24 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: RADIUS,
    padding: 4,
    marginBottom: 14,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: RADIUS - 2 },
  tabOn: { backgroundColor: C.primary },
  tabTxt: { fontSize: 15, fontWeight: '700', color: C.textMid },
  tabTxtOn: { color: '#fff' },

  title: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 12 },

  summaryCard: {
    backgroundColor: C.primaryBg, borderRadius: RADIUS, padding: 16,
    alignItems: 'center', marginBottom: 14, borderWidth: 1.5, borderColor: C.primary + '30',
  },
  summaryLabel: { fontSize: 13, fontWeight: '600', color: C.textMid },
  summaryPts: { fontSize: 36, fontWeight: '800', color: C.primary, marginTop: 2 },

  errIntro: { fontSize: 13, color: C.textMid, marginBottom: 10, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: C.cardWhite, borderWidth: 1.5, borderColor: C.border,
  },
  chipOn: { backgroundColor: C.accentBg, borderColor: C.accent },
  chipTxt: { fontSize: 13, fontWeight: '700', color: C.textMid },
  chipTxtOn: { color: C.accent },

  errCard: {
    backgroundColor: ERROR_CARD_BG,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 77, 0.35)',
  },
  errCardMastered: { opacity: 0.72 },
  errCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  subBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, maxWidth: '68%' },
  subBadgeTxt: { fontSize: 12, fontWeight: '800' },
  masterBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: C.cardWhite, borderWidth: 1, borderColor: C.border,
  },
  masterBtnOn: { backgroundColor: C.successBg, borderColor: C.success },
  masterBtnTxt: { fontSize: 12, fontWeight: '800', color: C.textMid },
  masterBtnTxtOn: { color: C.success },
  strikeText: { textDecorationLine: 'line-through', color: C.textLight },
  errQ: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 8, lineHeight: 22 },
  errAnsRow: { marginBottom: 4 },
  errLbl: { fontSize: 13, color: C.textMid },
  errWrong: { color: C.error, fontWeight: '800' },
  errRight: { color: C.success, fontWeight: '800' },
  errExpl: { fontSize: 12, color: C.textMid, marginTop: 6 },

  focusBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.accentBg, borderRadius: RADIUS, padding: 16, marginTop: 8,
    borderWidth: 1.5, borderColor: C.accent + '55',
  },
  focusBtnOff: { opacity: 0.55 },
  focusIcon: { fontSize: 28, marginRight: 12 },
  focusTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  focusDesc: { fontSize: 12, color: C.textMid, marginTop: 2, fontWeight: '600' },
  focusArrow: { fontSize: 20, fontWeight: '800', color: C.accent },

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
  cardDetail: { fontSize: 12, fontWeight: '600', color: C.success, marginTop: 1 },
  cardNote: { fontSize: 12, color: C.textMid, marginTop: 1 },
  cardDate: { fontSize: 11, color: C.textLight, marginTop: 3 },
  cardRight: { alignItems: 'flex-end' },
  cardPts: { fontSize: 18, fontWeight: '800' },
  cardBalance: { fontSize: 11, color: C.textLight, marginTop: 2 },
});
