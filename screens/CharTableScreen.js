import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Animated, Dimensions, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Line } from 'react-native-svg';
import * as Speech from 'expo-speech';
import { C, RADIUS, SHADOW, SHADOW_SM } from '../lib/theme';
import { getCharsForLessons, getWordInfo } from '../lib/textbookData';
import { useApp } from '../lib/AppContext';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 48;
const GRID_H_PAD = 12;
const GRID_GAP = 8;
const LITERACY_GRID_COLS = 2;
const GRID_CELL_W = (SCREEN_W - GRID_H_PAD * 2 - GRID_GAP) / LITERACY_GRID_COLS;
const TIAN = 240;
const WRITING_HEADER_BG = '#fdfbf7';
const WRITING_ACCENT = '#338F9B';
const MI_SHADOW = { shadowColor: 'rgba(0,102,112,0.05)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 2 };
const LIT_STICKY_BG = 'rgba(247, 250, 250, 0.92)';
const ERROR_BORDER_30 = 'rgba(186, 26, 26, 0.3)';

const KAITI = Platform.select({ ios: 'Kaiti SC', android: 'serif', default: 'serif' });

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
  const tianSize = TIAN;
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

  const cardH = isWriting
    ? Math.max(CARD_W * 1.35, 400)
    : CARD_W * 1.25;

  return (
    <View style={[st.cardContainer, { height: cardH }]}>
      {/* Front */}
      <Animated.View
        style={[st.card, st.cardFront, {
          height: cardH,
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
          {isWriting ? (
            <>
              <View style={st.miBoxOuter}>
                <Svg
                  width={tianSize}
                  height={tianSize}
                  style={st.miSvg}
                  pointerEvents="none"
                >
                  <Line
                    x1="0"
                    y1={String(tianSize / 2)}
                    x2={String(tianSize)}
                    y2={String(tianSize / 2)}
                    stroke={C.outline}
                    strokeWidth={1}
                    strokeDasharray="6 6"
                  />
                  <Line
                    x1={String(tianSize / 2)}
                    y1="0"
                    x2={String(tianSize / 2)}
                    y2={String(tianSize)}
                    stroke={C.outline}
                    strokeWidth={1}
                    strokeDasharray="6 6"
                  />
                  <Line
                    x1="0"
                    y1="0"
                    x2={String(tianSize)}
                    y2={String(tianSize)}
                    stroke={C.outline}
                    strokeWidth={1}
                    strokeDasharray="6 6"
                  />
                  <Line
                    x1={String(tianSize)}
                    y1="0"
                    x2="0"
                    y2={String(tianSize)}
                    stroke={C.outline}
                    strokeWidth={1}
                    strokeDasharray="6 6"
                  />
                </Svg>
                <Text
                  style={st.miCharText}
                  numberOfLines={1}
                >
                  {item.char}
                </Text>
              </View>
              <View style={st.strokePillRow}>
                {!!radical && (
                  <View style={st.strokePill}>
                    <Text style={st.strokePillTxt}>部首 {radical}</Text>
                  </View>
                )}
                {!!info?.parts?.length && (
                  <View style={st.strokePill}>
                    <Text style={st.strokePillTxt}>
                      结构 {info.parts.length} 部分
                    </Text>
                  </View>
                )}
              </View>
              <View style={st.flipHintRow}>
                <Text style={st.flipHint}>点击卡片查看更多</Text>
                <MaterialIcons name="arrow-forward" size={16} color={C.textLight} />
              </View>
            </>
          ) : (
            <>
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
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Back */}
      <Animated.View
        style={[st.card, st.cardBack, {
          height: cardH,
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
                <View style={st.pronounceCardW}>
                  <View style={st.pronounceCardWLeft}>
                    <Text style={st.pronounceLabelW}>读音</Text>
                    <Text style={st.backPinyinMainW}>{item.pinyin}</Text>
                  </View>
                  <TouchableOpacity
                    style={st.speakerBtnW}
                    onPress={(e) => { e.stopPropagation?.(); onSpeak(item.char); }}
                    activeOpacity={0.85}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <MaterialIcons name="volume-up" size={32} color={C.onPrimary} />
                  </TouchableOpacity>
                </View>

                {!!info?.memory && (
                  <View style={st.memoryCardW}>
                    <View style={st.memoryLabelRowW}>
                      <View style={st.memoryIconWrapW}>
                        <MaterialIcons name="lightbulb" size={20} color={C.onSecondary} />
                      </View>
                      <Text style={st.memoryLabelW}>记忆口诀</Text>
                    </View>
                    <Text style={st.memoryBodyW}>{info.memory}</Text>
                  </View>
                )}

                {(info?.words?.length > 0) && (
                  <View style={st.wordGridW}>
                    {info.words.slice(0, 6).map((w, i) => (
                      <TouchableOpacity
                        key={i}
                        style={st.wordCellW}
                        onPress={() => onSpeak(w.word)}
                        activeOpacity={0.7}
                      >
                        <Text style={st.wordCellPinyinW}>
                          {w.word.length === 1 ? item.pinyin : '·'}
                        </Text>
                        <Text style={st.wordCellHanziW} numberOfLines={2}>
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
                )}

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

  const ufCount = chars.filter((c) => unfamiliarChars.includes(c.char)).length;

  const renderCharCell = (c) => {
    const uf = unfamiliarChars.includes(c.char);
    const vis = showAllPinyin || revealedChars[c.char];
    if (viewList) {
      return (
        <View
          key={`${c.char}_${c.lesson}`}
          style={[
            st.listCell,
            uf && st.gridCellUf,
          ]}
        >
          <TouchableOpacity
            style={st.listCellMain}
            onPress={() => speak(c.pinyin)}
            onLongPress={() => toggleUnfamiliar(c.char)}
            activeOpacity={0.7}
          >
            <TouchableOpacity
              style={st.gridPinyinRow}
              onPress={() => toggleReveal(c.char)}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              {vis ? (
                <Text style={[st.gridPinyinText, uf && st.gridPinyinUf]}>{c.pinyin}</Text>
              ) : (
                <Text style={st.pinyinHidden}>···</Text>
              )}
            </TouchableOpacity>
            <Text style={[st.listCharTxt, uf && st.gridCharTxtUf]}>{c.char}</Text>
          </TouchableOpacity>
          <View style={uf ? st.gridCellHelpCircleUf : st.gridCellHelpCircle}>
            <MaterialIcons
              name={uf ? 'error' : 'help'}
              size={14}
              color={uf ? C.onPrimary : C.outline}
              style={!uf ? { opacity: 0.5 } : null}
            />
          </View>
          <TouchableOpacity
            style={st.gridCellFavBtn}
            onPress={() => toggleUnfamiliar(c.char)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityLabel="标记生僻字"
          >
            <MaterialIcons
              name={uf ? 'favorite' : 'favorite-border'}
              size={18}
              color={uf ? C.error : C.outline}
            />
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View
        key={`${c.char}_${c.lesson}`}
        style={[
          st.gridCell,
          uf && st.gridCellUf,
        ]}
      >
        <TouchableOpacity
          style={st.gridCellInner}
          onPress={() => speak(c.pinyin)}
          onLongPress={() => toggleUnfamiliar(c.char)}
          activeOpacity={0.7}
        >
          <TouchableOpacity
            style={st.gridPinyinRow}
            onPress={() => toggleReveal(c.char)}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            {vis ? (
              <Text style={[st.gridPinyinText, uf && st.gridPinyinUf]}>{c.pinyin}</Text>
            ) : (
              <Text style={st.pinyinHidden}>···</Text>
            )}
          </TouchableOpacity>
          <Text style={[st.gridCharTxt, uf && st.gridCharTxtUf]}>{c.char}</Text>
        </TouchableOpacity>
        <View style={uf ? st.gridCellHelpCircleUf : st.gridCellHelpCircle} pointerEvents="none">
          <MaterialIcons
            name={uf ? 'error' : 'help'}
            size={14}
            color={uf ? C.onPrimary : C.outline}
            style={!uf ? { opacity: 0.5 } : null}
          />
        </View>
        <TouchableOpacity
          style={st.gridCellFavBtn}
          onPress={() => toggleUnfamiliar(c.char)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityLabel="标记生僻字"
        >
          <MaterialIcons
            name={uf ? 'favorite' : 'favorite-border'}
            size={18}
            color={uf ? C.error : C.outline}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={st.gridRoot}>
      <View style={st.infoBar}>
        <View style={st.infoBarLeft}>
          <MaterialIcons name="info" size={20} color={C.primary} />
          <Text style={st.infoBarMsg} numberOfLines={2}>点击汉字查看详情</Text>
        </View>
        <View style={st.countPill}>
          <Text style={st.countPillText}>
            {chars.length} {countLabel}
          </Text>
        </View>
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
          style={st.pillToggleLit}
          onPress={() => setShowAllPinyin(!showAllPinyin)}
        >
          <MaterialIcons
            name="visibility"
            size={18}
            color={C.primary}
          />
          <Text style={st.pillToggleLitTxt}>
            {showAllPinyin ? '隐藏拼音' : '显示拼音'}
          </Text>
        </TouchableOpacity>
        <View style={st.viewModeToggles}>
          <TouchableOpacity
            style={[st.iconTogglePad, !viewList && st.iconToggleActive]}
            onPress={() => setViewList(false)}
            accessibilityLabel="宫格"
          >
            <MaterialIcons
              name="view-module"
              size={22}
              color={!viewList ? C.primary : C.outline}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.iconTogglePad, viewList && st.iconToggleActive]}
            onPress={() => setViewList(true)}
            accessibilityLabel="列表"
          >
            <MaterialIcons
              name="view-list"
              size={22}
              color={viewList ? C.primary : C.outline}
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
          <View style={st.gridMasonry}>
            {filtered.map((c) => renderCharCell(c))}
          </View>
        )}
      </ScrollView>

      <View style={[st.gridBottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={st.gridBottomBtnBook} onPress={onSwitchToCard} activeOpacity={0.85}>
          <MaterialIcons name="menu-book" size={24} color={C.text} />
          <Text style={st.gridBottomBtnBookTxt}>生字本</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.gridBottomBtnPractice} onPress={onOpenPractice} activeOpacity={0.85}>
          <MaterialIcons name="edit" size={24} color="#744300" />
          <Text style={st.gridBottomBtnPracticeTxt}>练习选中</Text>
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
        <View style={st.literacyHeaderSticky}>
          <TouchableOpacity
            onPress={() => nav.goBack()}
            style={st.headerBackCircle}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialIcons name="arrow-back" size={24} color={C.primary} />
          </TouchableOpacity>
          <Text style={st.headerTitleLit} numberOfLines={1}>
            {getScreenTitle(tableType, lessonKeys)}
          </Text>
          <View style={st.headerSpacer48} />
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

  const isWritingTable = tableType === 'xiezi';

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      {/* Header */}
      {isWritingTable ? (
        <View style={st.wHeaderWriting}>
          <TouchableOpacity
            style={st.wHeaderCloseBtn}
            onPress={() => {
              if (currentIdx > 0) goToCard(currentIdx - 1, 'right');
              else nav.goBack();
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialIcons name="close" size={28} color={WRITING_ACCENT} />
          </TouchableOpacity>
          <Text style={st.wTitleWriting} numberOfLines={1}>
            {reviewQueue
              ? '复习不认识的字'
              : getScreenTitle(tableType, lessonKeys)}
          </Text>
          <View style={st.headerSpacer} />
        </View>
      ) : (
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
      )}

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

      {/* Action buttons + writing nav */}
      <View
        style={[
          isWritingTable && st.writingBottomWrap,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <View style={[st.actionRow, isWritingTable && st.actionRowWriting]}>
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
        {isWritingTable && (
          <View style={st.writingFooterNav}>
            <TouchableOpacity
              style={[
                st.writingNavBtn,
                st.writingNavPrev,
                currentIdx === 0 && st.writingNavDisabled,
              ]}
              onPress={() => currentIdx > 0 && goToCard(currentIdx - 1, 'right')}
              activeOpacity={0.85}
              disabled={currentIdx === 0}
            >
              <Text
                style={[
                  st.writingNavBtnTxt,
                  currentIdx === 0 && st.writingNavBtnTxtDis,
                ]}
              >
                上一个
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                st.writingNavBtn,
                st.writingNavNext,
                currentIdx >= orderedChars.length - 1 && st.writingNavDisabled,
              ]}
              onPress={() => currentIdx < orderedChars.length - 1
                && goToCard(currentIdx + 1, 'left')}
              activeOpacity={0.85}
              disabled={currentIdx >= orderedChars.length - 1}
            >
              <Text
                style={[
                  st.writingNavBtnTxt,
                  st.writingNavNextTxt,
                  currentIdx >= orderedChars.length - 1 && st.writingNavBtnTxtDis,
                ]}
              >
                下一个
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  headerIconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { width: 40 },
  headerSpacer48: { width: 48 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: C.text, textAlign: 'center' },

  literacyHeaderSticky: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: LIT_STICKY_BG,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.surfaceVariant,
  },
  headerBackCircle: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: C.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitleLit: {
    flex: 1, fontSize: 24, fontWeight: '600', color: C.primary, textAlign: 'center',
    paddingHorizontal: 8,
  },

  wHeaderWriting: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: WRITING_HEADER_BG,
  },
  wHeaderCloseBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  wTitleWriting: {
    flex: 1, fontSize: 20, fontWeight: '900', color: WRITING_ACCENT, textAlign: 'center',
  },

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
    width: CARD_W, position: 'relative',
  },
  card: {
    position: 'absolute', top: 0, left: 0,
    width: CARD_W,
    borderRadius: RADIUS, overflow: 'hidden',
    backgroundColor: C.cardWhite,
    ...SHADOW,
  },
  cardFront: { backgroundColor: C.cardWhite, borderWidth: 1, borderColor: C.border },
  cardBack: { backgroundColor: C.cardWhite, borderWidth: 1, borderColor: C.primaryContainer },
  cardTouchable: { flex: 1, width: '100%', padding: 20, justifyContent: 'center', alignItems: 'center' },

  miBoxOuter: {
    width: TIAN, height: TIAN, borderRadius: 20, borderWidth: 4, borderColor: C.primaryFixedDim,
    backgroundColor: C.cardWhite, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    marginBottom: 8, ...MI_SHADOW,
  },
  miSvg: { position: 'absolute', left: 0, top: 0 },
  miCharText: {
    fontSize: 150, lineHeight: 150, color: C.text, fontWeight: '700', fontFamily: KAITI,
    textAlign: 'center', includeFontPadding: false,
  },
  strokePillRow: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 4, marginBottom: 8,
  },
  strokePill: {
    backgroundColor: C.surface, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999,
    borderWidth: 2, borderColor: C.primaryFixedDim,
  },
  strokePillTxt: { fontSize: 14, color: C.text, fontWeight: '500' },

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

  pronounceCardW: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.cardWhite, borderRadius: 24, padding: 24, marginBottom: 12,
    borderWidth: 2, borderColor: C.surfaceVariant,
    ...SHADOW,
  },
  pronounceCardWLeft: { flex: 1, marginRight: 12 },
  pronounceLabelW: { fontSize: 14, fontWeight: '600', color: C.textMid, marginBottom: 4 },
  backPinyinMainW: { fontSize: 22, fontWeight: '700', color: C.primary },
  speakerBtnW: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: C.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOW_SM,
  },
  memoryCardW: {
    backgroundColor: C.surfaceContainerLow, borderRadius: 24, padding: 24, marginBottom: 12,
  },
  memoryLabelRowW: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  memoryIconWrapW: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: C.secondaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  memoryLabelW: { fontSize: 16, fontWeight: '700', color: C.text },
  memoryBodyW: { fontSize: 20, lineHeight: 30, color: C.text },
  wordGridW: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12,
  },
  wordCellW: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 10,
    backgroundColor: C.cardWhite,
    borderRadius: 24,
    padding: 12,
    borderWidth: 2,
    borderColor: C.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordCellPinyinW: { fontSize: 14, color: C.outline, fontWeight: '500', marginBottom: 4 },
  wordCellHanziW: { fontSize: 24, fontWeight: '600', color: C.text, fontFamily: KAITI, textAlign: 'center' },

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
  actionRowWriting: {
    borderTopWidth: 0, paddingTop: 12, marginTop: 0,
  },
  writingBottomWrap: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderTopWidth: 2,
    borderTopColor: C.surfaceContainer,
    paddingTop: 4,
  },
  writingFooterNav: {
    flexDirection: 'row', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4, gap: 10,
  },
  writingNavBtn: {
    flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  writingNavDisabled: { opacity: 0.4 },
  writingNavPrev: {
    backgroundColor: C.surfaceVariant, borderBottomWidth: 3, borderBottomColor: C.surfaceContainerHighest,
  },
  writingNavNext: {
    backgroundColor: C.secondaryContainer,
    borderBottomWidth: 4, borderBottomColor: C.secondary,
  },
  writingNavBtnTxt: { fontSize: 16, fontWeight: '700', color: C.text },
  writingNavNextTxt: { color: '#744300' },
  writingNavBtnTxtDis: { color: C.outline },
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 12, marginHorizontal: 12, marginBottom: 8, borderRadius: 8,
    backgroundColor: C.surfaceContainerLowest,
    borderWidth: 2, borderColor: C.surfaceContainerHigh,
    gap: 8,
  },
  infoBarLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoBarMsg: { flex: 1, fontSize: 16, color: C.text, fontWeight: '600' },
  countPill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: C.surfaceContainer, borderWidth: 1, borderColor: C.outlineVariant,
  },
  countPillText: { fontSize: 14, fontWeight: '500', color: C.outline },
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
  pillToggleLit: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: C.cardWhite, borderWidth: 1, borderColor: C.surfaceContainerHigh, gap: 6,
  },
  pillToggleLitTxt: { fontSize: 14, fontWeight: '600', color: C.text },
  viewModeToggles: {
    flexDirection: 'row', backgroundColor: C.surfaceContainer, borderRadius: 999, padding: 2, gap: 0,
  },
  iconTogglePad: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  iconToggleActive: {
    backgroundColor: C.cardWhite, ...SHADOW_SM,
  },
  gridScroll: { flex: 1 },
  gridContent: { paddingHorizontal: GRID_H_PAD, paddingBottom: 12 },
  gridContentList: { paddingBottom: 12 },
  listCol: { width: '100%' },
  gridMasonry: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%',
  },

  gridCell: {
    width: GRID_CELL_W, aspectRatio: 1, marginBottom: GRID_GAP,
    borderRadius: 8, backgroundColor: C.surfaceContainerLowest,
    borderWidth: 2, borderColor: C.surfaceContainerHigh, padding: 12,
    position: 'relative', ...MI_SHADOW,
  },
  gridCellUf: {
    backgroundColor: C.errorContainer,
    borderColor: ERROR_BORDER_30,
  },
  gridCellInner: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  gridPinyinRow: { marginBottom: 4, minHeight: 20, width: '100%', alignItems: 'center' },
  gridPinyinText: { fontSize: 14, fontWeight: '500', color: C.outlineVariant, textAlign: 'center' },
  gridPinyinUf: { color: C.onErrorContainer },
  gridCharTxt: { fontSize: 40, fontWeight: '700', color: C.text, textAlign: 'center' },
  gridCharTxtUf: { color: C.onErrorContainer },
  gridCellHelpCircle: {
    position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.surfaceContainer, alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  gridCellHelpCircleUf: {
    position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.error, alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  gridCellFavBtn: { position: 'absolute', bottom: 6, right: 6, zIndex: 2 },

  listCell: {
    position: 'relative', width: '100%', minHeight: 80,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, marginBottom: 8, marginHorizontal: 10, borderRadius: 8,
    backgroundColor: C.surfaceContainerLowest, borderWidth: 2, borderColor: C.surfaceContainerHigh, ...MI_SHADOW,
  },
  listCellMain: { flex: 1, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', paddingRight: 40 },
  listCharTxt: { fontSize: 36, fontWeight: '800', color: C.text, marginTop: 4 },
  pinyinHidden: { fontSize: 12, color: C.outlineVariant, fontWeight: '600' },

  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTxt: { fontSize: 15, color: C.textMid },
  gridBottomBar: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.surfaceVariant, backgroundColor: C.bg,
  },
  gridBottomBtnBook: {
    flex: 1, flexDirection: 'row', height: 52, borderRadius: 999,
    backgroundColor: C.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', gap: 6,
    borderBottomWidth: 4, borderBottomColor: C.surfaceContainerHighest,
  },
  gridBottomBtnBookTxt: { fontSize: 24, fontWeight: '600', color: C.text },
  gridBottomBtnPractice: {
    flex: 2, flexDirection: 'row', height: 52, borderRadius: 999,
    backgroundColor: C.secondaryContainer, alignItems: 'center', justifyContent: 'center', gap: 6,
    borderBottomWidth: 4, borderBottomColor: 'rgba(116, 67, 0, 0.25)',
  },
  gridBottomBtnPracticeTxt: { fontSize: 24, fontWeight: '600', color: '#744300' },
});
