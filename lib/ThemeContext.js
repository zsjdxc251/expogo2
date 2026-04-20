import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, DARK } from './theme';

const THEME_KEY = '@learnpark_theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved === 'dark') setIsDark(true);
      } catch {}
      setReady(true);
    })();
  }, []);

  const toggleTheme = useCallback(async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
  }, [isDark]);

  const colors = isDark ? DARK : C;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors, ready }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be within ThemeProvider');
  return ctx;
}

export function useColors() {
  const { colors } = useTheme();
  return colors;
}

export default ThemeContext;
