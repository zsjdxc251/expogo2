import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, RADIUS, SUBJECT_COLORS } from '../lib/theme';
import recitationData from '../lib/recitationData';

const sc = SUBJECT_COLORS.chinese;

const POEM_TRANSLATIONS = {
  '咏柳': [
    { line: '碧玉妆成一树高', trans: '高高的柳树像用碧玉装扮而成' },
    { line: '万条垂下绿丝绦', trans: '千万条柳枝垂下来像绿色的丝带' },
    { line: '不知细叶谁裁出', trans: '不知这细嫩的柳叶是谁裁剪出来的' },
    { line: '二月春风似剪刀', trans: '原来是二月的春风像剪刀一样裁出' },
  ],
  '村居': [
    { line: '草长莺飞二月天', trans: '农历二月青草茂盛黄莺飞舞' },
    { line: '拂堤杨柳醉春烟', trans: '杨柳轻拂堤岸沉醉在烟雾般的春色中' },
    { line: '儿童散学归来早', trans: '孩子们放学早早回到家' },
    { line: '忙趁东风放纸鸢', trans: '趁着东风忙着放风筝' },
  ],
  '赋得古原草送别（节选）': [
    { line: '离离原上草', trans: '原野上的草长得茂盛' },
    { line: '一岁一枯荣', trans: '每年都经历枯萎和茂盛' },
    { line: '野火烧不尽', trans: '野火怎么也烧不完' },
    { line: '春风吹又生', trans: '春风一吹又重新生长' },
  ],
  '绝句': [
    { line: '两个黄鹂鸣翠柳', trans: '两只黄鹂在翠绿的柳树上鸣叫' },
    { line: '一行白鹭上青天', trans: '一行白鹭飞向蔚蓝的天空' },
    { line: '窗含西岭千秋雪', trans: '窗外可以看到西岭千年不化的积雪' },
    { line: '门泊东吴万里船', trans: '门前停泊着来自东吴的万里行船' },
  ],
  '晓出净慈寺送林子方': [
    { line: '毕竟西湖六月中', trans: '到底是六月的西湖啊' },
    { line: '风光不与四时同', trans: '风光和其他季节完全不同' },
    { line: '接天莲叶无穷碧', trans: '莲叶连绵到天边一片碧绿' },
    { line: '映日荷花别样红', trans: '在阳光映照下荷花格外鲜红' },
  ],
  '悯农（其一）': [
    { line: '春种一粒粟', trans: '春天播种一粒种子' },
    { line: '秋收万颗子', trans: '秋天收获万颗粮食' },
    { line: '四海无闲田', trans: '全天下没有荒废的田地' },
    { line: '农夫犹饿死', trans: '种田的农民还是会饿死' },
  ],
  '江上渔者': [
    { line: '江上往来人', trans: '江上来来往往的行人' },
    { line: '但爱鲈鱼美', trans: '只喜爱鲈鱼的味道鲜美' },
    { line: '君看一叶舟', trans: '你看那一叶小小的渔船' },
    { line: '出没风波里', trans: '在风浪中时隐时现多么危险' },
  ],
  '二十四节气歌': [
    { line: '春雨惊春清谷天', trans: '立春、雨水、惊蛰、春分、清明、谷雨' },
    { line: '夏满芒夏暑相连', trans: '立夏、小满、芒种、夏至、小暑、大暑' },
    { line: '秋处露秋寒霜降', trans: '立秋、处暑、白露、秋分、寒露、霜降' },
    { line: '冬雪雪冬小大寒', trans: '立冬、小雪、大雪、冬至、小寒、大寒' },
  ],
};

function LevelSelectScreen({ levels, onSelect }) {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Text style={[st.back, { color: sc.primary }]}>← 返回</Text>
        </TouchableOpacity>
        <Text style={st.headerTitle}>课文背诵</Text>
        <View style={{ width: 50 }} />
      </View>
      <ScrollView style={st.scroll} contentContainerStyle={st.levelContent} showsVerticalScrollIndicator={false}>
        <Text style={st.levelHint}>共 {levels.length} 关，选择要背诵的内容</Text>
        {levels.map((lv) => (
          <TouchableOpacity
            key={lv.level}
            style={st.levelCard}
            activeOpacity={0.7}
            onPress={() => onSelect(lv)}
          >
            <View style={[st.levelBadge, { backgroundColor: sc.primary }]}>
              <Text style={st.levelBadgeTxt}>{lv.title}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={st.levelSource}>{lv.source}</Text>
              <Text style={st.levelItems}>
                {lv.items.map((i) => i.title).join(' · ')}
              </Text>
            </View>
            <Text style={[st.levelGo, { color: sc.primary }]}>开始 →</Text>
          </TouchableOpacity>
        ))}
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

function ReciteItemScreen({ item, onNext, onBack, isLast, levelTitle }) {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const isPoem = item.type === '古诗';
  const translations = POEM_TRANSLATIONS[item.title] || null;
  const hasTranslation = isPoem && translations;

  const [mode, setMode] = useState('read');
  const [blankData, setBlankData] = useState(() => makeBlankContent(item.content));
  const [showTrans, setShowTrans] = useState(false);
  const [showAllBlanks, setShowAllBlanks] = useState(false);
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

  const switchMode = useCallback((m) => {
    fadeAnim.setValue(0);
    setMode(m);
    if (m === 'blank') resetBlanks();
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [fadeAnim, resetBlanks]);

  useEffect(() => {
    fadeAnim.setValue(0);
    setMode('read');
    setShowTrans(false);
    setShowAllBlanks(false);
    setBlankData(makeBlankContent(item.content));
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [item]);

  const lines = item.content.split('\n');
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

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={[st.back, { color: sc.primary }]}>← 返回</Text>
        </TouchableOpacity>
        <Text style={st.headerTitle}>{levelTitle}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={st.scroll} contentContainerStyle={st.reciteContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={st.itemCard}>
            <Text style={st.itemTitle}>{item.title}</Text>
            {item.author && <Text style={st.itemAuthor}>{item.author}</Text>}
            {item.type && <View style={[st.typeBadge, { backgroundColor: sc.bg }]}><Text style={[st.typeBadgeTxt, { color: sc.primary }]}>{item.type}</Text></View>}

            <View style={st.modeRow}>
              <TouchableOpacity
                style={[st.modeBtn, mode === 'read' && { backgroundColor: sc.primary }]}
                onPress={() => switchMode('read')}
              >
                <Text style={[st.modeTxt, mode === 'read' && { color: '#fff' }]}>朗读模式</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.modeBtn, mode === 'blank' && { backgroundColor: sc.primary }]}
                onPress={() => switchMode('blank')}
              >
                <Text style={[st.modeTxt, mode === 'blank' && { color: '#fff' }]}>挖空背诵</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.modeBtn, mode === 'first' && { backgroundColor: sc.primary }]}
                onPress={() => switchMode('first')}
              >
                <Text style={[st.modeTxt, mode === 'first' && { color: '#fff' }]}>首字提示</Text>
              </TouchableOpacity>
            </View>

            <View style={st.contentBox}>
              {mode === 'read' && lines.map((line, i) => (
                <Text key={i} style={isPoem ? st.poemLine : st.proseLine}>{line}</Text>
              ))}

              {mode === 'blank' && (
                <>
                  {blankedLines.map((lineData, li) => (
                    <View key={li} style={st.blankLine}>
                      {lineData.map((b, ci) => {
                        if (b.isBlank && !b.revealed) {
                          const globalIdx = lines.slice(0, li).reduce((s, l) => s + l.length + 1, 0) + ci;
                          return (
                            <TouchableOpacity key={ci} onPress={() => revealBlank(globalIdx)}>
                              <Text style={st.blankChar}>＿</Text>
                            </TouchableOpacity>
                          );
                        }
                        const revealed = b.isBlank && b.revealed;
                        return (
                          <Text key={ci} style={[
                            isPoem ? st.poemChar : st.proseChar,
                            revealed && st.revealedChar,
                          ]}>{b.char}</Text>
                        );
                      })}
                    </View>
                  ))}
                  <View style={st.blankActions}>
                    {!showAllBlanks && !allRevealed && (
                      <TouchableOpacity style={[st.actionBtn, { backgroundColor: '#FFF3E0' }]} onPress={revealAll}>
                        <Text style={[st.actionTxt, { color: '#E65100' }]}>显示答案</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[st.actionBtn, { backgroundColor: sc.bg }]} onPress={resetBlanks}>
                      <Text style={[st.actionTxt, { color: sc.primary }]}>重新挖空</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {mode === 'first' && lines.map((line, i) => {
                const chars = line.split('');
                const firstChinese = chars.findIndex((c) => /[\u4e00-\u9fff]/.test(c));
                return (
                  <View key={i} style={st.blankLine}>
                    {chars.map((ch, ci) => {
                      const isChinese = /[\u4e00-\u9fff]/.test(ch);
                      if (isChinese && ci !== firstChinese) {
                        return <Text key={ci} style={st.blankChar}>＿</Text>;
                      }
                      return (
                        <Text key={ci} style={[
                          isPoem ? st.poemChar : st.proseChar,
                          isChinese && ci === firstChinese && st.firstHintChar,
                        ]}>{ch}</Text>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </View>

          {hasTranslation && (
            <View style={st.transSection}>
              <TouchableOpacity
                style={[st.transToggle, { borderColor: sc.primary }]}
                onPress={() => setShowTrans(!showTrans)}
              >
                <Text style={[st.transToggleTxt, { color: sc.primary }]}>
                  {showTrans ? '隐藏译文 ▲' : '查看译文 ▼'}
                </Text>
              </TouchableOpacity>
              {showTrans && (
                <View style={st.transBox}>
                  {translations.map((t, i) => (
                    <View key={i} style={st.transRow}>
                      <Text style={st.transOrig}>{t.line}</Text>
                      <Text style={st.transMeaning}>{t.trans}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {!hasTranslation && (isPoem || item.type === '经典诵读') && (
            <View style={st.tipBox}>
              <Text style={st.tipIcon}>💡</Text>
              <Text style={st.tipText}>多读几遍，试着用挖空模式背诵吧！</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={[st.navRow, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={[st.navBtn, { backgroundColor: isLast ? sc.primary : C.card }]}
          onPress={onNext}
          activeOpacity={0.8}
        >
          <Text style={[isLast ? st.navBtnTxtW : st.navBtnTxt]}>
            {isLast ? '完成本关 ✓' : '下一篇 →'}
          </Text>
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
      levelTitle={`${selectedLevel.title} (${itemIdx + 1}/${selectedLevel.items.length})`}
      onNext={onNext}
      onBack={onBack}
      isLast={isLast}
    />
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
  scroll: { flex: 1 },
  levelContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  reciteContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },

  levelHint: { fontSize: 14, color: C.textMid, marginBottom: 14, textAlign: 'center' },
  levelCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: RADIUS, backgroundColor: C.card, marginBottom: 10,
    borderLeftWidth: 4, borderLeftColor: sc.primary,
  },
  levelBadge: {
    width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  levelBadgeTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },
  levelSource: { fontSize: 15, fontWeight: '700', color: C.text },
  levelItems: { fontSize: 12, color: C.textMid, marginTop: 3 },
  levelGo: { fontSize: 14, fontWeight: '700' },

  itemCard: {
    backgroundColor: C.card, borderRadius: RADIUS, padding: 20,
    borderTopWidth: 4, borderTopColor: sc.primary,
  },
  itemTitle: { fontSize: 22, fontWeight: '800', color: C.text, textAlign: 'center' },
  itemAuthor: { fontSize: 14, color: C.textMid, textAlign: 'center', marginTop: 4 },
  typeBadge: {
    alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 3,
    borderRadius: 10, marginTop: 8,
  },
  typeBadgeTxt: { fontSize: 12, fontWeight: '700' },

  modeRow: { flexDirection: 'row', gap: 8, marginTop: 16, justifyContent: 'center' },
  modeBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  modeTxt: { fontSize: 13, fontWeight: '700', color: C.textMid },

  contentBox: { marginTop: 20 },
  poemLine: {
    fontSize: 22, fontWeight: '600', color: C.text,
    textAlign: 'center', lineHeight: 38, letterSpacing: 2,
  },
  proseLine: {
    fontSize: 17, lineHeight: 30, color: C.text, textAlign: 'justify',
  },

  blankLine: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    marginBottom: 4,
  },
  blankChar: {
    fontSize: 22, fontWeight: '600', color: '#E06B6B',
    textAlign: 'center', width: 28, lineHeight: 38, letterSpacing: 2,
  },
  poemChar: {
    fontSize: 22, fontWeight: '600', color: C.text,
    textAlign: 'center', width: 28, lineHeight: 38, letterSpacing: 2,
  },
  proseChar: {
    fontSize: 17, color: C.text, lineHeight: 30,
  },
  revealedChar: { color: sc.primary, fontWeight: '800' },
  firstHintChar: { color: '#EB9F4A', fontWeight: '800', fontSize: 24 },

  blankActions: {
    flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 16,
  },
  actionBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14,
  },
  actionTxt: { fontSize: 13, fontWeight: '700' },

  transSection: { marginTop: 16 },
  transToggle: {
    alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 16, borderWidth: 1.5,
  },
  transToggleTxt: { fontSize: 14, fontWeight: '700' },
  transBox: {
    marginTop: 12, backgroundColor: '#FFFDE7', borderRadius: 14,
    padding: 16, borderLeftWidth: 4, borderLeftColor: '#FFB300',
  },
  transRow: { marginBottom: 10 },
  transOrig: { fontSize: 16, fontWeight: '700', color: '#5D4037', lineHeight: 26 },
  transMeaning: { fontSize: 14, color: '#795548', lineHeight: 22, marginTop: 2, paddingLeft: 8 },

  tipBox: {
    flexDirection: 'row', alignItems: 'center', marginTop: 16,
    backgroundColor: '#E8F5E9', borderRadius: 14, padding: 14,
  },
  tipIcon: { fontSize: 20, marginRight: 8 },
  tipText: { fontSize: 14, color: '#2E7D32', flex: 1 },

  navRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingTop: 10, gap: 10,
    borderTopWidth: 1, borderColor: C.border,
  },
  navBtn: {
    flex: 1, height: 48, borderRadius: RADIUS,
    alignItems: 'center', justifyContent: 'center',
  },
  navBtnTxt: { fontSize: 15, fontWeight: '700', color: C.text },
  navBtnTxtW: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
