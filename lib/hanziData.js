import { shuffle } from './questions';

// Each char has: char, pinyin, meaning, parts (ordered left→right or top→bottom),
// and a structure hint shown to the child.
// parts are the correct components; distractors are auto-generated from other chars' parts.

export const HANZI_UNITS = [
  {
    key: 'unit1',
    label: '左右结构',
    desc: '好、明、林、你...',
    icon: '🧩',
    chars: [
      { char: '好', pinyin: 'hǎo', meaning: '好', parts: ['女', '子'], hint: '女 + 子 = 好' },
      { char: '明', pinyin: 'míng', meaning: '明亮', parts: ['日', '月'], hint: '日 + 月 = 明' },
      { char: '林', pinyin: 'lín', meaning: '树林', parts: ['木', '木'], hint: '木 + 木 = 林' },
      { char: '你', pinyin: 'nǐ', meaning: '你', parts: ['亻', '尔'], hint: '亻+ 尔 = 你' },
      { char: '他', pinyin: 'tā', meaning: '他', parts: ['亻', '也'], hint: '亻+ 也 = 他' },
      { char: '妈', pinyin: 'mā', meaning: '妈妈', parts: ['女', '马'], hint: '女 + 马 = 妈' },
      { char: '吗', pinyin: 'ma', meaning: '语气词', parts: ['口', '马'], hint: '口 + 马 = 吗' },
      { char: '河', pinyin: 'hé', meaning: '河流', parts: ['氵', '可'], hint: '氵+ 可 = 河' },
      { char: '打', pinyin: 'dǎ', meaning: '打', parts: ['扌', '丁'], hint: '扌+ 丁 = 打' },
      { char: '吃', pinyin: 'chī', meaning: '吃', parts: ['口', '乞'], hint: '口 + 乞 = 吃' },
    ],
  },
  {
    key: 'unit2',
    label: '上下结构',
    desc: '花、字、早、星...',
    icon: '📐',
    chars: [
      { char: '花', pinyin: 'huā', meaning: '花朵', parts: ['艹', '化'], hint: '艹 + 化 = 花' },
      { char: '字', pinyin: 'zì', meaning: '文字', parts: ['宀', '子'], hint: '宀 + 子 = 字' },
      { char: '早', pinyin: 'zǎo', meaning: '早上', parts: ['日', '十'], hint: '日 + 十 = 早' },
      { char: '星', pinyin: 'xīng', meaning: '星星', parts: ['日', '生'], hint: '日 + 生 = 星' },
      { char: '草', pinyin: 'cǎo', meaning: '小草', parts: ['艹', '早'], hint: '艹 + 早 = 草' },
      { char: '笔', pinyin: 'bǐ', meaning: '铅笔', parts: ['⺮', '毛'], hint: '⺮ + 毛 = 笔' },
      { char: '安', pinyin: 'ān', meaning: '安全', parts: ['宀', '女'], hint: '宀 + 女 = 安' },
      { char: '尖', pinyin: 'jiān', meaning: '尖的', parts: ['小', '大'], hint: '小 + 大 = 尖' },
      { char: '尘', pinyin: 'chén', meaning: '灰尘', parts: ['小', '土'], hint: '小 + 土 = 尘' },
      { char: '男', pinyin: 'nán', meaning: '男生', parts: ['田', '力'], hint: '田 + 力 = 男' },
    ],
  },
  {
    key: 'unit3',
    label: '包围结构',
    desc: '国、问、回、园...',
    icon: '🔲',
    chars: [
      { char: '国', pinyin: 'guó', meaning: '国家', parts: ['囗', '玉'], hint: '囗 + 玉 = 国' },
      { char: '园', pinyin: 'yuán', meaning: '花园', parts: ['囗', '元'], hint: '囗 + 元 = 园' },
      { char: '回', pinyin: 'huí', meaning: '回来', parts: ['囗', '口'], hint: '囗 + 口 = 回' },
      { char: '问', pinyin: 'wèn', meaning: '问题', parts: ['门', '口'], hint: '门 + 口 = 问' },
      { char: '闪', pinyin: 'shǎn', meaning: '闪光', parts: ['门', '人'], hint: '门 + 人 = 闪' },
      { char: '这', pinyin: 'zhè', meaning: '这个', parts: ['辶', '文'], hint: '辶 + 文 = 这' },
      { char: '远', pinyin: 'yuǎn', meaning: '远方', parts: ['辶', '元'], hint: '辶 + 元 = 远' },
      { char: '近', pinyin: 'jìn', meaning: '附近', parts: ['辶', '斤'], hint: '辶 + 斤 = 近' },
    ],
  },
  {
    key: 'unit4',
    label: '简单独体字',
    desc: '大、天、人、木...',
    icon: '🔤',
    chars: [
      { char: '天', pinyin: 'tiān', meaning: '天空', parts: ['一', '大'], hint: '一 + 大 = 天' },
      { char: '太', pinyin: 'tài', meaning: '太大', parts: ['大', '丶'], hint: '大 + 丶 = 太' },
      { char: '本', pinyin: 'běn', meaning: '课本', parts: ['木', '一'], hint: '木 + 一(底横) = 本' },
      { char: '休', pinyin: 'xiū', meaning: '休息', parts: ['亻', '木'], hint: '亻+ 木 = 休' },
      { char: '体', pinyin: 'tǐ', meaning: '身体', parts: ['亻', '本'], hint: '亻+ 本 = 体' },
      { char: '从', pinyin: 'cóng', meaning: '从前', parts: ['人', '人'], hint: '人 + 人 = 从' },
      { char: '众', pinyin: 'zhòng', meaning: '群众', parts: ['人', '从'], hint: '人 + 从 = 众' },
      { char: '森', pinyin: 'sēn', meaning: '森林', parts: ['木', '林'], hint: '木 + 林 = 森' },
    ],
  },
];

// Collect all unique parts across all units for generating distractors
const ALL_PARTS_SET = new Set();
HANZI_UNITS.forEach((u) => u.chars.forEach((c) => c.parts.forEach((p) => ALL_PARTS_SET.add(p))));
const ALL_PARTS = [...ALL_PARTS_SET];

export const ALL_CHARS = HANZI_UNITS.flatMap((u) => u.chars);

export function getUnitChars(unitKey) {
  const unit = HANZI_UNITS.find((u) => u.key === unitKey);
  return unit ? unit.chars : [];
}

// ── Question generators ──────────────────────────────────

/**
 * Type 1: 选部件拼字
 * Show pinyin + meaning, give 4-6 component options, child picks the correct parts.
 */
export function genAssembleQuestions(unitKey, count) {
  const chars = getUnitChars(unitKey);
  if (chars.length === 0) return [];

  const pool = chars.map((c) => {
    const correctParts = [...c.parts];
    const distractors = shuffle(
      ALL_PARTS.filter((p) => !correctParts.includes(p)),
    ).slice(0, Math.max(2, 4 - correctParts.length));
    const options = shuffle([...correctParts, ...distractors]);

    return {
      type: 'assemble',
      char: c.char,
      pinyin: c.pinyin,
      meaning: c.meaning,
      hint: c.hint,
      correctParts,
      options,
      answer: correctParts,
    };
  });

  return shuffle(pool).slice(0, Math.min(count, pool.length));
}

/**
 * Type 2: 选另一半
 * Show one component + pinyin, child picks the missing half from 4 options.
 */
export function genHalfQuestions(unitKey, count) {
  const chars = getUnitChars(unitKey).filter((c) => c.parts.length === 2 && c.parts[0] !== c.parts[1]);
  if (chars.length === 0) return [];

  const pool = [];
  chars.forEach((c) => {
    const showFirst = Math.random() > 0.5;
    const given = showFirst ? c.parts[0] : c.parts[1];
    const missing = showFirst ? c.parts[1] : c.parts[0];

    const wrongs = shuffle(
      ALL_PARTS.filter((p) => p !== missing && p !== given),
    ).slice(0, 3);
    const options = shuffle([missing, ...wrongs]);

    pool.push({
      type: 'half',
      char: c.char,
      pinyin: c.pinyin,
      meaning: c.meaning,
      hint: c.hint,
      givenPart: given,
      missingPart: missing,
      showFirst,
      options,
      answer: options.indexOf(missing),
    });
  });

  return shuffle(pool).slice(0, Math.min(count, pool.length));
}

/**
 * Type 3: 看拼音选字
 * Show pinyin, child picks the correct character from 4 options.
 */
export function genPinyinPickQuestions(unitKey, count) {
  const chars = getUnitChars(unitKey);
  if (chars.length === 0) return [];

  const allChars = ALL_CHARS.map((c) => c.char);
  const pool = chars.map((c) => {
    const wrongs = shuffle(
      allChars.filter((ch) => ch !== c.char),
    ).slice(0, 3);
    const options = shuffle([c.char, ...wrongs]);

    return {
      type: 'pinyinPick',
      char: c.char,
      pinyin: c.pinyin,
      meaning: c.meaning,
      options,
      answer: options.indexOf(c.char),
    };
  });

  return shuffle(pool).slice(0, Math.min(count, pool.length));
}

/**
 * Mixed generator: combines all 3 types for variety
 */
export function genMixedQuestions(unitKey, count) {
  const a = genAssembleQuestions(unitKey, Math.ceil(count * 0.4));
  const b = genHalfQuestions(unitKey, Math.ceil(count * 0.3));
  const c = genPinyinPickQuestions(unitKey, Math.ceil(count * 0.3));
  return shuffle([...a, ...b, ...c]).slice(0, count);
}

export function getMaxQuestions(unitKey) {
  return getUnitChars(unitKey).length;
}
