import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import { C, RADIUS } from '../lib/theme';
import { SEMESTER_CHARS, HANZI_UNITS, getUnitChars } from '../lib/hanziData';
import { useApp } from '../lib/AppContext';

const COLS = 5;

export default function CharTableScreen() {
  const nav = useNavigation();
  const { unfamiliarChars, toggleUnfamiliar } = useApp();
  const [showAllPinyin, setShowAllPinyin] = useState(false);
  const [revealedChars, setRevealedChars] = useState({});
  const [unitIdx, setUnitIdx] = useState(0);

  const unit = HANZI_UNITS[unitIdx];
  const chars = unit.key === 'unfamiliar'
    ? getUnitChars('unfamiliar', unfamiliarChars)
    : getUnitChars(unit.key);

  const toggleReveal = useCallback((ch) => {
    setRevealedChars((prev) => ({ ...prev, [ch]: !prev[ch] }));
  }, []);

  const speak = useCallback((py) => {
    Speech.speak(py, { language: 'zh-CN', rate: 0.7 });
  }, []);

  const isPinyinVisible = (ch) => showAllPinyin || revealedChars[ch];
  const isUnfamiliar = (ch) => unfamiliarChars.includes(ch);

  const rows = [];
  for (let i = 0; i < chars.length; i += COLS) {
    rows.push(chars.slice(i, i + COLS));
  }

  const unfamiliarCount = unfamiliarChars.length;

  return (
    <View style={st.root}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Text style={st.backTxt}>← 返回</Text>
        </TouchableOpacity>
        <Text style={st.title}>认字表</Text>
        <TouchableOpacity onPress={() => nav.navigate('CharPractice')}>
          <Text style={st.practiceTxt}>练习 →</Text>
        </TouchableOpacity>
      </View>

      <View style={st.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.unitScroll}>
          {HANZI_UNITS.map((u, i) => (
            <TouchableOpacity
              key={u.key}
              style={[st.unitChip, unitIdx === i && st.unitChipOn]}
              onPress={() => setUnitIdx(i)}
            >
              <Text style={[st.unitChipTxt, unitIdx === i && st.unitChipTxtOn]}>
                {u.icon} {u.label}
                {u.key === 'unfamiliar' ? ` (${unfamiliarCount})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          style={[st.eyeBtn, showAllPinyin && st.eyeBtnOn]}
          onPress={() => setShowAllPinyin(!showAllPinyin)}
        >
          <Text style={st.eyeTxt}>{showAllPinyin ? '👁' : '👁‍🗨'}</Text>
          <Text style={st.eyeLabel}>{showAllPinyin ? '隐藏全部' : '显示全部'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={st.scroll} contentContainerStyle={st.grid} showsVerticalScrollIndicator={false}>
        {chars.length === 0 ? (
          <View style={st.emptyBox}>
            <Text style={st.emptyIcon}>📭</Text>
            <Text style={st.emptyTxt}>
              {unit.key === 'unfamiliar' ? '还没有标记陌生字' : '没有符合条件的字'}
            </Text>
          </View>
        ) : (
          rows.map((row, ri) => (
            <View key={ri} style={st.row}>
              {row.map((c) => {
                const uf = isUnfamiliar(c.char);
                const vis = isPinyinVisible(c.char);
                return (
                  <TouchableOpacity
                    key={c.char}
                    style={[st.cell, uf && st.cellUnfamiliar]}
                    onPress={() => speak(c.pinyin)}
                    onLongPress={() => toggleUnfamiliar(c.char)}
                    activeOpacity={0.7}
                  >
                    {uf && <Text style={st.starMark}>⭐</Text>}
                    <Text style={st.charTxt}>{c.char}</Text>
                    <TouchableOpacity onPress={() => toggleReveal(c.char)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      {vis ? (
                        <Text style={st.pinyinTxt}>{c.pinyin}</Text>
                      ) : (
                        <Text style={st.pinyinHidden}>· · ·</Text>
                      )}
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
              {row.length < COLS && Array.from({ length: COLS - row.length }).map((_, j) => (
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

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paperBg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8,
  },
  backTxt: { fontSize: 15, fontWeight: '600', color: '#4CAF7D' },
  title: { fontSize: 18, fontWeight: '800', color: C.text },
  practiceTxt: { fontSize: 15, fontWeight: '600', color: '#4CAF7D' },

  toolbar: { paddingHorizontal: 12, paddingBottom: 8 },
  unitScroll: { paddingBottom: 8 },
  unitChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: C.paperCard, marginRight: 6, borderWidth: 1.5, borderColor: 'transparent',
  },
  unitChipOn: { backgroundColor: '#4CAF7D', borderColor: '#4CAF7D' },
  unitChipTxt: { fontSize: 12, fontWeight: '600', color: C.textMid },
  unitChipTxtOn: { color: '#fff' },

  eyeBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: C.paperCard,
  },
  eyeBtnOn: { backgroundColor: '#4CAF7D' },
  eyeTxt: { fontSize: 16, marginRight: 4 },
  eyeLabel: { fontSize: 11, fontWeight: '600', color: C.textMid },

  scroll: { flex: 1 },
  grid: { paddingHorizontal: 10, paddingBottom: 20 },

  row: { flexDirection: 'row', justifyContent: 'center', marginBottom: 6 },

  cell: {
    width: 64, height: 82, borderRadius: 12, backgroundColor: '#FFFDF7',
    alignItems: 'center', justifyContent: 'center', marginHorizontal: 3,
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.08)',
  },
  cellUnfamiliar: { borderColor: '#E06B6B', backgroundColor: '#FFF5F5' },
  cellPad: { width: 64, height: 82, marginHorizontal: 3 },
  starMark: { position: 'absolute', top: 2, right: 2, fontSize: 10 },
  charTxt: { fontSize: 28, fontWeight: '700', color: '#333' },
  pinyinTxt: { fontSize: 11, color: '#4CAF7D', fontWeight: '600', marginTop: 2 },
  pinyinHidden: { fontSize: 11, color: '#bbb', fontWeight: '600', marginTop: 2 },

  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTxt: { fontSize: 15, color: C.textMid },

  footer: {
    paddingVertical: 10, paddingHorizontal: 16,
    backgroundColor: C.paperCard, alignItems: 'center',
  },
  footerTxt: { fontSize: 11, color: C.textMid },
});
