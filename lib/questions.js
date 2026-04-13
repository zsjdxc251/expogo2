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

function genMultiply(count, [lo, hi]) {
  const pool = [];
  for (let a = lo; a <= hi; a++)
    for (let b = lo; b <= hi; b++)
      pool.push(build(a, b, a * b, 'multiply', ['left', 'right']));
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

const GENERATORS = { multiply: genMultiply, add: genAdd, subtract: genSubtract, divide: genDivide };

export function generateQuestions(subject, count, range) {
  const gen = GENERATORS[subject];
  if (!gen) return [];
  return gen(count, range);
}

export { shuffle };
