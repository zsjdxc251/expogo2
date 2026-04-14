import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Switch, TextInput, ScrollView, StyleSheet, Alert, Platform,
} from 'react-native';
import { C, AVATARS, RADIUS } from '../lib/theme';
import { useApp } from '../lib/AppContext';

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
  const { user, settings, updateUser: onUpdate, resetAll, requestPin } = useApp();
  const onClear = resetAll;
  const onChangePin = useCallback(() => requestPin('setup'), [requestPin]);
  const [editing, setEditing] = useState(null);
  const [tmpName, setTmpName] = useState(user?.name || '');
  const [tmpAvatar, setTmpAvatar] = useState(user?.avatar || '');

  const breakConfig = user?.breakConfig || { usageMinutes: 20, breakMinutes: 5 };

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

  return (
    <ScrollView style={st.root} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      <Text style={st.title}>家长设置</Text>
      <Text style={st.subtitle}>仅家长可访问此页面</Text>

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

  ver: { textAlign: 'center', fontSize: 12, color: C.textLight, marginTop: 24 },
});
