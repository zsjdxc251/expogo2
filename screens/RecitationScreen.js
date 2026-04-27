import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { C, RADIUS, SHADOW, SHADOW_SM } from '../lib/theme';
import recitationData from '../lib/recitationData';

const POEM_TRANSLATIONS = {
  '咏柳': [
    { line: '碧玉妆成一树高，', trans: '高高的柳树像用碧玉装扮而成，' },
    { line: '万条垂下绿丝绦。', trans: '千万条柳枝垂下来像绿色的丝带。' },
    { line: '不知细叶谁裁出，', trans: '不知这细嫩的柳叶是谁裁剪出来的？' },
    { line: '二月春风似剪刀。', trans: '原来是二月的春风像剪刀一样裁出。' },
  ],
  '村居': [
    { line: '草长莺飞二月天，', trans: '农历二月青草茂盛黄莺飞舞，' },
    { line: '拂堤杨柳醉春烟。', trans: '杨柳轻拂堤岸沉醉在烟雾般的春色中。' },
    { line: '儿童散学归来早，', trans: '孩子们放学早早回到家，' },
    { line: '忙趁东风放纸鸢。', trans: '趁着东风忙着放风筝。' },
  ],
  '赋得古原草送别（节选）': [
    { line: '离离原上草，', trans: '原野上的草长得茂盛，' },
    { line: '一岁一枯荣。', trans: '每年都经历枯萎和茂盛。' },
    { line: '野火烧不尽，', trans: '野火怎么也烧不完，' },
    { line: '春风吹又生。', trans: '春风一吹又重新生长。' },
  ],
  '绝句': [
    { line: '两个黄鹂鸣翠柳，', trans: '两只黄鹂在翠绿的柳树上鸣叫，' },
    { line: '一行白鹭上青天。', trans: '一行白鹭飞向蔚蓝的天空。' },
    { line: '窗含西岭千秋雪，', trans: '窗外可以看到西岭千年不化的积雪，' },
    { line: '门泊东吴万里船。', trans: '门前停泊着来自东吴的万里行船。' },
  ],
  '晓出净慈寺送林子方': [
    { line: '毕竟西湖六月中，', trans: '到底是六月的西湖啊，' },
    { line: '风光不与四时同。', trans: '风光和其他季节完全不同。' },
    { line: '接天莲叶无穷碧，', trans: '莲叶连绵到天边一片碧绿，' },
    { line: '映日荷花别样红。', trans: '在阳光映照下荷花格外鲜红。' },
  ],
  '悯农（其一）': [
    { line: '春种一粒粟，', trans: '春天播种一粒种子，' },
    { line: '秋收万颗子。', trans: '秋天收获万颗粮食。' },
    { line: '四海无闲田，', trans: '全天下没有荒废的田地，' },
    { line: '农夫犹饿死。', trans: '种田的农民还是会饿死。' },
  ],
  '江上渔者': [
    { line: '江上往来人，', trans: '江上来来往往的行人，' },
    { line: '但爱鲈鱼美。', trans: '只喜爱鲈鱼的味道鲜美。' },
    { line: '君看一叶舟，', trans: '你看那一叶小小的渔船，' },
    { line: '出没风波里。', trans: '在风浪中时隐时现多么危险。' },
  ],
  '二十四节气歌': [
    { line: '春雨惊春清谷天，', trans: '立春、雨水、惊蛰、春分、清明、谷雨' },
    { line: '夏满芒夏暑相连。', trans: '立夏、小满、芒种、夏至、小暑、大暑' },
    { line: '秋处露秋寒霜降，', trans: '立秋、处暑、白露、秋分、寒露、霜降' },
    { line: '冬雪雪冬小大寒。', trans: '立冬、小雪、大雪、冬至、小寒、大寒' },
  ],
};

const TYPE_COLORS = {
  '古诗': { bg: '#FFF8E1', border: '#FFB300', icon: '📜' },
  '名言': { bg: '#E8F5E9', border: '#66BB6A', icon: '💬' },
  '课文': { bg: '#E3F2FD', border: '#42A5F5', icon: '📖' },
  '常识': { bg: '#F3E5F5', border: '#AB47BC', icon: '🧠' },
  '经典诵读': { bg: '#FBE9E7', border: '#FF7043', icon: '📕' },
};

function LevelSelectScreen({ levels, onSelect }) {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  return (
    <View style={st.root}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={st.headerBackBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <MaterialIcons name="arrow-back" size={24} color={C.primary} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>课文背诵</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={st.scroll} contentContainerStyle={st.levelContent} showsVerticalScrollIndicator={false}>
        <Text style={st.levelHint}>共 {levels.length} 关，选择要背诵的内容</Text>
        {levels.map((lv) => {
          const firstType = lv.items[0]?.type || '课文';
          const tc = TYPE_COLORS[firstType] || TYPE_COLORS['课文'];
          return (
            <TouchableOpacity
              key={lv.level}
              style={[st.levelCard, { borderLeftColor: tc.border }]}
              activeOpacity={0.7}
              onPress={() => onSelect(lv)}
            >
              <View style={[st.levelBadge, { backgroundColor: tc.border }]}>
                <Text style={st.levelBadgeNum}>{lv.level}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={st.levelSource}>{lv.source}</Text>
                <Text style={st.levelItems} numberOfLines={1}>
                  {lv.items.map((i) => i.title).join(' · ')}
                </Text>
              </View>
              <Text style={[st.levelGo, { color: tc.border }]}>GO →</Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const BLANK_RATIO = 0.35;

function makeBlankContent(text) {
  const chars = text.split('');
  const eligible = [];
  chars.forEach((ch, i) => {
    if (/[\u4e00-\u9fff]/.test(ch)) eligible.push(i);
  });
  const blankCount = Math.max(1, Math.round(eligible.length * BLANK_RATIO));
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  const blankSet = new Set(shuffled.slice(0, blankCount));
  return chars.map((ch, i) => ({
    char: ch,
    isBlank: blankSet.has(i),
    revealed: false,
  }));
}

function ReciteItemScreen({ item, onNext, onBack, isLast, levelTitle, lessonSource }) {
  const insets = useSafeAreaInsets();
  const translations = POEM_TRANSLATIONS[item.title] || null;
  const hasTranslation = translations != null;

  const [mode, setMode] = useState('read');
  const [blankData, setBlankData] = useState(() => makeBlankContent(item.content));
  const [showTrans, setShowTrans] = useState(false);
  const [showAllBlanks, setShowAllBlanks] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingLine, setSpeakingLine] = useState(-1);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const resetBlanks = useCallback(() => {
    setBlankData(makeBlankContent(item.content));
    setShowAllBlanks(false);
  }, [item.content]);

  const revealBlank = useCallback((idx) => {
    setBlankData((prev) => prev.map((b, i) => i === idx ? { ...b, revealed: true } : b));
  }, []);

  const revealAll = useCallback(() => {
    setBlankData((prev) => prev.map((b) => ({ ...b, revealed: true })));
    setShowAllBlanks(true);
  }, []);

  const stopSpeech = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
    setSpeakingLine(-1);
  }, []);

  const speakLine = useCallback((text, lineIdx) => {
    Speech.stop();
    setSpeakingLine(lineIdx);
    setIsSpeaking(true);
    Speech.speak(text, {
      language: 'zh-CN',
      rate: 0.85,
      onDone: () => { setIsSpeaking(false); setSpeakingLine(-1); },
      onStopped: () => { setIsSpeaking(false); setSpeakingLine(-1); },
      onError: () => { setIsSpeaking(false); setSpeakingLine(-1); },
    });
  }, []);

  const speakAll = useCallback(() => {
    if (isSpeaking) { stopSpeech(); return; }
    const allText = item.content.replace(/\n/g, '，');
    setIsSpeaking(true);
    setSpeakingLine(-2);
    Speech.speak(allText, {
      language: 'zh-CN',
      rate: 0.85,
      onDone: () => { setIsSpeaking(false); setSpeakingLine(-1); },
      onStopped: () => { setIsSpeaking(false); setSpeakingLine(-1); },
      onError: () => { setIsSpeaking(false); setSpeakingLine(-1); },
    });
  }, [isSpeaking, item.content, stopSpeech]);

  const switchMode = useCallback((m) => {
    stopSpeech();
    fadeAnim.setValue(0);
    setMode(m);
    if (m === 'blank') resetBlanks();
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [fadeAnim, resetBlanks, stopSpeech]);

  useEffect(() => {
    stopSpeech();
    fadeAnim.setValue(0);
    setMode('read');
    setShowTrans(false);
    setShowAllBlanks(false);
    setBlankData(makeBlankContent(item.content));
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [item]);

  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  const lines = item.content.split('\n');
  const blankW = 48;
  const blankH = 28;

  const blankedLines = useMemo(() => {
    const result = [];
    let cursor = 0;
    for (const line of lines) {
      const lineData = blankData.slice(cursor, cursor + line.length);
      result.push(lineData);
      cursor += line.length + 1;
    }
    return result;
  }, [blankData, lines]);

  const allRevealed = blankData.filter((b) => b.isBlank).every((b) => b.revealed);

  const renderReadMode = () => (
    <View style={st.contentBox}>
      <TouchableOpacity style={[st.speakAllBtn, isSpeaking && st.speakAllBtnActive]} onPress={speakAll} activeOpacity={0.7}>
        <Text style={st.speakAllEmoji}>🔊</Text>
        <Text style={[st.speakAllTxt, isSpeaking && { color: C.error }]}>{isSpeaking ? '停止朗读' : '朗读全文'}</Text>
      </TouchableOpacity>
      {lines.map((line, i) => (
        <TouchableOpacity key={i} onPress={() => speakLine(line, i)} activeOpacity={0.7}>
          <Text style={[st.poemLineText, st.unifiedLine, speakingLine === i && st.speakingHighlight]}>{line}</Text>
        </TouchableOpacity>
      ))}
      <Text style={st.speakHint}>点击任意一行可单独朗读</Text>
    </View>
  );

  const renderBlankMode = () => (
    <View style={st.contentBox}>
      {blankedLines.map((lineData, li) => (
        <View key={li} style={st.blankLine}>
          {lineData.map((b, ci) => {
            if (b.isBlank && !b.revealed) {
              const globalIdx = lines.slice(0, li).reduce((s, l) => s + l.length + 1, 0) + ci;
              return (
                <TouchableOpacity key={ci} onPress={() => revealBlank(globalIdx)} activeOpacity={0.6}>
                  <View style={[st.blankBox, { width: blankW, height: blankH }]}>
                    <Text style={st.blankUnderscore}>___</Text>
                  </View>
                </TouchableOpacity>
              );
            }
            const revealed = b.isBlank && b.revealed;
            return (
              <Text key={ci} style={[
                st.poemLineText, st.unifiedChar, revealed && st.revealedChar,
              ]}>{b.char}</Text>
            );
          })}
        </View>
      ))}
      <View style={st.blankActions}>
        {!showAllBlanks && !allRevealed && (
          <TouchableOpacity style={[st.actionBtn, { backgroundColor: '#FFF3E0' }]} onPress={revealAll}>
            <Text style={[st.actionTxt, { color: '#E65100' }]}>显示全部答案</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderFirstMode = () => (
    <View style={st.contentBox}>
      {lines.map((line, i) => {
        const chars = line.split('');
        let firstFound = false;
        return (
          <View key={i} style={st.blankLine}>
            {chars.map((ch, ci) => {
              const isChinese = /[\u4e00-\u9fff]/.test(ch);
              if (isChinese && !firstFound) {
                firstFound = true;
                return (
                  <Text key={ci} style={[st.poemLineText, st.unifiedChar, st.firstHintChar]}>{ch}</Text>
                );
              }
              if (isChinese) {
                return (
                  <View key={ci} style={[st.blankBox, { width: blankW, height: blankH }]}>
                    <Text style={st.blankUnderscore}>___</Text>
                  </View>
                );
              }
              return <Text key={ci} style={[st.poemLineText, st.unifiedChar]}>{ch}</Text>;
            })}
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={st.root}>
      <View style={[st.reciteHeader, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity onPress={onBack} style={st.headerBackBtnRound} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <MaterialIcons name="arrow-back" size={24} color={C.titleAccent} />
        </TouchableOpacity>
        <Text style={st.headerLessonTitle} numberOfLines={1}>
          {lessonSource || levelTitle}
        </Text>
      </View>

      <ScrollView style={st.scroll} contentContainerStyle={st.reciteContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={st.actionChipsWrap}>
            <TouchableOpacity
              style={[st.actionChip, SHADOW_SM]}
              onPress={() => (mode === 'blank' ? resetBlanks() : switchMode('blank'))}
              activeOpacity={0.7}
            >
              <Text style={st.actionChipEmoji}>🔄</Text>
              <Text style={st.actionChipLabel}>重新挖空</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[st.actionChip, SHADOW_SM]}
              onPress={() => switchMode('read')}
              activeOpacity={0.7}
            >
              <Text style={st.actionChipEmoji}>🔊</Text>
              <Text style={st.actionChipLabel}>朗读全文</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[st.actionChip, SHADOW_SM]}
              onPress={() => switchMode('first')}
              activeOpacity={0.7}
            >
              <Text style={st.actionChipEmoji}>💡</Text>
              <Text style={st.actionChipLabel}>首字提示</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[st.actionChip, st.actionChipPrimary, SHADOW_SM]}
              onPress={() => switchMode('blank')}
              activeOpacity={0.7}
            >
              <Text style={st.actionChipEmoji}>🎯</Text>
              <Text style={st.actionChipLabelOnPrimary}>闯关练习</Text>
            </TouchableOpacity>
          </View>

          <View style={st.poemCardOuter}>
            <View style={st.poemCardDecor} pointerEvents="none" />
            <View style={st.poemCard}>
              <View style={st.poemHeaderBlock}>
                <Text style={st.poemDisplayTitle}>{item.title}</Text>
                {item.author ? (
                  <View style={st.authorPill}>
                    <Text style={st.authorPillText}>{item.author}</Text>
                  </View>
                ) : null}
              </View>

              {mode === 'read' && renderReadMode()}
              {mode === 'blank' && renderBlankMode()}
              {mode === 'first' && renderFirstMode()}
            </View>
          </View>

          <View style={st.mascotSection}>
            <View style={st.mascotCircle}>
              <Text style={st.mascotEmojiLg}>🦉</Text>
            </View>
            <Text style={st.mascotHint}>仔细回想一下哦！</Text>
          </View>

          {hasTranslation && (
            <View style={st.transSection}>
              <TouchableOpacity
                style={[
                  st.transToggle,
                  { backgroundColor: showTrans ? C.primaryBg : 'transparent', borderColor: C.outline },
                ]}
                onPress={() => setShowTrans(!showTrans)}
                activeOpacity={0.7}
              >
                <Text style={[st.transToggleTxt, { color: C.primary }]}>
                  {showTrans ? '隐藏译文 ▲' : '查看译文 ▼'}
                </Text>
              </TouchableOpacity>
              {showTrans && (
                <View style={[st.transBox, { borderLeftColor: C.primary }]}>
                  {translations.map((t, i) => (
                    <View key={i} style={[st.transRow, i < translations.length - 1 && st.transRowBorder]}>
                      <Text style={st.transOrig}>{t.line}</Text>
                      <Text style={st.transMeaning}>{t.trans}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {!hasTranslation && (
            <View style={st.tipBox}>
              <MaterialIcons name="lightbulb" size={20} color={C.primary} style={st.tipIconM} />
              <Text style={st.tipText}>多读几遍，试着用挖空模式背诵吧！</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={[st.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={st.bottomBarBtn}
          onPress={onNext}
          activeOpacity={0.8}
        >
          {isLast ? (
            <Text style={st.bottomBarBtnTxt}>完成本关</Text>
          ) : (
            <View style={st.navBtnInner}>
              <Text style={st.bottomBarBtnTxt}>下一个</Text>
              <MaterialIcons name="arrow-forward" size={22} color={C.onPrimary} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RecitationScreen() {
  const route = useRoute();
  const nav = useNavigation();
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [itemIdx, setItemIdx] = useState(0);

  const levels = recitationData.levels;

  const onSelectLevel = useCallback((lv) => {
    setSelectedLevel(lv);
    setItemIdx(0);
  }, []);

  const onBack = useCallback(() => {
    if (itemIdx > 0) {
      setItemIdx(itemIdx - 1);
    } else {
      setSelectedLevel(null);
    }
  }, [itemIdx]);

  const onNext = useCallback(() => {
    if (!selectedLevel) return;
    if (itemIdx < selectedLevel.items.length - 1) {
      setItemIdx(itemIdx + 1);
    } else {
      setSelectedLevel(null);
    }
  }, [selectedLevel, itemIdx]);

  if (!selectedLevel) {
    return <LevelSelectScreen levels={levels} onSelect={onSelectLevel} />;
  }

  const currentItem = selectedLevel.items[itemIdx];
  const isLast = itemIdx === selectedLevel.items.length - 1;

  return (
    <ReciteItemScreen
      key={`${selectedLevel.level}_${itemIdx}`}
      item={currentItem}
      lessonSource={selectedLevel.source}
      levelTitle={`${selectedLevel.title} (${itemIdx + 1}/${selectedLevel.items.length})`}
      onNext={onNext}
      onBack={onBack}
      isLast={isLast}
    />
  );
}

/** Stitch: 0 8px 24px rgba(0,102,112,0.06) */
const RECITE_POEM_CARD_SHADOW = {
  shadowColor: 'rgba(0, 102, 112, 0.2)',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: 4,
};

/** Stitch: 0 4px 12px rgba(0,102,112,0.25) */
const RECITE_BOTTOM_BTN_SHADOW = {
  shadowColor: 'rgba(0, 102, 112, 0.3)',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.4,
  shadowRadius: 10,
  elevation: 8,
};

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  reciteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: C.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBackBtnRound: {
    padding: 8,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text, flex: 1, textAlign: 'center' },
  headerLessonTitle: {
    flex: 1,
    marginLeft: 8,
    fontSize: 20,
    fontWeight: '700',
    color: C.titleAccent,
  },
  back: { fontSize: 15, fontWeight: '600' },
  scroll: { flex: 1 },
  levelContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20 },
  reciteContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120 },

  actionChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: C.surfaceContainerHigh,
    gap: 6,
  },
  actionChipPrimary: {
    backgroundColor: C.primaryContainer,
  },
  actionChipEmoji: { fontSize: 14, marginRight: 0 },
  actionChipLabel: { fontSize: 14, fontWeight: '600', color: C.textMid },
  actionChipLabelOnPrimary: { fontSize: 14, fontWeight: '600', color: C.onPrimaryContainer },

  poemCardOuter: {
    position: 'relative',
    marginBottom: 4,
  },
  poemCardDecor: {
    position: 'absolute',
    top: -20,
    right: -28,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(29, 128, 140, 0.2)',
  },
  poemCard: {
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: C.surfaceContainerHighest,
    ...RECITE_POEM_CARD_SHADOW,
  },
  poemHeaderBlock: {
    alignItems: 'center',
    marginBottom: 4,
  },
  poemDisplayTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: C.text,
    letterSpacing: 6,
    textAlign: 'center',
  },
  authorPill: {
    marginTop: 8,
    alignSelf: 'center',
    backgroundColor: C.surfaceContainer,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  authorPillText: { fontSize: 14, fontWeight: '600', color: C.textMid },
  poemLineText: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 32,
    letterSpacing: 2,
    color: 'rgba(62, 73, 74, 0.8)',
  },
  mascotSection: {
    marginTop: 20,
    alignItems: 'center',
    opacity: 0.8,
  },
  mascotCircle: {
    padding: 16,
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  mascotEmojiLg: { fontSize: 40, lineHeight: 44, textAlign: 'center' },
  mascotHint: { marginTop: 8, fontSize: 14, fontWeight: '600', color: C.textMid, textAlign: 'center' },

  levelHint: { fontSize: 13, color: C.textMid, marginBottom: 12, textAlign: 'center' },
  levelCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: RADIUS, backgroundColor: C.card, marginBottom: 10,
    borderLeftWidth: 4,
    ...SHADOW,
  },
  levelBadge: {
    width: 44, height: 44, borderRadius: RADIUS, alignItems: 'center', justifyContent: 'center',
  },
  levelBadgeNum: { color: '#fff', fontSize: 18, fontWeight: '800' },
  levelSource: { fontSize: 15, fontWeight: '700', color: C.text },
  levelItems: { fontSize: 12, color: C.textMid, marginTop: 2 },
  levelGo: { fontSize: 14, fontWeight: '700' },

  speakAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS,
    backgroundColor: C.surfaceContainerLow,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,102,112,0.12)',
  },
  speakAllEmoji: { fontSize: 16, marginRight: 8 },
  speakAllBtnActive: { backgroundColor: C.errorBg, borderColor: 'rgba(186,26,26,0.25)' },
  speakAllTxt: { fontSize: 14, fontWeight: '600', color: C.primary },
  speakingHighlight: { backgroundColor: C.primaryBg, borderRadius: 8, paddingVertical: 2 },
  speakHint: { fontSize: 12, color: C.textLight, textAlign: 'center', marginTop: 12 },

  contentBox: { marginTop: 16 },

  unifiedLine: {
    textAlign: 'center',
  },
  unifiedChar: {
    textAlign: 'center',
  },

  blankLine: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    marginBottom: 10, minHeight: 40,
    alignItems: 'center',
  },

  blankBox: {
    marginHorizontal: 2,
    marginVertical: 2,
    backgroundColor: C.surfaceContainerLow,
    borderBottomWidth: 3,
    borderBottomColor: C.primaryContainer,
    borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  blankUnderscore: {
    fontSize: 10,
    fontWeight: '700', color: C.textMid,
  },
  revealedChar: {
    color: C.primary, fontWeight: '800',
    textDecorationLine: 'underline', textDecorationColor: C.primary,
  },
  firstHintChar: {
    color: C.secondary, fontWeight: '800',
  },

  blankActions: {
    flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 18,
  },
  actionBtn: {
    paddingHorizontal: 18, paddingVertical: 9, borderRadius: RADIUS,
  },
  actionTxt: { fontSize: 13, fontWeight: '700' },

  transSection: { marginTop: 14 },
  transToggle: {
    alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 9,
    borderRadius: RADIUS, borderWidth: 1,
  },
  transToggleTxt: { fontSize: 14, fontWeight: '700' },
  transBox: {
    marginTop: 12, backgroundColor: C.surfaceContainerLow, borderRadius: RADIUS,
    padding: 16, borderLeftWidth: 3,
  },
  transRow: { paddingVertical: 8 },
  transRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  transOrig: { fontSize: 16, fontWeight: '700', color: C.text, lineHeight: 26 },
  transMeaning: { fontSize: 14, color: C.textMid, lineHeight: 22, marginTop: 3, paddingLeft: 10 },

  tipBox: {
    flexDirection: 'row', alignItems: 'center', marginTop: 14,
    borderRadius: RADIUS, padding: 14,
    backgroundColor: C.primaryBg,
  },
  tipIconM: { marginRight: 8 },
  tipText: { fontSize: 14, flex: 1, fontWeight: '600', color: C.textMid },

  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: C.surfaceContainerHighest,
  },
  bottomBarBtn: {
    width: '100%',
    minHeight: 56,
    borderRadius: 9999,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...RECITE_BOTTOM_BTN_SHADOW,
  },
  bottomBarBtnTxt: { fontSize: 20, fontWeight: '600', color: C.onPrimary },
  navBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
