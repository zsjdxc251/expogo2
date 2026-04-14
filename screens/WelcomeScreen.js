import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { C, AVATARS, RADIUS } from '../lib/theme';
import { useApp } from '../lib/AppContext';

export default function WelcomeScreen() {
  const { createUser } = useApp();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');

  const valid = name.trim().length >= 1 && avatar;

  return (
    <KeyboardAvoidingView
      style={st.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={st.top}>
        <Text style={st.rocket}>🌿🌟</Text>
        <Text style={st.welcome}>欢迎来到</Text>
        <Text style={st.title}>学习乐园</Text>
        <Text style={st.desc}>数学 + 英语, 一起探索!</Text>
      </View>

      <View style={st.card}>
        <Text style={st.label}>输入你的名字</Text>
        <TextInput
          style={st.input}
          placeholder="你的名字..."
          placeholderTextColor={C.textLight}
          value={name}
          onChangeText={(t) => setName(t.slice(0, 8))}
          maxLength={8}
          autoFocus
        />

        <Text style={[st.label, { marginTop: 20 }]}>选择你的头像</Text>
        <View style={st.avatarGrid}>
          {AVATARS.map((a) => (
            <TouchableOpacity
              key={a}
              style={[st.avatarBtn, avatar === a && st.avatarOn]}
              onPress={() => setAvatar(a)}
            >
              <Text style={st.avatarTxt}>{a}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[st.btn, !valid && st.btnOff]}
        disabled={!valid}
        activeOpacity={0.8}
        onPress={() => createUser({ name: name.trim(), avatar })}
      >
        <Text style={[st.btnTxt, !valid && st.btnTxtOff]}>开始冒险!</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: C.bg },
  top: { alignItems: 'center', marginBottom: 28 },
  rocket: { fontSize: 56, marginBottom: 8 },
  welcome: { fontSize: 18, color: C.textMid },
  title: { fontSize: 32, fontWeight: '800', color: C.primary, marginTop: 4 },
  desc: { fontSize: 14, color: C.textLight, marginTop: 6 },
  card: {
    width: '100%', backgroundColor: C.card, borderRadius: RADIUS, padding: 24,
  },
  label: { fontSize: 15, fontWeight: '600', color: C.textMid, marginBottom: 10 },
  input: {
    height: 50, borderRadius: 20, backgroundColor: C.bg, paddingHorizontal: 16,
    fontSize: 18, fontWeight: '600', color: C.text, borderWidth: 2, borderColor: C.border,
  },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  avatarBtn: {
    width: 60, height: 60, borderRadius: 30, margin: 6,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.bg, borderWidth: 2.5, borderColor: 'transparent',
  },
  avatarOn: { borderColor: C.primary, backgroundColor: C.primaryBg },
  avatarTxt: { fontSize: 30 },
  btn: {
    marginTop: 28, width: '100%', height: 56, borderRadius: RADIUS,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  btnOff: { backgroundColor: C.border },
  btnTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },
  btnTxtOff: { color: C.textLight },
});
