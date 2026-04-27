import { useCallback, useEffect, useRef } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { C } from '../lib/theme';
import { useApp } from '../lib/AppContext';

import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TAB_META = {
  Home:     { icon: 'home',    label: '主页' },
  History:  { icon: 'stars',   label: '积分' },
  Settings: { icon: 'lock',    label: '家长' },
};

function TabIcon({ routeName, focused }) {
  const meta = TAB_META[routeName];
  return (
    <View style={st.tabItem}>
      <MaterialIcons
        name={meta.icon}
        size={24}
        color={focused ? '#fff' : 'rgba(255,255,255,0.55)'}
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
    borderTopWidth: 0,
    height: 64,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    position: 'absolute',
    bottom: 0,
    left: 16, right: 16,
    elevation: 6,
    shadowColor: 'rgba(0,102,112,0.15)',
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
  },
  tabItem: { alignItems: 'center', paddingTop: 6 },
  tabLabel: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2, fontWeight: '500' },
  tabLabelOn: { color: '#fff', fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, gap: 12 },
  emptyTxt: { fontSize: 16, color: C.textMid, fontWeight: '600' },
});
