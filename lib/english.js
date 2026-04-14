import { shuffle as arrayShuffle } from './questions';
import { TOPICS_L1, LEARN_L1, QUESTIONS_L1 } from './eng-level1';
import { TOPICS_L2, LEARN_L2, QUESTIONS_L2 } from './eng-level2';
import { TOPICS_L3, LEARN_L3, QUESTIONS_L3 } from './eng-level3';

export const ENG_LEVELS = [
  { key: 'beginner',     label: '初级',   badge: '🌱', color: '#7BAE8E', desc: '二年级基础' },
  { key: 'intermediate', label: '中级',   badge: '🌿', color: '#EB9F4A', desc: '进阶提升' },
  { key: 'advanced',     label: '高级',   badge: '🌳', color: '#D4839A', desc: '高阶挑战' },
];

const ALL_TOPICS  = { ...TOPICS_L1, ...TOPICS_L2, ...TOPICS_L3 };
const ALL_LEARN   = { ...LEARN_L1, ...LEARN_L2, ...LEARN_L3 };
const ALL_QUESTIONS = { ...QUESTIONS_L1, ...QUESTIONS_L2, ...QUESTIONS_L3 };

export const LEVEL_TOPIC_KEYS = {
  beginner:     Object.keys(TOPICS_L1),
  intermediate: Object.keys(TOPICS_L2),
  advanced:     Object.keys(TOPICS_L3),
};

export const ENG_TOPICS = ALL_TOPICS;
export const ENG_TOPIC_KEYS = Object.keys(ALL_TOPICS);
export const LEARN_CARDS = ALL_LEARN;

export function generateEngQuestions(topicKey, count) {
  const bank = ALL_QUESTIONS[topicKey];
  if (!bank) return [];
  const topic = ALL_TOPICS[topicKey];
  const pool = bank.map((q, i) => ({
    ...q,
    op: topic ? topic.key : topicKey,
    id: `${topicKey}_${i}`,
  }));
  return arrayShuffle(pool).slice(0, Math.min(count, pool.length));
}

export function getEngMaxQuestions(topicKey) {
  return ALL_QUESTIONS[topicKey]?.length || 0;
}
