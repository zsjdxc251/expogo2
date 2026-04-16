import { shuffle } from './questions';

// ── 本学期生字表 ─────────────────────────────────────────
// 每个字标注: char, pinyin, meaning, radical(偏旁部首), structure(结构)
// radical 用于第一步"选偏旁"，同 radical 的字用于第二步"找字"

export const SEMESTER_CHARS = [
  // 亻 (单人旁)
  { char: '你', pinyin: 'nǐ', meaning: '你', radical: '亻', structure: '左右' },
  { char: '他', pinyin: 'tā', meaning: '他', radical: '亻', structure: '左右' },
  { char: '们', pinyin: 'men', meaning: '们', radical: '亻', structure: '左右' },
  { char: '休', pinyin: 'xiū', meaning: '休息', radical: '亻', structure: '左右' },
  { char: '体', pinyin: 'tǐ', meaning: '身体', radical: '亻', structure: '左右' },
  { char: '住', pinyin: 'zhù', meaning: '住', radical: '亻', structure: '左右' },

  // 女 (女字旁)
  { char: '好', pinyin: 'hǎo', meaning: '好', radical: '女', structure: '左右' },
  { char: '妈', pinyin: 'mā', meaning: '妈妈', radical: '女', structure: '左右' },
  { char: '姐', pinyin: 'jiě', meaning: '姐姐', radical: '女', structure: '左右' },
  { char: '妹', pinyin: 'mèi', meaning: '妹妹', radical: '女', structure: '左右' },
  { char: '安', pinyin: 'ān', meaning: '安全', radical: '宀', structure: '上下' },

  // 口 (口字旁)
  { char: '吃', pinyin: 'chī', meaning: '吃', radical: '口', structure: '左右' },
  { char: '吗', pinyin: 'ma', meaning: '语气词', radical: '口', structure: '左右' },
  { char: '听', pinyin: 'tīng', meaning: '听', radical: '口', structure: '左右' },
  { char: '叫', pinyin: 'jiào', meaning: '叫', radical: '口', structure: '左右' },
  { char: '唱', pinyin: 'chàng', meaning: '唱歌', radical: '口', structure: '左右' },

  // 氵 (三点水)
  { char: '河', pinyin: 'hé', meaning: '河流', radical: '氵', structure: '左右' },
  { char: '洗', pinyin: 'xǐ', meaning: '洗', radical: '氵', structure: '左右' },
  { char: '海', pinyin: 'hǎi', meaning: '大海', radical: '氵', structure: '左右' },
  { char: '湖', pinyin: 'hú', meaning: '湖泊', radical: '氵', structure: '左右' },

  // 扌 (提手旁)
  { char: '打', pinyin: 'dǎ', meaning: '打', radical: '扌', structure: '左右' },
  { char: '找', pinyin: 'zhǎo', meaning: '寻找', radical: '扌', structure: '左右' },
  { char: '拉', pinyin: 'lā', meaning: '拉', radical: '扌', structure: '左右' },
  { char: '把', pinyin: 'bǎ', meaning: '把', radical: '扌', structure: '左右' },

  // 木 (木字旁)
  { char: '林', pinyin: 'lín', meaning: '树林', radical: '木', structure: '左右' },
  { char: '树', pinyin: 'shù', meaning: '大树', radical: '木', structure: '左右' },
  { char: '桥', pinyin: 'qiáo', meaning: '桥', radical: '木', structure: '左右' },
  { char: '森', pinyin: 'sēn', meaning: '森林', radical: '木', structure: '品字' },

  // 艹 (草字头)
  { char: '花', pinyin: 'huā', meaning: '花朵', radical: '艹', structure: '上下' },
  { char: '草', pinyin: 'cǎo', meaning: '小草', radical: '艹', structure: '上下' },
  { char: '苗', pinyin: 'miáo', meaning: '禾苗', radical: '艹', structure: '上下' },
  { char: '菜', pinyin: 'cài', meaning: '蔬菜', radical: '艹', structure: '上下' },

  // 宀 (宝盖头)
  { char: '字', pinyin: 'zì', meaning: '文字', radical: '宀', structure: '上下' },
  { char: '家', pinyin: 'jiā', meaning: '家', radical: '宀', structure: '上下' },
  { char: '定', pinyin: 'dìng', meaning: '一定', radical: '宀', structure: '上下' },

  // 日 (日字旁)
  { char: '早', pinyin: 'zǎo', meaning: '早上', radical: '日', structure: '上下' },
  { char: '明', pinyin: 'míng', meaning: '明亮', radical: '日', structure: '左右' },
  { char: '星', pinyin: 'xīng', meaning: '星星', radical: '日', structure: '上下' },
  { char: '晚', pinyin: 'wǎn', meaning: '晚上', radical: '日', structure: '左右' },

  // 门 (门字框)
  { char: '问', pinyin: 'wèn', meaning: '问', radical: '门', structure: '半包围' },
  { char: '闪', pinyin: 'shǎn', meaning: '闪光', radical: '门', structure: '半包围' },
  { char: '间', pinyin: 'jiān', meaning: '中间', radical: '门', structure: '半包围' },

  // 囗 (国字框)
  { char: '国', pinyin: 'guó', meaning: '国家', radical: '囗', structure: '全包围' },
  { char: '园', pinyin: 'yuán', meaning: '花园', radical: '囗', structure: '全包围' },
  { char: '回', pinyin: 'huí', meaning: '回来', radical: '囗', structure: '全包围' },

  // 辶 (走之底)
  { char: '这', pinyin: 'zhè', meaning: '这个', radical: '辶', structure: '半包围' },
  { char: '远', pinyin: 'yuǎn', meaning: '远方', radical: '辶', structure: '半包围' },
  { char: '近', pinyin: 'jìn', meaning: '附近', radical: '辶', structure: '半包围' },
  { char: '过', pinyin: 'guò', meaning: '经过', radical: '辶', structure: '半包围' },

  // ⺮ (竹字头)
  { char: '笔', pinyin: 'bǐ', meaning: '铅笔', radical: '⺮', structure: '上下' },
  { char: '笑', pinyin: 'xiào', meaning: '笑', radical: '⺮', structure: '上下' },

  // 田 / 力 等
  { char: '男', pinyin: 'nán', meaning: '男生', radical: '田', structure: '上下' },
  { char: '天', pinyin: 'tiān', meaning: '天空', radical: '一', structure: '独体' },
  { char: '大', pinyin: 'dà', meaning: '大', radical: '大', structure: '独体' },
  { char: '从', pinyin: 'cóng', meaning: '从前', radical: '人', structure: '左右' },
];

// ── Derived indexes ──────────────────────────────────────

const RADICAL_MAP = {};
SEMESTER_CHARS.forEach((c) => {
  if (!RADICAL_MAP[c.radical]) RADICAL_MAP[c.radical] = [];
  RADICAL_MAP[c.radical].push(c);
});

export const ALL_RADICALS = Object.keys(RADICAL_MAP);

export function getCharsByRadical(radical) {
  return RADICAL_MAP[radical] || [];
}

// Group by structure for alternate quiz modes
const STRUCT_MAP = {};
SEMESTER_CHARS.forEach((c) => {
  if (!STRUCT_MAP[c.structure]) STRUCT_MAP[c.structure] = [];
  STRUCT_MAP[c.structure].push(c);
});

export const ALL_STRUCTURES = Object.keys(STRUCT_MAP);

// ── Unit groupings (for setup UI) ────────────────────────

export const HANZI_UNITS = [
  { key: 'all', label: '全部生字', desc: `共${SEMESTER_CHARS.length}字`, icon: '📖' },
  { key: 'zuoyou', label: '左右结构', desc: '亻女口氵扌木...', icon: '↔️',
    filter: (c) => c.structure === '左右' },
  { key: 'shangxia', label: '上下结构', desc: '艹宀⺮日...', icon: '↕️',
    filter: (c) => c.structure === '上下' },
  { key: 'baowei', label: '包围结构', desc: '门囗辶...', icon: '🔲',
    filter: (c) => c.structure.includes('包围') },
];

export function getUnitChars(unitKey) {
  if (unitKey === 'all') return SEMESTER_CHARS;
  const unit = HANZI_UNITS.find((u) => u.key === unitKey);
  return unit?.filter ? SEMESTER_CHARS.filter(unit.filter) : SEMESTER_CHARS;
}

export function getMaxQuestions(unitKey) {
  return getUnitChars(unitKey).length;
}

// ── Question generator: 查字典式 ─────────────────────────
// Each question has two steps:
//   step1: 看拼音 → 选偏旁 (from 4 radicals)
//   step2: 选对偏旁后 → 从同偏旁的字中找到目标字

export function genDictQuestions(unitKey, count) {
  const chars = getUnitChars(unitKey);
  if (chars.length === 0) return [];

  // Only use chars whose radical has >= 2 siblings (so step2 has distractors)
  const usable = chars.filter((c) => getCharsByRadical(c.radical).length >= 2);
  if (usable.length === 0) return [];

  const pool = usable.map((c) => {
    // Step 1: pick correct radical + 3 wrong radicals
    const wrongRadicals = shuffle(
      ALL_RADICALS.filter((r) => r !== c.radical),
    ).slice(0, 3);
    const radicalOptions = shuffle([c.radical, ...wrongRadicals]);

    // Step 2: correct char + siblings with same radical as distractors
    const siblings = getCharsByRadical(c.radical)
      .filter((s) => s.char !== c.char)
      .map((s) => s.char);
    const siblingOptions = shuffle(siblings).slice(0, 3);
    // If not enough siblings, pad with chars from other radicals
    if (siblingOptions.length < 3) {
      const extra = shuffle(
        SEMESTER_CHARS.filter((s) => s.char !== c.char && s.radical !== c.radical),
      ).slice(0, 3 - siblingOptions.length).map((s) => s.char);
      siblingOptions.push(...extra);
    }
    const charOptions = shuffle([c.char, ...siblingOptions]);

    return {
      char: c.char,
      pinyin: c.pinyin,
      meaning: c.meaning,
      radical: c.radical,
      structure: c.structure,
      radicalOptions,
      correctRadicalIdx: radicalOptions.indexOf(c.radical),
      charOptions,
      correctCharIdx: charOptions.indexOf(c.char),
    };
  });

  return shuffle(pool).slice(0, Math.min(count, pool.length));
}

// ── Question generator: 看结构选字 ───────────────────────
// Show pinyin → tell child the structure → pick from chars of same structure

export function genStructureQuestions(unitKey, count) {
  const chars = getUnitChars(unitKey);
  if (chars.length === 0) return [];

  const pool = chars.map((c) => {
    const sameStruct = SEMESTER_CHARS
      .filter((s) => s.structure === c.structure && s.char !== c.char)
      .map((s) => s.char);
    const distractors = shuffle(sameStruct).slice(0, 3);
    if (distractors.length < 3) {
      const extra = shuffle(
        SEMESTER_CHARS.filter((s) => s.char !== c.char && s.structure !== c.structure),
      ).slice(0, 3 - distractors.length).map((s) => s.char);
      distractors.push(...extra);
    }
    const options = shuffle([c.char, ...distractors]);

    return {
      type: 'structure',
      char: c.char,
      pinyin: c.pinyin,
      meaning: c.meaning,
      structure: c.structure,
      radical: c.radical,
      options,
      answer: options.indexOf(c.char),
    };
  });

  return shuffle(pool).slice(0, Math.min(count, pool.length));
}
