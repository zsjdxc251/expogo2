import { useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { C, RADIUS, SHADOW, SHADOW_SM } from '../lib/theme';
import { ENG_TEXTBOOK_UNITS } from '../lib/eng-textbook-2b';

function SentenceRow({ line, isPlaying, onPlay }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onPlay(line.en);
  }, [line.en, onPlay, scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[st.sentenceRow, isPlaying && st.sentenceRowActive]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={st.sentenceContent}>
          <Text style={[st.sentenceEn, isPlaying && st.sentenceEnActive]}>{line.en}</Text>
          <Text style={st.sentenceZh}>{line.zh}</Text>
        </View>
        <View style={[st.playBtn, isPlaying && st.playBtnActive]}>
          <MaterialIcons
            name={isPlaying ? 'stop' : 'volume-up'}
            size={18}
            color={isPlaying ? C.onPrimary : C.primary}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function UnitListView({ onSelect }) {
  const nav = useNavigation();

  return (
    <View style={st.root}>
      <View style={st.header}>
        <TouchableOpacity
          style={st.headerBack}
          onPress={() => nav.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={C.primary} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>英语课文朗读</Text>
        <View style={st.headerSpacer} />
      </View>

      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.unitListContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={st.unitListTipRow}>
          <MaterialIcons name="menu-book" size={20} color={C.primary} />
          <Text style={st.unitListTip}>二年级下册 · 共 {ENG_TEXTBOOK_UNITS.length} 个单元</Text>
        </View>

        {ENG_TEXTBOOK_UNITS.map((unit) => {
          const totalLines = unit.sections.reduce((s, sec) => s + sec.lines.length, 0);
          return (
            <TouchableOpacity
              key={unit.key}
              style={st.unitCard}
              onPress={() => onSelect(unit.key)}
              activeOpacity={0.8}
            >
              <View style={[st.unitIconWrap, { backgroundColor: unit.bg }]}>
                <MaterialIcons name={unit.icon} size={28} color={unit.color} />
              </View>
              <View style={st.unitCardBody}>
                <Text style={st.unitCardLabel}>{unit.label}</Text>
                <Text style={st.unitCardTitle}>{unit.title}</Text>
                <Text style={st.unitCardTitleZh}>{unit.titleZh}</Text>
              </View>
              <View style={st.unitCardMeta}>
                <Text style={st.unitCardCount}>{totalLines} 句</Text>
                <MaterialIcons name="chevron-right" size={22} color={C.outline} />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function UnitDetailView({ unit }) {
  const nav = useNavigation();
  const [playingText, setPlayingText] = useState(null);

  const handlePlay = useCallback((text) => {
    Speech.stop();
    if (playingText === text) {
      setPlayingText(null);
      return;
    }
    setPlayingText(text);
    Speech.speak(text, {
      language: 'en-US',
      rate: 0.8,
      onDone: () => setPlayingText(null),
      onStopped: () => setPlayingText(null),
      onError: () => setPlayingText(null),
    });
  }, [playingText]);

  const playAllSection = useCallback((section) => {
    Speech.stop();
    const allText = section.lines.map((l) => l.en).join('. ');
    setPlayingText('__all__');
    Speech.speak(allText, {
      language: 'en-US',
      rate: 0.8,
      onDone: () => setPlayingText(null),
      onStopped: () => setPlayingText(null),
      onError: () => setPlayingText(null),
    });
  }, []);

  const totalLines = unit.sections.reduce((s, sec) => s + sec.lines.length, 0);

  return (
    <View style={st.root}>
      <View style={[st.header, { backgroundColor: unit.bg }]}>
        <TouchableOpacity
          style={st.headerBack}
          onPress={() => nav.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={unit.color} />
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <Text style={[st.headerTitle, { color: unit.color }]}>{unit.label} · {unit.title}</Text>
          <Text style={st.headerSub}>{unit.titleZh} · {totalLines} 句</Text>
        </View>
        <View style={st.headerSpacer} />
      </View>

      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.detailContent}
        showsVerticalScrollIndicator={false}
      >
        {unit.sections.map((section, si) => (
          <View key={si} style={st.sectionBlock}>
            <View style={st.sectionHeader}>
              <View style={[st.sectionDot, { backgroundColor: unit.color }]} />
              <Text style={st.sectionLabel}>{section.label}</Text>
              <TouchableOpacity
                style={[st.playAllBtn, { backgroundColor: unit.bg }]}
                onPress={() => playAllSection(section)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="play-circle-filled" size={16} color={unit.color} />
                <Text style={[st.playAllTxt, { color: unit.color }]}>播放全部</Text>
              </TouchableOpacity>
            </View>
            {section.lines.map((line, li) => (
              <SentenceRow
                key={li}
                line={line}
                isPlaying={playingText === line.en}
                onPlay={handlePlay}
              />
            ))}
          </View>
        ))}

        <View style={st.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

export default function TextbookEnglishScreen() {
  const route = useRoute();
  const [selectedUnit, setSelectedUnit] = useState(route.params?.unitKey || null);

  const unit = ENG_TEXTBOOK_UNITS.find((u) => u.key === selectedUnit);

  if (unit) {
    return <UnitDetailView unit={unit} />;
  }

  return <UnitListView onSelect={setSelectedUnit} />;
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  headerBack: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: 18, fontWeight: '800', color: C.text, textAlign: 'center',
  },
  headerSub: { fontSize: 12, color: C.textMid, marginTop: 2 },
  headerSpacer: { width: 40 },

  scroll: { flex: 1 },

  unitListContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  unitListTipRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.primaryBg, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: RADIUS, marginBottom: 16,
  },
  unitListTip: { fontSize: 14, fontWeight: '600', color: C.primary },

  unitCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.cardWhite, borderRadius: RADIUS, padding: 16,
    marginBottom: 10, ...SHADOW_SM,
  },
  unitIconWrap: {
    width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  unitCardBody: { flex: 1, marginLeft: 14 },
  unitCardLabel: { fontSize: 12, fontWeight: '700', color: C.textLight },
  unitCardTitle: { fontSize: 17, fontWeight: '800', color: C.text, marginTop: 1 },
  unitCardTitleZh: { fontSize: 13, color: C.textMid, marginTop: 1 },
  unitCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  unitCardCount: { fontSize: 12, fontWeight: '600', color: C.outline },

  detailContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },

  sectionBlock: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionLabel: { flex: 1, fontSize: 16, fontWeight: '800', color: C.text },
  playAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
  },
  playAllTxt: { fontSize: 12, fontWeight: '700' },

  sentenceRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.cardWhite, borderRadius: RADIUS, padding: 14,
    marginBottom: 8, borderWidth: 1.5, borderColor: C.border,
  },
  sentenceRowActive: {
    borderColor: C.primary, backgroundColor: C.primaryBg,
  },
  sentenceContent: { flex: 1, marginRight: 10 },
  sentenceEn: { fontSize: 16, fontWeight: '600', color: C.text, lineHeight: 22 },
  sentenceEnActive: { color: C.primary },
  sentenceZh: { fontSize: 13, color: C.textMid, marginTop: 4, lineHeight: 18 },

  playBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  playBtnActive: { backgroundColor: C.primary },

  bottomSpacer: { height: 40 },
});
