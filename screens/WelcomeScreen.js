import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { C, AVATARS, RADIUS, SHADOW } from '../lib/theme';
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
      <ScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={st.top}>
          <View style={st.logoWrap}>
            <MaterialIcons name="auto-stories" size={48} color={C.primary} />
          </View>
          <Text style={st.title}>学习乐园</Text>
          <Text style={st.desc}>Welcome to your learning adventure!</Text>
        </View>

        <View style={st.section}>
          <Text style={st.sectionTitle}>Pick your avatar!</Text>
          <View style={st.avatarGrid}>
            {AVATARS.map((a) => (
              <TouchableOpacity
                key={a}
                style={[st.avatarBtn, avatar === a && st.avatarOn]}
                onPress={() => setAvatar(a)}
                activeOpacity={0.7}
              >
                <Text style={st.avatarTxt}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={st.section}>
          <Text style={st.sectionTitle}>What is your name?</Text>
          <View style={st.inputWrap}>
            <TextInput
              style={st.input}
              placeholder="你的名字..."
              placeholderTextColor={C.textLight}
              value={name}
              onChangeText={(t) => setName(t.slice(0, 8))}
              maxLength={8}
              autoFocus
            />
            <Text style={st.charHint}>Max 8 characters</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[st.btn, !valid && st.btnOff]}
          disabled={!valid}
          activeOpacity={0.8}
          onPress={() => createUser({ name: name.trim(), avatar })}
        >
          <Text style={[st.btnTxt, !valid && st.btnTxtOff]}>Start Adventure!</Text>
          <MaterialIcons name="arrow-forward" size={20} color={valid ? '#fff' : C.textLight} />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, padding: 20 },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },

  top: { alignItems: 'center', marginBottom: 32 },
  logoWrap: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: C.primaryBg,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    ...SHADOW,
  },
  title: { fontSize: 32, fontWeight: '700', color: C.primary, letterSpacing: -0.5 },
  desc: { fontSize: 16, color: C.textMid, marginTop: 6 },

  section: { width: '100%', marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: C.textMid, marginBottom: 12, paddingLeft: 4 },

  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  avatarBtn: {
    width: 56, height: 56, borderRadius: 16, margin: 5,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.cardWhite, borderWidth: 2, borderColor: 'transparent',
    ...SHADOW,
  },
  avatarOn: { borderColor: C.primary, backgroundColor: C.primaryBg },
  avatarTxt: { fontSize: 28 },

  inputWrap: { width: '100%' },
  input: {
    height: 52, borderRadius: RADIUS, backgroundColor: C.cardWhite, paddingHorizontal: 16,
    fontSize: 18, fontWeight: '600', color: C.text, borderWidth: 2, borderColor: C.outlineVariant,
  },
  charHint: { fontSize: 12, color: C.textLight, marginTop: 6, paddingLeft: 4 },

  btn: {
    marginTop: 8, width: '100%', height: 56, borderRadius: RADIUS,
    backgroundColor: C.primary, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    ...SHADOW,
  },
  btnOff: { backgroundColor: C.surfaceContainerHigh, ...{ shadowOpacity: 0, elevation: 0 } },
  btnTxt: { fontSize: 18, fontWeight: '700', color: '#fff' },
  btnTxtOff: { color: C.textLight },
});
