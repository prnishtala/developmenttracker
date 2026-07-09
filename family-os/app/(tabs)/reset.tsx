import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Chip } from '@/components/ui';
import { Runbook } from '@/components/Runbook';
import { useStore } from '@/lib/store';
import { routineById } from '@/data/seed';
import { PersonKey, WeeklyDecision } from '@/lib/types';
import { todayLocal, weekStart, dateHeading } from '@/lib/time';
import { theme } from '@/lib/theme';

const DAYS: { code: string; label: string }[] = [
  { code: 'MO', label: 'Mon' },
  { code: 'TU', label: 'Tue' },
  { code: 'WE', label: 'Wed' },
  { code: 'TH', label: 'Thu' },
  { code: 'FR', label: 'Fri' }
];

export default function ResetScreen() {
  const insets = useSafeAreaInsets();
  const { decisionForWeek, setDecision, captures, addCapture, clearCaptures } = useStore();
  const wk = weekStart(todayLocal());
  const decision = decisionForWeek(wk);
  const resetRunbook = routineById('reset-weekly')?.runbook;
  const [note, setNote] = useState('');

  const update = (patch: Partial<WeeklyDecision>) =>
    setDecision({ weekStart: wk, ...decision, ...patch } as WeeklyDecision);

  const morningDays = decision?.prakashMorningDays ?? [];
  const toggleMorning = (code: string) => {
    const has = morningDays.includes(code);
    const next = has ? morningDays.filter((d) => d !== code) : [...morningDays, code];
    update({ prakashMorningDays: next });
  };

  const ownerChip = (label: string, value: PersonKey, active: boolean, on: () => void) => (
    <Chip label={label} active={active} onPress={on} color="#38bdf8" />
  );

  const savedMsg = useMemo(() => {
    if (!decision) return 'Not set yet for this week.';
    const bits: string[] = [];
    if (decision.wednesdayRefreshOwner) bits.push(`Wed cook: ${decision.wednesdayRefreshOwner}`);
    if (morningDays.length) bits.push(`Prakash mornings: ${morningDays.join(', ')}`);
    if (decision.laundryOwner) bits.push(`Laundry: ${decision.laundryOwner}`);
    return bits.length ? bits.join(' · ') : 'Not set yet for this week.';
  }, [decision, morningDays]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 48 }}
    >
      <Text style={styles.h1}>Weekly Reset</Text>
      <Text style={styles.sub}>Week of {dateHeading(wk)} · 15 min, both of you</Text>

      {resetRunbook ? (
        <Card style={{ marginTop: 16 }}>
          <Runbook runbook={resetRunbook} />
        </Card>
      ) : null}

      <Text style={styles.section}>This week’s decisions</Text>
      <Text style={styles.savedMsg}>{savedMsg}</Text>

      <Card style={{ marginTop: 12, gap: 16 }}>
        <View>
          <Text style={styles.q}>Who owns Wednesday’s refresh?</Text>
          <View style={styles.chipRow}>
            {ownerChip('Prakash', 'prakash', decision?.wednesdayRefreshOwner === 'prakash', () =>
              update({ wednesdayRefreshOwner: 'prakash' })
            )}
            {ownerChip('Shraddha', 'shraddha', decision?.wednesdayRefreshOwner === 'shraddha', () =>
              update({ wednesdayRefreshOwner: 'shraddha' })
            )}
          </View>
        </View>

        <View>
          <Text style={styles.q}>Which 2 mornings does Prakash take the 8–9 Ahana block?</Text>
          <View style={styles.chipRow}>
            {DAYS.map((d) => (
              <Chip
                key={d.code}
                label={d.label}
                active={morningDays.includes(d.code)}
                color="#38bdf8"
                onPress={() => toggleMorning(d.code)}
              />
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.q}>Whose laundry week is it?</Text>
          <View style={styles.chipRow}>
            {ownerChip('Prakash', 'prakash', decision?.laundryOwner === 'prakash', () =>
              update({ laundryOwner: 'prakash' })
            )}
            {ownerChip('Shraddha', 'shraddha', decision?.laundryOwner === 'shraddha', () =>
              update({ laundryOwner: 'shraddha' })
            )}
          </View>
        </View>
      </Card>

      <View style={styles.captureHead}>
        <Text style={styles.section}>Capture inbox</Text>
        {captures.length ? (
          <Pressable onPress={clearCaptures}>
            <Text style={styles.clear}>Empty ({captures.length})</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.sub}>The mid-day “net” — dump a thought so it stops interrupting. Empty it here at the reset.</Text>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a quick note…"
          placeholderTextColor={theme.textFaint}
          value={note}
          onChangeText={setNote}
          onSubmitEditing={() => {
            addCapture(note);
            setNote('');
          }}
          returnKeyType="done"
        />
        <Pressable
          style={styles.addBtn}
          onPress={() => {
            addCapture(note);
            setNote('');
          }}
        >
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      {captures.map((c) => (
        <View key={c.id} style={styles.captureItem}>
          <Text style={styles.captureText}>• {c.text}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  h1: { color: theme.text, fontSize: 28, fontWeight: '900' },
  sub: { color: theme.textDim, fontSize: 13, marginTop: 4, lineHeight: 19 },
  section: {
    color: theme.textFaint,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 24
  },
  savedMsg: { color: theme.accent, fontSize: 13, marginTop: 6, fontWeight: '600' },
  q: { color: theme.text, fontSize: 15, fontWeight: '700', marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  captureHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  clear: { color: '#f472b6', fontSize: 13, fontWeight: '700', marginTop: 24 },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  input: {
    flex: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: theme.text
  },
  addBtn: { backgroundColor: theme.accent, borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' },
  addBtnText: { color: '#0b1220', fontWeight: '800' },
  captureItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border },
  captureText: { color: theme.text, fontSize: 15 }
});
