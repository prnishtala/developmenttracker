import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { REFERENCE_ONLY } from '@/data/seed';
import { theme } from '@/lib/theme';

export default function ReferenceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 48 }}
    >
      <Text style={styles.h1}>The manual</Text>
      <Text style={styles.sub}>
        Decision trees, emergency info, and the reference cards — so the whole system lives in one app.
      </Text>

      <View style={{ marginTop: 16, gap: 10 }}>
        {REFERENCE_ONLY.map((r) => (
          <Pressable
            key={r.id}
            style={styles.item}
            onPress={() => router.push({ pathname: '/routine/[id]', params: { id: r.id } })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{r.title}</Text>
              <Text style={styles.line}>{r.terseLine}</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.settings} onPress={() => router.push('/settings')}>
        <Text style={styles.settingsText}>⚙️  Settings</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  h1: { color: theme.text, fontSize: 28, fontWeight: '900' },
  sub: { color: theme.textDim, fontSize: 13, marginTop: 6, lineHeight: 19 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius,
    padding: 16
  },
  title: { color: theme.text, fontSize: 16, fontWeight: '700' },
  line: { color: theme.textDim, fontSize: 13, marginTop: 3 },
  chev: { color: theme.textFaint, fontSize: 24, fontWeight: '300' },
  settings: {
    marginTop: 24,
    padding: 16,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center'
  },
  settingsText: { color: theme.textDim, fontSize: 15, fontWeight: '600' }
});
