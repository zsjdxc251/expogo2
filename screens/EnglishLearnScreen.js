import { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { C, RADIUS } from '../lib/theme';
import { ENG_TOPICS, LEARN_CARDS } from '../lib/english';
import SpeakButton from '../components/SpeakButton';

export default function EnglishLearnScreen() {
  const route = useRoute();
  const nav = useNavigation();
  const topicKey = route.params?.topicKey;
  const onBack = useCallback(() => nav.goBack(), [nav]);
  const onPractice = useCallback((k) => nav.replace('EngQuiz', { topicKey: k }), [nav]);
  const topic = ENG_TOPICS[topicKey] || { icon: '📖', label: topicKey || '英语', color: C.primary };
  const cards = LEARN_CARDS[topicKey] || [];
  const [idx, setIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const total = cards.length;
  const card = cards[idx];
  const isLast = idx === total - 1;

  const animateTo = useCallback((nextIdx) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setIdx(nextIdx);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  const goPrev = () => { if (idx > 0) animateTo(idx - 1); };
  const goNext = () => { if (idx < total - 1) animateTo(idx + 1); };

  if (!card) return null;

  return (
    <View style={st.root}>
      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity onPress={onBack}><Text style={st.backTxt}>← 返回</Text></TouchableOpacity>
        <Text style={st.headerTitle}>{topic.icon} {topic.label}</Text>
        <Text style={st.headerProg}>{idx + 1}/{total}</Text>
      </View>

      {/* Progress dots */}
      <View style={st.dots}>
        {cards.map((_, i) => (
          <View key={i} style={[st.dot, i === idx && { backgroundColor: topic.color, width: 20 }]} />
        ))}
      </View>

      {/* Card */}
      <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[st.card, { opacity: fadeAnim, borderTopColor: topic.color }]}>
          <Text style={st.cardEmoji}>{card.emoji}</Text>
          <Text style={st.cardTitle}>{card.title}</Text>

          {/* Body text */}
          <View style={st.bodyBox}>
            <Text style={st.bodyText}>{card.body}</Text>
          </View>

          {/* Highlight rule */}
          {card.highlight ? (
            <View style={[st.highlight, { backgroundColor: topic.bg, borderLeftColor: topic.color }]}>
              <Text style={[st.highlightText, { color: topic.color }]}>💡 {card.highlight}</Text>
            </View>
          ) : null}

          {/* Visual diagram */}
          {card.visual ? (
            <View style={st.visualBox}>
              {card.visual.lines.map((line, i) => (
                <Text key={i} style={st.visualLine}>{line}</Text>
              ))}
            </View>
          ) : null}

          {/* Examples */}
          {card.examples && card.examples.length > 0 ? (
            <View style={st.exSection}>
              <Text style={st.exTitle}>📝 例句</Text>
              {card.examples.map((ex, i) => (
                <View key={i} style={st.exItem}>
                  <View style={st.exEnRow}>
                    <Text style={[st.exEn, { flex: 1 }]}>{ex.en}</Text>
                    <SpeakButton text={ex.en} size="small" />
                  </View>
                  <Text style={st.exZh}>{ex.zh}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      {/* Navigation buttons */}
      <View style={st.navRow}>
        <TouchableOpacity
          style={[st.navBtn, idx === 0 && st.navBtnDisabled]}
          onPress={goPrev}
          disabled={idx === 0}
        >
          <Text style={[st.navBtnTxt, idx === 0 && st.navBtnTxtOff]}>← 上一张</Text>
        </TouchableOpacity>

        {isLast ? (
          <TouchableOpacity
            style={[st.navBtn, st.practiceBtn, { backgroundColor: topic.color }]}
            onPress={() => onPractice(topicKey)}
            activeOpacity={0.8}
          >
            <Text style={st.practiceBtnTxt}>去练习 →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[st.navBtn, { backgroundColor: topic.color }]}
            onPress={goNext}
            activeOpacity={0.8}
          >
            <Text style={st.navBtnTxtW}>下一张 →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6,
  },
  backTxt: { fontSize: 15, fontWeight: '600', color: C.primary },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  headerProg: { fontSize: 14, fontWeight: '600', color: C.textMid },

  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  dot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(196,196,196,0.5)',
    marginHorizontal: 3,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 20 },

  card: {
    backgroundColor: C.card, borderRadius: RADIUS, padding: 24,
    borderTopWidth: 4,
  },
  cardEmoji: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 22, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: 16 },

  bodyBox: { marginBottom: 16 },
  bodyText: { fontSize: 16, lineHeight: 26, color: C.text },

  highlight: {
    borderLeftWidth: 4, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
    marginBottom: 16,
  },
  highlightText: { fontSize: 15, fontWeight: '700', lineHeight: 22 },

  visualBox: {
    backgroundColor: 'rgba(229,229,229,0.5)', borderRadius: 12, padding: 14, marginBottom: 16,
    alignItems: 'center',
  },
  visualLine: { fontSize: 16, fontFamily: 'monospace', lineHeight: 24, color: C.text },

  exSection: { marginTop: 4 },
  exTitle: { fontSize: 15, fontWeight: '700', color: C.textMid, marginBottom: 8 },
  exItem: {
    backgroundColor: 'rgba(229,229,229,0.5)', borderRadius: 12, padding: 12, marginBottom: 8,
  },
  exEnRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  exEn: { fontSize: 16, fontWeight: '600', color: C.primary },
  exZh: { fontSize: 14, color: C.textMid },

  navRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  navBtn: {
    flex: 1, height: 48, borderRadius: RADIUS, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card, marginHorizontal: 4,
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnTxt: { fontSize: 15, fontWeight: '700', color: C.text },
  navBtnTxtOff: { color: C.textLight },
  navBtnTxtW: { fontSize: 15, fontWeight: '700', color: '#fff' },
  practiceBtn: { flex: 1.5 },
  practiceBtnTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
