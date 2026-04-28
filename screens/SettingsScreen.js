import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert, Platform, Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { C, SHADOW, SHADOW_SM, AVATARS, SUBJECTS, DIFFICULTIES, SUBJECT_COLORS } from '../lib/theme';
import { FONT_OPTIONS } from '../App';
import { useApp } from '../lib/AppContext';

const MATH_VIS_KEYS = [
  'mulForward', 'mulBlank', 'add', 'subtract', 'divide', 'divRem', 'divReverse',
  'addTwo', 'subtractTwo', 'mulReverse', 'compare', 'wordProblem', 'pattern',
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

const R2 = 16;
const CYAN_600 = '#0891b2';
const PRIMARY_05 = 'rgba(0, 102, 112, 0.05)';
const PRIMARY_20 = 'rgba(0, 102, 112, 0.2)';
const PRIMARY_30 = 'rgba(0, 102, 112, 0.3)';
const SURFACE_DIM = '#d7dbdb';
const SHADOW_3D_RED = { shadowColor: '#93000a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2 };
const SHADOW_3D_AMBER = { shadowColor: '#744300', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2 };
const SHADOW_PLUS_3D = { shadowColor: C.primaryDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2 };

const CARD_BENTO = {
  backgroundColor: C.surface,
  borderRadius: R2,
  borderWidth: 1,
  borderColor: C.surfaceVariant,
  padding: 24,
  shadowColor: 'rgba(0, 102, 112, 0.1)',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 1,
  shadowRadius: 10,
  elevation: 4,
};

function getTaskListIcon(key) {
  if (!key) return 'task-alt';
  if (['divide', 'divRem', 'divReverse', 'add', 'subtract', 'addTwo', 'subtractTwo', 'mulForward', 'mulBlank'].includes(key)) {
    return 'calculate';
  }
  return 'menu-book';
}

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

function CardHeader({ name, label, color }) {
  return (
    <View style={st.cardHeaderRow}>
      <MaterialIcons name={name} size={30} color={color} />
      <Text style={st.cardHeaderTitle}>{label}</Text>
    </View>
  );
}

function CustomSwitch({ value, onValueChange, disabled }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[st.toggleTrack, value && st.toggleTrackOn, disabled && { opacity: 0.45 }]}
    >
      <View style={[st.toggleKnob, value && st.toggleKnobOn]} />
    </TouchableOpacity>
  );
}

function StepperEye({ minus, plus, valueNode }) {
  return (
    <View style={st.stepperEye}>
      {minus}
      {valueNode}
      {plus}
    </View>
  );
}

export default function SettingsScreen() {
  const { user, settings, rewardConfig, visibility, updateUser: onUpdate, resetAll, requestPin, adjustPoints, pointsLog } = useApp();
  const onClear = resetAll;
  const onChangePin = useCallback(() => requestPin('setup'), [requestPin]);
  const [editing, setEditing] = useState(null);
  const [tmpName, setTmpName] = useState(user?.name || '');
  const [tmpAvatar, setTmpAvatar] = useState(user?.avatar || '');
  const [mathExpanded, setMathExpanded] = useState(false);

  const tc = user?.taskConfig || { enabled: false, tasks: [] };
  const [taskExpanded, setTaskExpanded] = useState(false);
  const [addTaskSubject, setAddTaskSubject] = useState(null);
  const [addTaskCount, setAddTaskCount] = useState(10);

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
  const displayName = user?.name || '学习小探险家';

  return (
    <ScrollView style={st.root} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      <View style={st.profileCard}>
        <View style={st.profileRow}>
          <View style={st.profileAvatar}>
            <Text style={st.profileAvatarTxt}>{user?.avatar || '?'}</Text>
          </View>
          <View style={st.profileMid}>
            <Text style={st.profileName}>{displayName}</Text>
            <Text style={st.profileSub}>管理学习偏好与控制</Text>
          </View>
          <View style={st.levelPill}>
            <Text style={st.levelPillTxt}>
              {levelLabel} 级 • {pointsFormatted} 分
            </Text>
          </View>
        </View>
      </View>

      <Text style={st.hint}>仅家长可访问此页面</Text>

      <View style={st.bentoItem}>
        <View style={st.card}>
          <CardHeader name="bolt" label="基础设置" color={C.primary} />
          <View style={st.blockGap}>
            <View style={st.toggleRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={st.bodyMdMed}>自动提交</Text>
                <Text style={st.rowDesc}>输入数字后自动提交答案</Text>
              </View>
              <CustomSwitch
                value={settings.autoSubmit}
                onValueChange={(v) => onUpdate({ settings: { ...settings, autoSubmit: v } })}
              />
            </View>

            <View style={st.fontSection}>
              <View style={{ marginBottom: 8 }}>
                <Text style={st.bodyMdMed}>全局字体</Text>
                <Text style={st.rowDesc}>切换应用内的显示字体</Text>
              </View>
              <View style={st.fontGrid}>
                {FONT_OPTIONS.map((f) => {
                  const active = (settings.fontKey || 'default') === f.key;
                  return (
                    <TouchableOpacity
                      key={f.key}
                      style={[st.fontChip, active && st.fontChipActive]}
                      onPress={() => onUpdate({ settings: { ...settings, fontKey: f.key } })}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        st.fontChipLabel,
                        active && st.fontChipLabelActive,
                        f.family && { fontFamily: f.family },
                      ]}>
                        {f.label}
                      </Text>
                      <Text style={[st.fontChipDesc, active && st.fontChipDescActive]}>
                        {f.desc}
                      </Text>
                      {active && (
                        <MaterialIcons name="check-circle" size={13} color={C.primary} style={{ position: 'absolute', top: 3, right: 3 }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[
                st.fontPreview,
                FONT_OPTIONS.find((f) => f.key === (settings.fontKey || 'default'))?.family
                  && { fontFamily: FONT_OPTIONS.find((f) => f.key === (settings.fontKey || 'default')).family },
              ]}>
                预览: 你好世界 Hello World 123
              </Text>
            </View>

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
              <TouchableOpacity
                style={st.settingsRow}
                onPress={() => { setTmpName(user.name); setEditing('name'); }}
                activeOpacity={0.75}
              >
                <View style={{ flex: 1 }}>
                  <Text style={st.bodyMdMed}>修改昵称</Text>
                  <Text style={st.rowDesc}>{user.name}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={C.textLight} />
              </TouchableOpacity>
            )}

            {editing === 'avatar' ? (
              <View style={st.avatarBox}>
                <Text style={st.bodyMdMed}>选择头像</Text>
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
              <TouchableOpacity style={st.settingsRow} onPress={() => setEditing('avatar')} activeOpacity={0.75}>
                <View style={{ flex: 1 }}>
                  <Text style={st.bodyMdMed}>修改头像</Text>
                  <Text style={st.rowDesc}>{user.avatar}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={C.textLight} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <View style={st.bentoItem}>
        <View style={st.card}>
          <CardHeader name="visibility" label="护眼提醒" color={C.primary} />
          <View style={st.blockGap}>
            <View style={st.eyeBlock}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={st.bodyMdMed}>每日限时</Text>
                <Text style={st.eyeSub}>连续使用多久后提醒休息</Text>
              </View>
              <StepperEye
                minus={(
                  <TouchableOpacity
                    style={st.stepBtnMinus}
                    onPress={() => updateBreakConfig({ usageMinutes: Math.max(5, breakConfig.usageMinutes - 5) })}
                  >
                    <MaterialIcons name="remove" size={22} color={C.primary} />
                  </TouchableOpacity>
                )}
                valueNode={(
                  <Text style={st.stepValTitle}>{breakConfig.usageMinutes}分钟/天</Text>
                )}
                plus={(
                  <TouchableOpacity
                    style={st.stepBtnPlus}
                    onPress={() => updateBreakConfig({ usageMinutes: Math.min(60, breakConfig.usageMinutes + 5) })}
                  >
                    <MaterialIcons name="add" size={22} color={C.onPrimary} />
                  </TouchableOpacity>
                )}
              />
            </View>
            <View style={st.eyeBlock}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={st.bodyMdMed}>休息间隔</Text>
                <Text style={st.eyeSub}>强制休息多少分钟</Text>
              </View>
              <StepperEye
                minus={(
                  <TouchableOpacity
                    style={st.stepBtnMinus}
                    onPress={() => updateBreakConfig({ breakMinutes: Math.max(1, breakConfig.breakMinutes - 1) })}
                  >
                    <MaterialIcons name="remove" size={22} color={C.primary} />
                  </TouchableOpacity>
                )}
                valueNode={(
                  <Text style={st.stepValTitle}>{breakConfig.breakMinutes}分钟/阶段</Text>
                )}
                plus={(
                  <TouchableOpacity
                    style={st.stepBtnPlus}
                    onPress={() => updateBreakConfig({ breakMinutes: Math.min(15, breakConfig.breakMinutes + 1) })}
                  >
                    <MaterialIcons name="add" size={22} color={C.onPrimary} />
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </View>
      </View>

      <View style={st.bentoItem}>
        <View style={st.card}>
          <CardHeader name="stars" label="奖励规则" color={C.secondary} />
          <View style={st.blockGap}>
            <View>
              <Text style={st.labelCaps}>每题得分</Text>
              <View style={st.inputLike}>
                <View style={st.stepperInInput}>
                  <TouchableOpacity
                    style={st.stepBtnMinus}
                    onPress={() => updateReward({ perCorrect: Math.max(1, rc.perCorrect - 1) })}
                  >
                    <MaterialIcons name="remove" size={22} color={C.primary} />
                  </TouchableOpacity>
                  <Text style={st.stepValTitleNarrow}>{rc.perCorrect}分</Text>
                  <TouchableOpacity
                    style={st.stepBtnPlus}
                    onPress={() => updateReward({ perCorrect: Math.min(50, rc.perCorrect + 1) })}
                  >
                    <MaterialIcons name="add" size={22} color={C.onPrimary} />
                  </TouchableOpacity>
                </View>
                <MaterialIcons name="monetization-on" size={24} color={C.secondary} style={st.inputIconRight} />
              </View>
            </View>
            <View>
              <Text style={st.labelCaps}>额外奖励 · 全对加分</Text>
              <View style={st.inputLike}>
                <View style={st.stepperInInput}>
                  <TouchableOpacity
                    style={st.stepBtnMinus}
                    onPress={() => updateReward({ perfectBonus: Math.max(0, rc.perfectBonus - 5) })}
                  >
                    <MaterialIcons name="remove" size={22} color={C.primary} />
                  </TouchableOpacity>
                  <Text style={st.stepValTitleNarrow}>{rc.perfectBonus}分</Text>
                  <TouchableOpacity
                    style={st.stepBtnPlus}
                    onPress={() => updateReward({ perfectBonus: Math.min(200, rc.perfectBonus + 5) })}
                  >
                    <MaterialIcons name="add" size={22} color={C.onPrimary} />
                  </TouchableOpacity>
                </View>
                <MaterialIcons name="emoji-events" size={24} color={C.secondary} style={st.inputIconRight} />
              </View>
            </View>
            <View>
              <Text style={st.labelCaps}>任务完成奖励</Text>
              <View style={st.inputLike}>
                <View style={st.stepperInInput}>
                  <TouchableOpacity
                    style={st.stepBtnMinus}
                    onPress={() => updateReward({ taskReward: Math.max(1, (rc.taskReward || 10) - 1) })}
                  >
                    <MaterialIcons name="remove" size={22} color={C.primary} />
                  </TouchableOpacity>
                  <Text style={st.stepValTitleNarrow}>{rc.taskReward || 10}分</Text>
                  <TouchableOpacity
                    style={st.stepBtnPlus}
                    onPress={() => updateReward({ taskReward: Math.min(100, (rc.taskReward || 10) + 1) })}
                  >
                    <MaterialIcons name="add" size={22} color={C.onPrimary} />
                  </TouchableOpacity>
                </View>
                <MaterialIcons name="assignment-turned-in" size={24} color={C.secondary} style={st.inputIconRight} />
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={st.bentoItem}>
        <View style={st.card}>
          <CardHeader name="signal-cellular-alt" label="难度权限" color={C.primary} />
          <View style={st.blockGapSm}>
            {Object.values(DIFFICULTIES).map((d) => {
              const on = allowedDiffs.includes(d.key);
              return (
                <View key={d.key} style={st.diffRow}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        st.bodyMdMed,
                        d.key === 'easy' && { color: C.primary },
                        d.key === 'normal' && { color: C.secondary },
                        d.key === 'hard' && { color: C.error },
                      ]}
                    >
                      {d.label}
                    </Text>
                    <Text style={st.diffSubNum}>数字 {d.range[0]}~{d.range[1]}</Text>
                  </View>
                  <CustomSwitch
                    value={on}
                    onValueChange={() => toggleDiff(d.key)}
                  />
                </View>
              );
            })}
            <Text style={st.pillHint}>选择允许的难度等级（至少保留一个）</Text>
          </View>
        </View>
      </View>

      <View style={st.bentoItem}>
        <View style={st.card}>
          <CardHeader name="menu-book" label="可选科目" color={C.tertiary} />
          <View style={st.blockGap}>
            <View style={st.subjRow}>
              <View style={st.subjLeft}>
                <View style={st.badgeNum}>
                  <Text style={st.badgeNumTxtP}>数</Text>
                </View>
                <Text style={st.bodyMdMed}>数学</Text>
              </View>
              <CustomSwitch
                value={vis.math !== false}
                onValueChange={(v) => toggleVis('math', v)}
              />
            </View>
            {vis.math !== false && (
              <>
                <TouchableOpacity style={st.settingsRow} onPress={() => setMathExpanded(!mathExpanded)} activeOpacity={0.75}>
                  <Text style={[st.rowDesc, { flex: 1 }]}>
                    {mathExpanded ? '收起题型设置' : '展开题型设置'}
                  </Text>
                  <MaterialIcons name={mathExpanded ? 'expand-less' : 'expand-more'} size={24} color={C.textLight} />
                </TouchableOpacity>
                {mathExpanded && MATH_VIS_KEYS.map((k) => {
                  const sub = SUBJECTS[k];
                  if (!sub) return null;
                  return (
                    <View key={k} style={st.subMathRow}>
                      <Text style={st.subLabel}>{sub.icon} {sub.label}</Text>
                      <CustomSwitch
                        value={vis[`math_${k}`] !== false}
                        onValueChange={(v) => toggleVis(`math_${k}`, v)}
                      />
                    </View>
                  );
                })}
                {mathExpanded && (
                  <View style={st.subMathRow}>
                    <Text style={st.subLabel}>⚡ 口算竞速</Text>
                    <CustomSwitch
                      value={vis.math_speed !== false}
                      onValueChange={(v) => toggleVis('math_speed', v)}
                    />
                  </View>
                )}
              </>
            )}
            <View style={st.subjRow}>
              <View style={st.subjLeft}>
                <View style={st.badgeEn}>
                  <Text style={st.badgeEnTxt}>英</Text>
                </View>
                <Text style={st.bodyMdMed}>英语</Text>
              </View>
              <CustomSwitch
                value={vis.english !== false}
                onValueChange={(v) => toggleVis('english', v)}
              />
            </View>
            <View style={st.subjRow}>
              <View style={st.subjLeft}>
                <View style={st.badgeLang}>
                  <Text style={st.badgeLangTxt}>语</Text>
                </View>
                <Text style={st.bodyMdMed}>语文</Text>
              </View>
              <CustomSwitch
                value={vis.chinese !== false}
                onValueChange={(v) => toggleVis('chinese', v)}
              />
            </View>
          </View>
        </View>
      </View>

      <View style={st.bentoItem}>
        <View style={st.card}>
          <CardHeader name="task-alt" label="每日任务" color={C.primary} />
          <View style={st.blockGap}>
            <View style={st.enforceBox}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={st.enforceTitle}>强制模式</Text>
                <Text style={st.enforceDesc}>必须完成任务后方可自由玩耍。</Text>
              </View>
              <CustomSwitch
                value={tc.enabled}
                onValueChange={toggleTaskEnabled}
              />
            </View>

            {tc.tasks.length > 0 && (
              <View>
                <Text style={[st.labelCaps, st.taskListLabel]}>必填任务列表</Text>
                <View style={st.taskListBox}>
                  {tc.tasks.map((t, i) => (
                    <View key={i} style={st.taskRowBento}>
                      <View style={st.taskRowLeft}>
                        <MaterialIcons name={getTaskListIcon(t.subject)} size={24} color={C.primary} />
                        <Text style={st.taskLabelMd}>{t.label} · {t.count}题/天</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeTask(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <MaterialIcons name="delete" size={24} color={C.outline} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={st.addTaskDashed}
              onPress={() => setTaskExpanded(!taskExpanded)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add" size={24} color={C.primary} />
              <Text style={st.addTaskDashedTxt}>添加任务</Text>
            </TouchableOpacity>

            {taskExpanded && (
              <View style={st.taskExpandBox}>
                <Text style={st.bodyMdMed}>选择科目</Text>
                <View style={st.chipRow}>
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
                <Text style={[st.rowDesc, { marginTop: 10, marginBottom: 6 }]}>每天题数</Text>
                <View style={st.stepperInInput}>
                  <TouchableOpacity style={st.stepBtnMinus} onPress={() => setAddTaskCount((c) => Math.max(5, c - 5))}>
                    <MaterialIcons name="remove" size={22} color={C.primary} />
                  </TouchableOpacity>
                  <Text style={st.stepValTitleNarrow}>{addTaskCount}题</Text>
                  <TouchableOpacity style={st.stepBtnPlus} onPress={() => setAddTaskCount((c) => Math.min(50, c + 5))}>
                    <MaterialIcons name="add" size={22} color={C.onPrimary} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[st.addTaskFill, !addTaskSubject && { opacity: 0.4 }]}
                  disabled={!addTaskSubject}
                  onPress={addTask}
                >
                  <MaterialIcons name="add" size={22} color={C.onPrimary} style={{ marginRight: 6 }} />
                  <Text style={st.addTaskFillTxt}>确认添加</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={st.bentoItem}>
        <View style={st.card}>
          <CardHeader name="account-balance-wallet" label="手动调整分数" color={C.secondary} />
          <View style={st.blockGap}>
            <View style={st.pointsSummary}>
              <Text style={st.bodyMdMed}>当前积分</Text>
              <Text style={st.pointsAmount}>{user?.totalPoints || 0}</Text>
            </View>
            <View style={st.ptRow}>
              <TouchableOpacity style={st.ptBtnSub} onPress={() => openPtModal('subtract')}>
                <MaterialIcons name="remove-circle" size={30} color={C.error} />
                <Text style={st.ptBtnTxtSub}>扣分</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.ptBtnAdd} onPress={() => openPtModal('add')}>
                <MaterialIcons name="add-circle" size={30} color={C.onSecondary} />
                <Text style={st.ptBtnTxtAdd}>加分</Text>
              </TouchableOpacity>
            </View>
            {pointsLog.length > 0 && (
              <>
                <TouchableOpacity style={st.settingsRow} onPress={() => setShowPtLog(!showPtLog)} activeOpacity={0.75}>
                  <Text style={[st.rowDesc, { flex: 1 }]}>
                    {showPtLog ? '收起记录' : `查看记录 (${pointsLog.length}条)`}
                  </Text>
                  <MaterialIcons name={showPtLog ? 'expand-less' : 'expand-more'} size={24} color={C.textLight} />
                </TouchableOpacity>
                {showPtLog && (
                  <View style={st.ptLogPad}>
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
        </View>
      </View>

      <Modal visible={showPtModal} transparent animationType="fade">
        <View style={st.modalOverlay}>
          <View style={st.modalSheet}>
            <Text style={st.modalTitle}>{ptType === 'add' ? '增加积分' : '减少积分'}</Text>

            <Text style={[st.rowDesc, { marginBottom: 8 }]}>选择原因</Text>
            <View style={st.chipRowModal}>
              {POINT_REASONS.filter((r) => r.type === ptType || r.type === 'both').map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={[st.taskChip, ptReason === r.key && st.taskChipOn]}
                  onPress={() => setPtReason(r.key)}
                >
                  <View style={st.chipInner}>
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

            <Text style={[st.rowDesc, { marginBottom: 6 }]}>积分数量</Text>
            <TextInput
              style={st.ptInput}
              value={ptAmount}
              onChangeText={(t) => setPtAmount(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="输入数量"
              placeholderTextColor={C.textLight}
            />

            <Text style={[st.rowDesc, { marginBottom: 6, marginTop: 10 }]}>备注 (可选)</Text>
            <TextInput
              style={st.ptInput}
              value={ptNote}
              onChangeText={setPtNote}
              placeholder="备注说明..."
              placeholderTextColor={C.textLight}
              maxLength={30}
            />

            <View style={st.modalActions}>
              <TouchableOpacity style={st.modalBtnCancel} onPress={() => setShowPtModal(false)}>
                <Text style={st.modalBtnTxtCancel}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.modalBtnOk, { backgroundColor: ptType === 'add' ? C.success : C.error }]}
                onPress={submitPtAdjust}
              >
                <Text style={st.modalBtnTxt}>确认</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={st.bentoItem}>
        <View style={st.card}>
          <CardHeader name="admin-panel-settings" label="系统管理" color={C.error} />
          <View style={st.blockGapSm}>
            <TouchableOpacity style={st.pinBtn} onPress={onChangePin} activeOpacity={0.8}>
              <MaterialIcons name="vpn-key" size={24} color={C.text} style={{ marginRight: 8 }} />
              <Text style={st.pinBtnTxt}>修改家长密码 (PIN)</Text>
            </TouchableOpacity>

            <View style={st.resetRow}>
              <TouchableOpacity
                style={st.resetLeft}
                onPress={() => showConfirm('重置积分', '确定要将积分重置为0吗?', () => onUpdate({ totalPoints: 0, level: 1 }))}
                activeOpacity={0.8}
              >
                <Text style={st.resetLeftTxt}>分数重置</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={st.resetRight}
                onPress={() => showConfirm('重置数据', '确定要清除所有数据吗? 此操作不可恢复。', onClear)}
                activeOpacity={0.8}
              >
                <Text style={st.resetRightTxt}>重置所有</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <Text style={st.ver}>学习乐园 v4.0</Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 40, gap: 16, backgroundColor: C.bg },
  bentoItem: { marginBottom: 0 },
  profileCard: {
    backgroundColor: C.surfaceContainerLow,
    borderRadius: R2,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(224, 227, 228, 0.5)',
  },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  profileMid: { flex: 1, minWidth: 0, marginLeft: 12, marginRight: 8 },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surfaceVariant,
    borderWidth: 1,
    borderColor: PRIMARY_20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarTxt: { fontSize: 20 },
  profileName: { fontSize: 14, fontWeight: '700', color: C.text },
  profileSub: { fontSize: 12, color: C.textLight, marginTop: 2 },
  levelPill: {
    backgroundColor: C.primaryBg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  levelPillTxt: { fontSize: 12, fontWeight: '700', color: CYAN_600 },
  hint: { fontSize: 12, color: C.textLight, marginTop: 4, marginBottom: 4 },
  card: { ...CARD_BENTO },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  cardHeaderTitle: { fontSize: 20, fontWeight: '600', color: C.text, marginLeft: 8 },
  blockGap: { gap: 12 },
  blockGapSm: { gap: 8 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 8,
    padding: 8,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 8,
    padding: 8,
  },
  bodyMdMed: { fontSize: 16, fontWeight: '500', color: C.text },
  rowDesc: { fontSize: 13, color: C.textLight, marginTop: 2 },
  fontSection: { paddingTop: 4 },
  fontGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  fontChip: {
    position: 'relative',
    backgroundColor: C.surfaceContainerLow, borderRadius: 6,
    paddingVertical: 4, paddingHorizontal: 8,
    borderWidth: 1, borderColor: C.border,
  },
  fontChipActive: { borderColor: C.primary, backgroundColor: C.primaryBg },
  fontChipLabel: { fontSize: 11, fontWeight: '600', color: C.text },
  fontChipLabelActive: { color: C.primary },
  fontChipDesc: { fontSize: 0, color: 'transparent', height: 0 },
  fontChipDescActive: { color: 'transparent' },
  fontPreview: {
    fontSize: 15, color: C.textMid, marginTop: 10,
    backgroundColor: C.surfaceContainerLow, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, textAlign: 'center',
  },
  toggleTrack: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.surfaceVariant,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleTrackOn: { backgroundColor: C.primary },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.cardWhite,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    marginLeft: 0,
  },
  toggleKnobOn: { marginLeft: 24 },
  stepperEye: { flexDirection: 'row', alignItems: 'center' },
  eyeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 8,
    padding: 8,
  },
  eyeSub: { fontSize: 12, color: C.textLight, marginTop: 2 },
  stepBtnMinus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW_SM,
  },
  stepBtnPlus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primary,
    borderWidth: 2,
    borderColor: C.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW_PLUS_3D,
  },
  stepValTitle: { width: 100, textAlign: 'center', fontSize: 20, fontWeight: '600', color: C.text },
  stepValTitleNarrow: { minWidth: 64, textAlign: 'center', fontSize: 20, fontWeight: '600', color: C.text, flex: 1 },
  stepperInInput: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
  inputLike: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: C.cardWhite,
    borderWidth: 2,
    borderColor: C.outlineVariant,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIconRight: { marginLeft: 4 },
  labelCaps: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textLight,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  taskListLabel: { marginBottom: 8 },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 8,
    padding: 8,
    minHeight: 48,
  },
  diffSubNum: { fontSize: 11, color: C.textLight, marginTop: 2 },
  pillHint: { fontSize: 12, color: C.textLight, marginTop: 4 },
  subjRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingVertical: 4,
  },
  subjLeft: { flexDirection: 'row', alignItems: 'center' },
  badgeNum: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: C.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  badgeNumTxtP: { fontSize: 14, fontWeight: '800', color: C.primary },
  badgeEn: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: C.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  badgeEnTxt: { fontSize: 14, fontWeight: '800', color: C.secondary },
  badgeLang: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: C.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  badgeLangTxt: { fontSize: 14, fontWeight: '800', color: C.error },
  subMathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 28,
    paddingRight: 4,
  },
  subLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: C.text },
  editBox: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: C.surfaceContainerLow, borderRadius: 8 },
  editInput: {
    flex: 1, height: 42, borderRadius: 10, backgroundColor: C.cardWhite, paddingHorizontal: 12,
    fontSize: 16, fontWeight: '600', color: C.text, borderWidth: 2, borderColor: C.primary,
  },
  editBtn: {
    marginLeft: 8, height: 42, paddingHorizontal: 16, borderRadius: 10,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  editBtnTxt: { color: C.cardWhite, fontWeight: '700', fontSize: 14 },
  cancelTxt: { marginLeft: 10, color: C.textMid, fontWeight: '600', fontSize: 14 },
  avatarBox: { padding: 8, backgroundColor: C.surfaceContainerLow, borderRadius: 8 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  avatarBtn: {
    width: 52, height: 52, borderRadius: 26, margin: 4,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.cardWhite, borderWidth: 2, borderColor: 'transparent',
  },
  avatarOn: { borderColor: C.primary, backgroundColor: C.primaryBg },
  avatarTxt: { fontSize: 26 },
  enforceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_05,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PRIMARY_20,
  },
  enforceTitle: { fontSize: 16, fontWeight: '700', color: C.primary },
  enforceDesc: { fontSize: 12, color: C.textLight, marginTop: 4 },
  taskListBox: {
    backgroundColor: C.surfaceContainerLow,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: SURFACE_DIM,
    gap: 8,
  },
  taskRowBento: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  taskRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  taskLabelMd: { fontSize: 14, color: C.text, marginLeft: 8, flex: 1 },
  addTaskDashed: {
    height: 48,
    borderRadius: 12,
    backgroundColor: C.surfaceContainerHigh,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: PRIMARY_30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTaskDashedTxt: { fontSize: 20, fontWeight: '600', color: C.primary, marginLeft: 8 },
  taskExpandBox: { marginTop: 4, gap: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chipRowModal: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  chipInner: { flexDirection: 'row', alignItems: 'center' },
  taskChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: C.surfaceContainerLow, marginRight: 6, marginBottom: 6,
    borderWidth: 1, borderColor: C.outlineVariant,
  },
  taskChipOn: { backgroundColor: C.primary, borderColor: C.primary },
  taskChipTxt: { fontSize: 12, fontWeight: '600', color: C.textMid },
  addTaskFill: {
    marginTop: 8, paddingVertical: 12, borderRadius: 12,
    backgroundColor: C.primary, alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
  },
  addTaskFillTxt: { fontSize: 15, fontWeight: '700', color: C.cardWhite },
  pointsSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pointsAmount: { fontSize: 20, fontWeight: '800', color: C.secondary },
  ptRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  ptBtnSub: {
    flex: 1,
    minHeight: 64,
    borderRadius: 12,
    padding: 16,
    backgroundColor: C.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW_3D_RED,
  },
  ptBtnTxtSub: { fontSize: 20, fontWeight: '600', color: C.error, marginTop: 6 },
  ptBtnAdd: {
    flex: 1,
    minHeight: 64,
    borderRadius: 12,
    padding: 16,
    backgroundColor: C.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW_3D_AMBER,
  },
  ptBtnTxtAdd: { fontSize: 20, fontWeight: '600', color: C.onSecondary, marginTop: 6 },
  ptLogPad: { paddingTop: 4 },
  ptLogRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.outlineVariant },
  ptLogSign: { fontSize: 16, fontWeight: '800', minWidth: 50 },
  ptLogReason: { fontSize: 13, fontWeight: '600', color: C.text },
  ptLogDate: { fontSize: 11, color: C.textLight, marginTop: 1 },
  ptInput: {
    height: 48, borderRadius: 12, backgroundColor: C.cardWhite, paddingHorizontal: 14,
    fontSize: 16, fontWeight: '600', color: C.text, borderWidth: 2, borderColor: C.outlineVariant,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 24 },
  modalSheet: { backgroundColor: C.cardWhite, borderRadius: 20, padding: 20, ...SHADOW },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 14, textAlign: 'center' },
  modalActions: { flexDirection: 'row', marginTop: 16, gap: 8 },
  modalBtnCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.outlineVariant, alignItems: 'center' },
  modalBtnOk: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalBtnTxt: { fontSize: 15, fontWeight: '700', color: C.cardWhite },
  modalBtnTxtCancel: { fontSize: 15, fontWeight: '700', color: C.textMid },
  pinBtn: {
    height: 48,
    width: '100%',
    backgroundColor: C.surfaceContainerHighest,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBtnTxt: { fontSize: 20, fontWeight: '600', color: C.text },
  resetRow: { flexDirection: 'row', gap: 8 },
  resetLeft: {
    flex: 1, height: 48, backgroundColor: C.surfaceContainerHighest, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  resetLeftTxt: { fontSize: 20, fontWeight: '600', color: C.error },
  resetRight: {
    flex: 1, height: 48, backgroundColor: C.error, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    ...SHADOW_3D_RED,
  },
  resetRightTxt: { fontSize: 20, fontWeight: '600', color: C.cardWhite },
  ver: { textAlign: 'center', fontSize: 12, color: C.textLight, marginTop: 8 },
});
