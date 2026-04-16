import { shuffle } from './questions';

// Grade-1 high-frequency characters grouped by unit/topic
export const HANZI_UNITS = [
  {
    key: 'unit1',
    label: '基础字（一）',
    desc: '人、大、小、上、下等',
    icon: '📝',
    chars: [
      { char: '人', pinyin: 'rén', meaning: '人，人类', words: ['人民', '大人', '人们', '工人'] },
      { char: '大', pinyin: 'dà', meaning: '大，与小相对', words: ['大小', '大人', '大家', '大门'] },
      { char: '小', pinyin: 'xiǎo', meaning: '小，与大相对', words: ['小人', '小学', '大小', '小心'] },
      { char: '上', pinyin: 'shàng', meaning: '上面，向上', words: ['上下', '上学', '上面', '上午'] },
      { char: '下', pinyin: 'xià', meaning: '下面，向下', words: ['下面', '上下', '下午', '下雨'] },
      { char: '左', pinyin: 'zuǒ', meaning: '左边', words: ['左右', '左手', '左边', '左面'] },
      { char: '右', pinyin: 'yòu', meaning: '右边', words: ['右手', '左右', '右边', '右面'] },
      { char: '中', pinyin: 'zhōng', meaning: '中间', words: ['中国', '中间', '中午', '中心'] },
    ],
  },
  {
    key: 'unit2',
    label: '自然字',
    desc: '日、月、水、火、山等',
    icon: '🌿',
    chars: [
      { char: '日', pinyin: 'rì', meaning: '太阳，日子', words: ['日月', '日子', '日出', '生日'] },
      { char: '月', pinyin: 'yuè', meaning: '月亮，月份', words: ['月亮', '日月', '月光', '一月'] },
      { char: '水', pinyin: 'shuǐ', meaning: '水', words: ['水果', '开水', '水平', '河水'] },
      { char: '火', pinyin: 'huǒ', meaning: '火', words: ['火车', '大火', '火山', '着火'] },
      { char: '山', pinyin: 'shān', meaning: '山', words: ['山上', '大山', '山水', '火山'] },
      { char: '石', pinyin: 'shí', meaning: '石头', words: ['石头', '石子', '宝石', '石山'] },
      { char: '田', pinyin: 'tián', meaning: '田地', words: ['田地', '水田', '田野', '农田'] },
      { char: '土', pinyin: 'tǔ', meaning: '土地', words: ['土地', '泥土', '土豆', '国土'] },
    ],
  },
  {
    key: 'unit3',
    label: '学习字',
    desc: '学、书、笔、字、写等',
    icon: '📚',
    chars: [
      { char: '学', pinyin: 'xué', meaning: '学习', words: ['学习', '学生', '学校', '上学'] },
      { char: '书', pinyin: 'shū', meaning: '书本', words: ['书本', '读书', '书包', '书法'] },
      { char: '笔', pinyin: 'bǐ', meaning: '笔', words: ['铅笔', '毛笔', '笔画', '笔记'] },
      { char: '字', pinyin: 'zì', meaning: '文字', words: ['写字', '汉字', '字母', '名字'] },
      { char: '写', pinyin: 'xiě', meaning: '书写', words: ['写字', '写作', '写生', '大写'] },
      { char: '本', pinyin: 'běn', meaning: '书本', words: ['课本', '书本', '本子', '本来'] },
      { char: '课', pinyin: 'kè', meaning: '课程', words: ['上课', '课本', '课文', '下课'] },
      { char: '读', pinyin: 'dú', meaning: '读书', words: ['读书', '朗读', '阅读', '读音'] },
    ],
  },
  {
    key: 'unit4',
    label: '动作字',
    desc: '走、跑、吃、喝、看等',
    icon: '🏃',
    chars: [
      { char: '走', pinyin: 'zǒu', meaning: '行走', words: ['走路', '走开', '行走', '走动'] },
      { char: '跑', pinyin: 'pǎo', meaning: '奔跑', words: ['跑步', '跑道', '奔跑', '跑开'] },
      { char: '吃', pinyin: 'chī', meaning: '吃东西', words: ['吃饭', '吃水果', '好吃', '吃力'] },
      { char: '喝', pinyin: 'hē', meaning: '喝水', words: ['喝水', '喝茶', '喝酒', '喝彩'] },
      { char: '看', pinyin: 'kàn', meaning: '看见', words: ['看见', '看书', '好看', '看到'] },
      { char: '听', pinyin: 'tīng', meaning: '听见', words: ['听见', '听话', '好听', '听写'] },
      { char: '说', pinyin: 'shuō', meaning: '说话', words: ['说话', '说明', '听说', '小说'] },
      { char: '花', pinyin: 'huā', meaning: '花朵', words: ['花朵', '开花', '花园', '花瓶'] },
    ],
  },
  {
    key: 'unit5',
    label: '数字与颜色',
    desc: '一、二、三、红、白等',
    icon: '🎨',
    chars: [
      { char: '一', pinyin: 'yī', meaning: '数字一', words: ['一个', '一天', '一起', '第一'] },
      { char: '二', pinyin: 'èr', meaning: '数字二', words: ['二月', '第二', '二手', '二楼'] },
      { char: '三', pinyin: 'sān', meaning: '数字三', words: ['三月', '三个', '第三', '三角'] },
      { char: '十', pinyin: 'shí', meaning: '数字十', words: ['十个', '十月', '十分', '十全'] },
      { char: '红', pinyin: 'hóng', meaning: '红色', words: ['红色', '红花', '红旗', '红星'] },
      { char: '白', pinyin: 'bái', meaning: '白色', words: ['白色', '白天', '白云', '明白'] },
      { char: '天', pinyin: 'tiān', meaning: '天空', words: ['天上', '白天', '天气', '今天'] },
      { char: '地', pinyin: 'dì', meaning: '大地', words: ['大地', '地上', '地方', '土地'] },
    ],
  },
];

export const ALL_CHARS = HANZI_UNITS.flatMap((u) => u.chars);

export function getUnitChars(unitKey) {
  const unit = HANZI_UNITS.find((u) => u.key === unitKey);
  return unit ? unit.chars : [];
}

// -- Word building question generators --

export function genWordSelectQuestions(unitKey, count) {
  const chars = getUnitChars(unitKey);
  if (chars.length === 0) return [];
  const pool = [];
  chars.forEach((c) => {
    const correct = c.words.slice(0, 2);
    const allOtherWords = chars
      .filter((o) => o.char !== c.char)
      .flatMap((o) => o.words);
    const wrong = shuffle(allOtherWords).slice(0, 2);
    const options = shuffle([...correct, ...wrong]);
    pool.push({
      op: 'chn_wordSelect',
      stem: `下面哪些是"${c.char}"的词语？`,
      targetChar: c.char,
      pinyin: c.pinyin,
      options,
      correctOptions: correct,
      answer: options.map((o, i) => correct.includes(o) ? i : -1).filter((i) => i >= 0),
      multiSelect: true,
    });
  });
  return shuffle(pool).slice(0, Math.min(count, pool.length));
}

export function genWordFillQuestions(unitKey, count) {
  const chars = getUnitChars(unitKey);
  if (chars.length === 0) return [];
  const pool = [];
  chars.forEach((c) => {
    c.words.forEach((word) => {
      const idx = word.indexOf(c.char);
      if (idx < 0) return;
      const blank = word.substring(0, idx) + '___' + word.substring(idx + 1);
      const wrongChars = shuffle(
        chars.filter((o) => o.char !== c.char).map((o) => o.char),
      ).slice(0, 3);
      const options = shuffle([c.char, ...wrongChars]);
      pool.push({
        op: 'chn_wordFill',
        stem: blank,
        word,
        targetChar: c.char,
        pinyin: c.pinyin,
        options,
        answer: options.indexOf(c.char),
      });
    });
  });
  return shuffle(pool).slice(0, Math.min(count, pool.length));
}

export function getMaxWordQuestions(unitKey, type) {
  const chars = getUnitChars(unitKey);
  if (type === 'wordFill') return chars.reduce((s, c) => s + c.words.length, 0);
  return chars.length;
}
