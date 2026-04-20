export const LEVELS = [
  { level: 1, min: 0,    title: '数学新手' },
  { level: 2, min: 200,  title: '计算小兵' },
  { level: 3, min: 500,  title: '数学战士' },
  { level: 4, min: 1000, title: '算术达人' },
  { level: 5, min: 2000, title: '数学大师' },
  { level: 6, min: 5000, title: '超级学霸' },
];

export function getLevel(points) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

export function nextLevel(points) {
  const cur = getLevel(points);
  const idx = LEVELS.findIndex((l) => l.level === cur.level);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

export function calcPoints({ total, correct, perCorrect = 5, perfectBonus = 10, perfectMinCount = 10 }) {
  let pts = correct * perCorrect;
  if (correct === total && total >= perfectMinCount) pts += perfectBonus;
  return pts;
}

export const ACH_DEFS = [
  { id: 'first',       name: '首次出征', desc: '完成第一次练习',       icon: '🎯' },
  { id: 'perfect',     name: '完美通关', desc: '任一次练习全对',       icon: '⭐' },
  { id: 'speed',       name: '闪电侠',   desc: '20题60秒内完成',      icon: '⚡' },
  { id: 'streak3',     name: '坚持不懈', desc: '连续3天练习',         icon: '🔥' },
  { id: 'allSubjects', name: '全科冠军', desc: '数学+英语+语文三科各完成至少1次', icon: '🏆' },
  { id: 'pts1000',     name: '千分王',   desc: '累计积分达到1000',     icon: '👑' },
  { id: 'streak7',       name: '周周不断', desc: '连续7天练习',             icon: '🔥' },
  { id: 'recite5',       name: '朗朗上口', desc: '完成5篇课文背诵',         icon: '📖' },
  { id: 'chnAllLevels',  name: '语文达人', desc: '语文闯关全部通过',         icon: '🏅' },
  { id: 'math1000',      name: '千题王',   desc: '累计完成1000道数学题',     icon: '👑' },
  { id: 'perfect10',     name: '十全十美', desc: '全对10次（10题以上练习）',  icon: '💯' },
  { id: 'challenge100',  name: '挑战大师', desc: '挑战模式得100分以上',      icon: '⚡' },
  { id: 'adventureClear',name: '闯关英雄', desc: '闯关模式全部通过',         icon: '🗺️' },
  { id: 'masterAll',     name: '错题克星', desc: '所有错题标记为已掌握',      icon: '✅' },
];

/** Math-related subject keys (includes 口算竞速); used for achievements and totals */
export const MATH_KEYS = [
  'mulForward', 'mulBlank', 'add', 'subtract', 'divide', 'divRem', 'divReverse',
  'addTwo', 'subtractTwo', 'mulReverse', 'compare', 'wordProblem', 'pattern',
  'speed', 'multiply',
];

export function checkNewAchievements({
  user, history, record, streak, unlocked,
  adventureProgress, challengeHighScore, masteredErrorCount, totalErrorCount,
}) {
  const fresh = [];
  const has = (id) => unlocked[id];

  if (!has('first'))       fresh.push('first');
  if (!has('perfect')     && record.correct === record.total) fresh.push('perfect');
  if (!has('speed')       && record.total >= 20 && record.elapsed <= 60) fresh.push('speed');
  if (!has('streak3')     && streak.count >= 3) fresh.push('streak3');
  if (!has('allSubjects')) {
    const allSubs = history.map((h) => h.subject).concat(record.subject);
    const hasMath = allSubs.some((s) => MATH_KEYS.includes(s));
    const hasEng = allSubs.some((s) => s && !s.startsWith('chn_') && !MATH_KEYS.includes(s) && s !== 'review');
    const hasChn = allSubs.some((s) => s && s.startsWith('chn_'));
    if (hasMath && hasEng && hasChn) fresh.push('allSubjects');
  }
  if (!has('pts1000') && user.totalPoints >= 1000) fresh.push('pts1000');

  if (!has('streak7') && streak.count >= 7) fresh.push('streak7');

  if (!has('math1000')) {
    const mathTotal = history.filter((h) => MATH_KEYS.includes(h.subject)).reduce((sum, h) => sum + (h.total || 0), 0);
    if (mathTotal >= 1000) fresh.push('math1000');
  }

  if (!has('perfect10')) {
    const perfectCount = history.filter((h) => h.correct === h.total && h.total >= 10).length;
    if (perfectCount >= 10) fresh.push('perfect10');
  }

  if (!has('challenge100') && (challengeHighScore ?? 0) >= 100) fresh.push('challenge100');

  if (!has('adventureClear') && adventureProgress) {
    const cleared = Object.values(adventureProgress).filter((s) => s >= 1).length;
    if (cleared >= 10) fresh.push('adventureClear');
  }

  if (!has('masterAll') && (totalErrorCount ?? 0) > 0 && (masteredErrorCount ?? 0) >= (totalErrorCount ?? 0)) {
    fresh.push('masterAll');
  }

  return fresh;
}

export function updateStreak(current) {
  const today = new Date().toISOString().split('T')[0];
  if (current.lastDate === today) return current;
  if (current.lastDate) {
    const diff = Math.round(
      (new Date(today) - new Date(current.lastDate)) / 86400000,
    );
    if (diff === 1) return { count: current.count + 1, lastDate: today };
  }
  return { count: 1, lastDate: today };
}

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
