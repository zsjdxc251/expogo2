import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@daily_tasks';
const REWARD_PER_TASK = 20;

const MATH_SUBS = ['mulForward','mulBlank','add','subtract','divide','divRem','divReverse','addTwo','subtractTwo','mulReverse','compare','wordProblem','pattern'];

const MATCHERS = {
  math_all:   (s) => MATH_SUBS.includes(s),
  math_add:   (s) => s === 'add',
  math_mul:   (s) => s === 'mulForward' || s === 'mulBlank',
  math_div:   (s) => s === 'divide' || s === 'divRem' || s === 'divReverse',
  eng_learn:  (s) => s && !s.startsWith('chn_') && !MATH_SUBS.includes(s) && s !== 'speed' && s !== 'review',
  eng_quiz:   (s) => s && !s.startsWith('chn_') && !MATH_SUBS.includes(s) && s !== 'speed' && s !== 'review',
  chn_learn:  (s) => s && s.startsWith('chn_'),
  chn_quiz:   (s) => s && s.startsWith('chn_'),
  speed:      (s) => s === 'speed',
  dictation:  (s) => s === 'dictation_eng' || s === 'dictation_chn',
};

const TASK_TEMPLATES = [
  { tpl: 'math_all',  type: 'math',      text: '完成 10 道数学题',      target: 10 },
  { tpl: 'math_add',  type: 'math',      text: '完成 5 道加法题',       target: 5 },
  { tpl: 'math_mul',  type: 'math',      text: '完成 5 道乘法题',       target: 5 },
  { tpl: 'math_div',  type: 'math',      text: '完成 5 道除法题',       target: 5 },
  { tpl: 'eng_learn', type: 'eng',       text: '学习 1 个英语知识点',   target: 1 },
  { tpl: 'eng_quiz',  type: 'eng',       text: '完成 5 道英语题',       target: 5 },
  { tpl: 'chn_learn', type: 'chn',       text: '学习 1 个语文知识点',   target: 1 },
  { tpl: 'chn_quiz',  type: 'chn',       text: '完成 5 道语文题',       target: 5 },
  { tpl: 'speed',     type: 'speed',     text: '完成 1 次口算竞速',     target: 1 },
  { tpl: 'dictation', type: 'dictation', text: '完成 1 次听写练习',     target: 1 },
];

function pickTasks(count = 4) {
  const shuffled = [...TASK_TEMPLATES].sort(() => Math.random() - 0.5);
  const types = new Set();
  const picked = [];
  for (const t of shuffled) {
    if (picked.length >= count) break;
    if (!types.has(t.type) || picked.length < count) {
      types.add(t.type);
      picked.push({
        tpl: t.tpl, type: t.type, text: t.text, target: t.target,
        id: `${t.type}_${Math.random().toString(36).slice(2, 6)}`,
        progress: 0, completed: false,
      });
    }
  }
  return picked;
}

function pickFromConfig(taskConfig) {
  if (!taskConfig?.enabled || !taskConfig.tasks?.length) return null;
  return taskConfig.tasks.map((t) => ({
    tpl: t.subject,
    type: 'math',
    text: `完成 ${t.count} 道${t.label}`,
    target: t.count,
    id: `cfg_${t.subject}_${Math.random().toString(36).slice(2, 6)}`,
    progress: 0,
    completed: false,
  }));
}

function configFingerprint(taskConfig) {
  if (!taskConfig?.enabled || !taskConfig.tasks?.length) return '';
  return taskConfig.tasks.map((t) => `${t.subject}:${t.count}`).sort().join('|');
}

function cachedFingerprint(tasks) {
  return tasks
    .filter((t) => t.id?.startsWith('cfg_'))
    .map((t) => `${t.tpl}:${t.target}`)
    .sort()
    .join('|');
}

export async function loadDailyTasks(taskConfig) {
  const today = new Date().toISOString().split('T')[0];
  const isConfigEnabled = taskConfig?.enabled && taskConfig.tasks?.length > 0;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.date === today) {
        const isCachedFromConfig = data.tasks.some((t) => t.id?.startsWith('cfg_'));
        if (isConfigEnabled && !isCachedFromConfig) {
          const tasks = pickFromConfig(taskConfig);
          await saveDailyTasks(tasks);
          return tasks;
        }
        if (!isConfigEnabled && isCachedFromConfig) {
          const tasks = pickTasks(4);
          await saveDailyTasks(tasks);
          return tasks;
        }
        if (isConfigEnabled && isCachedFromConfig) {
          const cfgFp = configFingerprint(taskConfig);
          const cacheFp = cachedFingerprint(data.tasks);
          if (cfgFp !== cacheFp) {
            const tasks = pickFromConfig(taskConfig);
            await saveDailyTasks(tasks);
            return tasks;
          }
        }
        return data.tasks;
      }
    }
  } catch {}
  const tasks = pickFromConfig(taskConfig) || pickTasks(4);
  await saveDailyTasks(tasks);
  return tasks;
}

export function rebuildTasks(taskConfig) {
  return pickFromConfig(taskConfig) || pickTasks(4);
}

export { MATCHERS };

export async function saveDailyTasks(tasks) {
  const today = new Date().toISOString().split('T')[0];
  await AsyncStorage.setItem(KEY, JSON.stringify({ date: today, tasks }));
}

export function updateTaskProgress(tasks, record) {
  if (!record || !record.subject) return tasks;
  return tasks.map((task) => {
    if (task.completed) return task;
    const matcher = MATCHERS[task.tpl];
    const matched = matcher
      ? matcher(record.subject)
      : task.tpl === record.subject;
    if (matched) {
      const newProg = task.progress + (record.total || 1);
      const done = newProg >= task.target;
      return { ...task, progress: newProg, completed: done };
    }
    return task;
  });
}

export function getTaskReward(tasks) {
  return tasks.filter((t) => t.completed).length * REWARD_PER_TASK;
}

export function getCompletedCount(tasks) {
  return tasks.filter((t) => t.completed).length;
}

export { REWARD_PER_TASK };
