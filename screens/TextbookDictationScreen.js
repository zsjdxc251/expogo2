import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { C, RADIUS, SUBJECT_COLORS } from '../lib/theme';
import { getCharsForLessons, getDictationContext, TABLE_TYPE_LABELS } from '../lib/textbookData';

export default function TextbookDictationScreen() {
  const nav = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const sc = SUBJECT_COLORS.chinese;
  const { tableType, lessonKeys } = route.params || {};

  const items = useMemo(() => getCharsForLessons(tableType, lessonKeys || []), [tableType, lessonKeys]);
  const total = items.length;

  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  const item = items[idx];
  const isXiezi = tableType === 'xiezi';
  const isCiyu = tableType === 'ciyu';
  const mainText = isXiezi || tableType === 'shizi' ? item?.char : item?.word;

  const ctx = useMemo(() => {
    if (!item) return {};
    return getDictationContext(tableType, item);
  }, [item, tableType]);

  const speakSequence = useCallback(() => {
    if (!mainText || speaking) return;
    setSpeaking(true);
    Speech.stop();
    clearTimeout(timerRef.current);

    if (isXiezi) {
      Speech.speak(mainText, {
        language: 'zh-CN', rate: 0.7,
        onDone: () => {
          timerRef.current = setTimeout(() => {
            Speech.speak(mainText, {
              language: 'zh-CN', rate: 0.7,
              onDone: () => {
                timerRef.current = setTimeout(() => {
                  Speech.speak(ctx.contextPhrase || mainText, {
                    language: 'zh-CN', rate: 0.8,
                    onDone: () => setSpeaking(false),
                    onError: () => setSpeaking(false),
                  });
                }, 500);
              },
              onError: () => setSpeaking(false),
            });
          }, 2000);
        },
        onError: () => setSpeaking(false),
      });
    } else {
      Speech.speak(mainText, {
        language: 'zh-CN', rate: 0.7,
        onDone: () => {
          timerRef.current = setTimeout(() => {
            Speech.speak(mainText, {
              language: 'zh-CN', rate: 0.7,
              onDone: () => {
                timerRef.current = setTimeout(() => {
                  Speech.speak(ctx.contextSentence || mainText, {
                    language: 'zh-CN', rate: 0.8,
                    onDone: () => setSpeaking(false),
                    onError: () => setSpeaking(false),
                  });
                }, 500);
              },
              onError: () => setSpeaking(false),
            });
          }, 2000);
        },
        onError: () => setSpeaking(false),
      });
    }
  }, [mainText, speaking, isXiezi, ctx]);

  useEffect(() => {
    if (item && !done) {
      const t = setTimeout(speakSequence, 600);
      return () => clearTimeout(t);
    }
  }, [idx, done]);

  useEffect(() => {
    return () => {
      Speech.stop();
      clearTimeout(timerRef.current);
    };
  }, []);

  const goNext = useCallback(() => {
    Speech.stop();
    clearTimeout(timerRef.current);
    setSpeaking(false);
    setShowAnswer(false);
    if (idx < total - 1) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
        setIdx(idx + 1);
        Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      });
    } else {
      setDone(true);
    }
  }, [idx, total, fadeAnim]);

  if (!item && !done) return null;

  if (done) {
    return (
      <View style={st.root}>
        <View style={st.doneBox}>
          <Text style={st.doneEmoji}>✏️</Text>
          <Text style={st.doneTitle}>听写完成！</Text>
          <Text style={st.doneDesc}>共听写了 {total} 个{isCiyu ? '词语' : '字'}</Text>
          <TouchableOpacity
            style={[st.doneBtn, { backgroundColor: sc.primary }]}
            onPress={() => nav.goBack()}
          >
            <Text style={st.doneBtnTxt}>返回</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={st.root}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => { Speech.stop(); nav.goBack(); }}>
          <Text style={[st.back, { color: sc.primary }]}>← 返回</Text>
        </TouchableOpacity>
        <Text style={st.headerTitle}>
          {TABLE_TYPE_LABELS[tableType]} 听写
        </Text>
        <Text style={st.headerProg}>{idx + 1}/{total}</Text>
      </View>

      <View style={st.progBar}>
        <View style={[st.progFill, { width: `${((idx + 1) / total) * 100}%`, backgroundColor: sc.primary }]} />
      </View>

      <Animated.View style={[st.body, { opacity: fadeAnim }]}>
        <View style={st.numberCircle}>
          <Text style={st.numberTxt}>{idx + 1}</Text>
        </View>

        <Text style={st.listenHint}>仔细听，写在纸上</Text>

        <TouchableOpacity
          style={[st.playBtn, speaking && { opacity: 0.6 }, { backgroundColor: sc.primary }]}
          onPress={speakSequence}
          disabled={speaking}
          activeOpacity={0.7}
        >
          <Text style={st.playIcon}>{speaking ? '🔊' : '▶'}</Text>
          <Text style={st.playTxt}>{speaking ? '播放中...' : '再听一遍'}</Text>
        </TouchableOpacity>

        <View style={st.contextBox}>
          {isXiezi && (
            <Text style={st.contextTxt}>
              提示：{ctx.contextPhrase || `${mainText}的${mainText}`}
            </Text>
          )}
          {isCiyu && (
            <Text style={st.contextTxt}>
              提示：{ctx.contextSentence || mainText}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={st.revealBtn}
          onPress={() => setShowAnswer(!showAnswer)}
        >
          <Text style={[st.revealTxt, { color: sc.primary }]}>
            {showAnswer ? '隐藏答案' : '查看答案'}
          </Text>
        </TouchableOpacity>

        {showAnswer && (
          <View style={[st.answerBox, { borderColor: sc.primary }]}>
            <Text style={st.answerChar}>{mainText}</Text>
            {item.pinyin && <Text style={st.answerPinyin}>{item.pinyin}</Text>}
          </View>
        )}
      </Animated.View>

      <View style={[st.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={[st.nextBtn, { backgroundColor: sc.primary }]}
          onPress={goNext}
          activeOpacity={0.8}
        >
          <Text style={st.nextTxt}>
            {idx === total - 1 ? '完成听写 ✓' : '下一个 →'}
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
    paddingHorizontal: 16, paddingVertical: 8,
  },
  back: { fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  headerProg: { fontSize: 14, fontWeight: '600', color: C.textMid },
  progBar: { height: 4, backgroundColor: C.border, marginHorizontal: 16, borderRadius: 2, marginBottom: 20 },
  progFill: { height: 4, borderRadius: 2 },
  body: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 40 },
  numberCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(51,143,155,0.1)', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  numberTxt: { fontSize: 28, fontWeight: '800', color: '#338F9B' },
  listenHint: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 24 },
  playBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 28, marginBottom: 24,
  },
  playIcon: { fontSize: 20, marginRight: 8 },
  playTxt: { fontSize: 17, fontWeight: '700', color: '#fff' },
  contextBox: { marginBottom: 20, paddingHorizontal: 16 },
  contextTxt: { fontSize: 15, color: C.textMid, textAlign: 'center', lineHeight: 22 },
  revealBtn: {
    paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 20, backgroundColor: C.card,
    marginBottom: 16,
  },
  revealTxt: { fontSize: 15, fontWeight: '600' },
  answerBox: {
    borderWidth: 2, borderRadius: RADIUS, padding: 20,
    alignItems: 'center', backgroundColor: C.card,
  },
  answerChar: { fontSize: 48, fontWeight: '900', color: C.text },
  answerPinyin: { fontSize: 18, fontWeight: '600', color: '#EB9F4A', marginTop: 4 },
  footer: {
    paddingHorizontal: 16, paddingTop: 10,
    borderTopWidth: 1, borderColor: C.border,
  },
  nextBtn: {
    height: 52, borderRadius: RADIUS,
    alignItems: 'center', justifyContent: 'center',
  },
  nextTxt: { fontSize: 17, fontWeight: '700', color: '#fff' },
  doneBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  doneEmoji: { fontSize: 64, marginBottom: 12 },
  doneTitle: { fontSize: 28, fontWeight: '800', color: C.text, marginBottom: 8 },
  doneDesc: { fontSize: 16, color: C.textMid, marginBottom: 24 },
  doneBtn: {
    width: '100%', height: 52, borderRadius: RADIUS,
    alignItems: 'center', justifyContent: 'center',
  },
  doneBtnTxt: { fontSize: 17, fontWeight: '700', color: '#fff' },
});
