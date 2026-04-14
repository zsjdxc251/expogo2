import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { C, SAFE_TOP } from '../lib/theme';
import { useApp } from '../lib/AppContext';

import MainTabs from './MainTabs';
import WelcomeScreen from '../screens/WelcomeScreen';
import QuizScreen from '../screens/QuizScreen';
import ResultsScreen from '../screens/ResultsScreen';
import EnglishLearnScreen from '../screens/EnglishLearnScreen';
import EnglishQuizScreen from '../screens/EnglishQuizScreen';
import ChineseLearnScreen from '../screens/ChineseLearnScreen';
import ChineseQuizScreen from '../screens/ChineseQuizScreen';
import SpeedChallengeScreen from '../screens/SpeedChallengeScreen';
import DictationScreen from '../screens/DictationScreen';
import BreakScreen from '../screens/BreakScreen';
import PinModal from '../components/PinModal';

const Stack = createNativeStackNavigator();

function LoadingScreen() {
  return (
    <View style={st.center}>
      <ActivityIndicator size="large" color={C.primary} />
      <Text style={st.loadTxt}>加载中...</Text>
    </View>
  );
}

export default function RootNavigator() {
  const {
    ready, hasUser, showBreak, breakConfig, onBreakDone,
    showPin, pinMode, user, onPinSuccess, onPinCancel,
  } = useApp();

  if (!ready) return <LoadingScreen />;

  return (
    <View style={st.root}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.bg },
          animation: 'slide_from_right',
        }}
      >
        {!hasUser ? (
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ animation: 'fade' }} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Quiz" component={QuizScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="EngLearn" component={EnglishLearnScreen} />
            <Stack.Screen name="EngQuiz" component={EnglishQuizScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="ChnLearn" component={ChineseLearnScreen} />
            <Stack.Screen name="ChnQuiz" component={ChineseQuizScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Speed" component={SpeedChallengeScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Dictation" component={DictationScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Results" component={ResultsScreen} options={{ gestureEnabled: false, animation: 'fade' }} />
          </>
        )}
      </Stack.Navigator>

      {showBreak && (
        <View style={StyleSheet.absoluteFill}>
          <BreakScreen breakMinutes={breakConfig.breakMinutes} onDone={onBreakDone} />
        </View>
      )}

      <PinModal
        visible={showPin}
        mode={pinMode}
        correctPin={user?.parentPin}
        onSuccess={onPinSuccess}
        onCancel={onPinCancel}
      />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, paddingTop: SAFE_TOP },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  loadTxt: { fontSize: 15, color: C.textMid, marginTop: 12 },
});
