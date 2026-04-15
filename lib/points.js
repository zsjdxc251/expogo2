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

export function calcPoints({ total, correct, perCorrect = 5, perfectBonus = 10 }) {
  let pts = correct * perCorrect;
  if (correct === total && total > 0) pts += perfectBonus;
  return pts;
}

export const ACH_DEFS = [
  { id: 'first',       name: '首次出征', desc: '完成第一次练习',       icon: '🎯' },
  { id: 'perfect',     name: '完美通关', desc: '任一次练习全对',       icon: '⭐' },
  { id: 'speed',       name: '闪电侠',   desc: '20题60秒内完成',      icon: '⚡' },
  { id: 'streak3',     name: '坚持不懈', desc: '连续3天练习',         icon: '🔥' },
  { id: 'allSubjects', name: '全科冠军', desc: '数学+英语+语文三科各完成至少1次', icon: '🏆' },
  { id: 'pts1000',     name: '千分王',   desc: '累计积分达到1000',     icon: '👑' },
];

export function checkNewAchievements({ user, history, record, streak, unlocked }) {
  const fresh = [];
  const has = (id) => unlocked[id];

  if (!has('first'))       fresh.push('first');
  if (!has('perfect')     && record.correct === record.total) fresh.push('perfect');
  if (!has('speed')       && record.total >= 20 && record.elapsed <= 60) fresh.push('speed');
  if (!has('streak3')     && streak.count >= 3) fresh.push('streak3');
  if (!has('allSubjects')) {
    const MATH_KEYS = ['mulForward','mulBlank','add','subtract','divide','divRem','divReverse','speed'];
    const allSubs = history.map((h) => h.subject).concat(record.subject);
    const hasMath = allSubs.some((s) => MATH_KEYS.includes(s));
    const hasEng = allSubs.some((s) => s && !s.startsWith('chn_') && !MATH_KEYS.includes(s) && s !== 'review');
    const hasChn = allSubs.some((s) => s && s.startsWith('chn_'));
    if (hasMath && hasEng && hasChn) fresh.push('allSubjects');
  }
  if (!has('pts1000') && user.totalPoints >= 1000) fresh.push('pts1000');

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
