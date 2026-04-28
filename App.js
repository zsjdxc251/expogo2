import React from 'react';
import { Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from './lib/AppContext';
import RootNavigator from './navigation/RootNavigator';

export const FONT_OPTIONS = [
  { key: 'default', label: '默认', desc: '系统默认', family: undefined },
  {
    key: 'kaiti', label: '楷体', desc: '规范书写',
    family: Platform.select({ ios: 'STKaiti', android: 'serif', default: '"STKaiti", "KaiTi", serif' }),
  },
  {
    key: 'songti', label: '宋体', desc: '经典印刷',
    family: Platform.select({ ios: 'STSong', android: 'serif', default: '"STSong", "SimSun", serif' }),
  },
  {
    key: 'xingkai', label: '行楷', desc: '行书风格',
    family: Platform.select({ ios: 'Xingkai SC', android: 'serif', default: '"Xingkai SC", "STXingkai", cursive' }),
  },
  {
    key: 'hanzipen', label: '翩翩体', desc: '钢笔手写',
    family: Platform.select({ ios: 'HanziPen SC', android: 'cursive', default: '"HanziPen SC", cursive' }),
  },
  {
    key: 'hannotate', label: '手注体', desc: '铅笔手写',
    family: Platform.select({ ios: 'Hannotate SC', android: 'cursive', default: '"Hannotate SC", cursive' }),
  },
  {
    key: 'baoli', label: '报隶', desc: '隶书风格',
    family: Platform.select({ ios: 'Baoli SC', android: 'serif', default: '"Baoli SC", serif' }),
  },
  {
    key: 'weibei', label: '魏碑', desc: '碑帖古风',
    family: Platform.select({ ios: 'Weibei SC', android: 'serif', default: '"Weibei SC", serif' }),
  },
  {
    key: 'rounded', label: '圆体', desc: '圆润可爱',
    family: Platform.select({ ios: 'Yuanti SC', android: 'sans-serif', default: '"Yuanti SC", "PingFang SC", sans-serif' }),
  },
];

export function getFontFamily(fontKey) {
  const opt = FONT_OPTIONS.find((f) => f.key === fontKey);
  return opt?.family;
}

// Monkey-patch Text.render to inject fontFamily into every Text component.
// Text.defaultProps.style doesn't work because explicit style props override it entirely.
let _globalFontFamily;
const _originalTextRender = Text.render;
if (_originalTextRender) {
  Text.render = function (props, ref) {
    if (_globalFontFamily) {
      const patched = {
        ...props,
        style: [{ fontFamily: _globalFontFamily }, props.style],
      };
      return _originalTextRender.call(this, patched, ref);
    }
    return _originalTextRender.call(this, props, ref);
  };
}

function AppContent() {
  const { settings } = useApp();
  const fontKey = settings?.fontKey || 'default';

  _globalFontFamily = getFontFamily(fontKey);

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
