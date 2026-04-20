import { shuffle } from './questions';

// ── 本学期生字表 ─────────────────────────────────────────

export const SEMESTER_CHARS = [
  { char: '你', pinyin: 'nǐ', meaning: '你', radical: '亻', structure: '左右' },
  { char: '他', pinyin: 'tā', meaning: '他', radical: '亻', structure: '左右' },
  { char: '们', pinyin: 'men', meaning: '们', radical: '亻', structure: '左右' },
  { char: '休', pinyin: 'xiū', meaning: '休息', radical: '亻', structure: '左右' },
  { char: '体', pinyin: 'tǐ', meaning: '身体', radical: '亻', structure: '左右' },
  { char: '住', pinyin: 'zhù', meaning: '住', radical: '亻', structure: '左右' },

  { char: '好', pinyin: 'hǎo', meaning: '好', radical: '女', structure: '左右' },
  { char: '妈', pinyin: 'mā', meaning: '妈妈', radical: '女', structure: '左右' },
  { char: '姐', pinyin: 'jiě', meaning: '姐姐', radical: '女', structure: '左右' },
  { char: '妹', pinyin: 'mèi', meaning: '妹妹', radical: '女', structure: '左右' },

  { char: '吃', pinyin: 'chī', meaning: '吃', radical: '口', structure: '左右' },
  { char: '吗', pinyin: 'ma', meaning: '语气词', radical: '口', structure: '左右' },
  { char: '听', pinyin: 'tīng', meaning: '听', radical: '口', structure: '左右' },
  { char: '叫', pinyin: 'jiào', meaning: '叫', radical: '口', structure: '左右' },
  { char: '唱', pinyin: 'chàng', meaning: '唱歌', radical: '口', structure: '左右' },

  { char: '河', pinyin: 'hé', meaning: '河流', radical: '氵', structure: '左右' },
  { char: '洗', pinyin: 'xǐ', meaning: '洗', radical: '氵', structure: '左右' },
  { char: '海', pinyin: 'hǎi', meaning: '大海', radical: '氵', structure: '左右' },
  { char: '湖', pinyin: 'hú', meaning: '湖泊', radical: '氵', structure: '左右' },

  { char: '打', pinyin: 'dǎ', meaning: '打', radical: '扌', structure: '左右' },
  { char: '找', pinyin: 'zhǎo', meaning: '寻找', radical: '扌', structure: '左右' },
  { char: '拉', pinyin: 'lā', meaning: '拉', radical: '扌', structure: '左右' },
  { char: '把', pinyin: 'bǎ', meaning: '把', radical: '扌', structure: '左右' },

  { char: '林', pinyin: 'lín', meaning: '树林', radical: '木', structure: '左右' },
  { char: '树', pinyin: 'shù', meaning: '大树', radical: '木', structure: '左右' },
  { char: '桥', pinyin: 'qiáo', meaning: '桥', radical: '木', structure: '左右' },
  { char: '森', pinyin: 'sēn', meaning: '森林', radical: '木', structure: '品字' },

  { char: '花', pinyin: 'huā', meaning: '花朵', radical: '艹', structure: '上下' },
  { char: '草', pinyin: 'cǎo', meaning: '小草', radical: '艹', structure: '上下' },
  { char: '苗', pinyin: 'miáo', meaning: '禾苗', radical: '艹', structure: '上下' },
  { char: '菜', pinyin: 'cài', meaning: '蔬菜', radical: '艹', structure: '上下' },

  { char: '安', pinyin: 'ān', meaning: '安全', radical: '宀', structure: '上下' },
  { char: '字', pinyin: 'zì', meaning: '文字', radical: '宀', structure: '上下' },
  { char: '家', pinyin: 'jiā', meaning: '家', radical: '宀', structure: '上下' },
  { char: '定', pinyin: 'dìng', meaning: '一定', radical: '宀', structure: '上下' },

  { char: '早', pinyin: 'zǎo', meaning: '早上', radical: '日', structure: '上下' },
  { char: '明', pinyin: 'míng', meaning: '明亮', radical: '日', structure: '左右' },
  { char: '星', pinyin: 'xīng', meaning: '星星', radical: '日', structure: '上下' },
  { char: '晚', pinyin: 'wǎn', meaning: '晚上', radical: '日', structure: '左右' },

  { char: '问', pinyin: 'wèn', meaning: '问', radical: '门', structure: '半包围' },
  { char: '闪', pinyin: 'shǎn', meaning: '闪光', radical: '门', structure: '半包围' },
  { char: '间', pinyin: 'jiān', meaning: '中间', radical: '门', structure: '半包围' },

  { char: '国', pinyin: 'guó', meaning: '国家', radical: '囗', structure: '全包围' },
  { char: '园', pinyin: 'yuán', meaning: '花园', radical: '囗', structure: '全包围' },
  { char: '回', pinyin: 'huí', meaning: '回来', radical: '囗', structure: '全包围' },

  { char: '这', pinyin: 'zhè', meaning: '这个', radical: '辶', structure: '半包围' },
  { char: '远', pinyin: 'yuǎn', meaning: '远方', radical: '辶', structure: '半包围' },
  { char: '近', pinyin: 'jìn', meaning: '附近', radical: '辶', structure: '半包围' },
  { char: '过', pinyin: 'guò', meaning: '经过', radical: '辶', structure: '半包围' },

  { char: '笔', pinyin: 'bǐ', meaning: '铅笔', radical: '⺮', structure: '上下' },
  { char: '笑', pinyin: 'xiào', meaning: '笑', radical: '⺮', structure: '上下' },

  { char: '男', pinyin: 'nán', meaning: '男生', radical: '田', structure: '上下' },
  { char: '天', pinyin: 'tiān', meaning: '天空', radical: '一', structure: '独体' },
  { char: '大', pinyin: 'dà', meaning: '大', radical: '大', structure: '独体' },
  { char: '从', pinyin: 'cóng', meaning: '从前', radical: '人', structure: '左右' },
];

// ── Radical & structure indexes ──────────────────────────

const RADICAL_MAP = {};
SEMESTER_CHARS.forEach((c) => {
  if (!RADICAL_MAP[c.radical]) RADICAL_MAP[c.radical] = [];
  RADICAL_MAP[c.radical].push(c);
});
export const ALL_RADICALS = Object.keys(RADICAL_MAP);
export function getCharsByRadical(r) { return RADICAL_MAP[r] || []; }

// ── Unit groupings ───────────────────────────────────────

export const HANZI_UNITS = [
  { key: 'all', label: '全部生字', desc: `共${SEMESTER_CHARS.length}字`, icon: '📖' },
  { key: 'zuoyou', label: '左右结构', desc: '亻女口氵扌木...', icon: '↔️',
    filter: (c) => c.structure === '左右' },
  { key: 'shangxia', label: '上下结构', desc: '艹宀⺮日...', icon: '↕️',
    filter: (c) => c.structure === '上下' },
  { key: 'baowei', label: '包围结构', desc: '门囗辶...', icon: '🔲',
    filter: (c) => c.structure.includes('包围') },
  { key: 'unfamiliar', label: '仅陌生字', desc: '之前标记的字', icon: '⭐' },
];

export function getUnitChars(unitKey, unfamiliarList) {
  if (unitKey === 'unfamiliar') {
    return SEMESTER_CHARS.filter((c) => (unfamiliarList || []).includes(c.char));
  }
  if (unitKey === 'all') return SEMESTER_CHARS;
  const unit = HANZI_UNITS.find((u) => u.key === unitKey);
  return unit?.filter ? SEMESTER_CHARS.filter(unit.filter) : SEMESTER_CHARS;
}

// ── Pinyin similarity engine ─────────────────────────────

const TONE_RE = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g;
const TONE_MAP = {
  'ā':'a','á':'a','ǎ':'a','à':'a',
  'ē':'e','é':'e','ě':'e','è':'e',
  'ī':'i','í':'i','ǐ':'i','ì':'i',
  'ō':'o','ó':'o','ǒ':'o','ò':'o',
  'ū':'u','ú':'u','ǔ':'u','ù':'u',
  'ǖ':'v','ǘ':'v','ǚ':'v','ǜ':'v',
};

function stripTone(py) {
  return py.replace(TONE_RE, (m) => TONE_MAP[m] || m);
}

const INITIALS = [
  'zh','ch','sh',
  'b','p','m','f','d','t','n','l','g','k','h','j','q','x','r','z','c','s','y','w',
];

function splitPinyin(py) {
  const base = stripTone(py);
  for (const ini of INITIALS) {
    if (base.startsWith(ini)) return { initial: ini, final: base.slice(ini.length) };
  }
  return { initial: '', final: base };
}

export function getSimilarPinyin(target, allChars, count = 3) {
  const { initial: ti, final: tf } = splitPinyin(target);
  const candidates = allChars
    .filter((c) => c.pinyin !== target)
    .map((c) => {
      const { initial: ci, final: cf } = splitPinyin(c.pinyin);
      let score = 0;
      if (ci === ti && cf !== tf) score = 3;      // same initial, diff final
      else if (cf === tf && ci !== ti) score = 2;  // same final, diff initial
      else score = 1;
      return { pinyin: c.pinyin, score };
    });

  const seen = new Set();
  const unique = candidates.filter((c) => {
    if (seen.has(c.pinyin)) return false;
    seen.add(c.pinyin);
    return true;
  });

  unique.sort((a, b) => b.score - a.score || Math.random() - 0.5);
  return unique.slice(0, count).map((c) => c.pinyin);
}

// ── Question generators ──────────────────────────────────

export function genDictQuestions(unitKey, count, unfamiliarList) {
  const chars = getUnitChars(unitKey, unfamiliarList);
  if (chars.length === 0) return [];

  const usable = chars.filter((c) => getCharsByRadical(c.radical).length >= 2);
  if (usable.length === 0) return [];

  const pool = usable.map((c) => {
    const wrongRadicals = shuffle(ALL_RADICALS.filter((r) => r !== c.radical)).slice(0, 3);
    const radicalOptions = shuffle([c.radical, ...wrongRadicals]);

    const siblings = getCharsByRadical(c.radical)
      .filter((s) => s.char !== c.char).map((s) => s.char);
    const siblingOpts = shuffle(siblings).slice(0, 3);
    if (siblingOpts.length < 3) {
      const extra = shuffle(SEMESTER_CHARS.filter((s) => s.char !== c.char && s.radical !== c.radical))
        .slice(0, 3 - siblingOpts.length).map((s) => s.char);
      siblingOpts.push(...extra);
    }
    const charOptions = shuffle([c.char, ...siblingOpts]);

    return {
      char: c.char, pinyin: c.pinyin, meaning: c.meaning,
      radical: c.radical, structure: c.structure,
      radicalOptions,
      correctRadicalIdx: radicalOptions.indexOf(c.radical),
      charOptions,
      correctCharIdx: charOptions.indexOf(c.char),
    };
  });

  return shuffle(pool).slice(0, Math.min(count, pool.length));
}

export function genPinyinQuestions(unitKey, count, unfamiliarList) {
  const chars = getUnitChars(unitKey, unfamiliarList);
  if (chars.length === 0) return [];

  const pool = chars.map((c) => {
    const distractors = getSimilarPinyin(c.pinyin, SEMESTER_CHARS, 3);
    const options = shuffle([c.pinyin, ...distractors]);
    return {
      char: c.char, pinyin: c.pinyin, meaning: c.meaning,
      radical: c.radical, structure: c.structure,
      options,
      answer: options.indexOf(c.pinyin),
    };
  });

  return shuffle(pool).slice(0, Math.min(count, pool.length));
}
