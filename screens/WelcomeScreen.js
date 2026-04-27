import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { C, AVATARS, RADIUS, SHADOW, SHADOW_SM } from '../lib/theme';
import { useApp } from '../lib/AppContext';

const MAIN_MAX_W = 672;
const ROOT_PAD = 20;
const _win = Dimensions.get('window');
const MAIN_W = Math.min(_win.width - ROOT_PAD * 2, MAIN_MAX_W);
const AVATAR_GRID_GAP = 8;
/* card inner = MAIN_W - 64, grid cell row = that - 32 grid padding - 3 gaps */
const AVATAR_CELL = Math.max(44, (MAIN_W - 120) / 4);

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
        <View style={st.mainColumn}>
          <View style={st.brandHeader}>
            <Text style={st.title}>学习乐园</Text>
            <Text style={st.desc}>Welcome to your learning adventure!</Text>
          </View>

          <View style={st.card}>
            <View style={st.avatarBlock}>
              <Text style={st.sectionTitle}>Pick your avatar!</Text>
              <ScrollView
                style={st.avatarScroll}
                contentContainerStyle={st.avatarScrollContent}
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                <View style={st.avatarGrid}>
                  {AVATARS.map((a, i) => (
                    <TouchableOpacity
                      key={`avatar-${i}`}
                      style={[
                        st.avatarBtn,
                        { width: AVATAR_CELL, height: AVATAR_CELL, marginBottom: AVATAR_GRID_GAP, marginRight: (i + 1) % 4 === 0 ? 0 : AVATAR_GRID_GAP },
                        avatar === a && st.avatarOn,
                      ]}
                      onPress={() => setAvatar(a)}
                      activeOpacity={0.7}
                    >
                      <Text style={st.avatarTxt}>{a}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={st.nameBlock}>
              <Text style={st.sectionTitle}>What is your name?</Text>
              <View style={st.inputWrap}>
                <TextInput
                  style={st.input}
                  placeholder="Type your name here..."
                  placeholderTextColor={C.outlineVariant}
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
              <MaterialIcons name="arrow-forward" size={20} color={valid ? C.onPrimary : C.textLight} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.headerBg, padding: ROOT_PAD },
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingVertical: 24, paddingBottom: 48, justifyContent: 'center' },

  mainColumn: { width: '100%', maxWidth: MAIN_MAX_W, alignSelf: 'center' },
  brandHeader: { alignItems: 'center', marginBottom: 32 },
  title: {
    fontSize: 40, fontWeight: '700', lineHeight: 52, color: C.primary, letterSpacing: -0.8, textAlign: 'center',
  },
  desc: { fontSize: 18, lineHeight: 28, fontWeight: '400', color: C.textMid, textAlign: 'center', marginTop: 0 },

  card: {
    width: '100%',
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 20,
    padding: 32,
    ...SHADOW,
    gap: 32,
  },
  avatarBlock: { width: '100%', gap: 16 },
  nameBlock: { width: '100%', gap: 8 },

  sectionTitle: { fontSize: 20, lineHeight: 28, fontWeight: '600', color: C.text, textAlign: 'center' },

  avatarScroll: { maxHeight: 300, width: '100%' },
  avatarScrollContent: { paddingBottom: 4 },
  avatarGrid: {
    flexDirection: 'row', flexWrap: 'wrap', alignContent: 'flex-start',
    backgroundColor: C.surfaceContainerLow, padding: 16, borderRadius: 20, width: '100%',
    ...SHADOW_SM,
  },
  avatarBtn: {
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.surfaceContainerLowest, borderWidth: 2, borderColor: 'transparent',
  },
  avatarOn: { borderColor: C.primary, backgroundColor: C.primaryContainer },
  avatarTxt: { fontSize: 30, textAlign: 'center' },

  inputWrap: { width: '100%', marginTop: 0, gap: 8, alignItems: 'center' },
  input: {
    width: '100%',
    height: 64, borderRadius: RADIUS, backgroundColor: C.surfaceContainerLowest, paddingHorizontal: 24,
    fontSize: 18, lineHeight: 28, fontWeight: '400', color: C.primary, textAlign: 'center', borderWidth: 2, borderColor: C.primary,
  },
  charHint: { fontSize: 14, lineHeight: 20, fontWeight: '700', color: C.textMid, textAlign: 'center' },

  btn: {
    width: '100%',
    height: 64,
    borderRadius: RADIUS,
    backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 0,
    borderBottomWidth: 4, borderBottomColor: C.primaryDark,
    shadowColor: 'rgba(51,143,155,0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 5,
  },
  btnOff: { backgroundColor: C.surfaceContainerHigh, borderBottomWidth: 0, shadowOpacity: 0, elevation: 0 },
  btnTxt: { fontSize: 20, lineHeight: 28, fontWeight: '600', color: C.onPrimary },
  btnTxtOff: { color: C.textLight },
});
