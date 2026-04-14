import { shuffle as arrayShuffle } from './questions';

// ── Topic definitions ─────────────────────────────────────

export const ENG_TOPICS = {
  pronoun: {
    key: 'engPronoun', label: '人称代词', icon: '👤',
    color: '#3B82F6', bg: '#EFF6FF',
    desc: 'I / you / he / she / it',
  },
  article: {
    key: 'engArticle', label: '冠词 a / an', icon: '📖',
    color: '#10B981', bg: '#ECFDF5',
    desc: 'a cat / an apple',
  },
  plural: {
    key: 'engPlural', label: '名词单复数', icon: '🔤',
    color: '#F59E0B', bg: '#FFFBEB',
    desc: 'cat → cats',
  },
  prep: {
    key: 'engPrep', label: '方位介词', icon: '📍',
    color: '#8B5CF6', bg: '#F5F3FF',
    desc: 'in / on / under',
  },
  beVerb: {
    key: 'engBeVerb', label: 'am / is / are', icon: '✏️',
    color: '#EC4899', bg: '#FDF2F8',
    desc: 'I am, She is, They are',
  },
  adjective: {
    key: 'engAdj', label: '形容词', icon: '🌈',
    color: '#F97316', bg: '#FFF7ED',
    desc: 'big ↔ small',
  },
};

export const ENG_TOPIC_KEYS = Object.keys(ENG_TOPICS);

// ── Learning content ──────────────────────────────────────

export const LEARN_CARDS = {
  // ─── 人称代词 ───────────────────────────────
  pronoun: [
    {
      title: '什么是人称代词？',
      emoji: '👋',
      body: '人称代词就是用来代替人名的小词语。\n比如不说"小明"，可以说 "he"（他）。',
      highlight: '代词让句子更简短！',
      examples: [],
    },
    {
      title: 'I 和 you',
      emoji: '🙋',
      body: 'I = 我 （永远大写哦！）\nyou = 你 / 你们',
      highlight: 'I 不管在哪里都要大写！',
      examples: [
        { en: 'I am a boy.', zh: '我是一个男孩。' },
        { en: 'You are my friend.', zh: '你是我的朋友。' },
      ],
    },
    {
      title: 'he / she / it',
      emoji: '👦👧🐱',
      body: 'he = 他（男孩、爸爸、叔叔）\nshe = 她（女孩、妈妈、阿姨）\nit = 它（动物、东西）',
      highlight: '男用 he，女用 she，其他用 it',
      examples: [
        { en: 'He is tall.', zh: '他很高。' },
        { en: 'She is kind.', zh: '她很善良。' },
        { en: 'It is a cat.', zh: '它是一只猫。' },
      ],
    },
    {
      title: 'we 和 they',
      emoji: '👨‍👩‍👧‍👦',
      body: 'we = 我们（包括我自己）\nthey = 他们/她们/它们（不包括我）',
      highlight: '有我 → we，没我 → they',
      examples: [
        { en: 'We are happy.', zh: '我们很开心。' },
        { en: 'They are students.', zh: '他们是学生。' },
      ],
    },
    {
      title: '🧠 记忆口诀',
      emoji: '💡',
      body: '我 I 你 you 他 he\n她 she 它 it 记心间\n我们 we 他们 they\n七个代词手拉手！',
      highlight: '试着背一背这个口诀！',
      examples: [],
    },
  ],

  // ─── 冠词 a / an ──────────────────────────────
  article: [
    {
      title: '什么是冠词？',
      emoji: '📖',
      body: 'a 和 an 是"冠词"，放在名词前面。\n就像给名词戴一顶帽子 🎩',
      highlight: '"一个"苹果 → an apple',
      examples: [],
    },
    {
      title: '什么时候用 a？',
      emoji: '🐶',
      body: '当后面的单词"读起来"是辅音开头时，用 a。\n大部分字母开头的词都用 a！',
      highlight: 'a + 辅音开头',
      examples: [
        { en: 'a cat 🐱', zh: '一只猫' },
        { en: 'a dog 🐶', zh: '一只狗' },
        { en: 'a book 📘', zh: '一本书' },
        { en: 'a pen ✏️', zh: '一支笔' },
      ],
    },
    {
      title: '什么时候用 an？',
      emoji: '🍎',
      body: '当后面的单词"读起来"是元音开头时，用 an。',
      highlight: '元音字母口诀：a e i o u',
      examples: [
        { en: 'an apple 🍎', zh: '一个苹果' },
        { en: 'an egg 🥚', zh: '一个鸡蛋' },
        { en: 'an ice cream 🍦', zh: '一个冰淇淋' },
        { en: 'an orange 🍊', zh: '一个橙子' },
        { en: 'an umbrella ☂️', zh: '一把雨伞' },
      ],
    },
    {
      title: '🧠 超级口诀',
      emoji: '💡',
      body: 'a e i o u 五兄弟\n看到它们用 an\n其他字母用 a\n记住口诀不出错！',
      highlight: 'a e i o u → an，其他 → a',
      examples: [],
    },
  ],

  // ─── 名词单复数 ────────────────────────────────
  plural: [
    {
      title: '什么是单数和复数？',
      emoji: '🐱🐱',
      body: '一个东西 = 单数\n两个或更多 = 复数\n复数通常在单词后面加 s 或 es',
      highlight: '1个用单数，2个以上用复数！',
      examples: [],
    },
    {
      title: '加 s 变复数',
      emoji: '✨',
      body: '大多数名词，直接在后面加 s 就行！',
      highlight: '最简单的规则！',
      examples: [
        { en: 'cat → cats 🐱🐱', zh: '猫 → 猫们' },
        { en: 'dog → dogs 🐶🐶', zh: '狗 → 狗们' },
        { en: 'book → books 📚', zh: '书 → 书们' },
        { en: 'apple → apples 🍎🍎', zh: '苹果 → 苹果们' },
      ],
    },
    {
      title: '加 es 变复数',
      emoji: '📦',
      body: '以 s, x, sh, ch 结尾的词，加 es！\n因为加 s 不好读，所以多加个 e。',
      highlight: '结尾是 s/x/sh/ch → 加 es',
      examples: [
        { en: 'box → boxes 📦📦', zh: '盒子 → 盒子们' },
        { en: 'bus → buses 🚌🚌', zh: '公交车 → 公交车们' },
        { en: 'fish → fishes 🐟🐟', zh: '鱼 → 鱼们' },
      ],
    },
    {
      title: '特殊变化',
      emoji: '🦸',
      body: '有些名词复数不加 s，要特别记住：',
      highlight: '特殊词要死记硬背哦！',
      examples: [
        { en: 'man → men 👨👨', zh: '男人 → 男人们' },
        { en: 'woman → women 👩👩', zh: '女人 → 女人们' },
        { en: 'child → children 👧👦', zh: '孩子 → 孩子们' },
        { en: 'foot → feet 🦶🦶', zh: '脚 → 脚们' },
      ],
    },
  ],

  // ─── 方位介词 ──────────────────────────────────
  prep: [
    {
      title: '什么是方位介词？',
      emoji: '🗺️',
      body: '方位介词告诉我们东西在哪里。\n就像指路的小箭头 ➡️',
      highlight: '用介词说出物品的位置！',
      examples: [],
    },
    {
      title: 'in = 在…里面',
      emoji: '📦',
      body: '想象一个盒子，东西在里面：',
      highlight: 'in → 里面',
      examples: [
        { en: 'The ball is in the box. ⚽📦', zh: '球在盒子里面。' },
        { en: 'The cat is in the room. 🐱🏠', zh: '猫在房间里面。' },
      ],
      visual: {
        type: 'position',
        lines: ['  ┌────────┐', '  │ ⚽ 📦 │', '  └────────┘', '  球在盒子里 → in'],
      },
    },
    {
      title: 'on = 在…上面',
      emoji: '📚',
      body: '东西放在表面上、接触着：',
      highlight: 'on → 上面（接触）',
      examples: [
        { en: 'The book is on the desk. 📖', zh: '书在桌子上面。' },
        { en: 'The cat is on the bed. 🐱🛏️', zh: '猫在床上面。' },
      ],
      visual: {
        type: 'position',
        lines: ['    ⚽', '  ────────', '  球在桌子上 → on'],
      },
    },
    {
      title: 'under = 在…下面',
      emoji: '👇',
      body: '东西在另一个东西的下面：',
      highlight: 'under → 下面',
      examples: [
        { en: 'The cat is under the table.', zh: '猫在桌子下面。' },
        { en: 'The ball is under the bed.', zh: '球在床下面。' },
      ],
      visual: {
        type: 'position',
        lines: ['  ────────', '    ⚽', '  球在桌子下 → under'],
      },
    },
    {
      title: '🧠 记忆画面',
      emoji: '💡',
      body: 'in  → 🐱📦 猫钻进盒子里\non  → 🐱📦 猫坐在盒子上\nunder → 📦🐱 猫躲在盒子下\nbehind → 📦 🐱 猫藏在盒子后',
      highlight: '想象小猫在盒子的不同位置！',
      examples: [],
    },
  ],

  // ─── be 动词 ──────────────────────────────────
  beVerb: [
    {
      title: '什么是 be 动词？',
      emoji: '✏️',
      body: 'be 动词就是 am、is、are。\n它们的意思都是"是"。\n不同的人用不同的 be 动词！',
      highlight: 'am / is / are 都是"是"',
      examples: [],
    },
    {
      title: 'I → am',
      emoji: '🙋',
      body: '"我"永远用 am！\nI am = I\'m（缩写）',
      highlight: 'I + am，独一无二的搭配！',
      examples: [
        { en: 'I am a student.', zh: '我是学生。' },
        { en: 'I am happy.', zh: '我很开心。' },
        { en: 'I am eight years old.', zh: '我八岁了。' },
      ],
    },
    {
      title: 'he / she / it → is',
      emoji: '👆',
      body: '一个人或一个东西，用 is：\nhe is, she is, it is',
      highlight: '单个的他/她/它 → is',
      examples: [
        { en: 'He is a boy.', zh: '他是一个男孩。' },
        { en: 'She is my mom.', zh: '她是我的妈妈。' },
        { en: 'It is a dog.', zh: '它是一只狗。' },
      ],
    },
    {
      title: 'you / we / they → are',
      emoji: '👥',
      body: '"你"和"我们""他们"用 are：\nyou are, we are, they are',
      highlight: '你/我们/他们 → are',
      examples: [
        { en: 'You are kind.', zh: '你很善良。' },
        { en: 'We are friends.', zh: '我们是朋友。' },
        { en: 'They are tall.', zh: '他们很高。' },
      ],
    },
    {
      title: '🧠 口诀',
      emoji: '💡',
      body: 'I 用 am\nyou 用 are\nis 跟着 he / she / it\nwe / they 都用 are\n记住口诀不会错！',
      highlight: '背熟口诀，做题飞快！',
      examples: [],
    },
  ],

  // ─── 形容词 ────────────────────────────────────
  adjective: [
    {
      title: '什么是形容词？',
      emoji: '🌈',
      body: '形容词是用来描述东西的词。\n比如：大的、小的、高的、红的…',
      highlight: '形容词 = 描述词',
      examples: [],
    },
    {
      title: '大小和高矮',
      emoji: '🐘🐭',
      body: 'big = 大   ↔   small = 小\ntall = 高  ↔   short = 矮/短\nlong = 长  ↔   short = 短',
      highlight: '反义词要一起记！',
      examples: [
        { en: 'The elephant is big. 🐘', zh: '大象是大的。' },
        { en: 'The mouse is small. 🐭', zh: '老鼠是小的。' },
        { en: 'The giraffe is tall. 🦒', zh: '长颈鹿是高的。' },
      ],
    },
    {
      title: '感受和心情',
      emoji: '😊😢',
      body: 'happy = 开心 ↔ sad = 伤心\nhot = 热    ↔ cold = 冷\nnew = 新    ↔ old = 旧',
      highlight: '形容词告诉我们感觉如何！',
      examples: [
        { en: 'I am happy. 😊', zh: '我很开心。' },
        { en: 'He is sad. 😢', zh: '他很伤心。' },
        { en: 'It is hot today. ☀️', zh: '今天很热。' },
      ],
    },
    {
      title: '颜色也是形容词',
      emoji: '🎨',
      body: 'red 红  blue 蓝  green 绿\nyellow 黄  white 白  black 黑',
      highlight: '颜色放在名词前面！',
      examples: [
        { en: 'a red apple 🍎', zh: '一个红苹果' },
        { en: 'a blue sky 🔵', zh: '蓝色的天空' },
        { en: 'a green tree 🌲', zh: '一棵绿色的树' },
      ],
    },
  ],
};

// ── Question banks ────────────────────────────────────────

const Q = (stem, options, answer, explanation) => ({ stem, options, answer, explanation });

const QUESTIONS = {
  pronoun: [
    Q('___ am a student.', ['I', 'He', 'She', 'You'], 0, 'am 前面只能用 I'),
    Q('___ is a girl.', ['He', 'She', 'I', 'We'], 1, 'girl(女孩)用 she'),
    Q('___ are students.', ['I', 'He', 'She', 'We'], 3, '我们 = we'),
    Q('Tom is a boy. ___ is tall.', ['He', 'She', 'I', 'We'], 0, 'Tom 是男孩，用 he'),
    Q('Lucy is my sister. ___ is nice.', ['He', 'She', 'It', 'We'], 1, 'Lucy 是女孩，用 she'),
    Q('The cat is cute. ___ is white.', ['He', 'She', 'It', 'We'], 2, '动物用 it'),
    Q('My mom and I are happy. ___ love school.', ['I', 'He', 'We', 'She'], 2, '我和妈妈 = 我们 = we'),
    Q('The dogs are big. ___ are in the park.', ['It', 'He', 'They', 'We'], 2, '那些狗 = they'),
    Q('___ am eight years old.', ['I', 'You', 'He', 'She'], 0, 'am 只跟 I'),
    Q('___ is my dad.', ['She', 'It', 'He', 'They'], 2, 'dad(爸爸)是男的，用 he'),
    Q('___ are my friends.', ['He', 'She', 'It', 'They'], 3, '朋友们(复数)用 they'),
    Q('The bird can fly. ___ is small.', ['He', 'She', 'It', 'They'], 2, '鸟是动物，用 it'),
    Q('___ is a teacher.', ['They', 'We', 'She', 'I'], 2, '一个老师用 she 或 he'),
    Q('Mom and Dad are home. ___ are happy.', ['He', 'She', 'We', 'They'], 3, '爸爸和妈妈(不含我) = they'),
    Q('___ are in the classroom.', ['I', 'He', 'She', 'You'], 3, 'are 前面用 you/we/they'),
    Q('Look at the fish! ___ is beautiful.', ['He', 'She', 'It', 'They'], 2, 'fish(鱼)用 it'),
    Q('I have a brother. ___ is ten.', ['She', 'He', 'It', 'They'], 1, 'brother(哥哥)是男的'),
    Q('Amy and I like to read. ___ go to the library.', ['I', 'She', 'They', 'We'], 3, 'Amy和我 = we'),
    Q('___ is a cute puppy!', ['He', 'She', 'It', 'They'], 2, 'puppy(小狗)用 it'),
    Q('My grandma is kind. ___ cooks well.', ['He', 'It', 'She', 'They'], 2, 'grandma(奶奶)是女的'),
  ],

  article: [
    Q('I have ___ cat.', ['a', 'an', 'the', '/'], 0, 'cat 是 c 开头，辅音，用 a'),
    Q('This is ___ apple.', ['a', 'an', 'the', '/'], 1, 'apple 是 a 开头，元音，用 an'),
    Q('I see ___ egg on the table.', ['a', 'an', 'the', '/'], 1, 'egg 是 e 开头，元音，用 an'),
    Q('She has ___ dog.', ['a', 'an', 'the', '/'], 0, 'dog 是 d 开头，辅音，用 a'),
    Q('There is ___ orange in the bag.', ['a', 'an', 'the', '/'], 1, 'orange 是 o 开头，元音，用 an'),
    Q('He is ___ boy.', ['a', 'an', 'the', '/'], 0, 'boy 是 b 开头，辅音，用 a'),
    Q('I want ___ ice cream.', ['a', 'an', 'the', '/'], 1, 'ice 是 i 开头，元音，用 an'),
    Q('It is ___ umbrella.', ['a', 'an', 'the', '/'], 1, 'umbrella 是 u 开头，元音，用 an'),
    Q('She draws ___ picture.', ['a', 'an', 'the', '/'], 0, 'picture 是 p 开头，辅音，用 a'),
    Q('I eat ___ banana every day.', ['a', 'an', 'the', '/'], 0, 'banana 是 b 开头，辅音，用 a'),
    Q('He found ___ ant on the flower.', ['a', 'an', 'the', '/'], 1, 'ant 是 a 开头，元音，用 an'),
    Q('Mom bought ___ new pen.', ['a', 'an', 'the', '/'], 0, 'new 是 n 开头，辅音，用 a'),
    Q('There is ___ old man.', ['a', 'an', 'the', '/'], 1, 'old 是 o 开头，元音，用 an'),
    Q('I need ___ eraser.', ['a', 'an', 'the', '/'], 1, 'eraser 是 e 开头，元音，用 an'),
    Q('We see ___ bird in the tree.', ['a', 'an', 'the', '/'], 0, 'bird 是 b 开头，辅音，用 a'),
    Q('She is ___ English teacher.', ['a', 'an', 'the', '/'], 1, 'English 是 E 开头，元音，用 an'),
    Q('He has ___ big house.', ['a', 'an', 'the', '/'], 0, 'big 是 b 开头，辅音，用 a'),
    Q('This is ___ elephant.', ['a', 'an', 'the', '/'], 1, 'elephant 是 e 开头，元音，用 an'),
    Q('I see ___ flower.', ['a', 'an', 'the', '/'], 0, 'flower 是 f 开头，辅音，用 a'),
    Q('There is ___ uncle here.', ['a', 'an', 'the', '/'], 1, 'uncle 是 u 开头，元音，用 an'),
  ],

  plural: [
    Q('one cat, two ___', ['cat', 'cats', 'cates', 'caties'], 1, '直接加 s → cats'),
    Q('one box, three ___', ['boxs', 'box', 'boxes', 'boxies'], 2, '以 x 结尾加 es → boxes'),
    Q('one dog, four ___', ['dogs', 'doges', 'dogies', 'dog'], 0, '直接加 s → dogs'),
    Q('one bus, two ___', ['buss', 'buses', 'bus', 'busis'], 1, '以 s 结尾加 es → buses'),
    Q('one man, three ___', ['mans', 'men', 'manes', 'menie'], 1, '特殊变化 man → men'),
    Q('one apple, five ___', ['apple', 'applees', 'apples', 'applis'], 2, '直接加 s → apples'),
    Q('one child, two ___', ['childs', 'childes', 'children', 'childies'], 2, '特殊变化 child → children'),
    Q('one book, many ___', ['bookes', 'books', 'book', 'bookies'], 1, '直接加 s → books'),
    Q('one foot, two ___', ['foots', 'feet', 'footes', 'feets'], 1, '特殊变化 foot → feet'),
    Q('one pen, six ___', ['pens', 'penes', 'penis', 'pen'], 0, '直接加 s → pens'),
    Q('one dish, two ___', ['dishs', 'dishes', 'dish', 'dishies'], 1, '以 sh 结尾加 es → dishes'),
    Q('one fish, three ___', ['fish', 'fishes', 'fishs', 'fishies'], 0, 'fish 单复数同形'),
    Q('one egg, four ___', ['egs', 'egg', 'eggies', 'eggs'], 3, '直接加 s → eggs'),
    Q('one woman, two ___', ['womans', 'women', 'womanes', 'womens'], 1, '特殊变化 woman → women'),
    Q('one star, five ___', ['stars', 'stares', 'staries', 'star'], 0, '直接加 s → stars'),
    Q('one class, two ___', ['classs', 'classes', 'class', 'classies'], 1, '以 ss 结尾加 es → classes'),
    Q('one toy, many ___', ['toies', 'toys', 'toyes', 'toy'], 1, '直接加 s → toys'),
    Q('one watch, two ___', ['watchs', 'watch', 'watches', 'watchies'], 2, '以 ch 结尾加 es → watches'),
    Q('one tree, three ___', ['trees', 'treees', 'treies', 'tree'], 0, '直接加 s → trees'),
    Q('one mouse, two ___', ['mouses', 'mice', 'mousees', 'mices'], 1, '特殊变化 mouse → mice'),
  ],

  prep: [
    Q('The ball is ___ the box. (在里面)', ['on', 'in', 'under', 'behind'], 1, 'in = 在里面'),
    Q('The book is ___ the desk. (在上面)', ['in', 'on', 'under', 'behind'], 1, 'on = 在上面'),
    Q('The cat is ___ the table. (在下面)', ['in', 'on', 'under', 'behind'], 2, 'under = 在下面'),
    Q('The dog is ___ the door. (在后面)', ['in', 'on', 'under', 'behind'], 3, 'behind = 在后面'),
    Q('The fish is ___ the water.', ['on', 'in', 'under', 'behind'], 1, '鱼在水里面 → in'),
    Q('The cup is ___ the table.', ['under', 'behind', 'in', 'on'], 3, '杯子在桌子上面 → on'),
    Q('The shoes are ___ the bed.', ['on', 'in', 'under', 'behind'], 2, '鞋在床下面 → under'),
    Q('The picture is ___ the wall.', ['in', 'under', 'on', 'behind'], 2, '画在墙上面 → on'),
    Q('The bird is ___ the cage. (笼子)', ['on', 'under', 'behind', 'in'], 3, '鸟在笼子里面 → in'),
    Q('The bag is ___ the chair. (在后面)', ['in', 'on', 'under', 'behind'], 3, 'behind = 在后面'),
    Q('Put the toy ___ the box. (放进去)', ['on', 'under', 'in', 'behind'], 2, '放进盒子里 → in'),
    Q('The apple is ___ the plate. (盘子上)', ['in', 'on', 'under', 'behind'], 1, '苹果在盘子上 → on'),
    Q('The mouse is ___ the sofa. (沙发下面)', ['in', 'on', 'under', 'behind'], 2, '老鼠在沙发下 → under'),
    Q('The flowers are ___ the vase. (花瓶里)', ['on', 'in', 'under', 'behind'], 1, '花在花瓶里 → in'),
    Q('The clock is ___ the wall.', ['in', 'under', 'on', 'behind'], 2, '钟在墙上 → on'),
    Q('The cat hides ___ the tree.', ['in', 'on', 'under', 'behind'], 3, '猫藏在树后面 → behind'),
    Q('The pen is ___ the pencil case.', ['on', 'in', 'under', 'behind'], 1, '笔在笔袋里 → in'),
    Q('The hat is ___ her head.', ['in', 'on', 'under', 'behind'], 1, '帽子在头上 → on'),
    Q('The ball rolled ___ the table.', ['on', 'in', 'behind', 'under'], 3, '球滚到桌子下面 → under'),
    Q('The gift is ___ the Christmas tree.', ['on', 'in', 'behind', 'under'], 3, '礼物在圣诞树下 → under'),
  ],

  beVerb: [
    Q('I ___ a student.', ['am', 'is', 'are', 'be'], 0, 'I + am'),
    Q('She ___ my sister.', ['am', 'is', 'are', 'be'], 1, 'She + is'),
    Q('They ___ happy.', ['am', 'is', 'are', 'be'], 2, 'They + are'),
    Q('He ___ tall.', ['am', 'is', 'are', 'be'], 1, 'He + is'),
    Q('We ___ friends.', ['am', 'is', 'are', 'be'], 2, 'We + are'),
    Q('You ___ kind.', ['am', 'is', 'are', 'be'], 2, 'You + are'),
    Q('It ___ a cat.', ['am', 'is', 'are', 'be'], 1, 'It + is'),
    Q('I ___ eight years old.', ['am', 'is', 'are', 'be'], 0, 'I + am'),
    Q('The dog ___ big.', ['am', 'is', 'are', 'be'], 1, 'The dog (= it) + is'),
    Q('Tom and Jerry ___ friends.', ['am', 'is', 'are', 'be'], 2, '两个人 + are'),
    Q('My mother ___ a teacher.', ['am', 'is', 'are', 'be'], 1, 'My mother (= she) + is'),
    Q('The books ___ on the desk.', ['am', 'is', 'are', 'be'], 2, '复数 books + are'),
    Q('I ___ not sad.', ['am', 'is', 'are', 'be'], 0, 'I + am'),
    Q('___ you a student?', ['Am', 'Is', 'Are', 'Be'], 2, 'you + are → Are you...?'),
    Q('___ she your sister?', ['Am', 'Is', 'Are', 'Be'], 1, 'she + is → Is she...?'),
    Q('My cat ___ cute.', ['am', 'is', 'are', 'be'], 1, 'My cat (= it) + is'),
    Q('The apples ___ red.', ['am', 'is', 'are', 'be'], 2, '复数 apples + are'),
    Q('This ___ my school.', ['am', 'is', 'are', 'be'], 1, 'This + is'),
    Q('Those ___ my toys.', ['am', 'is', 'are', 'be'], 2, 'Those(复数) + are'),
    Q('I ___ in Class Two.', ['am', 'is', 'are', 'be'], 0, 'I + am'),
  ],

  adjective: [
    Q('The elephant is very ___. 🐘', ['small', 'big', 'short', 'thin'], 1, '大象很大 → big'),
    Q('The mouse is very ___. 🐭', ['big', 'tall', 'small', 'long'], 2, '老鼠很小 → small'),
    Q('The giraffe is ___. 🦒', ['short', 'small', 'tall', 'sad'], 2, '长颈鹿很高 → tall'),
    Q('In winter, it is ___. ❄️', ['hot', 'cold', 'happy', 'new'], 1, '冬天很冷 → cold'),
    Q('In summer, it is ___. ☀️', ['cold', 'hot', 'old', 'sad'], 1, '夏天很热 → hot'),
    Q('I got 100 marks! I am ___. 😊', ['sad', 'cold', 'happy', 'old'], 2, '考了100分很开心 → happy'),
    Q('My toy is broken. I am ___. 😢', ['happy', 'big', 'new', 'sad'], 3, '玩具坏了很伤心 → sad'),
    Q('The sky is ___. 🔵', ['red', 'blue', 'green', 'yellow'], 1, '天空是蓝色的 → blue'),
    Q('The apple is ___. 🍎', ['blue', 'green', 'red', 'white'], 2, '苹果是红色的 → red'),
    Q('The grass is ___. 🌿', ['red', 'blue', 'yellow', 'green'], 3, '草是绿色的 → green'),
    Q('The ruler is ___. (长的)', ['short', 'long', 'big', 'small'], 1, '尺子很长 → long'),
    Q('The pencil is ___. (短的)', ['long', 'short', 'big', 'tall'], 1, '铅笔很短 → short'),
    Q('This book is ___. (新的)', ['old', 'new', 'big', 'sad'], 1, '这本书是新的 → new'),
    Q('That car is ___. (旧的)', ['new', 'old', 'big', 'happy'], 1, '那辆车是旧的 → old'),
    Q('The water is ___. (干净的)', ['dirty', 'clean', 'hot', 'red'], 1, '水很干净 → clean'),
    Q('A ___ ball is on the floor. (大的)', ['small', 'big', 'new', 'old'], 1, '一个大球 → big'),
    Q('She has a ___ dress. (漂亮的)', ['ugly', 'pretty', 'old', 'sad'], 1, '漂亮的裙子 → pretty'),
    Q('The opposite of "big" is ___.', ['tall', 'long', 'small', 'old'], 2, 'big 的反义词是 small'),
    Q('The opposite of "happy" is ___.', ['big', 'sad', 'cold', 'new'], 1, 'happy 的反义词是 sad'),
    Q('The opposite of "hot" is ___.', ['new', 'big', 'cold', 'sad'], 2, 'hot 的反义词是 cold'),
  ],
};

// ── Question generator for quiz ───────────────────────────

export function generateEngQuestions(topicKey, count) {
  const bank = QUESTIONS[topicKey];
  if (!bank) return [];
  const pool = bank.map((q, i) => ({
    ...q,
    op: ENG_TOPICS[topicKey].key,
    id: `${topicKey}_${i}`,
  }));
  return arrayShuffle(pool).slice(0, Math.min(count, pool.length));
}

export function getEngMaxQuestions(topicKey) {
  return QUESTIONS[topicKey]?.length || 0;
}
