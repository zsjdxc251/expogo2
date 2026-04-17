import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HanziWriter, useHanziWriter } from '@jamsch/react-native-hanzi-writer';
import { C, RADIUS } from '../lib/theme';

export default function StrokeAnimation({ char, size = 200, autoPlay = false }) {
  const [key, setKey] = useState(0);

  const writer = useHanziWriter({
    character: char,
    loader(c) {
      return fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${c}.json`)
        .then((r) => r.json());
    },
  });

  const animState = writer.animator.useStore((s) => s.state);

  const onAnimate = useCallback(() => {
    if (animState === 'playing') {
      writer.animator.cancelAnimation();
    } else {
      writer.animator.animateCharacter({
        delayBetweenStrokes: 600,
        strokeDuration: 700,
      });
    }
  }, [animState, writer]);

  const onReplay = useCallback(() => {
    setKey((k) => k + 1);
    setTimeout(() => {
      writer.animator.animateCharacter({
        delayBetweenStrokes: 600,
        strokeDuration: 700,
      });
    }, 300);
  }, [writer]);

  return (
    <View style={[st.root, { width: size + 16, alignItems: 'center' }]}>
      <View style={[st.gridBox, { width: size, height: size }]}>
        <View style={st.gridOverlay}>
          <View style={[st.gridLine, st.gridH]} />
          <View style={[st.gridLine, st.gridV]} />
          <View style={[st.gridLine, st.gridD1]} />
          <View style={[st.gridLine, st.gridD2]} />
        </View>
        <HanziWriter
          writer={writer}
          loading={<Text style={st.loading}>加载中...</Text>}
          error={<FallbackChar char={char} size={size} />}
          style={{ width: size, height: size }}
        >
          <HanziWriter.GridLines color="rgba(200,200,200,0.4)" />
          <HanziWriter.Svg>
            <HanziWriter.Outline color="#ddd" />
            <HanziWriter.Character color="#333" />
          </HanziWriter.Svg>
        </HanziWriter>
      </View>

      <View style={st.btnRow}>
        <TouchableOpacity style={[st.btn, st.btnPrimary]} onPress={onAnimate} activeOpacity={0.7}>
          <Text style={st.btnTxtW}>
            {animState === 'playing' ? '⏸ 暂停' : '▶ 笔顺演示'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.btn} onPress={onReplay} activeOpacity={0.7}>
          <Text style={st.btnTxt}>🔄 重播</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FallbackChar({ char, size }) {
  return (
    <View style={[st.fallback, { width: size, height: size }]}>
      <Text style={[st.fallbackChar, { fontSize: size * 0.6 }]}>{char}</Text>
      <Text style={st.fallbackHint}>笔画数据加载失败</Text>
    </View>
  );
}

const st = StyleSheet.create({
  root: { marginVertical: 12 },
  gridBox: {
    borderWidth: 2,
    borderColor: '#c00',
    backgroundColor: '#fff',
    position: 'relative',
    overflow: 'hidden',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  gridH: {
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(200,100,100,0.3)',
  },
  gridV: {
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(200,100,100,0.3)',
  },
  gridD1: {
    top: 0, left: 0, right: 0, bottom: 0,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(200,100,100,0.15)',
    transform: [{ rotate: '45deg' }, { scale: 1.41 }],
  },
  gridD2: {
    top: 0, left: 0, right: 0, bottom: 0,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(200,100,100,0.15)',
    transform: [{ rotate: '-45deg' }, { scale: 1.41 }],
  },
  loading: { fontSize: 14, color: C.textMid, textAlign: 'center', marginTop: 80 },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  fallbackChar: { fontWeight: '900', color: '#333' },
  fallbackHint: { fontSize: 12, color: C.textLight, marginTop: 4 },
  btnRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  btnPrimary: { backgroundColor: '#338F9B', borderColor: '#338F9B' },
  btnTxt: { fontSize: 14, fontWeight: '600', color: C.text },
  btnTxtW: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
