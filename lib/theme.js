import { Platform } from 'react-native';

export const C = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryBg: '#EFF6FF',
  accent: '#F59E0B',
  accentBg: '#FFFBEB',
  success: '#10B981',
  successBg: '#ECFDF5',
  error: '#EF4444',
  errorBg: '#FEF2F2',
  bg: '#F0F9FF',
  card: '#FFFFFF',
  text: '#1E293B',
  textMid: '#64748B',
  textLight: '#94A3B8',
  border: '#E2E8F0',
};

export const SHADOW = {
  shadowColor: '#1E293B',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};

export const SUBJECTS = {
  multiply: { key: 'multiply', label: '乘法口诀', icon: '✖️', color: '#3B82F6', bg: '#EFF6FF' },
  add:      { key: 'add',      label: '加法练习', icon: '➕', color: '#10B981', bg: '#ECFDF5' },
  subtract: { key: 'subtract', label: '减法练习', icon: '➖', color: '#F59E0B', bg: '#FFFBEB' },
  divide:   { key: 'divide',   label: '除法练习', icon: '➗', color: '#8B5CF6', bg: '#F5F3FF' },
};

export const OP_SYMBOL = {
  multiply: '×',
  add: '+',
  subtract: '−',
  divide: '÷',
};

export const DIFFICULTIES = {
  easy:   { key: 'easy',   label: '简单', range: [2, 5], color: '#10B981' },
  normal: { key: 'normal', label: '普通', range: [2, 7], color: '#F59E0B' },
  hard:   { key: 'hard',   label: '困难', range: [2, 9], color: '#EF4444' },
};

export const AVATARS = ['🚀', '🤖', '🦖', '🦁', '🦅', '👨‍🚀'];

export const SAFE_TOP = Platform.OS === 'android' ? 36 : 0;

export function poolSize(lo, hi) {
  const n = hi - lo + 1;
  return n * n;
}
