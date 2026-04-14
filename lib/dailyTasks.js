import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@daily_tasks';
const REWARD_PER_TASK = 20;

const TASK_TEMPLATES = [
  { type: 'math', text: '完成 10 道数学题', target: 10, subjectMatch: (s) => ['mulForward','mulBlank','add','subtract','divide','divRem','divReverse'].includes(s) },
  { type: 'math', text: '完成 5 道加法题', target: 5, subjectMatch: (s) => s === 'add' },
  { type: 'math', text: '完成 5 道乘法题', target: 5, subjectMatch: (s) => s === 'mulForward' || s === 'mulBlank' },
  { type: 'math', text: '完成 5 道除法题', target: 5, subjectMatch: (s) => s === 'divide' || s === 'divRem' || s === 'divReverse' },
  { type: 'eng', text: '学习 1 个英语知识点', target: 1, subjectMatch: (s) => s && !s.startsWith('chn_') && !['mulForward','mulBlank','add','subtract','divide','divRem','divReverse','speed','review'].includes(s) },
  { type: 'eng', text: '完成 5 道英语题', target: 5, subjectMatch: (s) => s && !s.startsWith('chn_') && !['mulForward','mulBlank','add','subtract','divide','divRem','divReverse','speed','review'].includes(s) },
  { type: 'chn', text: '学习 1 个语文知识点', target: 1, subjectMatch: (s) => s && s.startsWith('chn_') },
  { type: 'chn', text: '完成 5 道语文题', target: 5, subjectMatch: (s) => s && s.startsWith('chn_') },
  { type: 'speed', text: '完成 1 次口算竞速', target: 1, subjectMatch: (s) => s === 'speed' },
  { type: 'dictation', text: '完成 1 次听写练习', target: 1, subjectMatch: (s) => s === 'dictation_eng' || s === 'dictation_chn' },
];

function pickTasks(count = 4) {
  const shuffled = [...TASK_TEMPLATES].sort(() => Math.random() - 0.5);
  const types = new Set();
  const picked = [];
  for (const t of shuffled) {
    if (picked.length >= count) break;
    if (!types.has(t.type) || picked.length < count) {
      types.add(t.type);
      picked.push({ ...t, id: `${t.type}_${Math.random().toString(36).slice(2, 6)}`, progress: 0, completed: false });
    }
  }
  return picked;
}

export async function loadDailyTasks() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const today = new Date().toISOString().split('T')[0];
      if (data.date === today) return data.tasks;
    }
  } catch {}
  const tasks = pickTasks(4);
  await saveDailyTasks(tasks);
  return tasks;
}

export async function saveDailyTasks(tasks) {
  const today = new Date().toISOString().split('T')[0];
  await AsyncStorage.setItem(KEY, JSON.stringify({ date: today, tasks }));
}

export function updateTaskProgress(tasks, record) {
  if (!record || !record.subject) return tasks;
  return tasks.map((task) => {
    if (task.completed) return task;
    if (task.subjectMatch(record.subject)) {
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
