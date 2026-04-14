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
  { tpl: (a, b) => `小明有 ${a} 颗糖，又得到了 ${b} 颗，现在共有 ___ 颗糖`, fn: (a, b) => a + b },
  { tpl: (a, b) => `树上有 ${a} 只鸟，飞走了 ${b} 只，还剩 ___ 只`, fn: (a, b) => a - b, constraint: (a, b) => a > b },
  { tpl: (a, b) => `每排坐 ${a} 人，${b} 排一共坐 ___ 人`, fn: (a, b) => a * b },
  { tpl: (a, b) => `${a * b} 个苹果平均分给 ${b} 人，每人分到 ___ 个`, fn: (a, b) => a },
  { tpl: (a, b) => `一本书 ${a} 页，已经看了 ${b} 页，还剩 ___ 页`, fn: (a, b) => a - b, constraint: (a, b) => a > b },
];

function genWordProblem(count, [lo, hi]) {
  const pool = [];
  for (let i = 0; i < 100; i++) {
    const t = WORD_TEMPLATES[Math.floor(Math.random() * WORD_TEMPLATES.length)];
    const a = lo + Math.floor(Math.random() * (hi - lo + 1));
    const b = lo + Math.floor(Math.random() * (hi - lo + 1));
    if (t.constraint && !t.constraint(a, b)) continue;
    const result = t.fn(a, b);
    if (result < 0) continue;
    pool.push({
      op: 'wordProblem',
      stem: t.tpl(a, b),
      left: a, right: b, result,
      answer: result, missingPos: 'result',
      display: { left: '', right: '', result: '' },
    });
  }
  return shuffle(pool).slice(0, count);
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
  return gen(count, range);
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
  if (subject === 'wordProblem') return 50;
  if (subject === 'pattern') return 60;
  return n * n;
}

export { shuffle };
