import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LogScreen from '../screens/LogScreen';
import HistoryScreen from '../screens/HistoryScreen';
import InsightsScreen from '../screens/InsightsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AuthScreen from '../screens/AuthScreen';

const Tab = createBottomTabNavigator();

const C = {
  bg:        '#0A1628',
  bgCard:    '#111F35',
  border:    '#1E3352',
  teal:      '#4ECDC4',
  textDim:   '#3D5A7A',
  textWhite: '#F0F8FF',
};

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  {
    name: 'Log',
    label: 'Log',
    icon: (focused: boolean) => (
      <View style={[iconStyles.wrap, focused && { backgroundColor: C.teal + '18' }]}>
        {/* Plus cross icon */}
        <View style={[iconStyles.plusV, { backgroundColor: focused ? C.teal : C.textDim }]} />
        <View style={[iconStyles.plusH, { backgroundColor: focused ? C.teal : C.textDim }]} />
      </View>
    ),
  },
  {
    name: 'History',
    label: 'History',
    icon: (focused: boolean) => (
      <View style={[iconStyles.wrap, focused && { backgroundColor: C.teal + '18' }]}>
        {/* Calendar icon */}
        <View style={[iconStyles.calOuter, { borderColor: focused ? C.teal : C.textDim }]}>
          <View style={iconStyles.calRow}>
            {[0,1,2].map(i => (
              <View key={i} style={[iconStyles.calDot, { backgroundColor: focused ? C.teal : C.textDim }]} />
            ))}
          </View>
          <View style={iconStyles.calRow}>
            {[0,1,2].map(i => (
              <View key={i} style={[iconStyles.calDot, { backgroundColor: focused ? C.teal : C.textDim }]} />
            ))}
          </View>
        </View>
      </View>
    ),
  },
  {
    name: 'Insights',
    label: 'Insights',
    icon: (focused: boolean) => (
      <View style={[iconStyles.wrap, focused && { backgroundColor: C.teal + '18' }]}>
        {/* Brain / sparkle icon */}
        <View style={iconStyles.sparkleWrap}>
          <View style={[iconStyles.sparkleDot, { backgroundColor: focused ? C.teal : C.textDim }]} />
          <View style={[iconStyles.sparkleLineH, { backgroundColor: focused ? C.teal + '80' : C.textDim + '60' }]} />
          <View style={[iconStyles.sparkleLineV, { backgroundColor: focused ? C.teal + '80' : C.textDim + '60' }]} />
          <View style={[iconStyles.sparkleDotSm, { backgroundColor: focused ? C.teal : C.textDim, top: 4, right: 4 }]} />
          <View style={[iconStyles.sparkleDotSm, { backgroundColor: focused ? C.teal : C.textDim, bottom: 4, left: 4 }]} />
        </View>
      </View>
    ),
  },
  {
    name: 'Profile',
    label: 'Profile',
    icon: (focused: boolean) => (
      <View style={[iconStyles.wrap, focused && { backgroundColor: C.teal + '18' }]}>
        {/* Person icon */}
        <View style={iconStyles.personWrap}>
          <View style={[iconStyles.personHead, { borderColor: focused ? C.teal : C.textDim }]} />
          <View style={[iconStyles.personBody, { borderColor: focused ? C.teal : C.textDim }]} />
        </View>
      </View>
    ),
  },
];

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[tabStyles.outerWrap, { paddingBottom: insets.bottom || 12 }]}>
      {/* Glass blur effect via layered views */}
      <View style={tabStyles.bar}>
        {/* Top separator line */}
        <View style={tabStyles.topLine} />

        <View style={tabStyles.tabRow}>
          {TABS.map((tab, index) => {
            const focused = state.index === index;

            return (
              <TouchableOpacity
                key={tab.name}
                style={tabStyles.tabItem}
                onPress={() => navigation.navigate(tab.name)}
                activeOpacity={0.7}
              >
                {/* Active indicator line above icon */}
                <View style={[
                  tabStyles.activeLine,
                  focused && { backgroundColor: C.teal },
                ]} />

                {/* Icon */}
                {tab.icon(focused)}

                {/* Label */}
                <Text style={[
                  tabStyles.label,
                  { color: focused ? C.teal : C.textDim },
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export default function Navigation() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return (
      <NavigationContainer>
        <AuthScreen onLogin={() => setIsLoggedIn(true)} />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: C.bg },
          headerTintColor: C.textWhite,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 17,
            letterSpacing: -0.3,
          },
          headerShadowVisible: false,
        }}
      >
        <Tab.Screen
          name="Log"
          component={LogScreen}
          options={{ title: 'Daily Log' }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: 'History' }}
        />
        <Tab.Screen
          name="Insights"
          component={InsightsScreen}
          options={{ title: 'AI Insights' }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// ─── Icon Styles ──────────────────────────────────────────────────────────────

const iconStyles = StyleSheet.create({
  wrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },

  // Plus icon (Log)
  plusV: {
    position: 'absolute',
    width: 2.5,
    height: 18,
    borderRadius: 2,
  },
  plusH: {
    position: 'absolute',
    width: 18,
    height: 2.5,
    borderRadius: 2,
  },

  // Calendar icon (History)
  calOuter: {
    width: 22,
    height: 18,
    borderWidth: 1.5,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  calRow: {
    flexDirection: 'row',
    gap: 3,
  },
  calDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },

  // Sparkle icon (Insights)
  sparkleWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sparkleDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    position: 'absolute',
  },
  sparkleDotSm: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
  },
  sparkleLineH: {
    position: 'absolute',
    width: 18,
    height: 1.5,
    borderRadius: 1,
  },
  sparkleLineV: {
    position: 'absolute',
    width: 1.5,
    height: 18,
    borderRadius: 1,
  },

  // Person icon (Profile)
  personWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 22,
    gap: 2,
  },
  personHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  personBody: {
    width: 16,
    height: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1.5,
    borderBottomWidth: 0,
  },
});

// ─── Tab Bar Styles ───────────────────────────────────────────────────────────

const tabStyles = StyleSheet.create({
  outerWrap: {
    backgroundColor: C.bg,
  },
  bar: {
    backgroundColor: C.bgCard,
    marginHorizontal: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  topLine: {
    height: 1,
    backgroundColor: C.border,
  },
  tabRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 6,
  },
  activeLine: {
    height: 2.5,
    width: 24,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 1,
  },
});