import { Platform } from 'react-native';

export const C = {
  primary: '#006670',
  primaryDark: '#004f57',
  primaryContainer: '#1d808c',
  primaryBg: 'rgba(0,102,112,0.10)',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#f7feff',

  secondary: '#8a5100',
  secondaryContainer: '#ffb05a',
  secondaryBg: 'rgba(138,81,0,0.10)',
  onSecondary: '#ffffff',

  accent: '#ffb05a',
  accentBg: 'rgba(255,176,90,0.12)',

  success: '#4CAF7D',
  successBg: 'rgba(76,175,125,0.12)',
  error: '#ba1a1a',
  errorBg: 'rgba(186,26,26,0.08)',
  errorContainer: '#ffdad6',

  bg: '#f7fafa',
  surface: '#f7fafa',
  surfaceContainer: '#ebeeef',
  surfaceContainerHigh: '#e5e9e9',
  surfaceContainerHighest: '#e0e3e4',
  surfaceContainerLow: '#f1f4f5',

  card: '#ebeeef',
  cardWhite: '#FFFFFF',
  headerBg: '#e5e9e9',

  text: '#181c1d',
  textMid: '#3e494a',
  textLight: '#6e797b',
  border: '#bec8ca',
  outline: '#6e797b',
  outlineVariant: '#bec8ca',

  gold: '#ECC055',
  navBg: '#006670',
  inverseSurface: '#2d3132',
  inverseOnSurface: '#eef1f2',
  inversePrimary: '#7ed4e0',

  paperBg: '#f1f4f5',
  paperCard: '#e5e9e9',
};

export const SUBJECT_COLORS = {
  math:    { primary: '#5B7FFF', bg: 'rgba(91,127,255,0.10)', dark: '#4A6ADB', light: 'rgba(91,127,255,0.06)' },
  english: { primary: '#FF8C42', bg: 'rgba(255,140,66,0.10)', dark: '#E07A35', light: 'rgba(255,140,66,0.06)' },
  chinese: { primary: '#4CAF7D', bg: 'rgba(76,175,125,0.10)', dark: '#3D9468', light: 'rgba(76,175,125,0.06)' },
};

export const SHADOW = {
  shadowColor: 'rgba(0,102,112,0.06)',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 12,
  elevation: 3,
};

export const RADIUS = 12;

export const SUBJECTS = {
  mulForward: { key: 'mulForward', label: '顺着背',   desc: '6×7=?', icon: 'arrow_forward', color: '#006670', bg: 'rgba(0,102,112,0.10)' },
  mulBlank:   { key: 'mulBlank',   label: '挖空背',   desc: '7×?=42', icon: 'space_bar', color: '#1d808c', bg: 'rgba(29,128,140,0.10)' },
  add:        { key: 'add',        label: '加法练习', icon: 'add', color: '#4CAF7D', bg: 'rgba(76,175,125,0.10)' },
  subtract:   { key: 'subtract',   label: '减法练习', icon: 'remove', color: '#FF8C42', bg: 'rgba(255,140,66,0.10)' },
  divide:     { key: 'divide',     label: '整除计算', icon: 'calculate', color: '#9B7EBD', bg: 'rgba(155,126,189,0.10)' },
  divRem:     { key: 'divRem',     label: '余数除法', icon: 'grid_view', color: '#D4839A', bg: 'rgba(212,131,154,0.10)' },
  divReverse: { key: 'divReverse', label: '反推除法', desc: '?÷6=7...?', icon: 'replay', color: '#6B8E9B', bg: 'rgba(107,142,155,0.10)' },
  multiply:   { key: 'multiply',   label: '乘法口诀', icon: 'close', color: '#006670', bg: 'rgba(0,102,112,0.10)' },
  addTwo:     { key: 'addTwo',     label: '两位数加法', desc: '34+57=?', icon: 'add_circle', color: '#5B7FFF', bg: 'rgba(91,127,255,0.10)' },
  subtractTwo:{ key: 'subtractTwo',label: '两位数减法', desc: '83-47=?', icon: 'remove_circle', color: '#7B68EE', bg: 'rgba(123,104,238,0.10)' },
  mulReverse: { key: 'mulReverse', label: '乘法反推', desc: '哪个=36?', icon: 'search', color: '#DB7093', bg: 'rgba(219,112,147,0.10)' },
  compare:    { key: 'compare',    label: '比大小', desc: '3×4 __ 2×7', icon: 'compare_arrows', color: '#20B2AA', bg: 'rgba(32,178,170,0.10)' },
  wordProblem:{ key: 'wordProblem',label: '应用题', desc: '文字推理', icon: 'description', color: '#DAA520', bg: 'rgba(218,165,32,0.10)' },
  pattern:    { key: 'pattern',    label: '找规律', desc: '2,4,6,?', icon: 'extension', color: '#FF6347', bg: 'rgba(255,99,71,0.10)' },
};

export const EMOJI_MAP = {
  arrow_forward: '➡️',
  space_bar: '📝',
  add: '➕',
  remove: '➖',
  calculate: '🧮',
  grid_view: '🔢',
  replay: '🔄',
  close: '✖️',
  add_circle: '🔢',
  remove_circle: '📉',
  search: '🔍',
  compare_arrows: '⚖️',
  description: '📃',
  extension: '🧩',
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
  addTwo: '+',
  subtractTwo: '−',
};

export const DIFFICULTIES = {
  easy:   { key: 'easy',   label: '简单', range: [2, 5], color: '#4CAF7D' },
  normal: { key: 'normal', label: '普通', range: [2, 7], color: '#FF8C42' },
  hard:   { key: 'hard',   label: '困难', range: [2, 9], color: '#ba1a1a' },
};

export const AVATARS = [
  '🚀','🤖','🦖','🦁','🦅','👨‍🚀',
  '🐶','🐱','🐼','🐨','🦊','🐸','🐵',
  '🦄','🐢','🐬','🦋','🐝','🐘','🦜',
  '🏀','⚽','🎸','🎨','🌈','🌻','🍀',
  '🍎','🧁','🎪','🎠','🏰',
];

export const SAFE_TOP = Platform.OS === 'android' ? 36 : 0;

export function poolSize(lo, hi) {
  const n = hi - lo + 1;
  return n * n;
}
