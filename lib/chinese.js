import { shuffle } from './questions';

// ── Level definitions ──────────────────────────────────

export const CHN_LEVELS = [
  { key: 'pinyin', label: '初级 · 拼音', badge: '🔤', color: '#EB9F4A', desc: '声母韵母声调', bg: 'rgba(235,159,74,0.12)' },
  { key: 'literacy', label: '中级 · 识字', badge: '📚', color: '#338F9B', desc: '高频字偏旁部首', bg: 'rgba(51,143,155,0.12)' },
  { key: 'words', label: '高级 · 组词', badge: '✍️', color: '#7BAE8E', desc: '词语搭配造句', bg: 'rgba(123,174,142,0.12)' },
];

// ── Pinyin topics (Level 1) ──────────────────────────────

const TOPICS_PINYIN = {
  shengmu: { key: 'shengmu', label: '声母', icon: '🅱️', color: '#EB9F4A', bg: 'rgba(235,159,74,0.15)', desc: '23个声母' },
  yunmu:   { key: 'yunmu', label: '韵母', icon: '🅰️', color: '#E06B6B', bg: 'rgba(224,107,107,0.15)', desc: '24个韵母' },
  zhengti: { key: 'zhengti', label: '整体认读', icon: '📖', color: '#9B7EBD', bg: 'rgba(155,126,189,0.15)', desc: '16个音节' },
  shengdiao: { key: 'shengdiao', label: '声调', icon: '🎵', color: '#338F9B', bg: 'rgba(51,143,155,0.15)', desc: '四声规则' },
  pindou: { key: 'pindou', label: '拼读练习', icon: '🔗', color: '#7BAE8E', bg: 'rgba(123,174,142,0.15)', desc: '声母+韵母组合' },
};

const LEARN_PINYIN = {
  shengmu: [
    { title: '声母表', emoji: '🅱️', body: '声母是拼音的开头音。一共有23个声母。', highlight: 'b p m f  d t n l  g k h  j q x  zh ch sh r  z c s  y w', examples: [
      { zh: 'b — 像个6字', en: '嘴巴闭拢再张开' },
      { zh: 'p — 像个9字', en: '送气，手放嘴前能感到气流' },
      { zh: 'm — 两扇门', en: '嘴巴闭拢发鼻音' },
      { zh: 'f — 像个拐杖', en: '上齿咬下唇' },
    ]},
    { title: '翘舌音', emoji: '👅', body: '翘舌音需要舌头向上翘起。', highlight: 'zh  ch  sh  r', examples: [
      { zh: 'zh — 织毛衣的"织"', en: '舌头翘起' },
      { zh: 'ch — 吃东西的"吃"', en: '舌头翘起送气' },
      { zh: 'sh — 老师的"师"', en: '舌头翘起不送气' },
      { zh: 'r — 太阳日的"日"', en: '舌头微翘发浊音' },
    ]},
    { title: '平舌音', emoji: '😛', body: '平舌音舌头是平的，不翘起来。', highlight: 'z  c  s', examples: [
      { zh: 'z — 字母的"字"', en: '舌尖抵住上齿背' },
      { zh: 'c — 刺猬的"刺"', en: '舌尖抵住上齿背送气' },
      { zh: 's — 蚕丝的"丝"', en: '舌尖接近上齿背' },
    ]},
  ],
  yunmu: [
    { title: '单韵母', emoji: '🅰️', body: '单韵母只有一个元音，共6个。', highlight: 'a  o  e  i  u  ü', examples: [
      { zh: 'a — 啊，张大嘴巴', en: '嘴巴张最大' },
      { zh: 'o — 哦，嘴巴圆圆', en: '嘴巴圆形' },
      { zh: 'e — 鹅，嘴巴扁扁', en: '像微笑的嘴型' },
      { zh: 'i — 衣，嘴巴最小', en: '嘴巴小小扁扁' },
      { zh: 'u — 乌，嘴巴突出', en: '嘴巴圆形突出' },
      { zh: 'ü — 鱼，撅起小嘴', en: '嘴巴圆小' },
    ]},
    { title: '复韵母', emoji: '🔠', body: '由两个或三个元音组合而成。', highlight: 'ai ei ui  ao ou iu  ie üe er', examples: [
      { zh: 'ai — 爱，先a后i', en: '从a滑到i' },
      { zh: 'ou — 欧，先o后u', en: '从o滑到u' },
      { zh: 'ie — 耶，先i后e', en: '从i滑到e' },
    ]},
    { title: '鼻韵母', emoji: '👃', body: '发音时气流从鼻腔出来。', highlight: 'an en in un ün  ang eng ing ong', examples: [
      { zh: 'an — 安，前鼻音', en: '舌尖抵上齿龈' },
      { zh: 'ang — 昂，后鼻音', en: '舌根抵软腭' },
      { zh: 'ing — 英，后鼻音', en: '先i再鼻音ng' },
    ]},
  ],
  zhengti: [
    { title: '整体认读音节', emoji: '📖', body: '整体认读音节不需要拼读，直接读出来。一共16个。', highlight: 'zhi chi shi ri  zi ci si  yi wu yu  ye yue yuan  yin yun ying', examples: [
      { zh: 'zhi — 知道的"知"', en: '直接读，不拼' },
      { zh: 'yi — 一二三的"一"', en: '直接读' },
      { zh: 'wu — 五六七的"五"', en: '直接读' },
      { zh: 'yu — 小鱼的"鱼"', en: '直接读' },
    ]},
  ],
  shengdiao: [
    { title: '四个声调', emoji: '🎵', body: '汉语有四个声调，声调不同意思就不同。', highlight: '一声平 二声扬 三声拐弯 四声降', examples: [
      { zh: 'mā — 妈妈 (一声平)', en: '声音高高平平' },
      { zh: 'má — 麻绳 (二声扬)', en: '声音从低到高' },
      { zh: 'mǎ — 马儿 (三声拐)', en: '先降再升' },
      { zh: 'mà — 骂人 (四声降)', en: '声音从高到低' },
    ], visual: '一声 → ˉ (平)\n二声 → ˊ (升)\n三声 → ˇ (先降后升)\n四声 → ˋ (降)' },
    { title: '标调规则', emoji: '📝', body: '声调标在韵母上。有a标a，没a标o或e，iu并排标在后。', highlight: 'a先标 → 没a看oe → iu标后', examples: [
      { zh: 'hǎo — a在，标a上', en: 'h-ao → 标a' },
      { zh: 'méi — 没有a，标e', en: 'm-ei → 标e' },
      { zh: 'liú — iu并排，标u', en: 'l-iu → 标u' },
    ]},
  ],
  pindou: [
    { title: '两拼音节', emoji: '🔗', body: '声母和韵母拼在一起。前音轻短后音重，两音相连猛一碰。', highlight: 'b + a = ba  m + a = ma  h + ao = hao', examples: [
      { zh: 'b + ā → bā (八)', en: '声母+韵母' },
      { zh: 'g + uā → guā (瓜)', en: '三拼音节' },
      { zh: 'x + ué → xué (学)', en: '声母+韵母' },
    ]},
    { title: '三拼音节', emoji: '🧩', body: '声母+介母+韵母，三个音拼在一起。', highlight: '声母 + i/u/ü + 韵母', examples: [
      { zh: 'g + u + ā → guā (瓜)', en: '三个音快速拼' },
      { zh: 'x + i + ā → xiā (虾)', en: '三个音快速拼' },
      { zh: 'j + ü + é → jué (觉)', en: 'j遇ü去两点' },
    ]},
  ],
};

const Q_PINYIN = {
  shengmu: [
    { stem: '下面哪个是翘舌音？', options: ['z', 'zh', 's', 'c'], answer: 1, explanation: 'zh是翘舌音，z是平舌音' },
    { stem: '下面哪个是声母？', options: ['a', 'o', 'b', 'ai'], answer: 2, explanation: 'b是声母，a/o/ai是韵母' },
    { stem: '"吃"的声母是什么？', options: ['c', 'ch', 'sh', 'zh'], answer: 1, explanation: '吃 chī，声母是ch' },
    { stem: '下面哪个不是声母？', options: ['m', 'n', 'e', 'l'], answer: 2, explanation: 'e是韵母不是声母' },
    { stem: '平舌音有哪些？', options: ['zh ch sh', 'z c s', 'b p m', 'j q x'], answer: 1, explanation: 'z c s是平舌音' },
    { stem: '"老师"的"师"声母是？', options: ['s', 'sh', 'ch', 'r'], answer: 1, explanation: '师 shī，声母是sh' },
    { stem: '哪个声母发音时需要送气？', options: ['b', 'p', 'd', 'g'], answer: 1, explanation: 'p是送气音，b是不送气音' },
    { stem: '下面哪组全是声母？', options: ['a o e', 'b p m', 'ai ei ui', 'an en in'], answer: 1, explanation: 'b p m都是声母' },
    { stem: '"日"的声母是？', options: ['l', 'n', 'r', 'sh'], answer: 2, explanation: '日 rì，声母是r' },
    { stem: '声母一共有多少个？', options: ['21', '23', '24', '26'], answer: 1, explanation: '声母一共有23个' },
    { stem: '哪个是鼻音声母？', options: ['l', 'n', 'g', 'h'], answer: 1, explanation: 'n是鼻音声母' },
    { stem: '"风"的声母是？', options: ['h', 'p', 'f', 'b'], answer: 2, explanation: '风 fēng，声母是f' },
  ],
  yunmu: [
    { stem: '下面哪个是单韵母？', options: ['ai', 'ou', 'a', 'an'], answer: 2, explanation: 'a是单韵母' },
    { stem: '单韵母有几个？', options: ['4', '5', '6', '8'], answer: 2, explanation: '单韵母有6个：a o e i u ü' },
    { stem: '下面哪个是复韵母？', options: ['a', 'an', 'ai', 'ang'], answer: 2, explanation: 'ai是复韵母，an/ang是鼻韵母' },
    { stem: '哪个是后鼻韵母？', options: ['an', 'en', 'ang', 'in'], answer: 2, explanation: 'ang是后鼻韵母（ng结尾）' },
    { stem: '"ü"怎么读？', options: ['像"乌"', '像"鱼"', '像"衣"', '像"啊"'], answer: 1, explanation: 'ü读起来像"鱼"' },
    { stem: '前鼻韵母的特点是？', options: ['以ng结尾', '以n结尾', '以r结尾', '以l结尾'], answer: 1, explanation: '前鼻韵母以n结尾' },
    { stem: '"ei"是什么韵母？', options: ['单韵母', '复韵母', '前鼻韵母', '后鼻韵母'], answer: 1, explanation: 'ei是复韵母' },
    { stem: '下面哪个不是韵母？', options: ['ou', 'iu', 'sh', 'üe'], answer: 2, explanation: 'sh是声母' },
    { stem: '"学"的韵母是？', options: ['ue', 'üe', 'ie', 'ei'], answer: 1, explanation: '学 xué，韵母是üe（x后ü省略两点）' },
    { stem: '韵母一共有多少个？', options: ['20', '22', '24', '26'], answer: 2, explanation: '韵母一共有24个' },
  ],
  zhengti: [
    { stem: '下面哪个是整体认读音节？', options: ['ba', 'zhi', 'bo', 'ge'], answer: 1, explanation: 'zhi是整体认读音节' },
    { stem: '整体认读音节有几个？', options: ['12', '14', '16', '18'], answer: 2, explanation: '整体认读音节有16个' },
    { stem: '"一"的整体认读是？', options: ['yi', 'ya', 'ye', 'yu'], answer: 0, explanation: '一 → yi' },
    { stem: '下面哪个不是整体认读？', options: ['shi', 'si', 'ba', 'wu'], answer: 2, explanation: 'ba不是整体认读，需要拼读' },
    { stem: '"鱼"的整体认读是？', options: ['wu', 'yu', 'yi', 'ye'], answer: 1, explanation: '鱼 → yú' },
    { stem: '"月"的整体认读是？', options: ['yue', 'ye', 'yuan', 'yun'], answer: 0, explanation: '月 → yuè' },
    { stem: '哪组全是整体认读音节？', options: ['ba ma', 'zhi chi shi', 'bo po', 'ge ke'], answer: 1, explanation: 'zhi chi shi都是整体认读' },
    { stem: '"云"的整体认读是？', options: ['yin', 'yun', 'ying', 'yuan'], answer: 1, explanation: '云 → yún' },
  ],
  shengdiao: [
    { stem: '"妈"是第几声？', options: ['一声', '二声', '三声', '四声'], answer: 0, explanation: 'mā 是第一声（平声）' },
    { stem: '第三声怎么读？', options: ['平平的', '往上升', '先降后升', '往下降'], answer: 2, explanation: '第三声先降后升，像拐弯' },
    { stem: '"马"是第几声？', options: ['一声', '二声', '三声', '四声'], answer: 2, explanation: 'mǎ 是第三声' },
    { stem: '声调标在哪里？', options: ['声母上', '韵母上', '随便标', '不用标'], answer: 1, explanation: '声调标在韵母上' },
    { stem: '"hǎo"声调标在哪个字母上？', options: ['h', 'a', 'o', '都不标'], answer: 1, explanation: '有a标a，所以标在a上' },
    { stem: '"liú"声调标在哪个字母上？', options: ['l', 'i', 'u', '都可以'], answer: 2, explanation: 'iu并排标在后，所以标u' },
    { stem: '第二声的调号是？', options: ['ˉ', 'ˊ', 'ˇ', 'ˋ'], answer: 1, explanation: '第二声是ˊ（从低到高）' },
    { stem: '第四声怎么读？', options: ['平平的', '往上升', '先降后升', '从高到低'], answer: 3, explanation: '第四声从高到低，干脆利落' },
  ],
  pindou: [
    { stem: 'b + ā = ？', options: ['bā', 'pā', 'mā', 'dā'], answer: 0, explanation: 'b和a拼成bā' },
    { stem: '"花"的拼音是？', options: ['ha', 'hua', 'huo', 'hu'], answer: 1, explanation: '花 huā，是三拼音节' },
    { stem: 'g + u + ā = ？', options: ['gā', 'guā', 'gua', 'ga'], answer: 1, explanation: '三拼音节g+u+a → guā' },
    { stem: 'j 和 ü 相拼时？', options: ['ü不变', 'ü去两点', 'j变成q', '不能拼'], answer: 1, explanation: 'j q x遇ü，去掉两点' },
    { stem: '"学"的拼音是？', options: ['xue', 'xüe', 'sue', 'she'], answer: 0, explanation: '学 xué，j q x遇ü去两点' },
    { stem: '"天"的拼音是？', options: ['tan', 'tian', 'tien', 'tin'], answer: 1, explanation: '天 tiān' },
    { stem: '"国"的拼音是？', options: ['go', 'guo', 'gu', 'gou'], answer: 1, explanation: '国 guó，三拼音节' },
    { stem: '"雪"的拼音是？', options: ['xüe', 'xue', 'sue', 'she'], answer: 1, explanation: '雪 xuě' },
  ],
};

// ── Literacy topics (Level 2) ─────────────────────────────

const TOPICS_LITERACY = {
  gaopinzi: { key: 'gaopinzi', label: '高频字', icon: '📝', color: '#338F9B', bg: 'rgba(51,143,155,0.15)', desc: '常用汉字' },
  pianpang: { key: 'pianpang', label: '偏旁部首', icon: '🔍', color: '#EB9F4A', bg: 'rgba(235,159,74,0.15)', desc: '认识偏旁' },
  xingjinzi: { key: 'xingjinzi', label: '形近字', icon: '👀', color: '#E06B6B', bg: 'rgba(224,107,107,0.15)', desc: '易混淆字' },
  duoyinzi: { key: 'duoyinzi', label: '多音字', icon: '🔊', color: '#9B7EBD', bg: 'rgba(155,126,189,0.15)', desc: '一字多音' },
};

const LEARN_LITERACY = {
  gaopinzi: [
    { title: '常用汉字（一）', emoji: '📝', body: '这些是日常生活中最常用的汉字，认识它们能读懂很多东西！', highlight: '人 大 小 上 下 左 右 中 天 地', examples: [
      { zh: '人 — rén', en: '一撇一捺，像人走路' },
      { zh: '大 — dà', en: '一横加人，人张开手臂' },
      { zh: '小 — xiǎo', en: '中间一竖两边两点' },
      { zh: '天 — tiān', en: '大上加一横' },
    ]},
    { title: '常用汉字（二）', emoji: '📝', body: '继续认识更多的常用字。', highlight: '日 月 水 火 山 石 田 土 木 禾', examples: [
      { zh: '日 — rì', en: '太阳的形状' },
      { zh: '月 — yuè', en: '弯弯的月亮' },
      { zh: '水 — shuǐ', en: '水流的样子' },
      { zh: '火 — huǒ', en: '火焰向上烧' },
    ]},
    { title: '常用汉字（三）', emoji: '📝', body: '跟学习有关的字。', highlight: '学 习 字 写 读 书 笔 纸 课 本', examples: [
      { zh: '学 — xué', en: '爱学习' },
      { zh: '书 — shū', en: '读书学知识' },
      { zh: '笔 — bǐ', en: '竹字头，用竹子做笔' },
      { zh: '纸 — zhǐ', en: '绞丝旁，跟丝线有关' },
    ]},
  ],
  pianpang: [
    { title: '常见偏旁（上）', emoji: '🔍', body: '偏旁部首能帮助我们猜字的意思。一个偏旁代表一类意思。', highlight: '氵(三点水) — 与水有关\n亻(单人旁) — 与人有关\n口(口字旁) — 与嘴有关', examples: [
      { zh: '氵→ 河 湖 海 洗', en: '三点水都跟水有关' },
      { zh: '亻→ 你 他 们 住', en: '单人旁都跟人有关' },
      { zh: '口 → 吃 喝 叫 唱', en: '口字旁都跟嘴巴有关' },
    ], visual: '氵= 水的变形\n亻= 人的变形\n口 = 嘴巴的形状' },
    { title: '常见偏旁（下）', emoji: '🔍', body: '更多常见的偏旁部首。', highlight: '女(女字旁) — 与女性有关\n木(木字旁) — 与树木有关\n草字头(艹) — 与植物有关', examples: [
      { zh: '女 → 妈 姐 妹 好', en: '女字旁跟女性有关' },
      { zh: '木 → 树 林 森 桥', en: '木字旁跟树木有关' },
      { zh: '艹 → 花 草 苗 菜', en: '草字头跟植物有关' },
    ]},
  ],
  xingjinzi: [
    { title: '形近字辨析（一）', emoji: '👀', body: '有些字长得很像，但意思完全不同。看仔细每个笔画！', highlight: '人 vs 入\n大 vs 太\n土 vs 士', examples: [
      { zh: '人 rén — 入 rù', en: '人的撇长，入的捺长' },
      { zh: '大 dà — 太 tài', en: '太多了一点' },
      { zh: '土 tǔ — 士 shì', en: '土下横长，士上横长' },
    ]},
    { title: '形近字辨析（二）', emoji: '👀', body: '再来看更多容易混淆的字。', highlight: '目 vs 日\n田 vs 由\n己 vs 已', examples: [
      { zh: '目 mù — 日 rì', en: '目里面两横，日里面一横' },
      { zh: '田 tián — 由 yóu', en: '田封口，由出头' },
      { zh: '己 jǐ — 已 yǐ', en: '己不出头，已出一半' },
    ]},
  ],
  duoyinzi: [
    { title: '常见多音字', emoji: '🔊', body: '有些字有两个或更多读音，在不同的词语里读不同的音。', highlight: '长 — cháng / zhǎng\n行 — xíng / háng\n乐 — lè / yuè', examples: [
      { zh: '长 cháng — 很长', en: '形容长度' },
      { zh: '长 zhǎng — 长大', en: '表示成长' },
      { zh: '行 xíng — 行走', en: '走路的意思' },
      { zh: '行 háng — 银行', en: '一排或机构' },
    ]},
    { title: '更多多音字', emoji: '🔊', body: '学会根据词语判断读音。', highlight: '好 — hǎo / hào\n了 — le / liǎo\n还 — hái / huán', examples: [
      { zh: '好 hǎo — 你好', en: '好的、棒的' },
      { zh: '好 hào — 好学', en: '爱好、喜好' },
      { zh: '还 hái — 还有', en: '表示还有' },
      { zh: '还 huán — 还书', en: '归还的意思' },
    ]},
  ],
};

const Q_LITERACY = {
  gaopinzi: [
    { stem: '"人"的拼音是？', options: ['rén', 'rèn', 'lén', 'rěn'], answer: 0, explanation: '人 rén' },
    { stem: '"天"字比"大"字多了什么？', options: ['一点', '一横', '一撇', '一竖'], answer: 1, explanation: '天=大+一横' },
    { stem: '"水"的拼音是？', options: ['shuǐ', 'suǐ', 'shuí', 'shuì'], answer: 0, explanation: '水 shuǐ' },
    { stem: '"月"像什么？', options: ['太阳', '弯月亮', '星星', '山'], answer: 1, explanation: '月字像弯弯的月亮' },
    { stem: '"火"字有几画？', options: ['3画', '4画', '5画', '6画'], answer: 1, explanation: '火字是4画' },
    { stem: '"山"的拼音是？', options: ['sān', 'shān', 'sàn', 'shàn'], answer: 1, explanation: '山 shān' },
    { stem: '哪个字跟"学习"有关？', options: ['火', '山', '书', '石'], answer: 2, explanation: '书跟学习有关' },
    { stem: '"笔"是什么偏旁？', options: ['木', '竹', '水', '土'], answer: 1, explanation: '笔是竹字头' },
    { stem: '"大"字有几画？', options: ['2画', '3画', '4画', '5画'], answer: 1, explanation: '大字3画' },
    { stem: '"日"代表什么？', options: ['月亮', '太阳', '星星', '云'], answer: 1, explanation: '日代表太阳' },
  ],
  pianpang: [
    { stem: '"河"的偏旁是什么？', options: ['亻', '氵', '口', '木'], answer: 1, explanation: '河是三点水旁' },
    { stem: '三点水(氵)的字跟什么有关？', options: ['人', '水', '火', '土'], answer: 1, explanation: '三点水跟水有关' },
    { stem: '"妈"的偏旁是什么？', options: ['女', '马', '口', '亻'], answer: 0, explanation: '妈是女字旁' },
    { stem: '下面哪个字有"口"旁？', options: ['河', '花', '吃', '林'], answer: 2, explanation: '吃有口字旁' },
    { stem: '"花"的偏旁是什么？', options: ['木', '氵', '艹', '女'], answer: 2, explanation: '花是草字头' },
    { stem: '"林"有几个"木"？', options: ['1个', '2个', '3个', '4个'], answer: 1, explanation: '林由两个木组成' },
    { stem: '"你"的偏旁是什么？', options: ['氵', '亻', '女', '口'], answer: 1, explanation: '你是单人旁' },
    { stem: '草字头的字跟什么有关？', options: ['水', '动物', '植物', '人'], answer: 2, explanation: '草字头跟植物有关' },
    { stem: '"树"的偏旁是什么？', options: ['木', '氵', '艹', '口'], answer: 0, explanation: '树是木字旁' },
    { stem: '"唱"的偏旁表示跟什么有关？', options: ['手', '嘴巴', '眼睛', '耳朵'], answer: 1, explanation: '口字旁跟嘴巴有关' },
  ],
  xingjinzi: [
    { stem: '"入"和"人"的区别是？', options: ['完全一样', '入的捺长', '入多一点', '入多一横'], answer: 1, explanation: '入的捺比撇长，人的撇比捺长' },
    { stem: '"太"比"大"多了什么？', options: ['一横', '一竖', '一点', '一撇'], answer: 2, explanation: '太=大+一点' },
    { stem: '"土"和"士"的区别？', options: ['完全一样', '土下横长', '士多一点', '没有区别'], answer: 1, explanation: '土的下横长，士的上横长' },
    { stem: '"目"里面有几横？', options: ['一横', '两横', '三横', '没有横'], answer: 1, explanation: '目里面有两横（三格）' },
    { stem: '"田"和"由"的区别？', options: ['田出头', '由出头', '完全一样', '由多一横'], answer: 1, explanation: '由字下面出头' },
    { stem: '哪个字是"已经"的"已"？', options: ['己', '已', '巳', '已和己'], answer: 1, explanation: '已经的已，出一半头' },
    { stem: '"日"和"目"谁的画数多？', options: ['日多', '目多', '一样多', '都是4画'], answer: 1, explanation: '日4画，目5画' },
    { stem: '"天"和"夫"的区别？', options: ['完全一样', '夫的横长', '天多一点', '夫的撇出头'], answer: 3, explanation: '夫的撇从上面出头' },
  ],
  duoyinzi: [
    { stem: '"长大"的"长"读什么？', options: ['cháng', 'zhǎng', 'chǎng', 'zháng'], answer: 1, explanation: '长大读 zhǎng' },
    { stem: '"很长"的"长"读什么？', options: ['cháng', 'zhǎng', 'chǎng', 'zháng'], answer: 0, explanation: '很长读 cháng' },
    { stem: '"行走"的"行"读什么？', options: ['háng', 'xíng', 'hàng', 'xìng'], answer: 1, explanation: '行走读 xíng' },
    { stem: '"银行"的"行"读什么？', options: ['háng', 'xíng', 'hàng', 'xìng'], answer: 0, explanation: '银行读 háng' },
    { stem: '"好学"的"好"读什么？', options: ['hǎo', 'hào', 'hāo', 'háo'], answer: 1, explanation: '好学（爱好）读 hào' },
    { stem: '"快乐"的"乐"读什么？', options: ['lè', 'yuè', 'lè和yuè都行', 'yào'], answer: 0, explanation: '快乐读 lè' },
    { stem: '"音乐"的"乐"读什么？', options: ['lè', 'yuè', 'luò', 'yào'], answer: 1, explanation: '音乐读 yuè' },
    { stem: '"还书"的"还"读什么？', options: ['hái', 'huán', 'hái和huán', 'hé'], answer: 1, explanation: '还书（归还）读 huán' },
    { stem: '"还有"的"还"读什么？', options: ['hái', 'huán', 'hé', 'hèn'], answer: 0, explanation: '还有读 hái' },
    { stem: '"了不起"的"了"读什么？', options: ['le', 'liǎo', 'lè', 'liáo'], answer: 1, explanation: '了不起读 liǎo' },
  ],
};

// ── Words topics (Level 3) ────────────────────────────────

const TOPICS_WORDS = {
  ciyudapei: { key: 'ciyudapei', label: '词语搭配', icon: '🔗', color: '#7BAE8E', bg: 'rgba(123,174,142,0.15)', desc: '正确搭配词语' },
  fanyici: { key: 'fanyici', label: '反义词', icon: '↔️', color: '#E06B6B', bg: 'rgba(224,107,107,0.15)', desc: '意思相反的词' },
  jinyici: { key: 'jinyici', label: '近义词', icon: '≈', color: '#338F9B', bg: 'rgba(51,143,155,0.15)', desc: '意思相近的词' },
  liangci: { key: 'liangci', label: '量词', icon: '📏', color: '#EB9F4A', bg: 'rgba(235,159,74,0.15)', desc: '数量的词' },
  zaoju: { key: 'zaoju', label: '造句练习', icon: '✏️', color: '#9B7EBD', bg: 'rgba(155,126,189,0.15)', desc: '用词语造句' },
};

const LEARN_WORDS = {
  ciyudapei: [
    { title: '动词搭配', emoji: '🔗', body: '动词和名词要正确搭配。不能随便混用。', highlight: '打球 看书 写字 唱歌 跑步', examples: [
      { zh: '打 + 球 → 打球 ✓', en: '不说"打书"' },
      { zh: '看 + 书 → 看书 ✓', en: '不说"看球"（一般说打球）' },
      { zh: '写 + 字 → 写字 ✓', en: '也可以说"写作业"' },
      { zh: '唱 + 歌 → 唱歌 ✓', en: '不说"唱书"' },
    ]},
    { title: '形容词搭配', emoji: '🔗', body: '形容词修饰名词时要搭配恰当。', highlight: '高高的 + 山    红红的 + 花\n蓝蓝的 + 天    弯弯的 + 月', examples: [
      { zh: '高高的山', en: '高形容山' },
      { zh: '红红的花', en: '红形容花的颜色' },
      { zh: '弯弯的月亮', en: '弯形容月亮形状' },
      { zh: '圆圆的太阳', en: '圆形容太阳形状' },
    ]},
  ],
  fanyici: [
    { title: '常见反义词', emoji: '↔️', body: '反义词就是意思相反的词。学会反义词能丰富表达。', highlight: '大 ↔ 小   多 ↔ 少   高 ↔ 矮\n长 ↔ 短   快 ↔ 慢   远 ↔ 近', examples: [
      { zh: '大 ↔ 小', en: '大象很大，蚂蚁很小' },
      { zh: '快 ↔ 慢', en: '兔子跑得快，乌龟走得慢' },
      { zh: '开心 ↔ 难过', en: '考了100分很开心' },
      { zh: '黑 ↔ 白', en: '黑夜和白天' },
    ]},
    { title: '更多反义词', emoji: '↔️', body: '试着自己想出反义词。', highlight: '前 ↔ 后   左 ↔ 右   上 ↔ 下\n开 ↔ 关   来 ↔ 去   进 ↔ 出', examples: [
      { zh: '前 ↔ 后', en: '前面和后面' },
      { zh: '开 ↔ 关', en: '开门和关门' },
      { zh: '来 ↔ 去', en: '来学校和去学校（方向不同）' },
    ]},
  ],
  jinyici: [
    { title: '常见近义词', emoji: '≈', body: '近义词是意思相近的词。用不同的词表达类似的意思。', highlight: '好看 ≈ 漂亮   开心 ≈ 高兴\n飞快 ≈ 迅速   喜欢 ≈ 喜爱', examples: [
      { zh: '好看 ≈ 漂亮', en: '这朵花好看 = 这朵花漂亮' },
      { zh: '开心 ≈ 高兴', en: '我很开心 = 我很高兴' },
      { zh: '飞快 ≈ 迅速', en: '他飞快地跑 = 他迅速地跑' },
    ]},
  ],
  liangci: [
    { title: '常见量词', emoji: '📏', body: '量词就是数数时用的词。不同东西用不同的量词。', highlight: '一个人  一只鸟  一条鱼\n一本书  一朵花  一棵树', examples: [
      { zh: '一个苹果', en: '个——最常用的量词' },
      { zh: '一只猫', en: '只——小动物常用' },
      { zh: '一本书', en: '本——书本类用"本"' },
      { zh: '一条路', en: '条——长条形的东西' },
    ], visual: '个 → 人、苹果、鸡蛋\n只 → 鸟、猫、兔子\n本 → 书、杂志\n条 → 鱼、路、河\n棵 → 树、草\n朵 → 花、云' },
    { title: '更多量词', emoji: '📏', body: '继续学习量词。', highlight: '一张纸  一把伞  一双鞋\n一匹马  一头牛  一支笔', examples: [
      { zh: '一张桌子', en: '张——平面的东西' },
      { zh: '一把伞', en: '把——有把手的东西' },
      { zh: '一双鞋', en: '双——成对的东西' },
      { zh: '一支笔', en: '支——细长的东西' },
    ]},
  ],
  zaoju: [
    { title: '用"因为...所以..."造句', emoji: '✏️', body: '表示原因和结果的关系。', highlight: '因为...所以...\n前面说原因，后面说结果', examples: [
      { zh: '因为下雨了，所以我带了伞。', en: '原因：下雨 → 结果：带伞' },
      { zh: '因为他努力学习，所以考了100分。', en: '原因：努力 → 结果：满分' },
    ]},
    { title: '用"虽然...但是..."造句', emoji: '✏️', body: '表示转折关系。前后意思相反。', highlight: '虽然...但是...\n前面说一个情况，后面说相反的', examples: [
      { zh: '虽然天气很冷，但是我还是去上学了。', en: '虽然冷 → 但是去了' },
      { zh: '虽然考试很难，但是他还是及格了。', en: '虽然难 → 但是及格' },
    ]},
  ],
};

const Q_WORDS = {
  ciyudapei: [
    { stem: '哪个搭配是对的？', options: ['打书', '看球', '写字', '唱画'], answer: 2, explanation: '写字搭配正确' },
    { stem: '___的天空', options: ['高高', '蓝蓝', '弯弯', '红红'], answer: 1, explanation: '蓝蓝的天空' },
    { stem: '___的月亮', options: ['圆圆', '蓝蓝', '高高', '长长'], answer: 0, explanation: '圆圆的月亮' },
    { stem: '唱___', options: ['书', '字', '歌', '画'], answer: 2, explanation: '唱歌搭配正确' },
    { stem: '___的花', options: ['高高', '红红', '长长', '快快'], answer: 1, explanation: '红红的花' },
    { stem: '___的山', options: ['弯弯', '蓝蓝', '高高', '红红'], answer: 2, explanation: '高高的山' },
    { stem: '跑___', options: ['歌', '步', '字', '画'], answer: 1, explanation: '跑步' },
    { stem: '___的太阳', options: ['弯弯', '蓝蓝', '圆圆', '高高'], answer: 2, explanation: '圆圆的太阳' },
  ],
  fanyici: [
    { stem: '"大"的反义词是？', options: ['多', '小', '少', '高'], answer: 1, explanation: '大 ↔ 小' },
    { stem: '"快"的反义词是？', options: ['好', '远', '慢', '少'], answer: 2, explanation: '快 ↔ 慢' },
    { stem: '"高"的反义词是？', options: ['矮', '小', '少', '远'], answer: 0, explanation: '高 ↔ 矮' },
    { stem: '"前"的反义词是？', options: ['左', '右', '上', '后'], answer: 3, explanation: '前 ↔ 后' },
    { stem: '"开"的反义词是？', options: ['来', '去', '关', '走'], answer: 2, explanation: '开 ↔ 关' },
    { stem: '"黑"的反义词是？', options: ['红', '蓝', '白', '绿'], answer: 2, explanation: '黑 ↔ 白' },
    { stem: '"长"的反义词是？', options: ['大', '短', '小', '少'], answer: 1, explanation: '长 ↔ 短' },
    { stem: '"来"的反义词是？', options: ['走', '跑', '去', '进'], answer: 2, explanation: '来 ↔ 去' },
    { stem: '"多"的反义词是？', options: ['大', '小', '少', '矮'], answer: 2, explanation: '多 ↔ 少' },
    { stem: '"远"的反义词是？', options: ['近', '高', '大', '长'], answer: 0, explanation: '远 ↔ 近' },
  ],
  jinyici: [
    { stem: '"好看"的近义词是？', options: ['好吃', '漂亮', '好玩', '好听'], answer: 1, explanation: '好看 ≈ 漂亮' },
    { stem: '"开心"的近义词是？', options: ['难过', '高兴', '生气', '害怕'], answer: 1, explanation: '开心 ≈ 高兴' },
    { stem: '"飞快"的近义词是？', options: ['慢慢', '迅速', '仔细', '安静'], answer: 1, explanation: '飞快 ≈ 迅速' },
    { stem: '"喜欢"的近义词是？', options: ['讨厌', '喜爱', '害怕', '担心'], answer: 1, explanation: '喜欢 ≈ 喜爱' },
    { stem: '"美丽"的近义词是？', options: ['丑', '漂亮', '高大', '安静'], answer: 1, explanation: '美丽 ≈ 漂亮' },
    { stem: '"安静"的近义词是？', options: ['吵闹', '寂静', '快乐', '热闹'], answer: 1, explanation: '安静 ≈ 寂静' },
    { stem: '"仔细"的近义词是？', options: ['马虎', '认真', '随便', '快速'], answer: 1, explanation: '仔细 ≈ 认真' },
    { stem: '"害怕"的近义词是？', options: ['勇敢', '高兴', '恐惧', '喜欢'], answer: 2, explanation: '害怕 ≈ 恐惧' },
  ],
  liangci: [
    { stem: '一___书', options: ['个', '只', '本', '条'], answer: 2, explanation: '一本书' },
    { stem: '一___鱼', options: ['个', '只', '本', '条'], answer: 3, explanation: '一条鱼' },
    { stem: '一___鸟', options: ['个', '只', '本', '条'], answer: 1, explanation: '一只鸟' },
    { stem: '一___花', options: ['棵', '朵', '只', '条'], answer: 1, explanation: '一朵花' },
    { stem: '一___树', options: ['朵', '条', '棵', '本'], answer: 2, explanation: '一棵树' },
    { stem: '一___伞', options: ['个', '把', '只', '条'], answer: 1, explanation: '一把伞' },
    { stem: '一___鞋', options: ['个', '只', '双', '条'], answer: 2, explanation: '一双鞋' },
    { stem: '一___笔', options: ['个', '把', '条', '支'], answer: 3, explanation: '一支笔' },
    { stem: '一___纸', options: ['个', '张', '本', '把'], answer: 1, explanation: '一张纸' },
    { stem: '一___马', options: ['只', '条', '匹', '个'], answer: 2, explanation: '一匹马' },
  ],
  zaoju: [
    { stem: '因为下雨了，所以___', options: ['天很蓝', '我带了伞', '花开了', '鸟飞了'], answer: 1, explanation: '因果关系：下雨→带伞' },
    { stem: '虽然很累，但是___', options: ['我睡觉了', '我还是坚持了', '我也很累', '天黑了'], answer: 1, explanation: '转折关系：虽然累→但坚持' },
    { stem: '因为___，所以他迟到了', options: ['他跑得快', '路上堵车', '天气好', '老师表扬他'], answer: 1, explanation: '堵车→迟到（因果）' },
    { stem: '___很难，但是他还是做对了', options: ['因为题目', '虽然题目', '所以题目', '而且题目'], answer: 1, explanation: '虽然...但是...转折' },
    { stem: '因为他努力学习，所以___', options: ['他很笨', '考了100分', '不及格', '迟到了'], answer: 1, explanation: '努力→好成绩' },
    { stem: '虽然天气很冷，但是___', options: ['我穿了很厚', '我还是出去了', '天更冷了', '下雪了'], answer: 1, explanation: '虽然冷→但还是出去' },
  ],
};

// ── Aggregation ───────────────────────────────────────────

const ALL_TOPICS = { ...TOPICS_PINYIN, ...TOPICS_LITERACY, ...TOPICS_WORDS };
const ALL_LEARN = { ...LEARN_PINYIN, ...LEARN_LITERACY, ...LEARN_WORDS };
const ALL_QUESTIONS = { ...Q_PINYIN, ...Q_LITERACY, ...Q_WORDS };

export const CHN_TOPICS = ALL_TOPICS;
export const CHN_TOPIC_KEYS = Object.keys(ALL_TOPICS);
export const LEARN_CARDS = ALL_LEARN;

export const LEVEL_TOPIC_KEYS = {
  pinyin: Object.keys(TOPICS_PINYIN),
  literacy: Object.keys(TOPICS_LITERACY),
  words: Object.keys(TOPICS_WORDS),
};

export function generateChnQuestions(topicKey, count) {
  const bank = ALL_QUESTIONS[topicKey];
  if (!bank || bank.length === 0) return [];
  const pool = bank.map((q, i) => ({
    ...q,
    op: `chn_${topicKey}`,
    id: i,
  }));
  return shuffle(pool).slice(0, Math.min(count, pool.length));
}

export function getChnMaxQuestions(topicKey) {
  return (ALL_QUESTIONS[topicKey] || []).length;
}
