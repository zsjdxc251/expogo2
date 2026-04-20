const ADVENTURE_LEVELS = [
  { id: 1, title: '初出茅庐', desc: '简单加法热身', subject: 'add', difficulty: 'easy', count: 5, passRate: 60, stars: [60, 80, 100] },
  { id: 2, title: '小试牛刀', desc: '减法练习', subject: 'subtract', difficulty: 'easy', count: 5, passRate: 60, stars: [60, 80, 100] },
  { id: 3, title: '乘法入门', desc: '顺着背乘法', subject: 'mulForward', difficulty: 'easy', count: 8, passRate: 70, stars: [70, 85, 100] },
  { id: 4, title: '挖空挑战', desc: '挖空背乘法', subject: 'mulBlank', difficulty: 'easy', count: 8, passRate: 70, stars: [70, 85, 100] },
  { id: 5, title: '除法初探', desc: '整除计算', subject: 'divide', difficulty: 'normal', count: 8, passRate: 70, stars: [70, 85, 100] },
  { id: 6, title: '进阶加减', desc: '两位数加法', subject: 'addTwo', difficulty: 'normal', count: 10, passRate: 70, stars: [70, 85, 100] },
  { id: 7, title: '余数大师', desc: '余数除法', subject: 'divRem', difficulty: 'normal', count: 10, passRate: 75, stars: [75, 90, 100] },
  { id: 8, title: '应用达人', desc: '数学应用题', subject: 'wordProblem', difficulty: 'normal', count: 10, passRate: 70, stars: [70, 85, 100] },
  { id: 9, title: '规律探索', desc: '找规律', subject: 'pattern', difficulty: 'hard', count: 10, passRate: 75, stars: [75, 90, 100] },
  { id: 10, title: '终极挑战', desc: '混合难题', subject: 'mulForward', difficulty: 'hard', count: 15, passRate: 80, stars: [80, 90, 100] },
];

export default ADVENTURE_LEVELS;

export function getStarCount(accuracy, stars) {
  if (accuracy >= stars[2]) return 3;
  if (accuracy >= stars[1]) return 2;
  if (accuracy >= stars[0]) return 1;
  return 0;
}
