import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import { C, RADIUS, SUBJECT_COLORS, SHADOW } from '../lib/theme';
import { getCharsForLessons, getWordInfo } from '../lib/textbookData';
import { useApp } from '../lib/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const COLS = 5;
const sc = SUBJECT_COLORS.chinese;

function getItemKey(item) {
  if (!item) return '';
  return item.char || item.word || '';
}

function getItemPinyin(item) {
  if (!item) return '';
  return item.pinyin || '';
}

function normalizeWordLabels(words) {
  if (!words || !Array.isArray(words)) return [];
  return words
    .map((w) => {
      if (typeof w === 'string') return w;
      if (w && typeof w.word === 'string') return w.word;
      return '';
    })
    .filter(Boolean);
}

export default function CharTableScreen() {
  const nav = useNavigation();
  const route = useRoute();
  const { unfamiliarChars, addUnfamiliar, removeUnfamiliar, toggleUnfamiliar } = useApp();
  const { tableType, lessonKeys } = route.params || {};

  const [viewMode, setViewMode] = useState('flashcard');
  const [cardIdx, setCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState({ known: 0, unknown: 0 });
  const [finished, setFinished] = useState(false);
  const [reviewDeck, setReviewDeck] = useState(null);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const knownScale = useRef(new Animated.Value(1)).current;
  const unknownScale = useRef(new Animated.Value(1)).current;

  const [showAllPinyin, setShowAllPinyin] = useState(false);
  const [revealedChars, setRevealedChars] = useState({});
  const [filterUnfamiliar, setFilterUnfamiliar] = useState(false);

  const allChars = useMemo(
    () => getCharsForLessons(tableType || 'shizi', lessonKeys || []),
    [tableType, lessonKeys],
  );

  const baseOrdered = useMemo(() => {
    const uf = allChars.filter((c) => unfamiliarChars.includes(getItemKey(c)));
    const rest = allChars.filter((c) => !unfamiliarChars.includes(getItemKey(c)));
    return [...uf, ...rest];
  }, [allChars, unfamiliarChars]);

  const orderedChars = reviewDeck ?? baseOrdered;

  const currentChar = orderedChars[cardIdx];

  const lookupKey = useMemo(() => {
    if (!currentChar) return '';
    const k = getItemKey(currentChar);
    return k.length <= 1 ? k : k[0];
  }, [currentChar]);

  const wordInfo = useMemo(
    () => (lookupKey ? getWordInfo(lookupKey) : null),
    [lookupKey],
  );

  const wordLabels = useMemo(() => normalizeWordLabels(wordInfo?.words), [wordInfo]);

  const flipToFront = useCallback(() => {
    setIsFlipped(false);
    Animated.spring(flipAnim, { toValue: 0, friction: 8, useNativeDriver: true }).start();
  }, [flipAnim]);

  const flipToBack = useCallback(() => {
    setIsFlipped(true);
    Animated.spring(flipAnim, { toValue: 1, friction: 8, useNativeDriver: true }).start();
  }, [flipAnim]);

  const toggleFlip = useCallback(() => {
    if (isFlipped) flipToFront();
    else flipToBack();
  }, [isFlipped, flipToFront, flipToBack]);

  useEffect(() => {
    flipToFront();
  }, [cardIdx, flipToFront]);

  const speak = useCallback((text) => {
    if (!text) return;
    Speech.stop();
    Speech.speak(text, { language: 'zh-CN', rate: 0.7 });
  }, []);

  const speakCurrent = useCallback(() => {
    const py = getItemPinyin(currentChar);
    if (py) speak(py);
    else speak(getItemKey(currentChar));
  }, [currentChar, speak]);

  const advance = useCallback(() => {
    if (cardIdx >= orderedChars.length - 1) {
      setFinished(true);
    } else {
      setCardIdx((prev) => prev + 1);
    }
  }, [cardIdx, orderedChars.length]);

  const runBtnPulse = useCallback((scaleRef, fn) => {
    Animated.sequence([
      Animated.timing(scaleRef, { toValue: 0.94, duration: 90, useNativeDriver: true }),
      Animated.timing(scaleRef, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start(() => fn());
  }, []);

  const onKnown = useCallback(() => {
    if (!currentChar) return;
    const key = getItemKey(currentChar);
    runBtnPulse(knownScale, () => {
      removeUnfamiliar(key);
      setResults((prev) => ({ ...prev, known: prev.known + 1 }));
      advance();
    });
  }, [currentChar, removeUnfamiliar, advance, runBtnPulse, knownScale]);

  const onUnknown = useCallback(() => {
    if (!currentChar) return;
    const key = getItemKey(currentChar);
    runBtnPulse(unknownScale, () => {
      addUnfamiliar(key);
      setResults((prev) => ({ ...prev, unknown: prev.unknown + 1 }));
      advance();
    });
  }, [currentChar, addUnfamiliar, advance, runBtnPulse, unknownScale]);

  const restart = useCallback(() => {
    setReviewDeck(null);
    setCardIdx(0);
    setResults({ known: 0, unknown: 0 });
    setFinished(false);
    flipToFront();
  }, [flipToFront]);

  const reviewUnfamiliar = useCallback(() => {
    const uf = allChars.filter((c) => unfamiliarChars.includes(getItemKey(c)));
    if (uf.length === 0) return;
    setReviewDeck(uf);
    setCardIdx(0);
    setResults({ known: 0, unknown: 0 });
    setFinished(false);
    flipToFront();
  }, [allChars, unfamiliarChars, flipToFront]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '90deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['90deg', '90deg', '0deg'],
  });
  const frontOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] });
  const backOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });

  const gridChars = filterUnfamiliar
    ? allChars.filter((c) => unfamiliarChars.includes(getItemKey(c)))
    : allChars;

  const toggleReveal = useCallback((key) => {
    setRevealedChars((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const isPinyinVisible = (key) => showAllPinyin || revealedChars[key];
  const isUnfamiliar = (key) => unfamiliarChars.includes(key);

  const rows = [];
  for (let i = 0; i < gridChars.length; i += COLS) {
    rows.push(gridChars.slice(i, i + COLS));
  }

  const ufCount = allChars.filter((c) => unfamiliarChars.includes(getItemKey(c))).length;

  if (viewMode === 'grid') {
    return (
      <View style={st.root}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => nav.goBack()}>
            <Text style={st.backTxt}>← 返回</Text>
          </TouchableOpacity>
          <Text style={st.title}>认字浏览</Text>
          <View style={st.headerRight}>
            <TouchableOpacity onPress={() => setViewMode('flashcard')} style={st.modeToggle}>
              <Text style={st.modeToggleTxt}>🃏</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => nav.navigate('CharPractice', { tableType, lessonKeys })}>
              <Text style={st.practiceTxt}>选拼音 →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={st.toolbar}>
          <View style={st.chipRow}>
            <TouchableOpacity
              style={[st.unitChip, !filterUnfamiliar && st.unitChipOn]}
              onPress={() => setFilterUnfamiliar(false)}
            >
              <Text style={[st.unitChipTxt, !filterUnfamiliar && st.unitChipTxtOn]}>
                全部 ({allChars.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[st.unitChip, filterUnfamiliar && st.unitChipOn]}
              onPress={() => setFilterUnfamiliar(true)}
            >
              <Text style={[st.unitChipTxt, filterUnfamiliar && st.unitChipTxtOn]}>
                ⭐ 陌生字 ({ufCount})
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[st.eyeBtn, showAllPinyin && st.eyeBtnOn]}
            onPress={() => setShowAllPinyin(!showAllPinyin)}
          >
            <Text style={st.eyeTxt}>{showAllPinyin ? '👁' : '👁‍🗨'}</Text>
            <Text style={[st.eyeLabel, showAllPinyin && { color: '#fff' }]}>
              {showAllPinyin ? '隐藏拼音' : '显示拼音'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={st.scroll} contentContainerStyle={st.grid} showsVerticalScrollIndicator={false}>
          {gridChars.length === 0 ? (
            <View style={st.emptyBox}>
              <Text style={st.emptyIcon}>{filterUnfamiliar ? '⭐' : '📭'}</Text>
              <Text style={st.emptyTxt}>
                {filterUnfamiliar ? '还没有标记陌生字' : '没有符合条件的字'}
              </Text>
            </View>
          ) : (
            rows.map((row, ri) => (
              <View key={ri} style={st.row}>
                {row.map((c) => {
                  const key = getItemKey(c);
                  const uf = isUnfamiliar(key);
                  const vis = isPinyinVisible(key);
                  const display = key;
                  const py = getItemPinyin(c);
                  return (
                    <TouchableOpacity
                      key={`${key}_${c.lesson}`}
                      style={[st.cell, uf && st.cellUnfamiliar]}
                      onPress={() => speak(py || display)}
                      onLongPress={() => toggleUnfamiliar(key)}
                      activeOpacity={0.7}
                    >
                      {uf && <Text style={st.starMark}>⭐</Text>}
                      <Text style={st.charTxt} numberOfLines={1} adjustsFontSizeToFit>
                        {display}
                      </Text>
                      <TouchableOpacity
                        onPress={() => toggleReveal(key)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        {py ? (
                          vis ? (
                            <Text style={st.pinyinTxt}>{py}</Text>
                          ) : (
                            <Text style={st.pinyinHidden}>· · ·</Text>
                          )
                        ) : (
                          <Text style={st.pinyinHidden}> </Text>
                        )}
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
                {row.length < COLS &&
                  Array.from({ length: COLS - row.length }).map((_, j) => (
                    <View key={`pad${j}`} style={st.cellPad} />
                  ))}
              </View>
            ))
          )}
        </ScrollView>

        <View style={st.footer}>
          <Text style={st.footerTxt}>点击听发音 · 长按标记/取消陌生字 · 点 · · · 看拼音</Text>
        </View>
      </View>
    );
  }

  if (allChars.length === 0) {
    return (
      <View style={st.root}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => nav.goBack()}>
            <Text style={st.backTxt}>← 返回</Text>
          </TouchableOpacity>
          <Text style={st.title}>认字浏览</Text>
          <View style={{ width: 72 }} />
        </View>
        <View style={st.emptyBox}>
          <Text style={st.emptyIcon}>📭</Text>
          <Text style={st.emptyTxt}>没有符合条件的字</Text>
        </View>
      </View>
    );
  }

  if (orderedChars.length === 0) {
    return (
      <View style={st.root}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => nav.goBack()}>
            <Text style={st.backTxt}>← 返回</Text>
          </TouchableOpacity>
          <Text style={st.title}>认字浏览</Text>
          <TouchableOpacity onPress={() => setViewMode('grid')}>
            <Text style={st.modeToggleTxt}>▦</Text>
          </TouchableOpacity>
        </View>
        <View style={st.emptyBox}>
          <Text style={st.emptyIcon}>⭐</Text>
          <Text style={st.emptyTxt}>没有可复习的陌生字</Text>
          <TouchableOpacity style={st.restartBtn} onPress={restart}>
            <Text style={st.restartBtnTxt}>🔄 返回全部卡片</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (finished) {
    return (
      <View style={st.root}>
        <View style={st.flashHeader}>
          <TouchableOpacity onPress={() => nav.goBack()}>
            <Text style={st.backTxt}>← 返回</Text>
          </TouchableOpacity>
          <View style={{ width: 40 }} />
          <TouchableOpacity onPress={() => setViewMode('grid')} hitSlop={12}>
            <Text style={st.modeToggleTxt}>▦</Text>
          </TouchableOpacity>
        </View>
        <View style={st.summaryWrap}>
          <View style={st.summaryBox}>
            <Text style={st.summaryEmoji}>🎉</Text>
            <Text style={st.summaryTitle}>浏览完成!</Text>
            <View style={st.summaryStats}>
              <View style={[st.summaryStatItem, { backgroundColor: 'rgba(76,175,125,0.12)' }]}>
                <Text style={{ fontSize: 36 }}>✓</Text>
                <Text style={st.summaryStatNum}>{results.known}</Text>
                <Text style={st.summaryStatLabel}>认识</Text>
              </View>
              <View style={[st.summaryStatItem, { backgroundColor: 'rgba(224,107,107,0.12)' }]}>
                <Text style={{ fontSize: 36 }}>✗</Text>
                <Text style={st.summaryStatNum}>{results.unknown}</Text>
                <Text style={st.summaryStatLabel}>不认识</Text>
              </View>
            </View>
            <TouchableOpacity style={st.restartBtn} onPress={restart}>
              <Text style={st.restartBtnTxt}>🔄 重新开始</Text>
            </TouchableOpacity>
            {results.unknown > 0 && (
              <TouchableOpacity style={st.reviewOnlyBtn} onPress={reviewUnfamiliar}>
                <Text style={st.reviewOnlyTxt}>📝 只复习不认识的</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  const displayKey = getItemKey(currentChar);
  const displayPinyin = getItemPinyin(currentChar);

  return (
    <View style={st.root}>
      <View style={st.flashHeader}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Text style={st.backTxt}>← 返回</Text>
        </TouchableOpacity>
        <Text style={st.progressTxt}>
          {cardIdx + 1}/{orderedChars.length}
        </Text>
        <TouchableOpacity onPress={() => setViewMode('grid')} hitSlop={12}>
          <Text style={st.modeToggleTxt}>▦</Text>
        </TouchableOpacity>
      </View>

      <View style={st.flashBody}>
        <TouchableOpacity
          style={st.cardTouchable}
          activeOpacity={0.92}
          onPress={toggleFlip}
        >
          <View style={[st.cardShell, { width: CARD_WIDTH, minHeight: 320 }]}>
            <Animated.View
              style={[
                st.cardFace,
                {
                  opacity: frontOpacity,
                  transform: [{ perspective: 1200 }, { rotateY: frontInterpolate }],
                },
              ]}
              pointerEvents={isFlipped ? 'none' : 'auto'}
            >
              <View style={st.frontInner}>
                {displayPinyin ? (
                  <TouchableOpacity onPress={speakCurrent} hitSlop={{ top: 8, bottom: 8 }}>
                    <Text style={st.frontPinyin}>{displayPinyin}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={speakCurrent} hitSlop={{ top: 8, bottom: 8 }}>
                    <Text style={[st.frontPinyin, { opacity: 0.4 }]}>点读词语</Text>
                  </TouchableOpacity>
                )}
                <Text style={st.frontChar}>{displayKey}</Text>
                <Text style={st.flipHint}>点卡片翻面</Text>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                st.cardFace,
                st.cardFaceBack,
                {
                  opacity: backOpacity,
                  transform: [{ perspective: 1200 }, { rotateY: backInterpolate }],
                },
              ]}
              pointerEvents={isFlipped ? 'auto' : 'none'}
            >
              <ScrollView
                style={st.backScroll}
                contentContainerStyle={st.backScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={st.backContent}>
                  {wordInfo?.meaning ? (
                    <View style={st.infoSection}>
                      <Text style={st.infoLabel}>释义</Text>
                      <Text style={st.infoText}>{wordInfo.meaning}</Text>
                    </View>
                  ) : null}
                  {wordLabels.length > 0 ? (
                    <View style={st.infoSection}>
                      <Text style={st.infoLabel}>组词</Text>
                      <View style={st.wordChips}>
                        {wordLabels.map((w, i) => (
                          <TouchableOpacity key={i} style={st.wordChip} onPress={() => speak(w)}>
                            <Text style={st.wordChipTxt}>{w}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ) : null}
                  {wordInfo?.memory ? (
                    <View style={st.infoSection}>
                      <Text style={st.infoLabel}>记忆助手</Text>
                      <Text style={st.infoText}>{wordInfo.memory}</Text>
                    </View>
                  ) : null}
                  {wordInfo?.example ? (
                    <View style={st.infoSection}>
                      <Text style={st.infoLabel}>造句</Text>
                      <Text style={st.infoText}>{wordInfo.example}</Text>
                    </View>
                  ) : null}
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={st.actionRow}>
        <Animated.View style={{ transform: [{ scale: knownScale }], flex: 1 }}>
          <TouchableOpacity style={[st.knownBtn, { backgroundColor: sc.primary }]} onPress={onKnown} activeOpacity={0.85}>
            <Text style={st.actionBtnTxt}>认识 ✓</Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={{ transform: [{ scale: unknownScale }], flex: 1, marginLeft: 12 }}>
          <TouchableOpacity
            style={[st.unknownBtn, { backgroundColor: C.error }]}
            onPress={onUnknown}
            activeOpacity={0.85}
          >
            <Text style={st.actionBtnTxt}>不认识 ✗</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paperBg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  progressTxt: { fontSize: 17, fontWeight: '800', color: C.text },
  modeToggle: { paddingHorizontal: 4, paddingVertical: 4 },
  modeToggleTxt: { fontSize: 20, color: sc.primary, fontWeight: '700' },

  backTxt: { fontSize: 15, fontWeight: '600', color: sc.primary },
  title: { fontSize: 18, fontWeight: '800', color: C.text },
  practiceTxt: { fontSize: 15, fontWeight: '600', color: '#D4839A' },

  toolbar: { paddingHorizontal: 12, paddingBottom: 8 },
  chipRow: { flexDirection: 'row', marginBottom: 8 },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: C.paperCard,
    marginRight: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  unitChipOn: { backgroundColor: sc.primary, borderColor: sc.primary },
  unitChipTxt: { fontSize: 12, fontWeight: '600', color: C.textMid },
  unitChipTxtOn: { color: '#fff' },

  eyeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: C.paperCard,
  },
  eyeBtnOn: { backgroundColor: sc.primary },
  eyeTxt: { fontSize: 16, marginRight: 4 },
  eyeLabel: { fontSize: 11, fontWeight: '600', color: C.textMid },

  scroll: { flex: 1 },
  grid: { paddingHorizontal: 10, paddingBottom: 20 },

  row: { flexDirection: 'row', justifyContent: 'center', marginBottom: 6 },

  cell: {
    width: 64,
    height: 82,
    borderRadius: 12,
    backgroundColor: '#FFFDF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  cellUnfamiliar: { borderColor: '#E06B6B', backgroundColor: '#FFF5F5' },
  cellPad: { width: 64, height: 82, marginHorizontal: 3 },
  starMark: { position: 'absolute', top: 2, right: 2, fontSize: 10 },
  charTxt: { fontSize: 22, fontWeight: '700', color: '#333', maxWidth: 58, textAlign: 'center' },
  pinyinTxt: { fontSize: 11, color: sc.primary, fontWeight: '600', marginTop: 2 },
  pinyinHidden: { fontSize: 11, color: '#bbb', fontWeight: '600', marginTop: 2 },

  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTxt: { fontSize: 15, color: C.textMid },

  footer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: C.paperCard,
    alignItems: 'center',
  },
  footerTxt: { fontSize: 11, color: C.textMid },

  flashBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  cardTouchable: { alignItems: 'center' },
  cardShell: {
    position: 'relative',
    ...SHADOW,
    backgroundColor: C.cardWhite,
    borderRadius: RADIUS,
    overflow: 'hidden',
  },
  cardFace: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: RADIUS,
    backgroundColor: C.cardWhite,
    backfaceVisibility: 'hidden',
  },
  cardFaceBack: {
    backgroundColor: '#FFFDF7',
  },
  frontInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  frontPinyin: {
    fontSize: 22,
    fontWeight: '700',
    color: sc.primary,
    marginBottom: 12,
  },
  frontChar: {
    fontSize: 88,
    fontWeight: '800',
    color: C.text,
  },
  flipHint: {
    marginTop: 16,
    fontSize: 12,
    color: C.textLight,
    fontWeight: '600',
  },
  backScroll: { flex: 1, maxHeight: 320 },
  backScrollContent: { padding: 16, paddingBottom: 24 },
  backContent: { flex: 1 },
  infoSection: { marginBottom: 14 },
  infoLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: sc.dark,
    marginBottom: 6,
  },
  infoText: { fontSize: 15, lineHeight: 22, color: C.text, fontWeight: '500' },
  wordChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wordChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: sc.bg,
    borderWidth: 1,
    borderColor: 'rgba(76,175,125,0.25)',
  },
  wordChipTxt: { fontSize: 14, fontWeight: '600', color: sc.dark },

  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 8,
  },
  knownBtn: {
    borderRadius: RADIUS,
    paddingVertical: 16,
    alignItems: 'center',
    ...SHADOW,
  },
  unknownBtn: {
    borderRadius: RADIUS,
    paddingVertical: 16,
    alignItems: 'center',
    ...SHADOW,
  },
  actionBtnTxt: { fontSize: 17, fontWeight: '800', color: '#fff' },

  summaryWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  summaryBox: {
    backgroundColor: C.cardWhite,
    borderRadius: RADIUS,
    padding: 24,
    alignItems: 'center',
    ...SHADOW,
  },
  summaryEmoji: { fontSize: 48, marginBottom: 8 },
  summaryTitle: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 20 },
  summaryStats: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 24 },
  summaryStatItem: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: RADIUS,
    paddingVertical: 16,
    alignItems: 'center',
  },
  summaryStatNum: { fontSize: 32, fontWeight: '800', color: C.text, marginTop: 4 },
  summaryStatLabel: { fontSize: 14, fontWeight: '700', color: C.textMid, marginTop: 4 },
  restartBtn: {
    backgroundColor: sc.bg,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: RADIUS,
    borderWidth: 1.5,
    borderColor: sc.primary,
    width: '100%',
    alignItems: 'center',
  },
  restartBtnTxt: { fontSize: 16, fontWeight: '800', color: sc.dark },
  reviewOnlyBtn: {
    marginTop: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    borderRadius: RADIUS,
    backgroundColor: C.errorBg,
  },
  reviewOnlyTxt: { fontSize: 16, fontWeight: '800', color: C.error },
});
