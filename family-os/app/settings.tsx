import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '@/components/ui';
import { useStore } from '@/lib/store';
import { isSupabaseConfigured } from '@/lib/supabase';
import { requestPermission, rescheduleReminders } from '@/lib/notifications';
import { RampConfig } from '@/lib/types';
import { theme } from '@/lib/theme';

export default function Settings() {
  const { ramps, setRamp, view, decisions } = useStore();

  const enableReminders = async () => {
    const ok = await requestPermission();
    if (!ok) {
      Alert.alert('Reminders', 'Notification permission was not granted.');
      return;
    }
    const n = await rescheduleReminders(view, decisions);
    Alert.alert('Reminders', `Scheduled ${n} reminder(s) for the ${view} view over the next few days.`);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Text style={styles.section}>Views</Text>
      <Card>
        <Text style={styles.body}>
          Each phone picks its own view with the Prakash / Shraddha / Family switcher at the top of the
          Now and Timeline screens. There’s no separate login for v1 — the switcher is the “who am I”.
        </Text>
      </Card>

      <Text style={styles.section}>Bedtime ramps</Text>
      {ramps.map((r) => (
        <RampEditor key={r.personKey} ramp={r} onSave={setRamp} />
      ))}

      <Text style={styles.section}>Reminders</Text>
      <Card>
        <Text style={styles.body}>
          Block reminders fire only where the plan asks for them — 10 min before the batch cook and
          reviews; at-time for the BP doses, shutdown ritual, and the HEB order. Markers never notify.
        </Text>
        <Pressable style={styles.btn} onPress={enableReminders}>
          <Text style={styles.btnText}>Enable / refresh reminders</Text>
        </Pressable>
      </Card>

      <Text style={styles.section}>Sync</Text>
      <Card>
        <Text style={styles.body}>
          {isSupabaseConfigured
            ? 'Supabase is configured — completions, weekly decisions, and captures sync across both phones.'
            : 'Supabase is not configured. The app runs fully offline against the bundled plan; set EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY to sync both phones.'}
        </Text>
      </Card>
    </ScrollView>
  );
}

function RampEditor({ ramp, onSave }: { ramp: RampConfig; onSave: (r: RampConfig) => void }) {
  const [startDate, setStartDate] = useState(ramp.startDate);
  const [startTime, setStartTime] = useState(ramp.startTime);
  const [targetTime, setTargetTime] = useState(ramp.targetTime);

  const label = ramp.personKey === 'prakash' ? 'Prakash' : ramp.personKey === 'ahana' ? 'Ahana' : ramp.personKey;

  return (
    <Card style={{ marginBottom: 12, gap: 10 }}>
      <Text style={styles.rampTitle}>{label} — bedtime ramp</Text>
      <Field label="Ramp start date (YYYY-MM-DD)" value={startDate} onChange={setStartDate} />
      <Field label="Start bedtime (HH:mm)" value={startTime} onChange={setStartTime} />
      <Field label="Target bedtime (HH:mm)" value={targetTime} onChange={setTargetTime} />
      <Pressable
        style={styles.btn}
        onPress={() => onSave({ ...ramp, startDate, startTime, targetTime })}
      >
        <Text style={styles.btnText}>Save</Text>
      </Pressable>
    </Card>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        placeholderTextColor={theme.textFaint}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  section: {
    color: theme.textFaint,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 22,
    marginBottom: 8
  },
  body: { color: theme.textDim, fontSize: 14, lineHeight: 20 },
  rampTitle: { color: theme.text, fontSize: 16, fontWeight: '700' },
  fieldLabel: { color: theme.textFaint, fontSize: 12, marginBottom: 4 },
  input: {
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: theme.text
  },
  btn: { backgroundColor: theme.accent, borderRadius: 12, paddingVertical: 11, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#0b1220', fontWeight: '800' }
});
