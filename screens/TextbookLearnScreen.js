import { useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { C, RADIUS, SUBJECT_COLORS } from '../lib/theme';
import { getCharsForLessons, getWordInfo, TABLE_TYPE_LABELS } from '../lib/textbookData';
import StrokeAnimation from '../components/StrokeAnimation';

export default function TextbookLearnScreen() {
  const nav = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const sc = SUBJECT_COLORS.chinese;
  const { tableType, lessonKeys } = route.params || {};

  const items = useMemo(() => getCharsForLessons(tableType, lessonKeys || []), [tableType, lessonKeys]);
  const total = items.length;

  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const item = items[idx];

  const animateTo = useCallback((nextIdx) => {
    Speech.stop();
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setIdx(nextIdx);
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  const goPrev = () => { if (idx > 0) animateTo(idx - 1); };
  const goNext = () => {
    if (idx < total - 1) animateTo(idx + 1);
    else setDone(true);
  };

  const speak = useCallback((text) => {
    Speech.stop();
    Speech.speak(text, { language: 'zh-CN', rate: 0.75 });
  }, []);

  if (!item && !done) return null;

  if (done) {
    return (
      <View style={[st.root, { paddingTop: insets.top }]}>
        <View style={st.doneBox}>
          <Text style={st.doneEmoji}>🎉</Text>
          <Text style={st.doneTitle}>学习完成！</Text>
          <Text style={st.doneDesc}>
            共学习了 {total} 个{tableType === 'ciyu' ? '词语' : '字'}
          </Text>
          <TouchableOpacity
            style={[st.doneBtn, { backgroundColor: sc.primary }]}
            onPress={() => nav.navigate('TextbookDictation', { tableType, lessonKeys })}
          >
            <Text style={st.doneBtnTxt}>去听写 ✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.doneBtnSec} onPress={() => nav.goBack()}>
            <Text style={[st.doneBtnSecTxt, { color: sc.primary }]}>返回</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isChar = tableType === 'shizi' || tableType === 'xiezi';
  const char = isChar ? item.char : null;
  const pinyin = isChar ? item.pinyin : null;
  const word = !isChar ? item.word : null;
  const info = char ? getWordInfo(char) : null;

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Text style={[st.back, { color: sc.primary }]}>← 返回</Text>
        </TouchableOpacity>
        <Text style={st.headerTitle}>{TABLE_TYPE_LABELS[tableType]}</Text>
        <Text style={st.headerProg}>{idx + 1}/{total}</Text>
      </View>

      <View style={st.progBar}>
        <View style={[st.progFill, { width: `${((idx + 1) / total) * 100}%`, backgroundColor: sc.primary }]} />
      </View>

      <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {isChar ? (
            <CharCard
              char={char}
              pinyin={pinyin}
              info={info}
              showStroke={tableType === 'xiezi'}
              onSpeak={speak}
              sc={sc}
            />
          ) : (
            <WordCard word={word} onSpeak={speak} sc={sc} />
          )}
        </Animated.View>
      </ScrollView>

      <View style={[st.navRow, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={[st.navBtn, idx === 0 && st.navBtnOff]}
          onPress={goPrev}
          disabled={idx === 0}
        >
          <Text style={[st.navBtnTxt, idx === 0 && { color: C.textLight }]}>← 上一个</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.navBtn, { backgroundColor: sc.primary }]}
          onPress={goNext}
          activeOpacity={0.8}
        >
          <Text style={st.navBtnTxtW}>
            {idx === total - 1 ? '完成学习 ✓' : '下一个 →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CharCard({ char, pinyin, info, showStroke, onSpeak, sc }) {
  return (
    <View style={st.card}>
      <Text style={st.pinyin}>{pinyin}</Text>
      <TouchableOpacity onPress={() => onSpeak(char)} activeOpacity={0.7}>
        <Text style={st.bigChar}>{char}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[st.speakBtn, { backgroundColor: sc.bg }]} onPress={() => onSpeak(char)}>
        <Text style={[st.speakTxt, { color: sc.primary }]}>🔊 点击朗读</Text>
      </TouchableOpacity>

      {showStroke && (
        <View style={st.strokeSection}>
          <Text style={st.sectionTitle}>✍️ 笔顺演示</Text>
          <StrokeAnimation char={char} size={180} />
        </View>
      )}

      <View style={st.section}>
        <Text style={st.sectionTitle}>{info?.emoji || '📝'} 组词</Text>
        {(info?.words || []).map((w, i) => (
          <View key={i} style={st.wordRow}>
            <Text style={st.wordText}>
              {w.word.split('').map((c, ci) => (
                <Text
                  key={ci}
                  style={ci === w.highlight ? st.wordHighlight : st.wordNormal}
                >
                  {c}
                </Text>
              ))}
            </Text>
            <TouchableOpacity onPress={() => onSpeak(w.word)} style={st.miniSpeak}>
              <Text>🔊</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={[st.meaningBox, { backgroundColor: sc.bg }]}>
        <Text style={st.meaningLabel}>💡 释义</Text>
        <Text style={st.meaningTxt}>{info?.meaning || `学习"${char}"`}</Text>
      </View>
    </View>
  );
}

function WordCard({ word, onSpeak, sc }) {
  const WORD_MEANINGS = {
    "春天": "一年中的第一个季节，万物复苏",
    "寻找": "到处去找，想要找到",
    "眉毛": "长在眼睛上面的毛",
    "野花": "长在野外的花",
    "柳枝": "柳树的枝条",
    "桃花": "桃树开的粉色花",
    "鲜花": "新鲜好看的花",
    "先生": "对人的尊称",
    "原来": "一开始的时候，表示发现",
    "大叔": "对年长男性的称呼",
    "太太": "对已婚女性的称呼",
    "做客": "去别人家里玩",
    "惊奇": "感到非常奇怪和意外",
    "快活": "开心快乐的意思",
    "美好": "非常好，让人高兴",
    "礼物": "送给别人的东西",
    "植树": "种树",
    "故事": "有趣的事情的讲述",
    "生活": "日常的吃穿住行",
    "美食": "好吃的食物",
    "茄子": "一种紫色的蔬菜",
    "烤鸭": "烤制的鸭子，北京特色",
    "羊肉": "羊身上的肉",
    "蛋炒饭": "用鸡蛋炒的米饭",
    "钱币": "古代用来买东西的钱",
    "钱财": "钱和值钱的东西",
    "有关": "和某件事有联系",
    "样子": "外表的形态",
    "甲骨文": "刻在龟壳和骨头上的古代文字",
    "水煮鱼": "用水煮的鱼，一道菜",
    "碧空如洗": "天空像洗过一样蓝",
    "万里无云": "天上一片云都没有",
    "动物": "会动的生物",
    "新奇": "新鲜而有趣",
    "市场": "买卖东西的地方",
    "夺目": "光彩照人，很吸引目光",
    "力量": "力气，能量",
    "微笑": "轻轻地笑",
    "古迹": "古代留下来的建筑",
    "传统": "一代一代传下来的习惯",
    "节日": "庆祝的日子",
    "团圆": "分开的人又聚在一起",
    "热闹": "很多人很开心的样子",
    "指南针": "能指出南北方向的工具",
    "造纸术": "古代发明的造纸方法",
  };
  const meaning = WORD_MEANINGS[word] || `"${word}"是一个常用词语`;

  return (
    <View style={st.card}>
      <TouchableOpacity onPress={() => onSpeak(word)} activeOpacity={0.7}>
        <Text style={st.bigWord}>{word}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[st.speakBtn, { backgroundColor: sc.bg }]} onPress={() => onSpeak(word)}>
        <Text style={[st.speakTxt, { color: sc.primary }]}>🔊 点击朗读</Text>
      </TouchableOpacity>

      <View style={[st.meaningBox, { backgroundColor: sc.bg, marginTop: 20 }]}>
        <Text style={st.meaningLabel}>📖 词义</Text>
        <Text style={st.meaningTxt}>{meaning}</Text>
      </View>

      <View style={[st.meaningBox, { backgroundColor: 'rgba(235,159,74,0.1)', marginTop: 12 }]}>
        <Text style={st.meaningLabel}>💡 通俗解释</Text>
        <Text style={st.meaningTxt}>{meaning}</Text>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  back: { fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  headerProg: { fontSize: 14, fontWeight: '600', color: C.textMid },
  progBar: { height: 4, backgroundColor: C.border, marginHorizontal: 16, borderRadius: 2 },
  progFill: { height: 4, borderRadius: 2 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 20 },
  card: {
    backgroundColor: C.card, borderRadius: RADIUS, padding: 24,
    borderTopWidth: 4, borderTopColor: '#338F9B',
  },
  pinyin: { fontSize: 22, fontWeight: '600', color: '#EB9F4A', textAlign: 'center', marginBottom: 4 },
  bigChar: { fontSize: 80, fontWeight: '900', color: C.text, textAlign: 'center', lineHeight: 100 },
  bigWord: { fontSize: 48, fontWeight: '900', color: C.text, textAlign: 'center', lineHeight: 64, marginVertical: 8 },
  speakBtn: {
    alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, marginTop: 8,
  },
  speakTxt: { fontSize: 15, fontWeight: '600' },
  strokeSection: { marginTop: 20, alignItems: 'center' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 10 },
  wordRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(229,229,229,0.4)', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 14, marginBottom: 6,
  },
  wordText: { fontSize: 20 },
  wordHighlight: { fontSize: 26, fontWeight: '900', color: '#E06B6B' },
  wordNormal: { fontSize: 20, fontWeight: '500', color: C.text },
  miniSpeak: { padding: 4 },
  meaningBox: {
    borderRadius: 12, padding: 14, marginTop: 16,
  },
  meaningLabel: { fontSize: 14, fontWeight: '700', color: C.textMid, marginBottom: 4 },
  meaningTxt: { fontSize: 16, lineHeight: 24, color: C.text },
  navRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingTop: 10, gap: 10,
    borderTopWidth: 1, borderColor: C.border,
  },
  navBtn: {
    flex: 1, height: 48, borderRadius: RADIUS,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card,
  },
  navBtnOff: { opacity: 0.4 },
  navBtnTxt: { fontSize: 15, fontWeight: '700', color: C.text },
  navBtnTxtW: { fontSize: 15, fontWeight: '700', color: '#fff' },
  doneBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  doneEmoji: { fontSize: 64, marginBottom: 12 },
  doneTitle: { fontSize: 28, fontWeight: '800', color: C.text, marginBottom: 8 },
  doneDesc: { fontSize: 16, color: C.textMid, marginBottom: 24 },
  doneBtn: {
    width: '100%', height: 52, borderRadius: RADIUS,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  doneBtnTxt: { fontSize: 17, fontWeight: '700', color: '#fff' },
  doneBtnSec: {
    width: '100%', height: 48, borderRadius: RADIUS,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card,
  },
  doneBtnSecTxt: { fontSize: 15, fontWeight: '700' },
});
