import { useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { C, SUBJECTS, SHADOW, SHADOW_SM } from '../lib/theme';
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

/** Maps existing log data to Stitch row visuals (Quiz / Task / Purchase / Reward). */
function getLogEntryVisual(e) {
  if (e.source === 'quiz') {
    return {
      icon: 'quiz',
      circleBg: C.primaryContainer,
      iconColor: '#ffffff',
      iconOpacity: 1,
    };
  }
  if (e.reason === '兑现奖励') {
    return {
      icon: 'redeem',
      circleBg: C.tertiaryContainer,
      iconColor: '#ffffff',
      iconOpacity: 1,
    };
  }
  if (e.reason === '违规扣分') {
    return {
      icon: 'shopping-cart',
      circleBg: C.surfaceContainerHighest,
      iconColor: C.text,
      iconOpacity: 0.8,
    };
  }
  return {
    icon: 'task-alt',
    circleBg: C.secondaryContainer,
    iconColor: C.onSecondary,
    iconOpacity: 1,
  };
}

const PRIMARY_DIM_BORDER_10 = 'rgba(126, 212, 224, 0.1)';
const ERROR_10 = 'rgba(186, 26, 26, 0.1)';

const SHADOW_ERR = {
  shadowColor: 'rgba(186, 26, 26, 0.08)',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 1,
  shadowRadius: 20,
  elevation: 3,
};

const SHADOW_LOG = {
  ...SHADOW_SM,
  shadowColor: 'rgba(51, 143, 155, 0.05)',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 12,
  elevation: 2,
};

const CYAN_600 = '#0891b2';
const CYAN_50 = '#ecfeff';

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
    (sum, h) => sum + (h.wrongList ? h.wrongList.length : 0),
    0,
  );

  const totalPts = user?.totalPoints || 0;
  const lv = getLevel(totalPts);

  return (
    <ScrollView style={st.root} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      <Text style={st.title}>积分历史</Text>

      <View style={st.summaryCard}>
        <View style={st.summaryRow}>
          <View style={st.summaryStarWrap}>
            <MaterialIcons name="stars" size={30} color={C.secondaryContainer} />
          </View>
          <View style={st.summaryCenter}>
            <Text style={st.summaryLabel}>当前积分</Text>
            <Text style={st.summaryPts}>{totalPts.toLocaleString()}</Text>
          </View>
          <View style={st.levelBadge}>
            <Text style={st.levelBadgeTxt}>{`等级 ${lv.level}`}</Text>
          </View>
        </View>
      </View>

      {errorCount > 0 && (
        <TouchableOpacity style={st.errCard} activeOpacity={0.88} onPress={onErrorReview}>
          <View style={st.errRow}>
            <View style={st.errIconCircle}>
              <MaterialIcons name="assignment-late" size={24} color="#ffffff" />
            </View>
            <View style={st.errMiddle}>
              <Text style={st.errTitle}>错题复习</Text>
              <Text style={st.errDesc}>{`还有 ${errorCount} 道错题待复习`}</Text>
            </View>
            <View style={st.errGoBtn}>
              <Text style={st.errGoBtnTxt}>立即复习</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {pointsLog.length > 0 && <Text style={st.secTitle}>收支明细</Text>}

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
          const vis = getLogEntryVisual(e);
          const isAdd = e.type === 'add';
          return (
            <View key={e.id} style={st.logCard}>
              <View style={[st.logIconWrap, { backgroundColor: vis.circleBg }]}>
                <MaterialIcons
                  name={vis.icon}
                  size={22}
                  color={vis.iconColor}
                  style={{ opacity: vis.iconOpacity }}
                />
              </View>
              <View style={st.cardCenter}>
                <Text style={st.cardReason}>
                  {isQuiz ? (sub?.label || '练习') : e.reason}
                </Text>
                {isQuiz && e.reason && <Text style={st.cardDetail}>{e.reason}</Text>}
                {e.note ? <Text style={st.cardNote}>{e.note}</Text> : null}
                <Text style={st.cardDate}>{fmtDate(e.date)}</Text>
              </View>
              <View style={st.cardRight}>
                <Text
                  style={[
                    st.cardPts,
                    { color: isAdd ? C.primary : C.error },
                  ]}
                >
                  {isAdd ? '+' : '-'}
                  {e.amount}
                </Text>
                <Text style={st.cardBalance}>{`余额: ${e.balance.toLocaleString()}`}</Text>
              </View>
            </View>
          );
        })
      )}

      {pointsLog.length > 0 && (
        <TouchableOpacity style={st.loadMore} activeOpacity={0.75} onPress={() => {}}>
          <Text style={st.loadMoreTxt}>加载更多记录</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.headerBg },
  content: { padding: 20, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 16 },

  summaryCard: {
    backgroundColor: C.cardWhite,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: PRIMARY_DIM_BORDER_10,
    ...SHADOW,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryStarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 220, 189, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCenter: {
    flex: 1,
    marginLeft: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: C.textLight,
  },
  summaryPts: {
    fontSize: 20,
    fontWeight: '600',
    color: C.primary,
    marginTop: 2,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: CYAN_50,
  },
  levelBadgeTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: CYAN_600,
  },

  errCard: {
    backgroundColor: C.errorContainer,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: ERROR_10,
    ...SHADOW_ERR,
  },
  errRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  errMiddle: { flex: 1 },
  errTitle: { fontSize: 16, fontWeight: '600', color: C.onErrorContainer },
  errDesc: { fontSize: 14, color: 'rgba(147, 0, 10, 0.8)', marginTop: 2 },
  errGoBtn: {
    backgroundColor: C.error,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: 'rgb(147,0,10)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  errGoBtnTxt: { fontSize: 14, fontWeight: '700', color: '#ffffff' },

  secTitle: { fontSize: 18, fontWeight: '600', color: C.text, marginBottom: 12, marginTop: 0 },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTxt: { fontSize: 17, fontWeight: '600', color: C.textMid, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: C.textLight, marginTop: 4, textAlign: 'center' },

  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cardWhite,
    borderRadius: 20,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(224, 227, 228, 0.5)',
    ...SHADOW_LOG,
  },
  logIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardCenter: { flex: 1 },
  cardReason: { fontSize: 14, fontWeight: '700', color: C.text },
  cardDetail: { fontSize: 12, fontWeight: '600', color: C.success, marginTop: 2 },
  cardNote: { fontSize: 12, color: C.textMid, marginTop: 1 },
  cardDate: { fontSize: 12, color: C.textLight, marginTop: 3 },
  cardRight: { alignItems: 'flex-end' },
  cardPts: { fontSize: 16, fontWeight: '700' },
  cardBalance: { fontSize: 10, color: C.textLight, marginTop: 2 },

  loadMore: {
    width: '100%',
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: C.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
});
