import { useCallback, useEffect, useRef } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { C, SHADOW } from '../lib/theme';
import { useApp } from '../lib/AppContext';

import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TAB_META = {
  Home:     { icon: 'home',            label: '主页' },
  History:  { icon: 'history',         label: '历史' },
  Settings: { icon: 'manage-accounts',  label: '设置' },
};

function TabIcon({ routeName, focused }) {
  const meta = TAB_META[routeName];
  return (
    <View style={[st.tabItem, focused && st.tabItemActive]}>
      <MaterialIcons
        name={meta.icon}
        size={24}
        color={focused ? C.titleAccent : '#94a3b8'}
      />
      <Text style={[st.tabLabel, focused && st.tabLabelOn]}>{meta.label}</Text>
    </View>
  );
}

export default function MainTabs() {
  const { user, isParent, requestPin, exitParent } = useApp();
  const tabNavRef = useRef(null);
  const prevParent = useRef(isParent);

  useEffect(() => {
    if (isParent && !prevParent.current && tabNavRef.current) {
      tabNavRef.current.navigate('Settings');
    }
    prevParent.current = isParent;
  }, [isParent]);

  const settingsListeners = useCallback(({ navigation }) => {
    tabNavRef.current = navigation;
    return {
      tabPress: (e) => {
        if (!isParent) {
          e.preventDefault();
          if (!user?.parentPin) {
            requestPin('setup');
          } else {
            requestPin('verify');
          }
        }
      },
    };
  }, [user, isParent, requestPin]);

  const otherListeners = useCallback(() => ({
    tabPress: () => exitParent(),
  }), [exitParent]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: st.bar,
        tabBarShowLabel: false,
        tabBarIcon: ({ focused }) => <TabIcon routeName={route.name} focused={focused} />,
        sceneStyle: { paddingBottom: 80 },
        tabBarItemStyle: st.tabBarItem,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} listeners={otherListeners} />
      <Tab.Screen name="History" component={HistoryScreen} listeners={otherListeners} />
      <Tab.Screen
        name="Settings"
        component={isParent ? SettingsScreen : EmptySettings}
        listeners={settingsListeners}
      />
    </Tab.Navigator>
  );
}

function EmptySettings() {
  return (
    <View style={st.empty}>
      <MaterialIcons name="lock" size={48} color={C.textLight} />
      <Text style={st.emptyTxt}>请验证家长密码</Text>
    </View>
  );
}

const st = StyleSheet.create({
  bar: {
    backgroundColor: C.navBg,
    height: 80,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 0,
    borderColor: '#E0F7FA',
    ...SHADOW,
    shadowColor: 'rgba(51,143,155,0.15)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  tabBarItem: { justifyContent: 'center' },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
    minHeight: 56,
  },
  tabItemActive: {
    backgroundColor: '#E0F7FA',
    borderRadius: 16,
  },
  tabLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4, fontWeight: '500' },
  tabLabelOn: { color: C.titleAccent, fontWeight: '500' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, gap: 12 },
  emptyTxt: { fontSize: 16, color: C.textMid, fontWeight: '600' },
});
