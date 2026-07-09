import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from '@/lib/store';
import { theme } from '@/lib/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.bg },
            headerTintColor: theme.text,
            contentStyle: { backgroundColor: theme.bg }
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="routine/[id]" options={{ title: '', presentation: 'card' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
