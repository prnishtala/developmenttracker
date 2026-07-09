import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { theme } from '@/lib/theme';

function icon(emoji: string) {
  return ({ color }: { color: string }) => (
    <Text style={{ fontSize: 20, opacity: color === theme.accent ? 1 : 0.6 }}>{emoji}</Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: '800' },
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textFaint
      }}
    >
      <Tabs.Screen name="now" options={{ title: 'Now', tabBarIcon: icon('⌚') }} />
      <Tabs.Screen name="timeline" options={{ title: 'Timeline', tabBarIcon: icon('🗓️') }} />
      <Tabs.Screen name="reset" options={{ title: 'Reset', tabBarIcon: icon('🔄') }} />
      <Tabs.Screen name="reference" options={{ title: 'Manual', tabBarIcon: icon('📖') }} />
    </Tabs>
  );
}
