import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Animated, Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { C, RADIUS, SUBJECT_COLORS } from '../lib/theme';
import { getCharsForLessons, getWordInfo } from '../lib/textbookData';
import { useApp } from '../lib/AppContext';

const { width: SCREEN_W } = Dimensions.get('window');
const sc = SUBJECT_COLORS.chinese;
const GRID_COLS = 5;

// ---------------------------------------------------------------------------
// Flashcard with flip animation
// ---------------------------------------------------------------------------
function Flashcard({ item, info, isFlipped, onFlip, onSpeak, showPinyin, onTogglePinyin }) {
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 1 : 0,
      friction: 8,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [isFlipped]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['180deg', '270deg', '360deg'],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });

  return (
    <View style={st.cardContainer}>
      {/* Front */}
      <Animated.View
        style={[st.card, st.cardFront, {
          opacity: frontOpacity,
          transform: [{ perspective: 1000 }, { rotateY: frontInterpolate }],
        }]}
        pointerEvents={isFlipped ? 'none' : 'auto'}
      >
        <TouchableOpacity
          style={st.cardTouchable}
          activeOpacity={0.9}
          onPress={onFlip}
        >
          {info?.scene ? (
            <Text style={st.sceneEmoji}>{info.scene}</Text>
          ) : null}
          <TouchableOpacity
            style={st.pinyinToggle}
            onPress={(e) => { e.stopPropagation?.(); onTogglePinyin(); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={st.pinyinToggleIcon}>{showPinyin ? '👀' : '😑'}</Text>
          </TouchableOpacity>
          <View style={st.pinyinSlot}>
            <Text style={[st.frontPinyin, !showPinyin && st.pinyinInvisible]}>
              {item.pinyin}
            </Text>
            {!showPinyin && <Text style={st.pinyinDots}>· · ·</Text>}
          </View>
          <Text style={st.frontChar}>{item.char}</Text>
          <TouchableOpacity
            style={st.speakBtn}
            onPress={(e) => { e.stopPropagation?.(); onSpeak(item.char); }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={st.speakTxt}>🔊 点击朗读</Text>
          </TouchableOpacity>
          <Text style={st.flipHint}>点击卡片翻面 →</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Back */}
      <Animated.View
        style={[st.card, st.cardBack, {
          opacity: backOpacity,
          transform: [{ perspective: 1000 }, { rotateY: backInterpolate }],
        }]}
        pointerEvents={isFlipped ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={st.cardTouchable}
          activeOpacity={0.9}
          onPress={onFlip}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={st.backScroll}
            nestedScrollEnabled
          >
            <View style={st.backHeader}>
              <Text style={st.backChar}>{item.char}</Text>
              <Text style={st.backPinyin}>{item.pinyin}</Text>
            </View>

            <View style={st.infoSection}>
              <Text style={st.infoLabel}>💡 释义</Text>
              <Text style={st.infoText}>{info?.meaning || `学习"${item.char}"`}</Text>
            </View>

            {(info?.words?.length > 0) && (
              <View style={st.infoSection}>
                <Text style={st.infoLabel}>{info.emoji || '📝'} 组词</Text>
                <View style={st.wordsRow}>
                  {info.words.slice(0, 4).map((w, i) => (
                    <TouchableOpacity
                      key={i}
                      style={st.wordChip}
                      onPress={() => onSpeak(w.word)}
                    >
                      <Text style={st.wordChipText}>
                        {w.word.split('').map((c, ci) => (
                          <Text
                            key={ci}
                            style={ci === w.highlight ? st.wordHL : null}
                          >{c}</Text>
                        ))}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {info?.memory ? (
              <View style={[st.infoSection, st.memoryBox]}>
                <Text style={st.infoLabel}>🧠 记忆</Text>
                <Text style={st.memoryText}>{info.memory}</Text>
              </View>
            ) : null}

            {info?.example ? (
              <View style={[st.infoSection, st.exampleBox]}>
                <Text style={st.infoLabel}>✏️ 造句</Text>
                <Text style={st.exampleText}>{info.example}</Text>
              </View>
            ) : null}
          </ScrollView>
          <Text style={st.flipHintBack}>点击卡片翻回 ←</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Slide-in animation wrapper for card transitions
// ---------------------------------------------------------------------------
function SlideWrapper({ slideKey, direction, children }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(direction === 'left' ? SCREEN_W : -SCREEN_W);
    Animated.spring(anim, {
      toValue: 0,
      friction: 10,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [slideKey]);

  return (
    <Animated.View style={{ flex: 1, transform: [{ translateX: anim }] }}>
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Completion stats screen
// ---------------------------------------------------------------------------
function CompletionScreen({ total, knownCount, unknownCount, onReviewUnknown, onRestart, onExit }) {
  const pct = total > 0 ? Math.round((knownCount / total) * 100) : 0;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1, friction: 4, tension: 50, useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={st.completionRoot}>
      <Animated.View style={[st.completionCard, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={st.completionEmoji}>{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '🤗'}</Text>
        <Text style={st.completionTitle}>认字完成！</Text>
        <Text style={st.completionSub}>共 {total} 个字</Text>

        <View style={st.completionStats}>
          <View style={[st.statBox, { backgroundColor: 'rgba(76,175,125,0.12)' }]}>
            <Text style={[st.statNum, { color: sc.primary }]}>{knownCount}</Text>
            <Text style={st.statLabel}>认识 ✓</Text>
          </View>
          <View style={[st.statBox, { backgroundColor: 'rgba(224,107,107,0.12)' }]}>
            <Text style={[st.statNum, { color: C.error }]}>{unknownCount}</Text>
            <Text style={st.statLabel}>不认识 ✗</Text>
          </View>
        </View>

        <View style={st.completionBar}>
          <View style={[st.completionBarFill, { width: `${pct}%` }]} />
        </View>
        <Text style={st.completionPct}>掌握率 {pct}%</Text>

        {unknownCount > 0 && (
          <TouchableOpacity
            style={[st.completionBtn, { backgroundColor: C.error }]}
            onPress={onReviewUnknown}
          >
            <Text style={st.completionBtnTxt}>复习不认识的字 ({unknownCount})</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[st.completionBtn, { backgroundColor: sc.primary }]}
          onPress={onRestart}
        >
          <Text style={st.completionBtnTxt}>重新开始</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.completionBtnSec} onPress={onExit}>
          <Text style={[st.completionBtnSecTxt, { color: sc.primary }]}>返回</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Grid mode (preserved from original, simplified)
// ---------------------------------------------------------------------------
function GridMode({ chars, unfamiliarChars, toggleUnfamiliar, onSwitchToCard }) {
  const [showAllPinyin, setShowAllPinyin] = useState(false);
  const [revealedChars, setRevealedChars] = useState({});
  const [filterUnfamiliar, setFilterUnfamiliar] = useState(false);

  const filtered = filterUnfamiliar
    ? chars.filter((c) => unfamiliarChars.includes(c.char))
    : chars;

  const speak = useCallback((text) => {
    Speech.speak(text, { language: 'zh-CN', rate: 0.7 });
  }, []);

  const toggleReveal = useCallback((ch) => {
    setRevealedChars((prev) => ({ ...prev, [ch]: !prev[ch] }));
  }, []);

  const rows = [];
  for (let i = 0; i < filtered.length; i += GRID_COLS) {
    rows.push(filtered.slice(i, i + GRID_COLS));
  }

  const ufCount = chars.filter((c) => unfamiliarChars.includes(c.char)).length;

  return (
    <View style={{ flex: 1 }}>
      <View style={st.gridToolbar}>
        <View style={st.chipRow}>
          <TouchableOpacity
            style={[st.unitChip, !filterUnfamiliar && st.unitChipOn]}
            onPress={() => setFilterUnfamiliar(false)}
          >
            <Text style={[st.unitChipTxt, !filterUnfamiliar && st.unitChipTxtOn]}>
              全部 ({chars.length})
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
        <View style={st.gridToolbarRight}>
          <TouchableOpacity
            style={[st.eyeBtn, showAllPinyin && st.eyeBtnOn]}
            onPress={() => setShowAllPinyin(!showAllPinyin)}
          >
            <Text style={st.eyeTxt}>{showAllPinyin ? '👁' : '👁‍🗨'}</Text>
            <Text style={[st.eyeLabel, showAllPinyin && { color: '#fff' }]}>
              {showAllPinyin ? '隐藏拼音' : '显示拼音'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.switchBtn} onPress={onSwitchToCard}>
            <Text style={st.switchTxt}>🃏 字卡</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={st.gridContent} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={st.emptyBox}>
            <Text style={st.emptyIcon}>{filterUnfamiliar ? '⭐' : '📭'}</Text>
            <Text style={st.emptyTxt}>
              {filterUnfamiliar ? '还没有标记陌生字' : '没有符合条件的字'}
            </Text>
          </View>
        ) : (
          rows.map((row, ri) => (
            <View key={ri} style={st.gridRow}>
              {row.map((c) => {
                const uf = unfamiliarChars.includes(c.char);
                const vis = showAllPinyin || revealedChars[c.char];
                return (
                  <TouchableOpacity
                    key={`${c.char}_${c.lesson}`}
                    style={[st.gridCell, uf && st.gridCellUf]}
                    onPress={() => speak(c.pinyin)}
                    onLongPress={() => toggleUnfamiliar(c.char)}
                    activeOpacity={0.7}
                  >
                    {uf && <Text style={st.starMark}>⭐</Text>}
                    <Text style={st.gridCharTxt}>{c.char}</Text>
                    <TouchableOpacity
                      onPress={() => toggleReveal(c.char)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {vis ? (
                        <Text style={st.pinyinTxt}>{c.pinyin}</Text>
                      ) : (
                        <Text style={st.pinyinHidden}>· · ·</Text>
                      )}
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
              {row.length < GRID_COLS && Array.from({ length: GRID_COLS - row.length }).map((_, j) => (
                <View key={`pad${j}`} style={st.gridCellPad} />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <View style={st.gridFooter}>
        <Text style={st.gridFooterTxt}>点击听发音 · 长按标记/取消陌生字 · 点 · · · 看拼音</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function CharTableScreen() {
  const nav = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { unfamiliarChars, toggleUnfamiliar, addUnfamiliar, removeUnfamiliar } = useApp();

  const { tableType, lessonKeys } = route.params || {};
  const allChars = useMemo(
    () => getCharsForLessons(tableType || 'shizi', lessonKeys || []),
    [tableType, lessonKeys],
  );

  const [mode, setMode] = useState('card');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showPinyin, setShowPinyin] = useState(false);
  const [results, setResults] = useState({});
  const [slideDir, setSlideDir] = useState('left');
  const [isDone, setIsDone] = useState(false);
  const [reviewQueue, setReviewQueue] = useState(null);

  const activeChars = reviewQueue || allChars;
  const total = activeChars.length;
  const currentItem = activeChars[currentIdx];
  const currentInfo = currentItem ? getWordInfo(currentItem.char) : null;

  const knownCount = Object.values(results).filter((v) => v === 'known').length;
  const unknownCount = Object.values(results).filter((v) => v === 'unknown').length;

  const reorderWithUnfamiliarFirst = useCallback((chars) => {
    const uf = chars.filter((c) => unfamiliarChars.includes(c.char));
    const rest = chars.filter((c) => !unfamiliarChars.includes(c.char));
    return [...uf, ...rest];
  }, [unfamiliarChars]);

  useEffect(() => {
    if (mode === 'card' && !reviewQueue) {
      const reordered = reorderWithUnfamiliarFirst(allChars);
      if (reordered.length > 0 && reordered[0]?.char !== allChars[0]?.char) {
        // only reset if actually reordered and not mid-session
      }
    }
  }, []);

  const orderedChars = useMemo(() => {
    if (reviewQueue) return reviewQueue;
    return reorderWithUnfamiliarFirst(allChars);
  }, [allChars, reviewQueue, reorderWithUnfamiliarFirst]);

  const speak = useCallback((text) => {
    Speech.stop();
    Speech.speak(text, { language: 'zh-CN', rate: 0.75 });
  }, []);

  const goToCard = useCallback((idx, dir) => {
    setIsFlipped(false);
    setSlideDir(dir);
    setTimeout(() => setCurrentIdx(idx), 10);
  }, []);

  const handleKnown = useCallback(() => {
    const char = orderedChars[currentIdx]?.char;
    if (!char) return;
    setResults((prev) => ({ ...prev, [char]: 'known' }));
    removeUnfamiliar(char);
    if (currentIdx < orderedChars.length - 1) {
      goToCard(currentIdx + 1, 'left');
    } else {
      setIsDone(true);
    }
  }, [currentIdx, orderedChars, goToCard, removeUnfamiliar]);

  const handleUnknown = useCallback(() => {
    const char = orderedChars[currentIdx]?.char;
    if (!char) return;
    setResults((prev) => ({ ...prev, [char]: 'unknown' }));
    addUnfamiliar(char);
    if (currentIdx < orderedChars.length - 1) {
      goToCard(currentIdx + 1, 'left');
    } else {
      setIsDone(true);
    }
  }, [currentIdx, orderedChars, goToCard, addUnfamiliar]);

  const handleReviewUnknown = useCallback(() => {
    const unknownChars = orderedChars.filter((c) => results[c.char] === 'unknown');
    if (unknownChars.length === 0) return;
    setReviewQueue(unknownChars);
    setResults({});
    setCurrentIdx(0);
    setIsFlipped(false);
    setIsDone(false);
  }, [orderedChars, results]);

  const handleRestart = useCallback(() => {
    setReviewQueue(null);
    setResults({});
    setCurrentIdx(0);
    setIsFlipped(false);
    setIsDone(false);
  }, []);

  // card mode with completion
  if (mode === 'card' && isDone) {
    const totalForStats = orderedChars.length;
    const k = Object.values(results).filter((v) => v === 'known').length;
    const u = Object.values(results).filter((v) => v === 'unknown').length;
    return (
      <View style={[st.root, { paddingTop: insets.top }]}>
        <CompletionScreen
          total={totalForStats}
          knownCount={k}
          unknownCount={u}
          onReviewUnknown={handleReviewUnknown}
          onRestart={handleRestart}
          onExit={() => nav.goBack()}
        />
      </View>
    );
  }

  if (mode === 'grid') {
    return (
      <View style={[st.root, { paddingTop: insets.top }]}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => nav.goBack()}>
            <Text style={st.backTxt}>← 返回</Text>
          </TouchableOpacity>
          <Text style={st.headerTitle}>认字浏览</Text>
          <TouchableOpacity onPress={() => nav.navigate('CharPractice', { tableType, lessonKeys })}>
            <Text style={st.practiceTxt}>选拼音 →</Text>
          </TouchableOpacity>
        </View>
        <GridMode
          chars={allChars}
          unfamiliarChars={unfamiliarChars}
          toggleUnfamiliar={toggleUnfamiliar}
          onSwitchToCard={() => setMode('card')}
        />
      </View>
    );
  }

  // Card mode
  const cardItem = orderedChars[currentIdx];
  const cardInfo = cardItem ? getWordInfo(cardItem.char) : null;
  const progress = total > 0 ? ((currentIdx + (isDone ? 1 : 0)) / orderedChars.length) * 100 : 0;

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => {
          if (currentIdx > 0) goToCard(currentIdx - 1, 'right');
          else nav.goBack();
        }}>
          <Text style={st.backTxt}>{currentIdx > 0 ? '← 上一个' : '← 返回'}</Text>
        </TouchableOpacity>
        <Text style={st.headerTitle}>
          {reviewQueue ? '复习不认识的字' : '认字浏览'}
        </Text>
        <TouchableOpacity onPress={() => setMode('grid')}>
          <Text style={st.practiceTxt}>📋 网格</Text>
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={st.progressRow}>
        <View style={st.progressBar}>
          <View style={[st.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={st.progressText}>
          {currentIdx + 1} / {orderedChars.length}
        </Text>
      </View>

      {/* Stats chips */}
      <View style={st.statsRow}>
        {knownCount > 0 && (
          <View style={[st.statsChip, { backgroundColor: 'rgba(76,175,125,0.12)' }]}>
            <Text style={[st.statsChipTxt, { color: sc.primary }]}>✓ {knownCount}</Text>
          </View>
        )}
        {unknownCount > 0 && (
          <View style={[st.statsChip, { backgroundColor: 'rgba(224,107,107,0.12)' }]}>
            <Text style={[st.statsChipTxt, { color: C.error }]}>✗ {unknownCount}</Text>
          </View>
        )}
      </View>

      {/* Flashcard */}
      {cardItem && (
        <SlideWrapper slideKey={`${cardItem.char}_${currentIdx}`} direction={slideDir}>
          <View style={st.cardArea}>
            <Flashcard
              item={cardItem}
              info={cardInfo}
              isFlipped={isFlipped}
              onFlip={() => setIsFlipped((f) => !f)}
              onSpeak={speak}
              showPinyin={showPinyin}
              onTogglePinyin={() => setShowPinyin((v) => !v)}
            />
          </View>
        </SlideWrapper>
      )}

      {/* Action buttons */}
      <View style={[st.actionRow, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={[st.actionBtn, st.unknownBtn]}
          onPress={handleUnknown}
          activeOpacity={0.8}
        >
          <Text style={st.unknownBtnIcon}>✗</Text>
          <Text style={st.unknownBtnTxt}>不认识</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.actionBtn, st.knownBtn]}
          onPress={handleKnown}
          activeOpacity={0.8}
        >
          <Text style={st.knownBtnIcon}>✓</Text>
          <Text style={st.knownBtnTxt}>认识</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const CARD_W = SCREEN_W - 48;

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  backTxt: { fontSize: 15, fontWeight: '600', color: sc.primary },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  practiceTxt: { fontSize: 14, fontWeight: '600', color: C.textMid },

  progressRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 4,
  },
  progressBar: {
    flex: 1, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.06)', overflow: 'hidden', marginRight: 10,
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: sc.primary },
  progressText: { fontSize: 13, fontWeight: '700', color: C.textMid, minWidth: 50, textAlign: 'right' },

  statsRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    paddingHorizontal: 16, marginBottom: 4, minHeight: 28,
  },
  statsChip: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
  },
  statsChipTxt: { fontSize: 13, fontWeight: '700' },

  // Flashcard
  cardArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  cardContainer: {
    width: CARD_W, height: CARD_W * 1.25, position: 'relative',
  },
  card: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 24, backfaceVisibility: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  cardFront: { backgroundColor: '#fff', borderTopWidth: 4, borderTopColor: sc.primary },
  cardBack: { backgroundColor: '#fff', borderTopWidth: 4, borderTopColor: '#EB9F4A' },
  cardTouchable: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },

  pinyinToggle: { position: 'absolute', top: 16, right: 16, zIndex: 2, padding: 4 },
  pinyinToggleIcon: { fontSize: 22 },
  sceneEmoji: { fontSize: 36, letterSpacing: 6, marginBottom: 8, textAlign: 'center' },
  pinyinSlot: { height: 34, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  frontPinyin: {
    fontSize: 24, fontWeight: '600', color: '#EB9F4A', textAlign: 'center',
  },
  pinyinInvisible: { color: 'transparent' },
  pinyinDots: {
    position: 'absolute', fontSize: 20, color: '#ccc', letterSpacing: 4,
  },
  frontChar: {
    fontSize: 96, fontWeight: '900', color: C.text,
    textAlign: 'center', lineHeight: 120,
  },
  speakBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
    backgroundColor: 'rgba(76,175,125,0.12)', marginTop: 12,
  },
  speakTxt: { fontSize: 15, fontWeight: '600', color: sc.primary },
  flipHint: { fontSize: 12, color: C.textLight, marginTop: 12 },
  flipHintBack: { fontSize: 12, color: C.textLight, marginTop: 8, textAlign: 'center' },

  backScroll: { paddingBottom: 8 },
  backHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 12 },
  backChar: { fontSize: 36, fontWeight: '900', color: C.text, marginRight: 8 },
  backPinyin: { fontSize: 18, fontWeight: '600', color: '#EB9F4A' },

  infoSection: { marginBottom: 12 },
  infoLabel: { fontSize: 14, fontWeight: '700', color: C.textMid, marginBottom: 4 },
  infoText: { fontSize: 15, lineHeight: 22, color: C.text },

  wordsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wordChip: {
    backgroundColor: 'rgba(0,0,0,0.04)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10,
  },
  wordChipText: { fontSize: 18 },
  wordHL: { fontWeight: '900', color: C.error, fontSize: 22 },

  memoryBox: {
    backgroundColor: '#FFFDE7', borderRadius: 12, padding: 12,
    borderLeftWidth: 3, borderLeftColor: '#FFB300',
  },
  memoryText: { fontSize: 14, lineHeight: 22, color: '#5D4037' },

  exampleBox: {
    backgroundColor: '#E8F5E9', borderRadius: 12, padding: 12,
    borderLeftWidth: 3, borderLeftColor: '#43A047',
  },
  exampleText: { fontSize: 14, lineHeight: 22, color: '#2E7D32' },

  // Action buttons
  actionRow: {
    flexDirection: 'row', paddingHorizontal: 24, paddingTop: 10, gap: 12,
  },
  actionBtn: {
    flex: 1, height: 56, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  unknownBtn: { backgroundColor: 'rgba(224,107,107,0.12)', borderWidth: 2, borderColor: C.error },
  knownBtn: { backgroundColor: sc.primary },
  unknownBtnIcon: { fontSize: 20, fontWeight: '800', color: C.error, marginRight: 6 },
  unknownBtnTxt: { fontSize: 17, fontWeight: '700', color: C.error },
  knownBtnIcon: { fontSize: 20, fontWeight: '800', color: '#fff', marginRight: 6 },
  knownBtnTxt: { fontSize: 17, fontWeight: '700', color: '#fff' },

  // Completion screen
  completionRoot: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  completionCard: {
    width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 28,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  completionEmoji: { fontSize: 56, marginBottom: 8 },
  completionTitle: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 4 },
  completionSub: { fontSize: 15, color: C.textMid, marginBottom: 16 },
  completionStats: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  statBox: {
    flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 16,
  },
  statNum: { fontSize: 32, fontWeight: '800' },
  statLabel: { fontSize: 14, color: C.textMid, marginTop: 4 },
  completionBar: {
    width: '100%', height: 8, borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 4,
  },
  completionBarFill: { height: 8, borderRadius: 4, backgroundColor: sc.primary },
  completionPct: { fontSize: 14, fontWeight: '700', color: sc.primary, marginBottom: 20 },
  completionBtn: {
    width: '100%', height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  completionBtnTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
  completionBtnSec: {
    width: '100%', height: 46, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg,
  },
  completionBtnSecTxt: { fontSize: 15, fontWeight: '700' },

  // Grid mode
  gridToolbar: { paddingHorizontal: 12, paddingBottom: 8 },
  chipRow: { flexDirection: 'row', marginBottom: 8 },
  unitChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: C.card, marginRight: 6, borderWidth: 1.5, borderColor: 'transparent',
  },
  unitChipOn: { backgroundColor: sc.primary, borderColor: sc.primary },
  unitChipTxt: { fontSize: 12, fontWeight: '600', color: C.textMid },
  unitChipTxtOn: { color: '#fff' },
  gridToolbarRight: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyeBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: C.card,
  },
  eyeBtnOn: { backgroundColor: sc.primary },
  eyeTxt: { fontSize: 16, marginRight: 4 },
  eyeLabel: { fontSize: 11, fontWeight: '600', color: C.textMid },
  switchBtn: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12,
    backgroundColor: 'rgba(76,175,125,0.12)',
  },
  switchTxt: { fontSize: 12, fontWeight: '700', color: sc.primary },

  gridContent: { paddingHorizontal: 10, paddingBottom: 20 },
  gridRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 6 },
  gridCell: {
    width: 64, height: 82, borderRadius: 12, backgroundColor: '#FFFDF7',
    alignItems: 'center', justifyContent: 'center', marginHorizontal: 3,
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.08)',
  },
  gridCellUf: { borderColor: C.error, backgroundColor: '#FFF5F5' },
  gridCellPad: { width: 64, height: 82, marginHorizontal: 3 },
  starMark: { position: 'absolute', top: 2, right: 2, fontSize: 10 },
  gridCharTxt: { fontSize: 28, fontWeight: '700', color: '#333' },
  pinyinTxt: { fontSize: 11, color: sc.primary, fontWeight: '600', marginTop: 2 },
  pinyinHidden: { fontSize: 11, color: '#bbb', fontWeight: '600', marginTop: 2 },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTxt: { fontSize: 15, color: C.textMid },
  gridFooter: {
    paddingVertical: 10, paddingHorizontal: 16,
    backgroundColor: C.card, alignItems: 'center',
  },
  gridFooterTxt: { fontSize: 11, color: C.textMid },
});
