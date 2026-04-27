import { useEffect } from 'react';
import { Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from './lib/AppContext';
import RootNavigator from './navigation/RootNavigator';

export const FONT_OPTIONS = [
  { key: 'default', label: '默认字体', desc: '系统默认', family: undefined },
  {
    key: 'kaiti', label: '楷体', desc: '适合识字学习',
    family: Platform.select({ ios: 'STKaiti', android: 'serif', default: '"STKaiti", "KaiTi", serif' }),
  },
  {
    key: 'songti', label: '宋体', desc: '经典印刷体',
    family: Platform.select({ ios: 'STSong', android: 'serif', default: '"STSong", "SimSun", serif' }),
  },
  {
    key: 'rounded', label: '圆体', desc: '圆润可爱',
    family: Platform.select({ ios: 'PingFang SC', android: 'sans-serif', default: 'sans-serif' }),
  },
];

export function getFontFamily(fontKey) {
  const opt = FONT_OPTIONS.find((f) => f.key === fontKey);
  return opt?.family;
}

function AppContent() {
  const { settings } = useApp();
  const fontKey = settings?.fontKey || 'default';

  useEffect(() => {
    const family = getFontFamily(fontKey);
    if (!Text.defaultProps) Text.defaultProps = {};
    if (family) {
      Text.defaultProps.style = { fontFamily: family };
    } else {
      Text.defaultProps.style = {};
    }
  }, [fontKey]);

  return (
    <NavigationContainer key={`nav-${fontKey}`}>
      <RootNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
