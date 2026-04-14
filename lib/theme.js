import { Platform } from 'react-native';

export const C = {
  primary: '#338F9B',
  primaryDark: '#2A7580',
  primaryBg: '#E4F2F3',
  accent: '#EB9F4A',
  accentBg: '#FDF3E4',
  success: '#7BAE8E',
  successBg: '#EDF5F0',
  error: '#E06B6B',
  errorBg: '#FDEAEA',
  bg: '#FBF5F2',
  card: '#FFFFFF',
  cardAlt: 'rgba(218,212,206,0.28)',
  text: 'rgba(0,0,0,0.85)',
  textMid: 'rgba(0,0,0,0.55)',
  textLight: 'rgba(0,0,0,0.35)',
  border: 'rgba(196,190,184,0.35)',
  gold: '#ECC055',
  navBg: '#7BAE8E',
};

export const SHADOW = {
  shadowColor: '#8B7B6B',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
};

export const SUBJECTS = {
  mulForward: { key: 'mulForward', label: '顺着背',   desc: '6×7=?', icon: '📗', color: '#338F9B', bg: '#E4F2F3' },
  mulBlank:   { key: 'mulBlank',   label: '挖空背',   desc: '?×7=42', icon: '📝', color: '#5B8A9A', bg: '#E8EEF0' },
  add:        { key: 'add',        label: '加法练习', icon: '➕', color: '#7BAE8E', bg: '#EDF5F0' },
  subtract:   { key: 'subtract',   label: '减法练习', icon: '➖', color: '#EB9F4A', bg: '#FDF3E4' },
  divide:     { key: 'divide',     label: '整除计算', icon: '➗', color: '#9B7EBD', bg: '#F0EBF5' },
  divRem:     { key: 'divRem',     label: '余数除法', icon: '🔢', color: '#D4839A', bg: '#F8ECF0' },
  multiply:   { key: 'multiply',   label: '乘法口诀', icon: '✖️', color: '#338F9B', bg: '#E4F2F3' },
};

export const OP_SYMBOL = {
  mulForward: '×',
  mulBlank: '×',
  multiply: '×',
  add: '+',
  subtract: '−',
  divide: '÷',
  divRem: '÷',
};

export const DIFFICULTIES = {
  easy:   { key: 'easy',   label: '简单', range: [2, 5], color: '#7BAE8E' },
  normal: { key: 'normal', label: '普通', range: [2, 7], color: '#EB9F4A' },
  hard:   { key: 'hard',   label: '困难', range: [2, 9], color: '#E06B6B' },
};

export const AVATARS = ['🚀', '🤖', '🦖', '🦁', '🦅', '👨‍🚀'];

export const SAFE_TOP = Platform.OS === 'android' ? 36 : 0;

export function poolSize(lo, hi) {
  const n = hi - lo + 1;
  return n * n;
}
