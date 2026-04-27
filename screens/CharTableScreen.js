import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Animated, Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { C, RADIUS, SHADOW } from '../lib/theme';
import { getCharsForLessons, getWordInfo } from '../lib/textbookData';
import { useApp } from '../lib/AppContext';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_COLS = 5;

const TABLE_TITLES = { shizi: '识字表', xiezi: '写字表', ciyu: '词语表' };

function getScreenTitle(tableType, lessonKeys) {
  const tt = tableType || 'shizi';
  const lk0 = (lessonKeys || [])[0];
  const tableLabel = TABLE_TITLES[tt] || TABLE_TITLES.shizi;
  return lk0 ? `${lk0} ${tableLabel}` : tableLabel;
}

// ---------------------------------------------------------------------------
// Flashcard with flip animation
// ---------------------------------------------------------------------------
function Flashcard({ item, info, isFlipped, onFlip, onSpeak, showPinyin, onTogglePinyin, tableType }) {
  const isWriting = tableType === 'xiezi';
  const radical = info?.parts?.[0];
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
            accessibilityLabel={showPinyin ? '隐藏拼音' : '显示拼音'}
          >
            <MaterialIcons
              name={showPinyin ? 'visibility' : 'visibility-off'}
              size={24}
              color={C.primary}
            />
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
            <MaterialIcons name="volume-up" size={20} color={C.primary} />
            <Text style={st.speakTxt}> 点击朗读</Text>
          </TouchableOpacity>
          <View style={st.flipHintRow}>
            <Text style={st.flipHint}>点击卡片翻面</Text>
            <MaterialIcons name="arrow-forward" size={16} color={C.textLight} />
          </View>
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
            {isWriting ? (
              <>
                <View style={st.writingDetailCard}>
                  <Text style={st.writingBackChar}>{item.char}</Text>
                  <View style={st.writingMetaRow}>
                    {!!radical && (
                      <Text style={st.writingMeta}>部首：{radical}</Text>
                    )}
                  </View>
                </View>

                <View style={st.pronounceSection}>
                  <View style={st.pronounceRow}>
                    <Text style={st.backPinyinMain}>{item.pinyin}</Text>
                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation?.(); onSpeak(item.char); }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialIcons name="volume-up" size={22} color={C.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {!!info?.memory && (
                  <View style={st.tipBox}>
                    <View style={st.tipLabelRow}>
                      <MaterialIcons name="lightbulb" size={18} color={C.primary} />
                      <Text style={st.tipLabelText}> 记忆提示</Text>
                    </View>
                    <Text style={st.tipText}>{info.memory}</Text>
                  </View>
                )}

                <View style={st.infoSection}>
                  <Text style={st.vocabTitle}>生词与运用</Text>
                  {(info?.words?.length > 0) && (
                    <View style={st.vocabList}>
                      {info.words.slice(0, 6).map((w, i) => (
                        <TouchableOpacity
                          key={i}
                          style={st.vocabRow}
                          onPress={() => onSpeak(w.word)}
                          activeOpacity={0.7}
                        >
                          <View style={st.vocabWordBlock}>
                            <Text style={st.vocabWordText}>
                              {w.word.split('').map((c, ci) => (
                                <Text
                                  key={ci}
                                  style={ci === w.highlight ? st.wordHL : null}
                                >{c}</Text>
                              ))}
                            </Text>
                            {w.word.length === 1 && (
                              <Text style={st.vocabWordPinyin}>{item.pinyin}</Text>
                            )}
                          </View>
                          <MaterialIcons name="arrow-forward" size={18} color={C.textLight} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={st.infoSection}>
                  <Text style={st.infoLabelPlain}>释义</Text>
                  <Text style={st.infoText}>{info?.meaning || `学习「${item.char}」`}</Text>
                </View>

                {info?.example ? (
                  <View style={[st.infoSection, st.exampleBox]}>
                    <Text style={st.infoLabelPlain}>造句</Text>
                    <Text style={st.exampleText}>{info.example}</Text>
                  </View>
                ) : null}
              </>
            ) : (
              <>
                <View style={st.backHeader}>
                  <Text style={st.backChar}>{item.char}</Text>
                  <Text style={st.backPinyin}>{item.pinyin}</Text>
                </View>

                <View style={st.infoSection}>
                  <View style={st.backSectionHead}>
                    <MaterialIcons name="info" size={16} color={C.textMid} />
                    <Text style={st.infoLabelInline}> 释义</Text>
                  </View>
                  <Text style={st.infoText}>{info?.meaning || `学习"${item.char}"`}</Text>
                </View>

                {(info?.words?.length > 0) && (
                  <View style={st.infoSection}>
                    <View style={st.backSectionHead}>
                      <Text style={st.infoLabelInline}>{info.emoji || '📝'} 组词</Text>
                    </View>
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
                    <View style={st.tipLabelRow}>
                      <MaterialIcons name="lightbulb" size={18} color={C.primary} />
                      <Text style={st.infoLabelInline}> 记忆</Text>
                    </View>
                    <Text style={st.memoryText}>{info.memory}</Text>
                  </View>
                ) : null}

                {info?.example ? (
                  <View style={[st.infoSection, st.exampleBox]}>
                    <Text style={st.infoLabelPlain}>造句</Text>
                    <Text style={st.exampleText}>{info.example}</Text>
                  </View>
                ) : null}
              </>
            )}
          </ScrollView>
          <View style={st.flipHintBackRow}>
            <MaterialIcons name="arrow-back" size={16} color={C.textLight} />
            <Text style={st.flipHintBack}> 点击卡片翻回</Text>
          </View>
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
          <View style={[st.statBox, { backgroundColor: C.successBg }]}>
            <Text style={[st.statNum, { color: C.primary }]}>{knownCount}</Text>
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
          style={[st.completionBtn, { backgroundColor: C.primary }]}
          onPress={onRestart}
        >
          <Text style={st.completionBtnTxt}>重新开始</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.completionBtnSec} onPress={onExit}>
          <Text style={[st.completionBtnSecTxt, { color: C.primary }]}>返回</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Grid mode (preserved from original, simplified)
// ---------------------------------------------------------------------------
function GridMode({
  chars, unfamiliarChars, toggleUnfamiliar, onSwitchToCard, onOpenPractice, tableType,
}) {
  const insets = useSafeAreaInsets();
  const [showAllPinyin, setShowAllPinyin] = useState(false);
  const [revealedChars, setRevealedChars] = useState({});
  const [filterUnfamiliar, setFilterUnfamiliar] = useState(false);
  const [viewList, setViewList] = useState(false);

  const filtered = filterUnfamiliar
    ? chars.filter((c) => unfamiliarChars.includes(c.char))
    : chars;

  const countLabel = tableType === 'ciyu' ? '个词语' : '个生字';

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

  const renderCharCell = (c) => {
    const uf = unfamiliarChars.includes(c.char);
    const vis = showAllPinyin || revealedChars[c.char];
    return (
      <View
        key={`${c.char}_${c.lesson}`}
        style={[
          viewList ? st.listCell : st.gridCell,
          uf && st.gridCellUf,
        ]}
      >
        <TouchableOpacity
          style={viewList ? st.listCellMain : st.gridCellMain}
          onPress={() => speak(c.pinyin)}
          onLongPress={() => toggleUnfamiliar(c.char)}
          activeOpacity={0.7}
        >
          <TouchableOpacity
            style={st.gridPinyinTouch}
            onPress={() => toggleReveal(c.char)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            {vis ? (
              <Text style={st.gridPinyinTop}>{c.pinyin}</Text>
            ) : (
              <Text style={st.pinyinHidden}>···</Text>
            )}
          </TouchableOpacity>
          <Text style={viewList ? st.listCharTxt : st.gridCharTxt}>{c.char}</Text>
        </TouchableOpacity>
        <View style={st.gridActionIcons}>
          <MaterialIcons
            name={uf ? 'help' : 'help-outline'}
            size={18}
            color={uf ? C.primary : C.textLight}
          />
          <TouchableOpacity
            onPress={() => toggleUnfamiliar(c.char)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityLabel="标记生僻字"
          >
            <MaterialIcons
              name={uf ? 'favorite' : 'favorite-border'}
              size={18}
              color={uf ? C.error : C.textLight}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={st.gridRoot}>
      <View style={st.infoBar}>
        <MaterialIcons name="info" size={18} color={C.primary} style={st.infoBarIcon} />
        <Text style={st.infoBarMsg} numberOfLines={1}>点击汉字查看详情</Text>
        <Text style={st.infoBarCount}>
          {chars.length}
          {countLabel}
        </Text>
      </View>

      <View style={st.chipRow}>
        <TouchableOpacity
          style={[st.unitChip, !filterUnfamiliar && st.unitChipOn]}
          onPress={() => setFilterUnfamiliar(false)}
        >
          <Text style={[st.unitChipTxt, !filterUnfamiliar && st.unitChipTxtOn]}>
            全部 (
            {chars.length}
            )
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.unitChip, filterUnfamiliar && st.unitChipOn]}
          onPress={() => setFilterUnfamiliar(true)}
        >
          <Text style={[st.unitChipTxt, filterUnfamiliar && st.unitChipTxtOn]}>
            陌生字 (
            {ufCount}
            )
          </Text>
        </TouchableOpacity>
      </View>

      <View style={st.gridToolbarRow}>
        <TouchableOpacity
          style={[st.pillToggle, showAllPinyin && st.pillToggleOn]}
          onPress={() => setShowAllPinyin(!showAllPinyin)}
        >
          <MaterialIcons
            name={showAllPinyin ? 'visibility' : 'visibility-off'}
            size={18}
            color={showAllPinyin ? C.onPrimary : C.textMid}
          />
          <Text style={[st.pillToggleTxt, showAllPinyin && st.pillToggleTxtOn]}>
            {showAllPinyin ? '隐藏拼音' : '显示拼音'}
          </Text>
        </TouchableOpacity>
        <View style={st.viewModeToggles}>
          <TouchableOpacity
            style={[st.iconToggle, !viewList && st.iconToggleOn]}
            onPress={() => setViewList(false)}
            accessibilityLabel="宫格"
          >
            <MaterialIcons
              name="view-module"
              size={22}
              color={!viewList ? C.onPrimary : C.textLight}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.iconToggle, viewList && st.iconToggleOn]}
            onPress={() => setViewList(true)}
            accessibilityLabel="列表"
          >
            <MaterialIcons
              name="view-list"
              size={22}
              color={viewList ? C.onPrimary : C.textLight}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={st.gridScroll}
        contentContainerStyle={[st.gridContent, viewList && st.gridContentList]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={st.emptyBox}>
            <MaterialIcons
              name={filterUnfamiliar ? 'sentiment-dissatisfied' : 'inbox'}
              size={48}
              color={C.textLight}
            />
            <Text style={st.emptyTxt}>
              {filterUnfamiliar ? '还没有标记陌生字' : '没有符合条件的字'}
            </Text>
          </View>
        ) : viewList ? (
          <View style={st.listCol}>{filtered.map((c) => renderCharCell(c))}</View>
        ) : (
          rows.map((row, ri) => (
            <View key={ri} style={st.gridRow}>
              {row.map((c) => renderCharCell(c))}
              {row.length < GRID_COLS && Array.from({ length: GRID_COLS - row.length }).map((_, j) => (
                <View key={`pad${j}`} style={st.gridCellPad} />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <View style={[st.gridBottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={st.gridBottomBtn} onPress={onSwitchToCard} activeOpacity={0.85}>
          <MaterialIcons name="menu-book" size={22} color={C.onPrimary} />
          <Text style={st.gridBottomBtnTxt}> 生字本</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.gridBottomBtn} onPress={onOpenPractice} activeOpacity={0.85}>
          <MaterialIcons name="edit" size={22} color={C.onPrimary} />
          <Text style={st.gridBottomBtnTxt}> 练习选中</Text>
        </TouchableOpacity>
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
          <TouchableOpacity onPress={() => nav.goBack()} style={st.headerIconBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <MaterialIcons name="arrow-back" size={24} color={C.primary} />
          </TouchableOpacity>
          <Text style={st.headerTitle} numberOfLines={1}>
            {getScreenTitle(tableType, lessonKeys)}
          </Text>
          <View style={st.headerSpacer} />
        </View>
        <GridMode
          chars={allChars}
          unfamiliarChars={unfamiliarChars}
          toggleUnfamiliar={toggleUnfamiliar}
          onSwitchToCard={() => setMode('card')}
          onOpenPractice={() => nav.navigate('CharPractice', { tableType, lessonKeys })}
          tableType={tableType}
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
        <TouchableOpacity
          style={st.headerIconBtn}
          onPress={() => {
            if (currentIdx > 0) goToCard(currentIdx - 1, 'right');
            else nav.goBack();
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={C.primary} />
        </TouchableOpacity>
        <Text style={st.headerTitle} numberOfLines={1}>
          {reviewQueue
            ? '复习不认识的字'
            : getScreenTitle(tableType, lessonKeys)}
        </Text>
        <TouchableOpacity
          style={st.headerIconBtn}
          onPress={() => setMode('grid')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialIcons name="view-list" size={24} color={C.primary} />
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
          <View style={[st.statsChip, { backgroundColor: C.successBg }]}>
            <Text style={[st.statsChipTxt, { color: C.primary }]}>✓ {knownCount}</Text>
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
              tableType={tableType}
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
    paddingHorizontal: 12, paddingVertical: 10,
  },
  headerIconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { width: 40 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: C.text, textAlign: 'center' },

  progressRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 4,
  },
  progressBar: {
    flex: 1, height: 6, borderRadius: RADIUS / 2,
    backgroundColor: C.surfaceContainer, overflow: 'hidden', marginRight: 10,
  },
  progressFill: { height: 6, borderRadius: RADIUS / 2, backgroundColor: C.primary },
  progressText: { fontSize: 13, fontWeight: '700', color: C.textMid, minWidth: 50, textAlign: 'right' },

  statsRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    paddingHorizontal: 16, marginBottom: 4, minHeight: 28,
  },
  statsChip: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADIUS,
  },
  statsChipTxt: { fontSize: 13, fontWeight: '700' },

  // Flashcard
  cardArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  cardContainer: {
    width: CARD_W, height: CARD_W * 1.25, position: 'relative',
  },
  card: {
    position: 'absolute', top: 0, left: 0,
    width: CARD_W, height: CARD_W * 1.25,
    borderRadius: RADIUS, overflow: 'hidden',
    backgroundColor: C.cardWhite,
    ...SHADOW,
  },
  cardFront: { backgroundColor: C.cardWhite, borderWidth: 1, borderColor: C.border },
  cardBack: { backgroundColor: C.cardWhite, borderWidth: 1, borderColor: C.primaryContainer },
  cardTouchable: { flex: 1, width: '100%', padding: 20, justifyContent: 'center', alignItems: 'center' },

  pinyinToggle: { position: 'absolute', top: 16, right: 16, zIndex: 2, padding: 4 },
  sceneEmoji: { fontSize: 32, marginBottom: 8, textAlign: 'center' },
  pinyinSlot: {
    height: 34, width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  frontPinyin: {
    fontSize: 24, fontWeight: '600', color: C.primary, textAlign: 'center',
  },
  pinyinInvisible: { color: 'transparent' },
  pinyinDots: {
    position: 'absolute', fontSize: 20, color: C.outline, letterSpacing: 4, textAlign: 'center',
  },
  frontChar: {
    fontSize: 96, fontWeight: '900', color: C.text,
    textAlign: 'center', lineHeight: 120,
  },
  speakBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: RADIUS * 1.5,
    backgroundColor: C.primaryBg, marginTop: 12,
  },
  speakTxt: { fontSize: 15, fontWeight: '600', color: C.primary, flexShrink: 0 },
  flipHintRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 4 },
  flipHint: { fontSize: 12, color: C.textLight },
  flipHintBackRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  flipHintBack: { fontSize: 12, color: C.textLight, textAlign: 'center' },

  backScroll: { paddingBottom: 8 },
  backHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 12 },
  backChar: { fontSize: 36, fontWeight: '900', color: C.text, marginRight: 8 },
  backPinyin: { fontSize: 18, fontWeight: '600', color: C.primary },

  writingDetailCard: {
    alignItems: 'center',
    backgroundColor: C.cardWhite,
    borderRadius: RADIUS,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    ...SHADOW,
  },
  writingBackChar: { fontSize: 64, fontWeight: '900', color: C.text, marginBottom: 8 },
  writingMetaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  writingMeta: { fontSize: 14, color: C.textMid, fontWeight: '600' },

  pronounceSection: { marginBottom: 12 },
  pronounceRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  backPinyinMain: { fontSize: 22, fontWeight: '600', color: C.primary },

  tipBox: {
    backgroundColor: C.surfaceContainerLow, borderRadius: RADIUS, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
  },
  tipLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  tipLabelText: { fontSize: 14, fontWeight: '700', color: C.text },
  tipText: { fontSize: 14, lineHeight: 22, color: C.textMid },

  vocabTitle: { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 8 },
  vocabList: { gap: 0 },
  vocabRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: C.cardWhite, borderRadius: RADIUS, marginBottom: 8, borderWidth: 1, borderColor: C.border,
  },
  vocabWordBlock: { flex: 1 },
  vocabWordText: { fontSize: 20, fontWeight: '700', color: C.text },
  vocabWordPinyin: { fontSize: 13, color: C.textLight, marginTop: 2, fontWeight: '500' },
  backSectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  infoLabelInline: { fontSize: 14, fontWeight: '700', color: C.textMid },
  infoLabelPlain: { fontSize: 14, fontWeight: '700', color: C.textMid, marginBottom: 4 },

  infoSection: { marginBottom: 12 },
  infoLabel: { fontSize: 14, fontWeight: '700', color: C.textMid, marginBottom: 4 },
  infoText: { fontSize: 15, lineHeight: 22, color: C.text },

  wordsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wordChip: {
    backgroundColor: C.surfaceContainer, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: RADIUS, borderWidth: 1, borderColor: C.border,
  },
  wordChipText: { fontSize: 18 },
  wordHL: { fontWeight: '900', color: C.error, fontSize: 22 },

  memoryBox: {
    backgroundColor: C.surfaceContainerLow, borderRadius: RADIUS, padding: 12,
    borderWidth: 1, borderColor: C.border, borderLeftWidth: 3, borderLeftColor: C.primary,
  },
  memoryText: { fontSize: 14, lineHeight: 22, color: C.textMid, marginTop: 4 },

  exampleBox: {
    backgroundColor: C.successBg, borderRadius: RADIUS, padding: 12,
    borderWidth: 1, borderColor: C.border, borderLeftWidth: 3, borderLeftColor: C.success,
  },
  exampleText: { fontSize: 14, lineHeight: 22, color: C.text },

  // Action buttons
  actionRow: {
    flexDirection: 'row', paddingHorizontal: 24, paddingTop: 10, gap: 12,
  },
  actionBtn: {
    flex: 1, height: 56, borderRadius: RADIUS,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  unknownBtn: { backgroundColor: C.errorBg, borderWidth: 2, borderColor: C.error },
  knownBtn: { backgroundColor: C.primary },
  unknownBtnIcon: { fontSize: 20, fontWeight: '800', color: C.error, marginRight: 6 },
  unknownBtnTxt: { fontSize: 17, fontWeight: '700', color: C.error },
  knownBtnIcon: { fontSize: 20, fontWeight: '800', color: '#fff', marginRight: 6 },
  knownBtnTxt: { fontSize: 17, fontWeight: '700', color: '#fff' },

  // Completion screen
  completionRoot: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  completionCard: {
    width: '100%', backgroundColor: C.cardWhite, borderRadius: RADIUS, padding: 28,
    alignItems: 'center', ...SHADOW,
  },
  completionEmoji: { fontSize: 56, marginBottom: 8 },
  completionTitle: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 4 },
  completionSub: { fontSize: 15, color: C.textMid, marginBottom: 16 },
  completionStats: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  statBox: {
    flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: RADIUS,
  },
  statNum: { fontSize: 32, fontWeight: '800' },
  statLabel: { fontSize: 14, color: C.textMid, marginTop: 4 },
  completionBar: {
    width: '100%', height: 8, borderRadius: RADIUS / 2,
    backgroundColor: C.surfaceContainer, overflow: 'hidden', marginBottom: 4,
  },
  completionBarFill: { height: 8, borderRadius: RADIUS / 2, backgroundColor: C.primary },
  completionPct: { fontSize: 14, fontWeight: '700', color: C.primary, marginBottom: 20 },
  completionBtn: {
    width: '100%', height: 52, borderRadius: RADIUS,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  completionBtnTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
  completionBtnSec: {
    width: '100%', height: 46, borderRadius: RADIUS,
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg,
  },
  completionBtnSecTxt: { fontSize: 15, fontWeight: '700' },

  // Grid mode
  gridRoot: { flex: 1 },
  infoBar: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, marginHorizontal: 12, marginBottom: 8, borderRadius: RADIUS, backgroundColor: C.surfaceContainerHigh, gap: 8,
  },
  infoBarIcon: { marginTop: 1 },
  infoBarMsg: { flex: 1, fontSize: 12, color: C.textMid, fontWeight: '500' },
  infoBarCount: { fontSize: 12, fontWeight: '700', color: C.primary, flexShrink: 0 },
  chipRow: { flexDirection: 'row', marginBottom: 8, paddingHorizontal: 12 },
  unitChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS * 2,
    backgroundColor: C.card, marginRight: 8, borderWidth: 1, borderColor: C.border,
  },
  unitChipOn: { backgroundColor: C.primary, borderColor: C.primary },
  unitChipTxt: { fontSize: 12, fontWeight: '600', color: C.textMid },
  unitChipTxtOn: { color: C.onPrimary },
  gridToolbarRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginBottom: 10,
  },
  pillToggle: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS * 2,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, gap: 6,
  },
  pillToggleOn: { backgroundColor: C.primary, borderColor: C.primary },
  pillToggleTxt: { fontSize: 12, fontWeight: '600', color: C.textMid },
  pillToggleTxtOn: { color: C.onPrimary },
  viewModeToggles: { flexDirection: 'row', gap: 4 },
  iconToggle: {
    width: 40, height: 40, borderRadius: RADIUS, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  iconToggleOn: { backgroundColor: C.primary, borderColor: C.primary },
  gridScroll: { flex: 1 },
  gridContent: { paddingHorizontal: 10, paddingBottom: 12 },
  gridContentList: { paddingBottom: 12 },
  listCol: { width: '100%' },

  gridRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  gridCell: {
    width: 72, minHeight: 112, borderRadius: RADIUS, backgroundColor: C.cardWhite, alignItems: 'center', paddingTop: 6, paddingBottom: 8, marginHorizontal: 3,
    borderWidth: 1, borderColor: C.border, ...SHADOW,
  },
  gridCellUf: { borderColor: C.error, backgroundColor: C.errorContainer, borderWidth: 2 },
  gridCellMain: { alignItems: 'center', width: '100%', paddingHorizontal: 2 },
  gridPinyinTouch: { minHeight: 16, justifyContent: 'center' },
  gridPinyinTop: { fontSize: 10, color: C.primary, fontWeight: '700' },
  gridActionIcons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 2 },
  gridCharTxt: { fontSize: 28, fontWeight: '700', color: C.text, marginTop: 2 },
  listCell: {
    width: '100%',
    minHeight: 80,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 12, paddingRight: 10, paddingVertical: 10, marginBottom: 8, marginHorizontal: 10, borderRadius: RADIUS, backgroundColor: C.cardWhite, borderWidth: 1, borderColor: C.border, ...SHADOW,
  },
  listCellMain: { flex: 1, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', paddingRight: 4 },
  listCharTxt: { fontSize: 36, fontWeight: '800', color: C.text },
  pinyinHidden: { fontSize: 11, color: C.outline, fontWeight: '600' },

  gridCellPad: { width: 72, minHeight: 112, marginHorizontal: 3 },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTxt: { fontSize: 15, color: C.textMid },
  gridBottomBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  gridBottomBtn: {
    flex: 1, flexDirection: 'row', height: 48, borderRadius: RADIUS, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  gridBottomBtnTxt: { fontSize: 15, fontWeight: '700', color: C.onPrimary },
});
