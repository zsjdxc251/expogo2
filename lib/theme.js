import { Platform } from 'react-native';

export const C = {
  primary: '#338F9B',
  primaryDark: '#2A7580',
  primaryBg: 'rgba(51,143,155,0.12)',
  accent: '#EB9F4A',
  accentBg: 'rgba(235,159,74,0.12)',
  success: '#7BAE8E',
  successBg: 'rgba(123,174,142,0.12)',
  error: '#E06B6B',
  errorBg: 'rgba(224,107,107,0.12)',
  bg: '#FBF5F2',
  card: 'rgba(196,196,196,0.4)',
  cardWhite: '#FFFFFF',
  headerBg: 'rgba(229,229,229,0.8)',
  text: 'rgba(0,0,0,0.9)',
  textMid: 'rgba(0,0,0,0.6)',
  textLight: 'rgba(0,0,0,0.5)',
  border: 'rgba(0,0,0,0.1)',
  gold: '#ECC055',
  navBg: '#7BAE8E',
  blue: '#02A1FB',
};

export const SHADOW = {
  shadowColor: 'rgba(0,0,0,0.15)',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 3,
};

export const RADIUS = 20;

export const SUBJECTS = {
  mulForward: { key: 'mulForward', label: '顺着背',   desc: '6×7=?', icon: '📗', color: '#338F9B', bg: 'rgba(51,143,155,0.15)' },
  mulBlank:   { key: 'mulBlank',   label: '挖空背',   desc: '?×7=42', icon: '📝', color: '#5B8A9A', bg: 'rgba(91,138,154,0.15)' },
  add:        { key: 'add',        label: '加法练习', icon: '➕', color: '#7BAE8E', bg: 'rgba(123,174,142,0.15)' },
  subtract:   { key: 'subtract',   label: '减法练习', icon: '➖', color: '#EB9F4A', bg: 'rgba(235,159,74,0.15)' },
  divide:     { key: 'divide',     label: '整除计算', icon: '➗', color: '#9B7EBD', bg: 'rgba(155,126,189,0.15)' },
  divRem:     { key: 'divRem',     label: '余数除法', icon: '🔢', color: '#D4839A', bg: 'rgba(212,131,154,0.15)' },
  divReverse: { key: 'divReverse', label: '反推除法', desc: '?÷6=7...?', icon: '🔄', color: '#6B8E9B', bg: 'rgba(107,142,155,0.15)' },
  multiply:   { key: 'multiply',   label: '乘法口诀', icon: '✖️', color: '#338F9B', bg: 'rgba(51,143,155,0.15)' },
};

export const OP_SYMBOL = {
  mulForward: '×',
  mulBlank: '×',
  multiply: '×',
  add: '+',
  subtract: '−',
  divide: '÷',
  divRem: '÷',
  divReverse: '÷',
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
