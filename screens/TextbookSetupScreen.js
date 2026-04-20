import { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, RADIUS, SUBJECT_COLORS } from '../lib/theme';
import { getLessons, getAvailableTableTypes, TABLE_TYPE_LABELS } from '../lib/textbookData';

const TABLE_TYPES = [
  { key: 'shizi', icon: '📖', desc: '认读生字，学习拼音和组词' },
  { key: 'xiezi', icon: '✍️', desc: '学写生字，笔顺动画演示' },
  { key: 'ciyu', icon: '📚', desc: '词语学习，理解词义' },
];

export default function TextbookSetupScreen() {
  const nav = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const isDictation = route.params?.mode === 'dictation';
  const sc = SUBJECT_COLORS.chinese;

  const [selectedLessons, setSelectedLessons] = useState([]);
  const [tableType, setTableType] = useState('shizi');

  const allLessons = useMemo(() => ({
    shizi: getLessons('shizi'),
    xiezi: getLessons('xiezi'),
    ciyu: getLessons('ciyu'),
  }), []);

  const currentLessons = allLessons[tableType] || [];

  const toggleLesson = useCallback((key) => {
    setSelectedLessons((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  const selectAll = useCallback(() => {
    const allKeys = currentLessons.map((l) => l.key);
    const allSelected = allKeys.every((k) => selectedLessons.includes(k));
    if (allSelected) {
      setSelectedLessons((prev) => prev.filter((k) => !allKeys.includes(k)));
    } else {
      setSelectedLessons((prev) => [...new Set([...prev, ...allKeys])]);
    }
  }, [currentLessons, selectedLessons]);

  const selectedCount = currentLessons.filter((l) => selectedLessons.includes(l.key)).length;
  const totalChars = currentLessons
    .filter((l) => selectedLessons.includes(l.key))
    .reduce((s, l) => s + l.count, 0);

  const canStart = selectedCount > 0;
  const isShizi = tableType === 'shizi' && !isDictation;

  const onStart = useCallback(() => {
    if (!canStart) return;
    const target = isDictation ? 'TextbookDictation' : 'TextbookLearn';
    nav.navigate(target, { tableType, lessonKeys: selectedLessons });
  }, [canStart, isDictation, tableType, selectedLessons, nav]);

  const onCharTable = useCallback(() => {
    if (!canStart) return;
    nav.navigate('CharTable', { tableType, lessonKeys: selectedLessons });
  }, [canStart, tableType, selectedLessons, nav]);

  const onCharPractice = useCallback(() => {
    if (!canStart) return;
    nav.navigate('CharPractice', { tableType, lessonKeys: selectedLessons });
  }, [canStart, tableType, selectedLessons, nav]);

  const allSelected = currentLessons.length > 0 && currentLessons.every((l) => selectedLessons.includes(l.key));

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Text style={[st.back, { color: sc.primary }]}>← 返回</Text>
        </TouchableOpacity>
        <Text style={st.title}>{isDictation ? '课文听写' : '课文学习'}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={st.secLabel}>选择类型</Text>
        <View style={st.typeRow}>
          {TABLE_TYPES.map((t) => {
            const active = tableType === t.key;
            if (isDictation && t.key === 'shizi') return null;
            return (
              <TouchableOpacity
                key={t.key}
                style={[st.typeCard, active && { borderColor: sc.primary, backgroundColor: sc.bg }]}
                onPress={() => { setTableType(t.key); setSelectedLessons([]); }}
                activeOpacity={0.7}
              >
                <Text style={st.typeIcon}>{t.icon}</Text>
                <Text style={[st.typeName, active && { color: sc.primary }]}>
                  {TABLE_TYPE_LABELS[t.key]}
                </Text>
                <Text style={st.typeDesc}>{t.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={st.secRow}>
          <Text style={st.secLabel}>选择课文（可多选）</Text>
          <TouchableOpacity onPress={selectAll}>
            <Text style={[st.selectAll, { color: sc.primary }]}>
              {allSelected ? '取消全选' : '全选'}
            </Text>
          </TouchableOpacity>
        </View>

        {selectedCount > 0 && (
          <View style={[st.summary, { backgroundColor: sc.bg }]}>
            <Text style={[st.summaryTxt, { color: sc.primary }]}>
              已选 {selectedCount} 课，共 {totalChars} 个{tableType === 'ciyu' ? '词语' : '字'}
            </Text>
          </View>
        )}

        {currentLessons.map((lesson) => {
          const on = selectedLessons.includes(lesson.key);
          return (
            <TouchableOpacity
              key={lesson.key}
              style={[st.lessonRow, on && { backgroundColor: sc.bg, borderColor: sc.primary }]}
              onPress={() => toggleLesson(lesson.key)}
              activeOpacity={0.7}
            >
              <View style={[st.check, on && { backgroundColor: sc.primary, borderColor: sc.primary }]}>
                {on && <Text style={st.checkMark}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[st.lessonKey, on && { color: sc.primary }]}>{lesson.key}</Text>
                <Text style={st.lessonName}>{lesson.name}</Text>
              </View>
              <Text style={st.lessonCount}>{lesson.count}{tableType === 'ciyu' ? '词' : '字'}</Text>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[st.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {isShizi && (
          <View style={st.shiziRow}>
            <TouchableOpacity
              style={[st.shiziBtnAlt, { borderColor: canStart ? '#4CAF7D' : C.border }]}
              onPress={onCharTable}
              disabled={!canStart}
              activeOpacity={0.8}
            >
              <Text style={[st.shiziBtnAltTxt, { color: canStart ? '#4CAF7D' : C.textLight }]}>
                📋 认字浏览
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[st.shiziBtnAlt, { borderColor: canStart ? '#D4839A' : C.border }]}
              onPress={onCharPractice}
              disabled={!canStart}
              activeOpacity={0.8}
            >
              <Text style={[st.shiziBtnAltTxt, { color: canStart ? '#D4839A' : C.textLight }]}>
                📝 看字选拼音
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={[st.startBtn, { backgroundColor: canStart ? sc.primary : C.border }]}
          onPress={onStart}
          disabled={!canStart}
          activeOpacity={0.8}
        >
          <Text style={st.startTxt}>
            {isDictation ? '开始听写' : '开始学习'} ({totalChars}{tableType === 'ciyu' ? '词' : '字'})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  back: { fontSize: 15, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '800', color: C.text },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  secLabel: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 16, marginBottom: 10 },
  secRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 10 },
  selectAll: { fontSize: 14, fontWeight: '600' },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeCard: {
    flex: 1, padding: 12, borderRadius: RADIUS, backgroundColor: C.card,
    borderWidth: 2, borderColor: 'transparent', alignItems: 'center',
  },
  typeIcon: { fontSize: 28, marginBottom: 4 },
  typeName: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  typeDesc: { fontSize: 11, color: C.textMid, textAlign: 'center' },
  summary: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, marginBottom: 10 },
  summaryTxt: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  lessonRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 6,
    borderRadius: RADIUS, backgroundColor: C.card, borderWidth: 1.5, borderColor: 'transparent',
  },
  check: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '800' },
  lessonKey: { fontSize: 15, fontWeight: '700', color: C.text },
  lessonName: { fontSize: 13, color: C.textMid, marginTop: 1 },
  lessonCount: { fontSize: 13, fontWeight: '600', color: C.textMid },
  footer: {
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderColor: C.border, backgroundColor: C.bg,
  },
  shiziRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  shiziBtnAlt: {
    flex: 1, height: 44, borderRadius: RADIUS, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, backgroundColor: C.card,
  },
  shiziBtnAltTxt: { fontSize: 14, fontWeight: '700' },
  startBtn: {
    height: 52, borderRadius: RADIUS, alignItems: 'center', justifyContent: 'center',
  },
  startTxt: { fontSize: 17, fontWeight: '700', color: '#fff' },
});
