import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { C } from '../../constants/colors';

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={tabStyles.container}>
      <Text style={tabStyles.icon}>{icon}</Text>
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: { alignItems: 'center', gap: 2 },
  icon: { fontSize: 20 },
  label: { fontSize: 10, color: C.textTertiary },
  labelActive: { color: C.green, fontWeight: '600' },
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.bg,
          borderTopColor: C.border,
          borderTopWidth: 0.5,
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: C.green,
        tabBarInactiveTintColor: C.textTertiary,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Bosh" focused={focused} /> }}
      />
      <Tabs.Screen
        name="practice"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🎯" label="Mashq" focused={focused} /> }}
      />
      <Tabs.Screen
        name="notebook"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📒" label="Daftar" focused={focused} /> }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏆" label="Reyting" focused={focused} /> }}
      />
    </Tabs>
  );
}
