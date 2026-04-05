import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import LogScreen from '../screens/LogScreen';
import HistoryScreen from '../screens/HistoryScreen';
import InsightsScreen from '../screens/InsightsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ label }: { label: string }) {
  const icons: Record<string, string> = {
    Log: '📝',
    History: '📅',
    Insights: '🧠',
    Profile: '👤',
  };
  return <Text style={{ fontSize: 20 }}>{icons[label]}</Text>;
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: () => <TabIcon label={route.name} />,
          tabBarActiveTintColor: '#6C63FF',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            paddingBottom: 8,
            paddingTop: 8,
            height: 65,
            elevation: 8, // android shadow
          },
          headerShown: true,
          headerStyle: { backgroundColor: '#6C63FF' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        })}
      >
        <Tab.Screen name="Log" component={LogScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Insights" component={InsightsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}