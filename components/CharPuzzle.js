import { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { C, RADIUS } from '../lib/theme';

const SCATTER_RADIUS = 80;
const ANIM_DURATION = 600;

function getScatterPos(index, total) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return {
    x: Math.cos(angle) * SCATTER_RADIUS,
    y: Math.sin(angle) * SCATTER_RADIUS,
  };
}

export default function CharPuzzle({ parts, char, size = 180 }) {
  const [assembled, setAssembled] = useState(false);
  const partAnims = useRef(parts.map(() => new Animated.Value(0))).current;
  const charScale = useRef(new Animated.Value(0)).current;
  const charOpacity = useRef(new Animated.Value(0)).current;

  const reset = useCallback(() => {
    setAssembled(false);
    charScale.setValue(0);
    charOpacity.setValue(0);
    partAnims.forEach((a) => a.setValue(0));
  }, [partAnims, charScale, charOpacity]);

  useEffect(() => { reset(); }, [char]);

  const assemble = useCallback(() => {
    Animated.stagger(100, partAnims.map((a) =>
      Animated.timing(a, {
        toValue: 1,
        duration: ANIM_DURATION,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      })
    )).start(() => {
      setAssembled(true);
      charOpacity.setValue(1);
      Animated.spring(charScale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }).start();
    });
  }, [partAnims, charScale, charOpacity]);

  if (!parts || parts.length === 0) return null;

  const partFontSize = size * 0.3;
  const charFontSize = size * 0.45;

  return (
    <View style={[st.root, { height: size + 60 }]}>
      <Text style={st.title}>🧩 拼一拼</Text>

      <View style={[st.arena, { width: size, height: size }]}>
        {!assembled && parts.map((p, i) => {
          const scatter = getScatterPos(i, parts.length);
          const translateX = partAnims[i].interpolate({
            inputRange: [0, 1],
            outputRange: [scatter.x, 0],
          });
          const translateY = partAnims[i].interpolate({
            inputRange: [0, 1],
            outputRange: [scatter.y, 0],
          });
          const scale = partAnims[i].interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 1.15, 0.6],
          });
          const opacity = partAnims[i].interpolate({
            inputRange: [0, 0.8, 1],
            outputRange: [1, 1, 0],
          });

          return (
            <Animated.View
              key={`${char}-${i}`}
              style={[
                st.partChip,
                {
                  transform: [{ translateX }, { translateY }, { scale }],
                  opacity,
                },
              ]}
            >
              <Text style={[st.partText, { fontSize: partFontSize }]}>{p}</Text>
            </Animated.View>
          );
        })}

        {parts.length > 1 && !assembled && (
          <View style={st.plusContainer}>
            {parts.slice(1).map((_, i) => (
              <Text key={i} style={st.plusSign}>+</Text>
            ))}
          </View>
        )}

        <Animated.View
          style={[
            st.charCenter,
            {
              opacity: charOpacity,
              transform: [{ scale: charScale }],
            },
          ]}
        >
          <Text style={[st.charText, { fontSize: charFontSize }]}>{char}</Text>
        </Animated.View>
      </View>

      <View style={st.btnRow}>
        {!assembled ? (
          <TouchableOpacity style={st.btn} onPress={assemble} activeOpacity={0.7}>
            <Text style={st.btnTxt}>🧩 开始拼字</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[st.btn, st.btnSec]} onPress={reset} activeOpacity={0.7}>
            <Text style={st.btnSecTxt}>🔄 再来一次</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { alignItems: 'center', marginVertical: 12 },
  title: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 8 },
  arena: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  partChip: {
    position: 'absolute',
    backgroundColor: '#FFF3E0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#FF9800',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  partText: { fontWeight: '900', color: '#E65100' },
  plusContainer: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 20,
  },
  plusSign: { fontSize: 22, fontWeight: '800', color: '#FF9800' },
  charCenter: {
    position: 'absolute',
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  charText: { fontWeight: '900', color: '#1B5E20' },
  btnRow: { marginTop: 8, flexDirection: 'row', gap: 8 },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS,
    backgroundColor: '#FF9800',
  },
  btnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
  btnSec: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  btnSecTxt: { fontSize: 14, fontWeight: '700', color: C.text },
});
