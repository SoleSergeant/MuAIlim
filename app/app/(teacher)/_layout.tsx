import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { C } from '../../constants/colors';

export default function TeacherLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: C.green,
      tabBarInactiveTintColor: C.textTertiary,
      tabBarStyle: { borderTopColor: C.border, borderTopWidth: 0.5, backgroundColor: C.bg },
      tabBarLabelStyle: { fontSize: 11, marginBottom: 2 },
    }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text> }}
      />
      <Tabs.Screen
        name="students"
        options={{ title: "O'quvchilar", tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👥</Text> }}
      />
      <Tabs.Screen
        name="create-test"
        options={{ title: 'Test yaratish', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>✏️</Text> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text> }}
      />
    </Tabs>
  );
}
