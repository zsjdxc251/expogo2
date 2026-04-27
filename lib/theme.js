import { Platform } from 'react-native';

export const C = {
  primary: '#006670',
  primaryDark: '#004f57',
  primaryContainer: '#1d808c',
  primaryBg: 'rgba(0,102,112,0.10)',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#f7feff',
  primaryFixed: '#9af0fd',
  primaryFixedDim: '#7ed4e0',

  secondary: '#8a5100',
  secondaryContainer: '#ffb05a',
  secondaryFixed: '#ffdcbd',
  secondaryFixedDim: '#ffb86d',
  onSecondaryFixed: '#2c1600',
  secondaryBg: 'rgba(138,81,0,0.10)',
  onSecondary: '#ffffff',

  accent: '#ffb05a',
  accentBg: 'rgba(255,176,90,0.12)',

  tertiary: '#884d1e',
  tertiaryContainer: '#a66534',
  tertiaryFixed: '#ffdcc6',

  success: '#4CAF7D',
  successBg: 'rgba(76,175,125,0.12)',
  error: '#ba1a1a',
  errorBg: 'rgba(186,26,26,0.08)',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',

  bg: '#f7fafa',
  surface: '#f7fafa',
  surfaceContainer: '#ebeeef',
  surfaceContainerHigh: '#e5e9e9',
  surfaceContainerHighest: '#e0e3e4',
  surfaceContainerLow: '#f1f4f5',
  surfaceContainerLowest: '#ffffff',
  surfaceVariant: '#e0e3e4',

  card: '#ebeeef',
  cardWhite: '#FFFFFF',
  headerBg: '#FBF5F2',
  titleAccent: '#338F9B',

  text: '#181c1d',
  textMid: '#3e494a',
  textLight: '#6e797b',
  border: '#bec8ca',
  outline: '#6e797b',
  outlineVariant: '#bec8ca',

  gold: '#ECC055',
  navBg: '#FFFFFF',
  inverseSurface: '#2d3132',
  inverseOnSurface: '#eef1f2',
  inversePrimary: '#7ed4e0',

  paperBg: '#f1f4f5',
  paperCard: '#e5e9e9',
};

export const SUBJECT_COLORS = {
  math:    { primary: '#006670', bg: 'rgba(0,102,112,0.10)', dark: '#004f57', light: '#E5F5F7' },
  english: { primary: '#8a5100', bg: 'rgba(138,81,0,0.10)', dark: '#693c00', light: '#FFF3E0' },
  chinese: { primary: '#884d1e', bg: 'rgba(136,77,30,0.10)', dark: '#6e380a', light: '#FFDCC6' },
};

export const SHADOW = {
  shadowColor: 'rgba(51,143,155,0.10)',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 1,
  shadowRadius: 20,
  elevation: 3,
};

export const SHADOW_SM = {
  shadowColor: 'rgba(51,143,155,0.08)',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 8,
  elevation: 2,
};

export const RADIUS = 12;

export const SUBJECTS = {
  mulForward: { key: 'mulForward', label: '顺着背',   desc: '6×7=?', icon: 'arrow_forward', color: '#006670', bg: 'rgba(0,102,112,0.10)', iconBg: '#E5F5F7', iconColor: '#006670', barColor: '#006670' },
  mulBlank:   { key: 'mulBlank',   label: '挖空背',   desc: '7×?=42', icon: 'space_bar', color: '#E65100', bg: 'rgba(230,81,0,0.10)', iconBg: '#FFF3E0', iconColor: '#E65100', barColor: '#8A5100' },
  add:        { key: 'add',        label: '加法练习', desc: '15+27=?', icon: 'add', color: '#4A148C', bg: 'rgba(74,20,140,0.10)', iconBg: '#F3E5F5', iconColor: '#4A148C', barColor: '#4A148C' },
  subtract:   { key: 'subtract',   label: '减法练习', desc: '42-18=?', icon: 'remove', color: '#B71C1C', bg: 'rgba(183,28,28,0.10)', iconBg: '#FFEBEE', iconColor: '#B71C1C', barColor: '#BA1A1A' },
  divide:     { key: 'divide',     label: '整除计算', icon: 'calculate', color: '#1565C0', bg: 'rgba(21,101,192,0.10)', iconBg: '#E3F2FD', iconColor: '#1565C0', barColor: '#1565C0' },
  divRem:     { key: 'divRem',     label: '余数除法', icon: 'grid_view', color: '#AD1457', bg: 'rgba(173,20,87,0.10)', iconBg: '#FCE4EC', iconColor: '#AD1457', barColor: '#AD1457' },
  divReverse: { key: 'divReverse', label: '反推除法', desc: '?÷6=7...?', icon: 'replay', color: '#00695C', bg: 'rgba(0,105,92,0.10)', iconBg: '#E0F2F1', iconColor: '#00695C', barColor: '#00695C' },
  multiply:   { key: 'multiply',   label: '乘法口诀', icon: 'close', color: '#006670', bg: 'rgba(0,102,112,0.10)', iconBg: '#E5F5F7', iconColor: '#006670', barColor: '#006670' },
  addTwo:     { key: 'addTwo',     label: '两位数加法', desc: '34+57=?', icon: 'add_circle', color: '#283593', bg: 'rgba(40,53,147,0.10)', iconBg: '#E8EAF6', iconColor: '#283593', barColor: '#283593' },
  subtractTwo:{ key: 'subtractTwo',label: '两位数减法', desc: '83-47=?', icon: 'remove_circle', color: '#4527A0', bg: 'rgba(69,39,160,0.10)', iconBg: '#EDE7F6', iconColor: '#4527A0', barColor: '#4527A0' },
  mulReverse: { key: 'mulReverse', label: '乘法反推', desc: '哪个=36?', icon: 'search', color: '#C2185B', bg: 'rgba(194,24,91,0.10)', iconBg: '#FCE4EC', iconColor: '#C2185B', barColor: '#C2185B' },
  compare:    { key: 'compare',    label: '比大小', desc: '3×4 __ 2×7', icon: 'compare_arrows', color: '#00838F', bg: 'rgba(0,131,143,0.10)', iconBg: '#E0F7FA', iconColor: '#00838F', barColor: '#00838F' },
  wordProblem:{ key: 'wordProblem',label: '应用题', desc: '文字推理', icon: 'description', color: '#F57F17', bg: 'rgba(245,127,23,0.10)', iconBg: '#FFF9C4', iconColor: '#F57F17', barColor: '#F57F17' },
  pattern:    { key: 'pattern',    label: '找规律', desc: '2,4,6,?', icon: 'extension', color: '#D84315', bg: 'rgba(216,67,21,0.10)', iconBg: '#FBE9E7', iconColor: '#D84315', barColor: '#D84315' },
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
