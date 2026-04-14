import { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import { C } from '../lib/theme';

export default function SpeakButton({ text, size = 'normal', language = 'en-US' }) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  const handlePress = async () => {
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(text, {
      language,
      rate: language === 'zh-CN' ? 0.9 : 0.85,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const isSmall = size === 'small';

  return (
    <TouchableOpacity
      style={[st.btn, speaking && st.btnActive, isSmall && st.btnSmall]}
      activeOpacity={0.6}
      onPress={handlePress}
    >
      <Text style={[st.icon, isSmall && st.iconSmall]}>
        {speaking ? '⏹' : '🔊'}
      </Text>
    </TouchableOpacity>
  );
}

const st = StyleSheet.create({
  btn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.primaryBg,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 6,
  },
  btnActive: { backgroundColor: C.primary },
  btnSmall: { width: 26, height: 26, borderRadius: 13, marginLeft: 4 },
  icon: { fontSize: 16 },
  iconSmall: { fontSize: 13 },
});
