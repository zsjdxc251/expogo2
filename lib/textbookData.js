import TEXTBOOK_RAW from './_vocabRaw';
import { CHAR_DICT } from './_charDict';

export const TEXTBOOK_DATA = TEXTBOOK_RAW;

const TABLE_KEYS = { shizi: '识字表', xiezi: '写字表', ciyu: '词语表' };

export function getLessons(tableType) {
  const tbl = TEXTBOOK_RAW[TABLE_KEYS[tableType]];
  if (!tbl) return [];
  return Object.entries(tbl.by_lesson).map(([key, val]) => ({
    key,
    name: val.lesson_name,
    count: val.count || (val.chars ? val.chars.length : val.words ? val.words.length : 0),
  }));
}

export function getCharsForLessons(tableType, lessonKeys) {
  const tbl = TEXTBOOK_RAW[TABLE_KEYS[tableType]];
  if (!tbl) return [];
  const result = [];
  lessonKeys.forEach((lk) => {
    const lesson = tbl.by_lesson[lk];
    if (!lesson) return;
    if (tableType === 'ciyu') {
      (lesson.words || []).forEach((w) => result.push({ word: w, lesson: lk }));
    } else {
      (lesson.chars || []).forEach((c) => result.push({ ...c, lesson: lk }));
    }
  });
  return result;
}

export function getAvailableTableTypes(lessonKeys) {
  const types = [];
  ['shizi', 'xiezi', 'ciyu'].forEach((t) => {
    const items = getCharsForLessons(t, lessonKeys);
    if (items.length > 0) types.push(t);
  });
  return types;
}

export function getWordInfo(char) {
  if (CHAR_DICT[char]) return CHAR_DICT[char];
  return {
    emoji: "📝",
    words: [{ word: char, highlight: 0 }],
    meaning: `学习"${char}"`,
    scene: "📝✏️📖",
    memory: `仔细看看"${char}"这个字的结构`,
    example: `我学会了"${char}"这个字。`,
    parts: [],
  };
}

const DICTATION_XIEZI = {
  "诗": { contextWord: "古诗", contextPhrase: "古诗的诗" },
  "碧": { contextWord: "碧绿", contextPhrase: "碧绿的碧" },
  "妆": { contextWord: "化妆", contextPhrase: "化妆的妆" },
  "绿": { contextWord: "绿色", contextPhrase: "绿色的绿" },
  "丝": { contextWord: "丝线", contextPhrase: "丝线的丝" },
  "剪": { contextWord: "剪刀", contextPhrase: "剪刀的剪" },
  "童": { contextWord: "儿童", contextPhrase: "儿童的童" },
  "归": { contextWord: "回归", contextPhrase: "回归的归" },
  "话": { contextWord: "说话", contextPhrase: "说话的话" },
  "朗": { contextWord: "朗读", contextPhrase: "朗读的朗" },
  "题": { contextWord: "题目", contextPhrase: "题目的题" },
  "桩": { contextWord: "木桩", contextPhrase: "木桩的桩" },
  "肥": { contextWord: "肥胖", contextPhrase: "肥胖的肥" },
  "鲜": { contextWord: "新鲜", contextPhrase: "新鲜的鲜" },
  "邻": { contextWord: "邻居", contextPhrase: "邻居的邻" },
  "程": { contextWord: "路程", contextPhrase: "路程的程" },
  "魔": { contextWord: "魔术", contextPhrase: "魔术的魔" },
  "术": { contextWord: "美术", contextPhrase: "美术的术" },
  "食": { contextWord: "食物", contextPhrase: "食物的食" },
  "烤": { contextWord: "烤鸭", contextPhrase: "烤鸭的烤" },
  "茄": { contextWord: "茄子", contextPhrase: "茄子的茄" },
  "炒": { contextWord: "炒菜", contextPhrase: "炒菜的炒" },
  "煮": { contextWord: "煮饭", contextPhrase: "煮饭的煮" },
  "贝": { contextWord: "宝贝", contextPhrase: "宝贝的贝" },
  "壳": { contextWord: "贝壳", contextPhrase: "贝壳的壳" },
  "甲": { contextWord: "指甲", contextPhrase: "指甲的甲" },
  "币": { contextWord: "硬币", contextPhrase: "硬币的币" },
  "财": { contextWord: "财宝", contextPhrase: "财宝的财" },
  "彩": { contextWord: "彩色", contextPhrase: "彩色的彩" },
  "梦": { contextWord: "做梦", contextPhrase: "做梦的梦" },
  "森": { contextWord: "森林", contextPhrase: "森林的森" },
  "拉": { contextWord: "拉手", contextPhrase: "拉手的拉" },
  "结": { contextWord: "结果", contextPhrase: "结果的结" },
  "掰": { contextWord: "掰开", contextPhrase: "掰开的掰" },
  "摘": { contextWord: "摘花", contextPhrase: "摘花的摘" },
  "伯": { contextWord: "伯伯", contextPhrase: "伯伯的伯" },
  "匹": { contextWord: "一匹马", contextPhrase: "一匹马的匹" },
  "纹": { contextWord: "花纹", contextPhrase: "花纹的纹" },
  "补": { contextWord: "补丁", contextPhrase: "补丁的补" },
  "充": { contextWord: "充满", contextPhrase: "充满的充" },
  "助": { contextWord: "帮助", contextPhrase: "帮助的助" },
  "筝": { contextWord: "风筝", contextPhrase: "风筝的筝" },
  "湾": { contextWord: "台湾", contextPhrase: "台湾的湾" },
  "峡": { contextWord: "海峡", contextPhrase: "海峡的峡" },
  "族": { contextWord: "民族", contextPhrase: "民族的族" },
  "谊": { contextWord: "友谊", contextPhrase: "友谊的谊" },
  "齐": { contextWord: "整齐", contextPhrase: "整齐的齐" },
  "奋": { contextWord: "勤奋", contextPhrase: "勤奋的奋" },
  "繁": { contextWord: "繁忙", contextPhrase: "繁忙的繁" },
  "荣": { contextWord: "光荣", contextPhrase: "光荣的荣" },
  "传": { contextWord: "传说", contextPhrase: "传说的传" },
  "统": { contextWord: "传统", contextPhrase: "传统的统" },
  "锋": { contextWord: "雷锋", contextPhrase: "雷锋的锋" },
  "叔": { contextWord: "叔叔", contextPhrase: "叔叔的叔" },
  "泥": { contextWord: "泥土", contextPhrase: "泥土的泥" },
  "瓣": { contextWord: "花瓣", contextPhrase: "花瓣的瓣" },
  "莲": { contextWord: "莲花", contextPhrase: "莲花的莲" },
  "露": { contextWord: "露水", contextPhrase: "露水的露" },
  "角": { contextWord: "角落", contextPhrase: "角落的角" },
  "晶": { contextWord: "水晶", contextPhrase: "水晶的晶" },
  "停": { contextWord: "停下", contextPhrase: "停下的停" },
  "亭": { contextWord: "凉亭", contextPhrase: "凉亭的亭" },
  "精": { contextWord: "精彩", contextPhrase: "精彩的精" },
  "仙": { contextWord: "神仙", contextPhrase: "神仙的仙" },
  "塔": { contextWord: "宝塔", contextPhrase: "宝塔的塔" },
  "雾": { contextWord: "大雾", contextPhrase: "大雾的雾" },
  "景": { contextWord: "风景", contextPhrase: "风景的景" },
};

const DICTATION_CIYU = {
  "春天": { contextSentence: "春天来了的春天" },
  "寻找": { contextSentence: "寻找春天的寻找" },
  "眉毛": { contextSentence: "弯弯的眉毛的眉毛" },
  "野花": { contextSentence: "山上的野花的野花" },
  "柳枝": { contextSentence: "柳枝发芽的柳枝" },
  "桃花": { contextSentence: "粉红的桃花的桃花" },
  "鲜花": { contextSentence: "美丽的鲜花的鲜花" },
  "先生": { contextSentence: "老先生好的先生" },
  "原来": { contextSentence: "原来如此的原来" },
  "大叔": { contextSentence: "大叔你好的大叔" },
  "太太": { contextSentence: "太太好的太太" },
  "做客": { contextSentence: "去朋友家做客的做客" },
  "惊奇": { contextSentence: "非常惊奇的惊奇" },
  "快活": { contextSentence: "快活地玩的快活" },
  "美好": { contextSentence: "美好的一天的美好" },
  "礼物": { contextSentence: "收到礼物的礼物" },
  "植树": { contextSentence: "一起植树的植树" },
  "故事": { contextSentence: "讲故事的故事" },
  "生活": { contextSentence: "幸福生活的生活" },
  "美食": { contextSentence: "好吃的美食的美食" },
  "茄子": { contextSentence: "紫色的茄子的茄子" },
  "烤鸭": { contextSentence: "北京烤鸭的烤鸭" },
  "羊肉": { contextSentence: "好吃的羊肉的羊肉" },
  "蛋炒饭": { contextSentence: "一碗蛋炒饭的蛋炒饭" },
  "钱币": { contextSentence: "古代钱币的钱币" },
  "钱财": { contextSentence: "钱财宝贝的钱财" },
  "有关": { contextSentence: "有关联的有关" },
  "样子": { contextSentence: "好看的样子的样子" },
  "甲骨文": { contextSentence: "古代甲骨文的甲骨文" },
  "水煮鱼": { contextSentence: "好吃的水煮鱼的水煮鱼" },
  "碧空如洗": { contextSentence: "碧空如洗万里无云的碧空如洗" },
  "万里无云": { contextSentence: "万里无云的万里无云" },
  "动物": { contextSentence: "可爱的动物的动物" },
  "新奇": { contextSentence: "新奇有趣的新奇" },
  "市场": { contextSentence: "去市场买菜的市场" },
  "夺目": { contextSentence: "光彩夺目的夺目" },
  "力量": { contextSentence: "力量很大的力量" },
  "微笑": { contextSentence: "甜甜的微笑的微笑" },
  "古迹": { contextSentence: "名胜古迹的古迹" },
  "传统": { contextSentence: "传统文化的传统" },
  "节日": { contextSentence: "欢乐的节日的节日" },
  "团圆": { contextSentence: "一家团圆的团圆" },
  "热闹": { contextSentence: "非常热闹的热闹" },
  "指南针": { contextSentence: "神奇的指南针的指南针" },
  "造纸术": { contextSentence: "古代的造纸术的造纸术" },
};

export function getDictationContext(tableType, item) {
  if (tableType === 'xiezi') {
    const c = item.char || item;
    const entry = DICTATION_XIEZI[c];
    if (entry) return entry;
    const info = getWordInfo(c);
    const firstWord = info.words[0]?.word || c;
    return { contextWord: firstWord, contextPhrase: `${firstWord}的${c}` };
  }
  if (tableType === 'ciyu') {
    const w = item.word || item;
    const entry = DICTATION_CIYU[w];
    if (entry) return entry;
    return { contextSentence: `${w}的${w}` };
  }
  return { contextWord: item.char || item, contextPhrase: item.char || item };
}

export const TABLE_TYPE_LABELS = {
  shizi: '识字表',
  xiezi: '写字表',
  ciyu: '词语表',
};
