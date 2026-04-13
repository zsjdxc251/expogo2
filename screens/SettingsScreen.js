import { useState } from 'react';
import {
  View, Text, TouchableOpacity, Switch, TextInput, ScrollView, StyleSheet, Alert, Platform,
} from 'react-native';
import { C, SHADOW, AVATARS } from '../lib/theme';

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

export default function SettingsScreen({ user, settings, onUpdate, onClear }) {
  const [editing, setEditing] = useState(null); // 'name' | 'avatar' | null
  const [tmpName, setTmpName] = useState(user.name);
  const [tmpAvatar, setTmpAvatar] = useState(user.avatar);

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

  return (
    <ScrollView style={st.root} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      <Text style={st.title}>设置</Text>

      <View style={st.card}>
        {/* Auto submit */}
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

        {/* Name */}
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

        {/* Avatar */}
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
        <View style={st.divider} />

        {/* Reset */}
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

      <Text style={st.ver}>数学星球 v2.0</Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 16 },

  card: { backgroundColor: C.card, borderRadius: 20, overflow: 'hidden', ...SHADOW, shadowOpacity: 0.05 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: C.text },
  rowDesc: { fontSize: 13, color: C.textLight, marginTop: 2 },
  arrow: { fontSize: 16, color: C.textLight, fontWeight: '600' },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 18 },

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
