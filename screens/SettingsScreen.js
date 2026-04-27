import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Switch, TextInput, ScrollView, StyleSheet, Alert, Platform, Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { C, AVATARS, RADIUS, SUBJECTS, DIFFICULTIES, SHADOW, SUBJECT_COLORS } from '../lib/theme';
import { useApp } from '../lib/AppContext';

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

const PT_REASON_MICON = {
  redeem: 'card-giftcard',
  chores: 'home',
  reading: 'menu-book',
  behavior: 'emoji-events',
  penalty: 'warning',
  other: 'edit',
};

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

function SectionHeader({ name, label }) {
  return (
    <View style={st.sectionHeader}>
      <MaterialIcons name={name} size={20} color={C.primary} />
      <Text style={st.secLabel}>{label}</Text>
    </View>
  );
}

export default function SettingsScreen() {
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

  const pointsFormatted = (user?.totalPoints ?? 0).toLocaleString('zh-CN');
  const levelLabel = user?.level ?? 1;

  return (
    <ScrollView style={st.root} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      <Text style={st.title}>家长设置</Text>

      <View style={st.profileCard}>
        <View style={st.profileRow}>
          <View style={st.profileAvatar}>
            <Text style={st.profileAvatarTxt}>{user?.avatar || '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.profileName}>{user?.name || '未命名'}</Text>
            <Text style={st.profileSub}>管理学习偏好与控制</Text>
            <Text style={st.profileMeta}>{levelLabel}级 · {pointsFormatted}分</Text>
          </View>
        </View>
      </View>

      <Text style={st.hint}>仅家长可访问此页面</Text>

      <SectionHeader name="bolt" label="基础设置" />
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
            thumbColor={C.cardWhite}
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
            <MaterialIcons name="chevron-right" size={22} color={C.textLight} />
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
            <MaterialIcons name="chevron-right" size={22} color={C.textLight} />
          </TouchableOpacity>
        )}
      </View>

      <SectionHeader name="visibility" label="护眼提醒" />
      <View style={st.card}>
        <View style={st.row}>
          <View style={{ flex: 1 }}>
            <Text style={st.rowTitle}>每日限时</Text>
            <Text style={st.rowDesc}>连续使用多久后提醒休息</Text>
          </View>
          <View style={st.stepper}>
            <TouchableOpacity
              style={st.stepBtn}
              onPress={() => updateBreakConfig({ usageMinutes: Math.max(5, breakConfig.usageMinutes - 5) })}
            >
              <MaterialIcons name="remove" size={20} color={C.primary} />
            </TouchableOpacity>
            <Text style={st.stepVal}>{breakConfig.usageMinutes}分钟/天</Text>
            <TouchableOpacity
              style={st.stepBtn}
              onPress={() => updateBreakConfig({ usageMinutes: Math.min(60, breakConfig.usageMinutes + 5) })}
            >
              <MaterialIcons name="add" size={20} color={C.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={st.divider} />
        <View style={st.row}>
          <View style={{ flex: 1 }}>
            <Text style={st.rowTitle}>休息间隔</Text>
            <Text style={st.rowDesc}>强制休息多少分钟</Text>
          </View>
          <View style={st.stepper}>
            <TouchableOpacity
              style={st.stepBtn}
              onPress={() => updateBreakConfig({ breakMinutes: Math.max(1, breakConfig.breakMinutes - 1) })}
            >
              <MaterialIcons name="remove" size={20} color={C.primary} />
            </TouchableOpacity>
            <Text style={st.stepVal}>{breakConfig.breakMinutes}分钟/阶段</Text>
            <TouchableOpacity
              style={st.stepBtn}
              onPress={() => updateBreakConfig({ breakMinutes: Math.min(15, breakConfig.breakMinutes + 1) })}
            >
              <MaterialIcons name="add" size={20} color={C.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <SectionHeader name="stars" label="奖励规则" />
      <View style={st.card}>
        <View style={st.row}>
          <View style={{ flex: 1 }}>
            <Text style={st.rowTitle}>每题得分</Text>
            <Text style={st.rowDesc}>答对一题获得的积分</Text>
          </View>
          <View style={st.stepper}>
            <TouchableOpacity style={st.stepBtn} onPress={() => updateReward({ perCorrect: Math.max(1, rc.perCorrect - 1) })}>
              <MaterialIcons name="remove" size={20} color={C.primary} />
            </TouchableOpacity>
            <Text style={st.stepVal}>{rc.perCorrect}分</Text>
            <TouchableOpacity style={st.stepBtn} onPress={() => updateReward({ perCorrect: Math.min(50, rc.perCorrect + 1) })}>
              <MaterialIcons name="add" size={20} color={C.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={st.divider} />
        <View style={st.row}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name="emoji-events" size={18} color={C.accent} style={{ marginRight: 6 }} />
            <View style={{ flex: 1 }}>
              <Text style={st.rowTitle}>额外奖励门槛</Text>
              <Text style={st.rowDesc}>一次练习全部答对的额外积分</Text>
            </View>
          </View>
          <View style={st.stepper}>
            <TouchableOpacity style={st.stepBtn} onPress={() => updateReward({ perfectBonus: Math.max(0, rc.perfectBonus - 5) })}>
              <MaterialIcons name="remove" size={20} color={C.primary} />
            </TouchableOpacity>
            <Text style={st.stepVal}>{rc.perfectBonus}分</Text>
            <TouchableOpacity style={st.stepBtn} onPress={() => updateReward({ perfectBonus: Math.min(200, rc.perfectBonus + 5) })}>
              <MaterialIcons name="add" size={20} color={C.primary} />
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
              <MaterialIcons name="remove" size={20} color={C.primary} />
            </TouchableOpacity>
            <Text style={st.stepVal}>{rc.taskReward || 10}分</Text>
            <TouchableOpacity style={st.stepBtn} onPress={() => updateReward({ taskReward: Math.min(100, (rc.taskReward || 10) + 1) })}>
              <MaterialIcons name="add" size={20} color={C.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <SectionHeader name="signal-cellular-alt" label="难度权限" />
      <View style={st.card}>
        <View style={st.pillRow}>
          {Object.values(DIFFICULTIES).map((d) => {
            const on = allowedDiffs.includes(d.key);
            return (
              <TouchableOpacity
                key={d.key}
                style={[
                  st.diffPill,
                  on && { backgroundColor: `${d.color}24`, borderColor: d.color },
                ]}
                onPress={() => toggleDiff(d.key)}
              >
                <Text style={[st.diffPillTxt, on && { color: d.color, fontWeight: '800' }]}>{d.label}</Text>
                <Text style={st.diffPillSub}>数字 {d.range[0]}~{d.range[1]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={st.pillHint}>选择允许的难度等级（至少保留一个）</Text>
      </View>

      <SectionHeader name="menu-book" label="可选科目" />
      <View style={st.card}>
        <View style={st.row}>
          <View style={st.subjTitleWrap}>
            <View style={[st.subjDot, { backgroundColor: SUBJECT_COLORS.math.primary }]} />
            <Text style={st.rowTitle}>数学</Text>
          </View>
          <Switch
            value={vis.math !== false}
            onValueChange={(v) => toggleVis('math', v)}
            trackColor={{ true: C.primary, false: C.border }}
            thumbColor={C.cardWhite}
          />
        </View>
        {vis.math !== false && (
          <>
            <View style={st.divider} />
            <TouchableOpacity style={st.row} onPress={() => setMathExpanded(!mathExpanded)}>
              <Text style={[st.rowDesc, { flex: 1 }]}>
                {mathExpanded ? '收起题型设置' : '展开题型设置'}
              </Text>
              <MaterialIcons name={mathExpanded ? 'expand-less' : 'expand-more'} size={24} color={C.textLight} />
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
                      thumbColor={C.cardWhite}
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
                    thumbColor={C.cardWhite}
                  />
                </View>
              </View>
            )}
          </>
        )}
        <View style={st.divider} />
        <View style={st.row}>
          <View style={st.subjTitleWrap}>
            <View style={[st.subjDot, { backgroundColor: SUBJECT_COLORS.english.primary }]} />
            <Text style={st.rowTitle}>英语</Text>
          </View>
          <Switch
            value={vis.english !== false}
            onValueChange={(v) => toggleVis('english', v)}
            trackColor={{ true: C.primary, false: C.border }}
            thumbColor={C.cardWhite}
          />
        </View>
        <View style={st.divider} />
        <View style={st.row}>
          <View style={st.subjTitleWrap}>
            <View style={[st.subjDot, { backgroundColor: SUBJECT_COLORS.chinese.primary }]} />
            <Text style={st.rowTitle}>语文</Text>
          </View>
          <Switch
            value={vis.chinese !== false}
            onValueChange={(v) => toggleVis('chinese', v)}
            trackColor={{ true: C.primary, false: C.border }}
            thumbColor={C.cardWhite}
          />
        </View>
      </View>

      <SectionHeader name="task-alt" label="每日任务" />
      <View style={st.card}>
        <View style={st.row}>
          <View style={{ flex: 1 }}>
            <Text style={st.rowTitle}>强制模式</Text>
            <Text style={st.rowDesc}>开启后，孩子必须完成任务才能自由练习</Text>
          </View>
          <Switch
            value={tc.enabled}
            onValueChange={toggleTaskEnabled}
            trackColor={{ true: C.primary, false: C.border }}
            thumbColor={C.cardWhite}
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
                  <TouchableOpacity onPress={() => removeTask(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialIcons name="delete" size={22} color={C.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={st.divider} />
        <TouchableOpacity style={st.row} onPress={() => setTaskExpanded(!taskExpanded)}>
          <Text style={[st.rowDesc, { flex: 1 }]}>
            {taskExpanded ? '收起添加任务' : '添加任务'}
          </Text>
          <MaterialIcons name={taskExpanded ? 'expand-less' : 'expand-more'} size={24} color={C.textLight} />
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
                  <Text style={[st.taskChipTxt, addTaskSubject === s.key && { color: C.cardWhite }]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[st.rowDesc, { marginTop: 10, marginBottom: 6 }]}>每天题数:</Text>
            <View style={st.stepper}>
              <TouchableOpacity style={st.stepBtn} onPress={() => setAddTaskCount((c) => Math.max(5, c - 5))}>
                <MaterialIcons name="remove" size={20} color={C.primary} />
              </TouchableOpacity>
              <Text style={st.stepVal}>{addTaskCount}题</Text>
              <TouchableOpacity style={st.stepBtn} onPress={() => setAddTaskCount((c) => Math.min(50, c + 5))}>
                <MaterialIcons name="add" size={20} color={C.primary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[st.addTaskBtn, !addTaskSubject && { opacity: 0.4 }]}
              disabled={!addTaskSubject}
              onPress={addTask}
            >
              <MaterialIcons name="add" size={20} color={C.cardWhite} style={{ marginRight: 6 }} />
              <Text style={st.addTaskBtnTxt}>添加任务</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <SectionHeader name="account-balance-wallet" label="手动调整分数" />
      <View style={st.card}>
        <View style={st.row}>
          <View style={{ flex: 1 }}>
            <Text style={st.rowTitle}>当前积分</Text>
            <Text style={[st.rowDesc, { fontSize: 20, fontWeight: '800', color: C.accent }]}>{user?.totalPoints || 0}</Text>
          </View>
        </View>
        <View style={st.divider} />
        <View style={[st.row, { justifyContent: 'space-around' }]}>
          <TouchableOpacity style={st.ptBtnAdd} onPress={() => openPtModal('add')}>
            <MaterialIcons name="add-circle" size={22} color={C.success} style={{ marginRight: 6 }} />
            <Text style={st.ptBtnTxtAdd}>加分</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.ptBtnSub} onPress={() => openPtModal('subtract')}>
            <MaterialIcons name="remove-circle" size={22} color={C.error} style={{ marginRight: 6 }} />
            <Text style={st.ptBtnTxtSub}>扣分</Text>
          </TouchableOpacity>
        </View>
        {pointsLog.length > 0 && (
          <>
            <View style={st.divider} />
            <TouchableOpacity style={st.row} onPress={() => setShowPtLog(!showPtLog)}>
              <Text style={[st.rowDesc, { flex: 1 }]}>
                {showPtLog ? '收起记录' : `查看记录 (${pointsLog.length}条)`}
              </Text>
              <MaterialIcons name={showPtLog ? 'expand-less' : 'expand-more'} size={24} color={C.textLight} />
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
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons
                      name={PT_REASON_MICON[r.key] || 'label'}
                      size={14}
                      color={ptReason === r.key ? C.cardWhite : C.textMid}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[st.taskChipTxt, ptReason === r.key && { color: C.cardWhite }]}>{r.label}</Text>
                  </View>
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

      <SectionHeader name="admin-panel-settings" label="系统管理" />
      <View style={st.card}>
        <TouchableOpacity
          style={st.row}
          onPress={() => showConfirm('重置积分', '确定要将积分重置为0吗?', () => onUpdate({ totalPoints: 0, level: 1 }))}
        >
          <View style={{ flex: 1 }}>
            <Text style={st.rowTitle}>重置积分</Text>
            <Text style={st.rowDesc}>将积分和等级清零，保留练习记录</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={C.textLight} />
        </TouchableOpacity>
        <View style={st.divider} />

        <TouchableOpacity style={st.row} onPress={onChangePin}>
          <View style={st.rowIconTitle}>
            <MaterialIcons name="vpn-key" size={20} color={C.primary} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={st.rowTitle}>修改家长密码 (PIN)</Text>
              <Text style={st.rowDesc}>重新设置4位数字密码</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={C.textLight} />
        </TouchableOpacity>
        <View style={st.divider} />

        <TouchableOpacity
          style={st.row}
          onPress={() => showConfirm('重置数据', '确定要清除所有数据吗? 此操作不可恢复。', onClear)}
        >
          <View style={{ flex: 1 }}>
            <Text style={[st.rowTitle, { color: C.error }]}>重置所有</Text>
            <Text style={st.rowDesc}>清除全部练习记录、积分和成就</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={C.error} />
        </TouchableOpacity>
      </View>

      <Text style={st.ver}>学习乐园 v4.0</Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 32 },

  title: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 16 },

  profileCard: {
    backgroundColor: C.cardWhite,
    borderRadius: RADIUS,
    padding: 16,
    marginBottom: 8,
    ...SHADOW,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.card,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileAvatarTxt: { fontSize: 28 },
  profileName: { fontSize: 18, fontWeight: '800', color: C.text },
  profileSub: { fontSize: 13, color: C.textLight, marginTop: 2 },
  profileMeta: { fontSize: 14, fontWeight: '700', color: C.primary, marginTop: 6 },

  hint: { fontSize: 12, color: C.textLight, marginBottom: 12 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 8 },
  secLabel: { fontSize: 15, fontWeight: '800', color: C.text, marginLeft: 8 },

  card: {
    backgroundColor: C.cardWhite,
    borderRadius: RADIUS,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    ...SHADOW,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowIconTitle: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  subjTitleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  subjDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: C.text },
  rowDesc: { fontSize: 13, color: C.textLight, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginHorizontal: 16 },

  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepVal: { fontSize: 14, fontWeight: '700', color: C.text, marginHorizontal: 8, minWidth: 88, textAlign: 'center' },

  editBox: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  editInput: {
    flex: 1, height: 42, borderRadius: 10, backgroundColor: C.bg, paddingHorizontal: 12,
    fontSize: 16, fontWeight: '600', color: C.text, borderWidth: 1.5, borderColor: C.primary,
  },
  editBtn: {
    marginLeft: 8, height: 42, paddingHorizontal: 16, borderRadius: 10,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  editBtnTxt: { color: C.cardWhite, fontWeight: '700', fontSize: 14 },
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

  subRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, paddingLeft: 32 },
  subLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: C.text },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, justifyContent: 'space-between' },
  diffPill: {
    minWidth: '30%',
    flexGrow: 1,
    maxWidth: '32%',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.bg,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    margin: 4,
  },
  diffPillTxt: { fontSize: 15, fontWeight: '600', color: C.text },
  diffPillSub: { fontSize: 10, color: C.textLight, marginTop: 2 },
  pillHint: { fontSize: 12, color: C.textLight, paddingHorizontal: 16, paddingBottom: 12 },

  taskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, backgroundColor: C.bg, borderRadius: 10, padding: 10 },
  taskLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: C.text },
  taskCount: { fontSize: 13, fontWeight: '700', color: C.primary, marginRight: 10 },
  taskChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: C.bg, marginRight: 6, marginBottom: 6,
    borderWidth: 1.5, borderColor: C.border,
  },
  taskChipOn: { backgroundColor: C.primary, borderColor: C.primary },
  taskChipTxt: { fontSize: 12, fontWeight: '600', color: C.textMid },
  addTaskBtn: {
    marginTop: 10, paddingVertical: 12, borderRadius: RADIUS,
    backgroundColor: C.primary, alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
  },
  addTaskBtnTxt: { fontSize: 15, fontWeight: '700', color: C.cardWhite },

  ptBtnAdd: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    borderRadius: RADIUS,
    backgroundColor: C.successBg,
    borderWidth: 1.5,
    borderColor: C.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ptBtnTxtAdd: { fontSize: 15, fontWeight: '800', color: C.success },
  ptBtnSub: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    borderRadius: RADIUS,
    backgroundColor: C.errorBg,
    borderWidth: 1.5,
    borderColor: C.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ptBtnTxtSub: { fontSize: 15, fontWeight: '800', color: C.error },
  ptLogRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border },
  ptLogSign: { fontSize: 16, fontWeight: '800', minWidth: 50 },
  ptLogReason: { fontSize: 13, fontWeight: '600', color: C.text },
  ptLogDate: { fontSize: 11, color: C.textLight, marginTop: 1 },
  ptInput: {
    height: 44, borderRadius: RADIUS, backgroundColor: C.bg, paddingHorizontal: 14,
    fontSize: 16, fontWeight: '600', color: C.text, borderWidth: 1.5, borderColor: C.border,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 24 },
  modalSheet: { backgroundColor: C.cardWhite, borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 14, textAlign: 'center' },
  modalBtn: { paddingVertical: 12, borderRadius: RADIUS, alignItems: 'center' },
  modalBtnTxt: { fontSize: 15, fontWeight: '700', color: C.cardWhite },

  ver: { textAlign: 'center', fontSize: 12, color: C.textLight, marginTop: 24 },
});
