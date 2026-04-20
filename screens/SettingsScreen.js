import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Switch, TextInput, ScrollView, StyleSheet, Alert, Platform, Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C, AVATARS, RADIUS, SUBJECTS, DIFFICULTIES } from '../lib/theme';
import { useApp } from '../lib/AppContext';
import { useTheme } from '../lib/ThemeContext';

const MATH_VIS_KEYS = [
  'mulForward','mulBlank','add','subtract','divide','divRem','divReverse',
  'addTwo','subtractTwo','mulReverse','compare','wordProblem','pattern',
];

const TASK_SUBJECTS = [
  { key: 'mulForward', label: '顺着背' },
  { key: 'mulBlank', label: '挖空背' },
  { key: 'divide', label: '整除计算' },
  { key: 'divRem', label: '余数除法' },
  { key: 'divReverse', label: '反推除法' },
  { key: 'add', label: '加法练习' },
  { key: 'subtract', label: '减法练习' },
  { key: 'addTwo', label: '两位数加法' },
  { key: 'subtractTwo', label: '两位数减法' },
];

const POINT_REASONS = [
  { key: 'redeem', label: '兑现奖励', icon: '🎁', type: 'subtract' },
  { key: 'chores', label: '做家务', icon: '🧹', type: 'add' },
  { key: 'reading', label: '课外阅读', icon: '📚', type: 'add' },
  { key: 'behavior', label: '表现优秀', icon: '⭐', type: 'add' },
  { key: 'penalty', label: '违规扣分', icon: '⚠️', type: 'subtract' },
  { key: 'other', label: '其他', icon: '📝', type: 'both' },
];

function showConfirm(title, msg, onOk) {
  if (Platform.OS === 'web') {
    if (confirm(`${title}\n${msg}`)) onOk();
  } else {
    Alert.alert(title, msg, [
      { text: '取消', style: 'cancel' },
      { text: '确定', style: 'destructive', onPress: onOk },
    ]);
  }
}

export default function SettingsScreen() {
  const nav = useNavigation();
  const { isDark, toggleTheme } = useTheme();
  const { user, settings, rewardConfig, visibility, updateUser: onUpdate, resetAll, requestPin, adjustPoints, pointsLog, dailyTasks } = useApp();
  const onClear = resetAll;
  const onChangePin = useCallback(() => requestPin('setup'), [requestPin]);
  const [editing, setEditing] = useState(null);
  const [tmpName, setTmpName] = useState(user?.name || '');
  const [tmpAvatar, setTmpAvatar] = useState(user?.avatar || '');
  const [mathExpanded, setMathExpanded] = useState(false);

  // Task config state
  const tc = user?.taskConfig || { enabled: false, tasks: [] };
  const [taskExpanded, setTaskExpanded] = useState(false);
  const [addTaskSubject, setAddTaskSubject] = useState(null);
  const [addTaskCount, setAddTaskCount] = useState(10);

  // Points modal state
  const [showPtModal, setShowPtModal] = useState(false);
  const [ptType, setPtType] = useState('add');
  const [ptAmount, setPtAmount] = useState('');
  const [ptReason, setPtReason] = useState('');
  const [ptNote, setPtNote] = useState('');
  const [showPtLog, setShowPtLog] = useState(false);

  const breakConfig = user?.breakConfig || { usageMinutes: 20, breakMinutes: 5 };
  const rc = rewardConfig || { perCorrect: 5, perfectBonus: 10 };
  const vis = visibility || {};

  const updateReward = (patch) => {
    onUpdate({ rewardConfig: { ...rc, ...patch } });
  };

  const toggleVis = (key, val) => {
    onUpdate({ visibility: { ...vis, [key]: val } });
  };

  const allowedDiffs = vis.allowedDifficulties || ['easy', 'normal', 'hard'];
  const toggleDiff = (key) => {
    const next = allowedDiffs.includes(key)
      ? allowedDiffs.filter((d) => d !== key)
      : [...allowedDiffs, key];
    if (next.length === 0) return;
    onUpdate({ visibility: { ...vis, allowedDifficulties: next } });
  };

  const saveName = () => {
    if (tmpName.trim()) {
      onUpdate({ name: tmpName.trim() });
      setEditing(null);
    }
  };

  const saveAvatar = (a) => {
    setTmpAvatar(a);
    onUpdate({ avatar: a });
    setEditing(null);
  };

  const updateBreakConfig = (patch) => {
    onUpdate({ breakConfig: { ...breakConfig, ...patch } });
  };

  const toggleTaskEnabled = (v) => {
    onUpdate({ taskConfig: { ...tc, enabled: v } });
  };
  const addTask = () => {
    if (!addTaskSubject) return;
    const label = TASK_SUBJECTS.find((s) => s.key === addTaskSubject)?.label || addTaskSubject;
    const newTasks = [...tc.tasks, { subject: addTaskSubject, count: addTaskCount, label }];
    onUpdate({ taskConfig: { ...tc, tasks: newTasks } });
    setAddTaskSubject(null);
    setAddTaskCount(10);
  };
  const removeTask = (idx) => {
    const newTasks = tc.tasks.filter((_, i) => i !== idx);
    onUpdate({ taskConfig: { ...tc, tasks: newTasks } });
  };

  const openPtModal = (type) => {
    setPtType(type);
    setPtAmount('');
    setPtReason('');
    setPtNote('');
    setShowPtModal(true);
  };
  const submitPtAdjust = () => {
    const amt = parseInt(ptAmount, 10);
    if (!amt || amt <= 0 || !ptReason) return;
    const label = POINT_REASONS.find((r) => r.key === ptReason)?.label || ptReason;
    adjustPoints(ptType, amt, label, ptNote);
    setShowPtModal(false);
  };

  return (
    <ScrollView style={st.root} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      <Text style={st.title}>家长设置</Text>
      <Text style={st.subtitle}>仅家长可访问此页面</Text>

      <Text style={st.secLabel}>外观设置</Text>
      <View style={st.card}>
        <View style={st.row}>
          <View style={{ flex: 1 }}>
            <Text style={st.rowTitle}>🌙 深色模式</Text>
            <Text style={st.rowDesc}>开启后使用深色主题</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ true: C.primary, false: C.border }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Basic Settings */}
      <Text style={st.secLabel}>基本设置</Text>
      <View style={st.card}>
        <View style={st.row}>
          <View style={{ flex: 1 }}>
            <Text style={st.rowTitle}>自动提交</Text>
            <Text style={st.rowDesc}>输入数字后自动提交答案</Text>
          </View>
          <Switch
            value={settings.autoSubmit}
            onValueChange={(v) => onUpdate({ settings: { ...settings, autoSubmit: v } })}
            trackColor={{ true: C.primary, false: C.border }}
            thumbColor="#fff"
          />
        </View>
        <View style={st.divider} />

        {editing === 'name' ? (
          <View style={st.editBox}>
            <TextInput
              style={st.editInput}
              value={tmpName}
              onChangeText={(t) => setTmpName(t.slice(0, 8))}
              maxLength={8}
              autoFocus
            />
            <TouchableOpacity style={st.editBtn} onPress={saveName}>
              <Text style={st.editBtnTxt}>保存</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditing(null)}>
              <Text style={st.cancelTxt}>取消</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={st.row} onPress={() => { setTmpName(user.name); setEditing('name'); }}>
            <View style={{ flex: 1 }}>
              <Text style={st.rowTitle}>修改昵称</Text>
              <Text style={st.rowDesc}>{user.name}</Text>
            </View>
            <Text style={st.arrow}>→</Text>
          </TouchableOpacity>
        )}
        <View style={st.divider} />

        {editing === 'avatar' ? (
          <View style={st.avatarBox}>
            <Text style={st.rowTitle}>选择头像</Text>
            <View style={st.avatarGrid}>
              {AVATARS.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[st.avatarBtn, tmpAvatar === a && st.avatarOn]}
                  onPress={() => saveAvatar(a)}
                >
                  <Text style={st.avatarTxt}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <TouchableOpacity style={st.row} onPress={() => setEditing('avatar')}>
            <View style={{ flex: 1 }}>
              <Text style={st.rowTitle}>修改头像</Text>
              <Text style={st.rowDesc}>{user.avatar}</Text>
            </View>
            <Text style={st.arrow}>→</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Break Timer Settings */}
      <Text style={st.secLabel}>休息提醒</Text>
      <View style={st.card}>
        <View style={st.row}>
          <View style={{ flex: 1 }}>
            <Text style={st.rowTitle}>使用时长</Text>
            <Text style={st.rowDesc}>连续使用多久后提醒休息</Text>
          </View>
          <View style={st.stepper}>
            <TouchableOpacity
              style={st.stepBtn}
              onPress={() => updateBreakConfig({ usageMinutes: Math.max(5, breakConfig.usageMinutes - 5) })}
            >
              <Text style={st.stepTxt}>−</Text>
            </TouchableOpacity>
            <Text style={st.stepVal}>{breakConfig.usageMinutes}分钟</Text>
            <TouchableOpacity
              style={st.stepBtn}
              onPress={() => updateBreakConfig({ usageMinutes: Math.min(60, breakConfig.usageMinutes + 5) })}
            >
              <Text style={st.stepTxt}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={st.divider} />
        <View style={st.row}>
          <View style={{ flex: 1 }}>
            <Text style={st.rowTitle}>休息时长</Text>
            <Text style={st.rowDesc}>强制休息多少分钟</Text>
          </View>
          <View style={st.stepper}>
            <TouchableOpacity
              style={st.stepBtn}
              onPress={() => updateBreakConfig({ breakMinutes: Math.max(1, breakConfig.breakMinutes - 1) })}
            >
              <Text style={st.stepTxt}>−</Text>
            </TouchableOpacity>
            <Text style={st.stepVal}>{breakConfig.breakMinutes}分钟</Text>
            <TouchableOpacity
              style={st.stepBtn}
              onPress={() => updateBreakConfig({ breakMinutes: Math.min(15, breakConfig.breakMinutes + 1) })}
            >
              <Text style={st.stepTxt}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Reward Settings */}
      <Text style={st.secLabel}>积分设置</Text>
      <View style={st.card}>
        <View style={st.row}>
          <View style={{ flex: 1 }}>
            <Text style={st.rowTitle}>每题正确积分</Text>
            <Text style={st.rowDesc}>答对一题获得的积分</Text>
          </View>
          <View style={st.stepper}>
            <TouchableOpacity style={st.stepBtn} onPress={() => updateReward({ perCorrect: Math.max(1, rc.perCorrect - 1) })}>
              <Text style={st.stepTxt}>−</Text>
            </TouchableOpacity>
            <Text style={st.stepVal}>{rc.perCorrect}分</Text>
            <TouchableOpacity style={st.stepBtn} onPress={() => updateReward({ perCorrect: Math.min(50, rc.perCorrect + 1) })}>
              <Text style={st.stepTxt}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={st.divider} />
        <View style={st.row}>
          <View style={{ flex: 1 }}>
            <Text style={st.rowTitle}>全对额外奖励</Text>
            <Text style={st.rowDesc}>一次练习全部答对的额外积分</Text>
          </View>
          <View style={st.stepper}>
            <TouchableOpacity style={st.stepBtn} onPress={() => updateReward({ perfectBonus: Math.max(0, rc.perfectBonus - 5) })}>
              <Text style={st.stepTxt}>−</Text>
            </TouchableOpacity>
            <Text style={st.stepVal}>{rc.perfectBonus}分</Text>
            <TouchableOpacity style={st.stepBtn} onPress={() => updateReward({ perfectBonus: Math.min(200, rc.perfectBonus + 5) })}>
              <Text style={st.stepTxt}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={st.divider} />
        <View style={st.row}>
          <View style={{ flex: 1 }}>
            <Text style={st.rowTitle}>任务完成奖励</Text>
            <Text style={st.rowDesc}>每完成一个每日任务的积分</Text>
          </View>
          <View style={st.stepper}>
            <TouchableOpacity style={st.stepBtn} onPress={() => updateReward({ taskReward: Math.max(1, (rc.taskReward || 10) - 1) })}>
              <Text style={st.stepTxt}>−</Text>
            </TouchableOpacity>
            <Text style={st.stepVal}>{rc.taskReward || 10}分</Text>
            <TouchableOpacity style={st.stepBtn} onPress={() => updateReward({ taskReward: Math.min(100, (rc.taskReward || 10) + 1) })}>
              <Text style={st.stepTxt}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Difficulty Permissions */}
      <Text style={st.secLabel}>难度权限</Text>
      <View style={st.card}>
        <View style={st.row}>
          <Text style={[st.rowDesc, { flex: 1 }]}>选择允许的难度等级（至少保留一个）</Text>
        </View>
        {Object.values(DIFFICULTIES).map((d) => (
          <View key={d.key}>
            <View style={st.divider} />
            <View style={st.row}>
              <View style={{ flex: 1 }}>
                <Text style={st.rowTitle}>{d.label}</Text>
                <Text style={st.rowDesc}>数字范围 {d.range[0]}~{d.range[1]}</Text>
              </View>
              <Switch
                value={allowedDiffs.includes(d.key)}
                onValueChange={() => toggleDiff(d.key)}
                trackColor={{ true: d.color, false: C.border }}
                thumbColor="#fff"
              />
            </View>
          </View>
        ))}
      </View>

      {/* Visibility / Permissions */}
      <Text style={st.secLabel}>科目权限</Text>
      <View style={st.card}>
        <View style={st.row}>
          <View style={{ flex: 1 }}>
            <Text style={st.rowTitle}>📐 数学</Text>
          </View>
          <Switch
            value={vis.math !== false}
            onValueChange={(v) => toggleVis('math', v)}
            trackColor={{ true: C.primary, false: C.border }}
            thumbColor="#fff"
          />
        </View>
        {vis.math !== false && (
          <>
            <View style={st.divider} />
            <TouchableOpacity style={st.row} onPress={() => setMathExpanded(!mathExpanded)}>
              <Text style={[st.rowDesc, { flex: 1 }]}>
                {mathExpanded ? '收起题型设置 ▲' : '展开题型设置 ▼'}
              </Text>
            </TouchableOpacity>
            {mathExpanded && MATH_VIS_KEYS.map((k) => {
              const sub = SUBJECTS[k];
              if (!sub) return null;
              return (
                <View key={k}>
                  <View style={st.divider} />
                  <View style={st.subRow}>
                    <Text style={st.subLabel}>{sub.icon} {sub.label}</Text>
                    <Switch
                      value={vis[`math_${k}`] !== false}
                      onValueChange={(v) => toggleVis(`math_${k}`, v)}
                      trackColor={{ true: C.primary, false: C.border }}
                      thumbColor="#fff"
                    />
                  </View>
                </View>
              );
            })}
            {mathExpanded && (
              <View>
                <View style={st.divider} />
                <View style={st.subRow}>
                  <Text style={st.subLabel}>⚡ 口算竞速</Text>
                  <Switch
                    value={vis.math_speed !== false}
                    onValueChange={(v) => toggleVis('math_speed', v)}
                    trackColor={{ true: C.primary, false: C.border }}
                    thumbColor="#fff"
                  />
                </View>
              </View>
            )}
          </>
        )}
        <View style={st.divider} />
        <View style={st.row}>
          <View style={{ flex: 1 }}>
            <Text style={st.rowTitle}>📖 英语</Text>
          </View>
          <Switch
            value={vis.english !== false}
            onValueChange={(v) => toggleVis('english', v)}
            trackColor={{ true: C.primary, false: C.border }}
            thumbColor="#fff"
          />
        </View>
        <View style={st.divider} />
        <View style={st.row}>
          <View style={{ flex: 1 }}>
            <Text style={st.rowTitle}>📝 语文</Text>
          </View>
          <Switch
            value={vis.chinese !== false}
            onValueChange={(v) => toggleVis('chinese', v)}
            trackColor={{ true: C.primary, false: C.border }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Task Config */}
      <Text style={st.secLabel}>每日任务配置</Text>
      <View style={st.card}>
        <View style={st.row}>
          <View style={{ flex: 1 }}>
            <Text style={st.rowTitle}>强制每日任务</Text>
            <Text style={st.rowDesc}>开启后，孩子必须完成任务才能自由练习</Text>
          </View>
          <Switch
            value={tc.enabled}
            onValueChange={toggleTaskEnabled}
            trackColor={{ true: C.primary, false: C.border }}
            thumbColor="#fff"
          />
        </View>

        {tc.tasks.length > 0 && (
          <>
            <View style={st.divider} />
            <View style={{ padding: 14 }}>
              <Text style={[st.rowDesc, { marginBottom: 8 }]}>已配置任务:</Text>
              {tc.tasks.map((t, i) => (
                <View key={i} style={st.taskRow}>
                  <Text style={st.taskLabel}>{t.label}</Text>
                  <Text style={st.taskCount}>{t.count}题/天</Text>
                  <TouchableOpacity onPress={() => removeTask(i)}>
                    <Text style={st.taskDel}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={st.divider} />
        <TouchableOpacity style={st.row} onPress={() => setTaskExpanded(!taskExpanded)}>
          <Text style={[st.rowDesc, { flex: 1 }]}>
            {taskExpanded ? '收起添加任务 ▲' : '添加任务 ▼'}
          </Text>
        </TouchableOpacity>

        {taskExpanded && (
          <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
            <Text style={[st.rowDesc, { marginBottom: 8 }]}>选择科目:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {TASK_SUBJECTS.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[st.taskChip, addTaskSubject === s.key && st.taskChipOn]}
                  onPress={() => setAddTaskSubject(s.key)}
                >
                  <Text style={[st.taskChipTxt, addTaskSubject === s.key && { color: '#fff' }]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[st.rowDesc, { marginTop: 10, marginBottom: 6 }]}>每天题数:</Text>
            <View style={st.stepper}>
              <TouchableOpacity style={st.stepBtn} onPress={() => setAddTaskCount((c) => Math.max(5, c - 5))}>
                <Text style={st.stepTxt}>−</Text>
              </TouchableOpacity>
              <Text style={st.stepVal}>{addTaskCount}题</Text>
              <TouchableOpacity style={st.stepBtn} onPress={() => setAddTaskCount((c) => Math.min(50, c + 5))}>
                <Text style={st.stepTxt}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[st.addTaskBtn, !addTaskSubject && { opacity: 0.4 }]}
              disabled={!addTaskSubject}
              onPress={addTask}
            >
              <Text style={st.addTaskBtnTxt}>+ 添加此任务</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Points Management */}
      <Text style={st.secLabel}>积分管理</Text>
      <View style={st.card}>
        <View style={st.row}>
          <View style={{ flex: 1 }}>
            <Text style={st.rowTitle}>当前积分</Text>
            <Text style={[st.rowDesc, { fontSize: 20, fontWeight: '800', color: C.accent }]}>{user?.totalPoints || 0}</Text>
          </View>
        </View>
        <View style={st.divider} />
        <View style={[st.row, { justifyContent: 'space-around' }]}>
          <TouchableOpacity style={st.ptBtn} onPress={() => openPtModal('add')}>
            <Text style={st.ptBtnTxt}>+ 增加积分</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.ptBtn, st.ptBtnSub]} onPress={() => openPtModal('subtract')}>
            <Text style={[st.ptBtnTxt, { color: C.error }]}>- 减少积分</Text>
          </TouchableOpacity>
        </View>
        {pointsLog.length > 0 && (
          <>
            <View style={st.divider} />
            <TouchableOpacity style={st.row} onPress={() => setShowPtLog(!showPtLog)}>
              <Text style={[st.rowDesc, { flex: 1 }]}>
                {showPtLog ? '收起记录 ▲' : `查看记录 (${pointsLog.length}条) ▼`}
              </Text>
            </TouchableOpacity>
            {showPtLog && (
              <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
                {pointsLog.slice(0, 20).map((e) => (
                  <View key={e.id} style={st.ptLogRow}>
                    <Text style={[st.ptLogSign, { color: e.type === 'add' ? C.success : C.error }]}>
                      {e.type === 'add' ? '+' : '-'}{e.amount}
                    </Text>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={st.ptLogReason}>{e.reason}{e.note ? ` · ${e.note}` : ''}</Text>
                      <Text style={st.ptLogDate}>{new Date(e.date).toLocaleDateString('zh-CN')} 余额:{e.balance}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>

      {/* Points Adjust Modal */}
      <Modal visible={showPtModal} transparent animationType="fade">
        <View style={st.modalOverlay}>
          <View style={st.modalSheet}>
            <Text style={st.modalTitle}>{ptType === 'add' ? '增加积分' : '减少积分'}</Text>

            <Text style={[st.rowDesc, { marginBottom: 8 }]}>选择原因:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
              {POINT_REASONS.filter((r) => r.type === ptType || r.type === 'both').map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={[st.taskChip, ptReason === r.key && st.taskChipOn]}
                  onPress={() => setPtReason(r.key)}
                >
                  <Text style={[st.taskChipTxt, ptReason === r.key && { color: '#fff' }]}>{r.icon} {r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[st.rowDesc, { marginBottom: 6 }]}>积分数量:</Text>
            <TextInput
              style={st.ptInput}
              value={ptAmount}
              onChangeText={(t) => setPtAmount(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="输入数量"
              placeholderTextColor={C.textLight}
            />

            <Text style={[st.rowDesc, { marginBottom: 6, marginTop: 10 }]}>备注 (可选):</Text>
            <TextInput
              style={st.ptInput}
              value={ptNote}
              onChangeText={setPtNote}
              placeholder="备注说明..."
              placeholderTextColor={C.textLight}
              maxLength={30}
            />

            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <TouchableOpacity style={[st.modalBtn, { backgroundColor: C.border, flex: 1, marginRight: 8 }]} onPress={() => setShowPtModal(false)}>
                <Text style={[st.modalBtnTxt, { color: C.textMid }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.modalBtn, { backgroundColor: ptType === 'add' ? C.success : C.error, flex: 1 }]}
                onPress={submitPtAdjust}
              >
                <Text style={st.modalBtnTxt}>确认</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Danger Zone */}
      <Text style={st.secLabel}>管理</Text>
      <View style={st.card}>
        <TouchableOpacity
          style={st.row}
          onPress={() => showConfirm('重置积分', '确定要将积分重置为0吗?', () => onUpdate({ totalPoints: 0, level: 1 }))}
        >
          <View style={{ flex: 1 }}>
            <Text style={st.rowTitle}>重置积分</Text>
            <Text style={st.rowDesc}>将积分和等级清零，保留练习记录</Text>
          </View>
          <Text style={st.arrow}>→</Text>
        </TouchableOpacity>
        <View style={st.divider} />

        <TouchableOpacity style={st.row} onPress={onChangePin}>
          <View style={{ flex: 1 }}>
            <Text style={st.rowTitle}>修改家长密码</Text>
            <Text style={st.rowDesc}>重新设置4位数字密码</Text>
          </View>
          <Text style={st.arrow}>→</Text>
        </TouchableOpacity>
        <View style={st.divider} />

        <TouchableOpacity
          style={st.row}
          onPress={() => showConfirm('重置数据', '确定要清除所有数据吗? 此操作不可恢复。', onClear)}
        >
          <View style={{ flex: 1 }}>
            <Text style={[st.rowTitle, { color: C.error }]}>重置所有数据</Text>
            <Text style={st.rowDesc}>清除全部练习记录、积分和成就</Text>
          </View>
          <Text style={[st.arrow, { color: C.error }]}>→</Text>
        </TouchableOpacity>
      </View>

      <Text style={st.secLabel}>学习报告</Text>
      <View style={st.card}>
        <TouchableOpacity style={st.row} onPress={() => nav.navigate('Report')}>
          <View style={{ flex: 1 }}>
            <Text style={st.rowTitle}>📊 查看学习报告</Text>
            <Text style={st.rowDesc}>本周学习情况、科目分析、进步趋势</Text>
          </View>
          <Text style={st.arrow}>→</Text>
        </TouchableOpacity>
      </View>

      <Text style={st.ver}>学习乐园 v4.0</Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 2 },
  subtitle: { fontSize: 13, color: C.textMid, marginBottom: 16 },

  secLabel: { fontSize: 14, fontWeight: '700', color: C.textMid, marginBottom: 8, marginTop: 12 },

  card: { backgroundColor: C.card, borderRadius: RADIUS, overflow: 'hidden', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: C.text },
  rowDesc: { fontSize: 13, color: C.textLight, marginTop: 2 },
  arrow: { fontSize: 16, color: C.textLight, fontWeight: '600' },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 18 },

  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: C.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  stepTxt: { fontSize: 18, fontWeight: '700', color: C.primary },
  stepVal: { fontSize: 15, fontWeight: '700', color: C.text, marginHorizontal: 10, minWidth: 56, textAlign: 'center' },

  editBox: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  editInput: {
    flex: 1, height: 42, borderRadius: 10, backgroundColor: C.bg, paddingHorizontal: 12,
    fontSize: 16, fontWeight: '600', color: C.text, borderWidth: 1.5, borderColor: C.primary,
  },
  editBtn: {
    marginLeft: 8, height: 42, paddingHorizontal: 16, borderRadius: 10,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  editBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cancelTxt: { marginLeft: 10, color: C.textMid, fontWeight: '600', fontSize: 14 },

  avatarBox: { padding: 14 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  avatarBtn: {
    width: 52, height: 52, borderRadius: 26, margin: 4,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.bg, borderWidth: 2.5, borderColor: 'transparent',
  },
  avatarOn: { borderColor: C.primary, backgroundColor: C.primaryBg },
  avatarTxt: { fontSize: 26 },

  subRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, paddingLeft: 36 },
  subLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: C.text },

  // Task config
  taskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, backgroundColor: C.bg, borderRadius: 10, padding: 10 },
  taskLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: C.text },
  taskCount: { fontSize: 13, fontWeight: '700', color: C.primary, marginRight: 10 },
  taskDel: { fontSize: 16, color: C.error, fontWeight: '700', paddingHorizontal: 6 },
  taskChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
    backgroundColor: C.bg, marginRight: 6, marginBottom: 6,
    borderWidth: 1.5, borderColor: C.border,
  },
  taskChipOn: { backgroundColor: C.primary, borderColor: C.primary },
  taskChipTxt: { fontSize: 12, fontWeight: '600', color: C.textMid },
  addTaskBtn: {
    marginTop: 10, paddingVertical: 10, borderRadius: 12,
    backgroundColor: C.primary, alignItems: 'center',
  },
  addTaskBtnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Points management
  ptBtn: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12,
    backgroundColor: 'rgba(123,174,142,0.15)', borderWidth: 1.5, borderColor: C.success,
  },
  ptBtnSub: { backgroundColor: 'rgba(224,107,107,0.1)', borderColor: C.error },
  ptBtnTxt: { fontSize: 14, fontWeight: '700', color: C.success },
  ptLogRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border },
  ptLogSign: { fontSize: 16, fontWeight: '800', minWidth: 50 },
  ptLogReason: { fontSize: 13, fontWeight: '600', color: C.text },
  ptLogDate: { fontSize: 11, color: C.textLight, marginTop: 1 },
  ptInput: {
    height: 44, borderRadius: 12, backgroundColor: C.bg, paddingHorizontal: 14,
    fontSize: 16, fontWeight: '600', color: C.text, borderWidth: 1.5, borderColor: C.border,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 24 },
  modalSheet: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 14, textAlign: 'center' },
  modalBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },

  ver: { textAlign: 'center', fontSize: 12, color: C.textLight, marginTop: 24 },
});
