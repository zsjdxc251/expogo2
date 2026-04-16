import AsyncStorage from '@react-native-async-storage/async-storage';

const FREQ_KEY = '@learnpark_qfreq';
let freqCache = null;

async function loadFreq() {
  if (freqCache) return freqCache;
  try {
    const raw = await AsyncStorage.getItem(FREQ_KEY);
    freqCache = raw ? JSON.parse(raw) : {};
  } catch { freqCache = {}; }
  return freqCache;
}

function saveFreqAsync(freq) {
  freqCache = freq;
  AsyncStorage.setItem(FREQ_KEY, JSON.stringify(freq)).catch(() => {});
}

function questionKey(q) {
  if (q.stem) return q.stem;
  return `${q.op}|${q.left}|${q.right}|${q.missingPos || ''}`;
}

function weightedSelect(pool, count, freq) {
  const maxFreq = Math.max(1, ...pool.map((q) => freq[questionKey(q)] || 0));
  const items = pool.map((q) => ({
    q,
    w: maxFreq + 1 - (freq[questionKey(q)] || 0),
  }));
  const selected = [];
  for (let i = 0; i < count && items.length > 0; i++) {
    let totalW = 0;
    for (let j = 0; j < items.length; j++) totalW += items[j].w;
    if (totalW <= 0) break;
    let r = Math.random() * totalW;
    for (let j = 0; j < items.length; j++) {
      r -= items[j].w;
      if (r <= 0) {
        selected.push(items[j].q);
        items.splice(j, 1);
        break;
      }
    }
  }
  return selected;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(positions) {
  return positions[Math.floor(Math.random() * positions.length)];
}

function build(left, right, result, op, positions) {
  const miss = pick(positions);
  const answer = miss === 'left' ? left : miss === 'right' ? right : result;
  return {
    left, right, result, op, missingPos: miss, answer,
    display: {
      left:   miss === 'left'   ? '' : String(left),
      right:  miss === 'right'  ? '' : String(right),
      result: miss === 'result' ? '' : String(result),
    },
  };
}

function genMulForward(count, [lo, hi]) {
  const pool = [];
  for (let a = lo; a <= hi; a++)
    for (let b = lo; b <= hi; b++)
      pool.push(build(a, b, a * b, 'mulForward', ['result']));
  return shuffle(pool).slice(0, count);
}

function genMulBlank(count, [lo, hi]) {
  const pool = [];
  for (let a = lo; a <= hi; a++)
    for (let b = lo; b <= hi; b++)
      pool.push(build(a, b, a * b, 'mulBlank', ['left', 'right']));
  return shuffle(pool).slice(0, count);
}

function genAdd(count, [lo, hi]) {
  const pool = [];
  for (let a = lo; a <= hi; a++)
    for (let b = lo; b <= hi; b++)
      pool.push(build(a, b, a + b, 'add', ['left', 'right']));
  return shuffle(pool).slice(0, count);
}

function genSubtract(count, [lo, hi]) {
  const pool = [];
  for (let a = lo; a <= hi; a++)
    for (let b = lo; b <= hi; b++)
      pool.push(build(a + b, a, b, 'subtract', ['right', 'result']));
  return shuffle(pool).slice(0, count);
}

function genDivide(count, [lo, hi]) {
  const pool = [];
  for (let a = lo; a <= hi; a++)
    for (let b = lo; b <= hi; b++)
      pool.push(build(a * b, a, b, 'divide', ['right', 'result']));
  return shuffle(pool).slice(0, count);
}

function genDivRem(count, [lo, hi]) {
  const pool = [];
  for (let b = lo; b <= hi; b++) {
    for (let q = lo; q <= hi; q++) {
      for (let r = 1; r < b; r++) {
        const a = b * q + r;
        pool.push({
          left: a, right: b, result: q, remainder: r,
          op: 'divRem', missingPos: 'both', multiInput: true,
          answer: { q, r },
          display: {
            left: String(a), right: String(b),
            result: '', remainder: '',
          },
        });
      }
    }
  }
  return shuffle(pool).slice(0, count);
}

function genDivReverse(count, [lo, hi]) {
  const pool = [];
  for (let b = lo; b <= hi; b++) {
    for (let q = lo; q <= hi; q++) {
      const maxR = b - 1;
      const dividend = b * q + maxR;
      pool.push({
        left: dividend, right: b, result: q, remainder: maxR,
        op: 'divReverse', missingPos: 'both', multiInput: true,
        answer: { dividend, remainder: maxR },
        display: {
          left: '', right: String(b),
          result: String(q), remainder: '',
        },
      });
    }
  }
  return shuffle(pool).slice(0, count);
}

function genAddTwo(count, [lo, hi]) {
  const pool = [];
  const scale = lo <= 3 ? 10 : lo <= 5 ? 20 : 30;
  for (let i = 0; i < 200; i++) {
    const a = scale + Math.floor(Math.random() * (99 - scale));
    const b = scale + Math.floor(Math.random() * (99 - scale));
    pool.push(build(a, b, a + b, 'addTwo', ['result']));
  }
  const seen = new Set();
  return pool.filter((q) => {
    const k = `${q.left}+${q.right}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, count);
}

function genSubtractTwo(count, [lo, hi]) {
  const pool = [];
  const scale = lo <= 3 ? 10 : lo <= 5 ? 20 : 30;
  for (let i = 0; i < 200; i++) {
    const b = scale + Math.floor(Math.random() * (50 - scale));
    const diff = 1 + Math.floor(Math.random() * (b - 1));
    const a = b + diff;
    pool.push(build(a, b, diff, 'subtractTwo', ['result']));
  }
  const seen = new Set();
  return pool.filter((q) => {
    const k = `${q.left}-${q.right}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, count);
}

function genMulReverse(count, [lo, hi]) {
  const pool = [];
  for (let a = lo; a <= hi; a++) {
    for (let b = a; b <= hi; b++) {
      const product = a * b;
      const wrong1 = product + Math.floor(Math.random() * 3) + 1;
      const wrong2 = product - Math.floor(Math.random() * 3) - 1;
      const wrong3 = (a + 1) * b;
      const options = shuffle([
        `${a} × ${b}`,
        `${a} × ${b + 1}`,
        `${Math.max(2, a - 1)} × ${b}`,
        `${a + 1} × ${Math.max(2, b - 1)}`,
      ].slice(0, 4));
      const correctOpt = `${a} × ${b}`;
      const answerIdx = options.indexOf(correctOpt);
      pool.push({
        op: 'mulReverse', mcq: true,
        stem: `哪个乘法等于 ${product}?`,
        options, answer: answerIdx >= 0 ? answerIdx : 0,
        left: a, right: b, result: product,
      });
    }
  }
  return shuffle(pool).slice(0, count);
}

function genCompare(count, [lo, hi]) {
  const pool = [];
  const OPS = ['>', '<', '='];
  for (let i = 0; i < 150; i++) {
    const a1 = lo + Math.floor(Math.random() * (hi - lo + 1));
    const b1 = lo + Math.floor(Math.random() * (hi - lo + 1));
    const a2 = lo + Math.floor(Math.random() * (hi - lo + 1));
    const b2 = lo + Math.floor(Math.random() * (hi - lo + 1));
    const leftVal = a1 * b1;
    const rightVal = a2 * b2;
    const correct = leftVal > rightVal ? 0 : leftVal < rightVal ? 1 : 2;
    pool.push({
      op: 'compare', mcq: true,
      stem: `${a1}×${b1}  ___  ${a2}×${b2}`,
      options: OPS,
      answer: correct,
      left: leftVal, right: rightVal, result: correct,
    });
  }
  const seen = new Set();
  return pool.filter((q) => {
    const k = q.stem;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, count);
}

const WORD_TEMPLATES = [
  // ===== 基础加法 =====
  { tpl: (a, b) => `小明有 ${a} 颗糖，又得到了 ${b} 颗，现在共有 ___ 颗糖`, fn: (a, b) => a + b },
  { tpl: (a, b) => `停车场有 ${a} 辆车，又开来了 ${b} 辆，现在共有 ___ 辆车`, fn: (a, b) => a + b },
  { tpl: (a, b) => `哥哥有 ${a} 张贴纸，妹妹有 ${b} 张贴纸，他们一共有 ___ 张`, fn: (a, b) => a + b },
  { tpl: (a, b) => `上午卖了 ${a} 个面包，下午卖了 ${b} 个，一天共卖了 ___ 个`, fn: (a, b) => a + b },
  // ===== 基础减法 =====
  { tpl: (a, b) => `树上有 ${a} 只鸟，飞走了 ${b} 只，还剩 ___ 只`, fn: (a, b) => a - b, constraint: (a, b) => a > b },
  { tpl: (a, b) => `一本书 ${a} 页，已经看了 ${b} 页，还剩 ___ 页`, fn: (a, b) => a - b, constraint: (a, b) => a > b },
  { tpl: (a, b) => `超市有 ${a} 个苹果，卖掉了 ${b} 个，还剩 ___ 个`, fn: (a, b) => a - b, constraint: (a, b) => a > b },
  { tpl: (a, b) => `小红有 ${a} 元钱，买文具花了 ${b} 元，还剩 ___ 元`, fn: (a, b) => a - b, constraint: (a, b) => a > b },
  // ===== 基础乘法 =====
  { tpl: (a, b) => `每排坐 ${a} 人，${b} 排一共坐 ___ 人`, fn: (a, b) => a * b },
  { tpl: (a, b) => `每盒有 ${a} 块饼干，买了 ${b} 盒，一共有 ___ 块`, fn: (a, b) => a * b },
  { tpl: (a, b) => `一辆车有 ${a} 个轮子，${b} 辆车一共有 ___ 个轮子`, fn: () => 4, fixA: 4, constraint: (a, b) => a === 4 },
  { tpl: (a, b) => `每束花 ${a} 朵，买了 ${b} 束，一共有 ___ 朵花`, fn: (a, b) => a * b },
  // ===== 基础除法（整除）=====
  { tpl: (a, b) => `${a * b} 个苹果平均分给 ${b} 人，每人分到 ___ 个`, fn: (a, b) => a },
  { tpl: (a, b) => `${a * b} 支铅笔，每 ${b} 支装一盒，能装 ___ 盒`, fn: (a, b) => a },
  { tpl: (a, b) => `有 ${a * b} 块糖，平均分给 ${a} 个小朋友，每人分 ___ 块`, fn: (a, b) => b },
  // ===== 购买与找零 =====
  { tpl: (a, b) => `一本笔记本 ${a} 元，小明带了 ${a + b} 元，最多能买 ___ 本`, fn: (a, b) => Math.floor((a + b) / a), constraint: (a, b) => a >= 3 && b >= 0 },
  { tpl: (a, b) => `每把团扇 ${a} 元，${b * a + Math.floor(a / 2)} 元最多能买 ___ 把`, fn: (a, b) => b, constraint: (a, b) => a >= 3 },
  { tpl: (a, b) => `小红有 50 元，买了 ${b} 个面包，每个 ${a} 元，还剩 ___ 元`, fn: (a, b) => 50 - a * b, constraint: (a, b) => a * b < 50 && a >= 3 },
  // ===== 除法余数（实际场景）=====
  {
    tpl: (a, b) => `${a} 位同学练武术，每排站 ${b} 位，能站满 ___ 排（输入排数）`,
    fn: (a, b) => Math.floor(a / b),
    constraint: (a, b) => b >= 3 && a > b && a % b !== 0,
    genRange: (lo, hi) => {
      const b = lo + Math.floor(Math.random() * (hi - lo + 1));
      const q = 2 + Math.floor(Math.random() * 6);
      const r = 1 + Math.floor(Math.random() * (b - 1));
      return [b * q + r, Math.max(3, b)];
    },
  },
  {
    tpl: (a, b) => `${a} 个鸡蛋，每 ${b} 个装一盒，能装满 ___ 盒`,
    fn: (a, b) => Math.floor(a / b),
    constraint: (a, b) => b >= 3 && a > b,
    genRange: (lo, hi) => {
      const b = lo + Math.floor(Math.random() * (hi - lo + 1));
      const q = 2 + Math.floor(Math.random() * 5);
      const r = Math.floor(Math.random() * b);
      return [b * q + r, Math.max(3, b)];
    },
  },
  {
    tpl: (a, b) => `${a} 个小朋友去划船，每条船坐 ${b} 人，至少需要 ___ 条船`,
    fn: (a, b) => Math.ceil(a / b),
    constraint: (a, b) => b >= 3 && a > b,
    genRange: (lo, hi) => {
      const b = Math.max(3, lo + Math.floor(Math.random() * (Math.min(hi, 8) - lo + 1)));
      const a = b * 2 + 1 + Math.floor(Math.random() * (b * 4));
      return [a, b];
    },
  },
  // ===== 比较与倍数 =====
  {
    tpl: (a, b) => `爸爸每分钟写 ${a} 个字，妈妈每分钟写 ${b} 个字，爸爸写得快还是妈妈写得快？（输入较大数）`,
    fn: (a, b) => Math.max(a, b),
    constraint: (a, b) => a !== b,
  },
  {
    tpl: (a, b) => `小明跳了 ${a} 下，小红跳的次数是小明的 ${b} 倍，小红跳了 ___ 下`,
    fn: (a, b) => a * b,
    constraint: (a, b) => b >= 2 && b <= 5,
  },
  {
    tpl: (a, b) => `姐姐有 ${a * b} 颗珠子，是妹妹的 ${b} 倍，妹妹有 ___ 颗`,
    fn: (a, b) => a,
    constraint: (a, b) => b >= 2 && b <= 5,
  },
  // ===== 多步运算 =====
  {
    tpl: (a, b) => `商店有 ${a} 个玩具，上午卖了 ${b} 个，下午又进了 ${Math.floor(b / 2)} 个，现在有 ___ 个`,
    fn: (a, b) => a - b + Math.floor(b / 2),
    constraint: (a, b) => a > b && b >= 4 && b % 2 === 0,
  },
  {
    tpl: (a, b) => `图书馆有 ${a} 本书，借出 ${b} 本后又归还了 ${Math.floor(b / 3)} 本，现在有 ___ 本`,
    fn: (a, b) => a - b + Math.floor(b / 3),
    constraint: (a, b) => a > b && b >= 6 && b % 3 === 0,
  },
  // ===== 表格数据类 =====
  {
    tpl: (a, b) => {
      const c = a + b + Math.floor(Math.random() * 5) + 1;
      return `文具店有铅笔 ${a} 支、橡皮 ${b} 块、尺子 ${c} 把，铅笔和橡皮一共有 ___ 件`;
    },
    fn: (a, b) => a + b,
  },
  {
    tpl: (a, b) => {
      const total = a * 3 + b * 2;
      return `每个大盒装 ${a} 个球，每个小盒装 ${b} 个球。3个大盒和2个小盒共装 ___ 个球`;
    },
    fn: (a, b) => a * 3 + b * 2,
    constraint: (a, b) => a > b && a >= 5,
  },
  // ===== 材料与制作（瓶颈约束）=====
  {
    tpl: (a, b) => {
      const need = 3;
      return `做一个风车需要 ${need} 根竹签，现有 ${a * need + b} 根竹签，最多做 ___ 个风车`;
    },
    fn: (a, b) => a,
    constraint: (a, b) => a >= 2 && b >= 0 && b < 3,
    genRange: () => {
      const a = 2 + Math.floor(Math.random() * 8);
      const b = Math.floor(Math.random() * 3);
      return [a, b];
    },
  },
  // ===== 时间类 =====
  {
    tpl: (a, b) => `小明 ${a} 点出门，${a + b} 点到学校，路上用了 ___ 小时`,
    fn: (a, b) => b,
    constraint: (a, b) => a >= 6 && a + b <= 12 && b >= 1,
    genRange: () => [6 + Math.floor(Math.random() * 3), 1 + Math.floor(Math.random() * 2)],
  },
  {
    tpl: (a, b) => `一节课 ${a} 分钟，下课休息 ${b} 分钟，两节课加一次课间共 ___ 分钟`,
    fn: (a, b) => a * 2 + b,
    constraint: () => true,
    genRange: () => [40, 10],
  },
  // ===== 排列组合简单问题 =====
  {
    tpl: (a, b) => `一件上衣配一条裤子，有 ${a} 件上衣和 ${b} 条裤子，共有 ___ 种搭配`,
    fn: (a, b) => a * b,
    constraint: (a, b) => a >= 2 && a <= 5 && b >= 2 && b <= 5,
  },
  // ===== 钱币计算 =====
  {
    tpl: (a, b) => `小红有 ${a} 张5元和 ${b} 张1元，一共有 ___ 元`,
    fn: (a, b) => a * 5 + b,
    constraint: (a, b) => a >= 1 && a <= 6 && b >= 1 && b <= 9,
    genRange: () => [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 9)],
  },
  // ===== 等量代换 =====
  {
    tpl: (a, b) => `1 个苹果和 ${b} 个橘子一样重，${a} 个苹果等于 ___ 个橘子`,
    fn: (a, b) => a * b,
    constraint: (a, b) => a >= 2 && a <= 5 && b >= 2 && b <= 4,
  },
  // ===== 间隔问题 =====
  {
    tpl: (a, b) => `一条路的一边种了 ${a} 棵树，每两棵树之间有 ${b} 米，从第一棵到最后一棵共 ___ 米`,
    fn: (a, b) => (a - 1) * b,
    constraint: (a, b) => a >= 3 && a <= 10 && b >= 2 && b <= 5,
  },
  {
    tpl: (a, b) => `一根绳子剪 ${a} 刀，能剪成 ___ 段`,
    fn: (a) => a + 1,
    constraint: (a) => a >= 2 && a <= 9,
  },
];

function genWordProblem(count, [lo, hi]) {
  const pool = [];
  const attempts = Math.max(300, count * 8);
  for (let i = 0; i < attempts; i++) {
    const t = WORD_TEMPLATES[Math.floor(Math.random() * WORD_TEMPLATES.length)];
    let a, b;
    if (t.genRange) {
      [a, b] = t.genRange(lo, hi);
    } else {
      a = lo + Math.floor(Math.random() * (hi - lo + 1));
      b = lo + Math.floor(Math.random() * (hi - lo + 1));
    }
    if (t.constraint && !t.constraint(a, b)) continue;
    const result = t.fn(a, b);
    if (result < 0 || !Number.isFinite(result)) continue;
    pool.push({
      op: 'wordProblem',
      stem: t.tpl(a, b),
      left: a, right: b, result,
      answer: result, missingPos: 'result',
      display: { left: '', right: '', result: '' },
    });
  }
  const seen = new Set();
  const deduped = pool.filter((q) => {
    if (seen.has(q.stem)) return false;
    seen.add(q.stem);
    return true;
  });
  return shuffle(deduped).slice(0, count);
}

function genPattern(count, [lo, hi]) {
  const pool = [];
  const step = lo <= 3 ? 2 : lo <= 5 ? 3 : 5;
  for (let start = lo; start <= hi * 3; start++) {
    for (let d = 1; d <= step + 2; d++) {
      const seq = [start, start + d, start + 2 * d, start + 3 * d];
      pool.push({
        op: 'pattern',
        stem: `${seq[0]}, ${seq[1]}, ${seq[2]}, ___`,
        answer: seq[3],
        left: start, right: d, result: seq[3],
        missingPos: 'result',
        display: { left: '', right: '', result: '' },
      });
    }
    for (let r = 2; r <= 3; r++) {
      const seq = [start, start * r, start * r * r];
      if (seq[2] <= 200) {
        pool.push({
          op: 'pattern',
          stem: `${seq[0]}, ${seq[1]}, ${seq[2]}, ___`,
          answer: seq[2] * r,
          left: start, right: r, result: seq[2] * r,
          missingPos: 'result',
          display: { left: '', right: '', result: '' },
        });
      }
    }
  }
  return shuffle(pool).slice(0, count);
}

const GENERATORS = {
  mulForward: genMulForward, mulBlank: genMulBlank,
  add: genAdd, subtract: genSubtract,
  divide: genDivide, divRem: genDivRem, divReverse: genDivReverse,
  addTwo: genAddTwo, subtractTwo: genSubtractTwo,
  mulReverse: genMulReverse, compare: genCompare,
  wordProblem: genWordProblem, pattern: genPattern,
};

export function generateQuestions(subject, count, range) {
  const gen = GENERATORS[subject];
  if (!gen) return [];
  const maxPool = getMaxQuestions(subject, range);
  const pool = gen(Math.max(count * 3, maxPool), range);
  if (pool.length <= count) return shuffle(pool);
  const freq = freqCache || {};
  const selected = weightedSelect(pool, count, freq);
  selected.forEach((q) => { freq[questionKey(q)] = (freq[questionKey(q)] || 0) + 1; });
  saveFreqAsync(freq);
  return selected;
}

export function getMaxQuestions(subject, range) {
  if (!range || range.length < 2) return 50;
  const [lo, hi] = range;
  const n = hi - lo + 1;
  if (subject === 'divRem') {
    let total = 0;
    for (let b = lo; b <= hi; b++) total += n * (b - 1);
    return total;
  }
  if (subject === 'divReverse') return n * n;
  if (subject === 'addTwo' || subject === 'subtractTwo') return 100;
  if (subject === 'mulReverse') return Math.floor(n * (n + 1) / 2);
  if (subject === 'compare') return 80;
  if (subject === 'wordProblem') return 120;
  if (subject === 'pattern') return 60;
  return n * n;
}

export function generateSpeedAdd(count, diffRange) {
  const pool = [];
  const [lo, hi] = diffRange || [2, 9];
  const maxSum = hi <= 5 ? 50 : hi <= 7 ? 80 : 100;
  for (let i = 0; i < 400; i++) {
    const a = 1 + Math.floor(Math.random() * (maxSum - 1));
    const maxB = Math.min(maxSum - a, maxSum - 1);
    if (maxB < 1) continue;
    const b = 1 + Math.floor(Math.random() * maxB);
    pool.push(build(a, b, a + b, 'add', ['result']));
  }
  const seen = new Set();
  return pool.filter((q) => {
    const k = `${q.left}+${q.right}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, count);
}

export function generateSpeedSub(count, diffRange) {
  const pool = [];
  const [lo, hi] = diffRange || [2, 9];
  const maxNum = hi <= 5 ? 50 : hi <= 7 ? 80 : 100;
  for (let i = 0; i < 400; i++) {
    const a = 2 + Math.floor(Math.random() * (maxNum - 1));
    const b = 1 + Math.floor(Math.random() * (a - 1));
    pool.push(build(a, b, a - b, 'subtract', ['result']));
  }
  const seen = new Set();
  return pool.filter((q) => {
    const k = `${q.left}-${q.right}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, count);
}

export function generateSpeedDiv(count, range) {
  const [lo, hi] = range || [2, 9];
  const pool = [];
  for (let a = lo; a <= hi; a++)
    for (let b = lo; b <= hi; b++)
      pool.push(build(a * b, a, b, 'divide', ['result']));
  return shuffle(pool).slice(0, count);
}

export { shuffle };
export const preloadFreq = loadFreq;
