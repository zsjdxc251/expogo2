import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { C, RADIUS } from '../lib/theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

export default function PinModal({ visible, mode, onSuccess, onCancel }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  const isSetup = mode === 'setup';
  const maxLen = 4;

  const reset = useCallback(() => {
    setPin('');
    setConfirmPin('');
    setStep(1);
    setError('');
  }, []);

  const handleKey = useCallback((k) => {
    setError('');
    const current = step === 1 ? pin : confirmPin;
    const setter = step === 1 ? setPin : setConfirmPin;

    if (k === 'C') { setter(''); return; }
    if (k === '⌫') { setter((v) => v.slice(0, -1)); return; }
    if (current.length >= maxLen) return;

    const next = current + k;
    setter(next);

    if (next.length === maxLen) {
      setTimeout(() => {
        if (isSetup) {
          if (step === 1) {
            setStep(2);
          } else {
            if (pin === next) {
              onSuccess(next);
              reset();
            } else {
              setError('两次输入不一致，请重新设置');
              setPin('');
              setConfirmPin('');
              setStep(1);
            }
          }
        } else {
          onSuccess(next);
          reset();
        }
      }, 200);
    }
  }, [pin, confirmPin, step, isSetup, onSuccess, reset, maxLen]);

  const handleCancel = useCallback(() => {
    reset();
    onCancel();
  }, [onCancel, reset]);

  const currentPin = step === 1 ? pin : confirmPin;
  const title = isSetup
    ? (step === 1 ? '设置家长密码' : '再次确认密码')
    : '输入家长密码';
  const subtitle = isSetup
    ? (step === 1 ? '请设置4位数字密码' : '请再次输入相同密码')
    : '请输入4位数字密码进入家长模式';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={st.overlay}>
        <View style={st.box}>
          <Text style={st.title}>{title}</Text>
          <Text style={st.subtitle}>{subtitle}</Text>

          <View style={st.dots}>
            {Array.from({ length: maxLen }).map((_, i) => (
              <View key={i} style={[st.dot, i < currentPin.length && st.dotFilled]} />
            ))}
          </View>

          {error ? <Text style={st.error}>{error}</Text> : null}

          <View style={st.pad}>
            {KEYS.map((k) => (
              <TouchableOpacity
                key={k}
                style={[st.key, (k === 'C' || k === '⌫') && st.keyAlt]}
                activeOpacity={0.6}
                onPress={() => handleKey(k)}
              >
                <Text style={[st.keyTxt, (k === 'C' || k === '⌫') && st.keyAltTxt]}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={st.cancelBtn} onPress={handleCancel}>
            <Text style={st.cancelTxt}>取消</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  box: {
    width: 320, backgroundColor: C.bg, borderRadius: RADIUS,
    padding: 28, alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: C.textMid, marginBottom: 20, textAlign: 'center' },
  dots: { flexDirection: 'row', marginBottom: 16 },
  dot: {
    width: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(196,196,196,0.5)',
    marginHorizontal: 8,
  },
  dotFilled: { backgroundColor: C.primary },
  error: { fontSize: 13, color: C.error, fontWeight: '600', marginBottom: 10 },
  pad: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    width: 240,
  },
  key: {
    width: 68, height: 50, borderRadius: 14, backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center', margin: 4,
  },
  keyAlt: { backgroundColor: 'rgba(229,229,229,0.6)' },
  keyTxt: { fontSize: 22, fontWeight: '700', color: C.text },
  keyAltTxt: { fontSize: 16, color: C.textMid },
  cancelBtn: { marginTop: 16, paddingVertical: 8, paddingHorizontal: 24 },
  cancelTxt: { fontSize: 15, color: C.textMid, fontWeight: '600' },
});
