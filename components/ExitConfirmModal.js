import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { C, RADIUS } from '../lib/theme';

export default function ExitConfirmModal({ visible, onCancel, onConfirm }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={st.overlay}>
        <View style={st.box}>
          <Text style={st.icon}>⚠️</Text>
          <Text style={st.title}>确认退出？</Text>
          <Text style={st.msg}>退出后本次练习不会获得积分哦</Text>
          <TouchableOpacity style={st.stayBtn} onPress={onCancel} activeOpacity={0.8}>
            <Text style={st.stayTxt}>继续练习</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.exitBtn} onPress={onConfirm} activeOpacity={0.8}>
            <Text style={st.exitTxt}>确认退出</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  box: {
    width: 300, backgroundColor: C.bg, borderRadius: RADIUS,
    padding: 28, alignItems: 'center',
  },
  icon: { fontSize: 40, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 6 },
  msg: { fontSize: 14, color: C.textMid, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  stayBtn: {
    width: '100%', height: 46, borderRadius: 12,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  stayTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
  exitBtn: {
    width: '100%', height: 42, borderRadius: 12,
    backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
  },
  exitTxt: { fontSize: 15, fontWeight: '600', color: C.textMid },
});
