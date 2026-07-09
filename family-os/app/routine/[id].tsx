import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Runbook } from '@/components/Runbook';
import { Card, CategoryDot, DoneCheck } from '@/components/ui';
import { routineById } from '@/data/seed';
import { useStore } from '@/lib/store';
import { rampStatus } from '@/lib/ramp';
import { categoryMeta, PERSON_LABEL } from '@/lib/categories';
import { dateHeading, label12h, todayLocal } from '@/lib/time';
import { theme } from '@/lib/theme';

export default function RoutineDetail() {
  const { id, date } = useLocalSearchParams<{ id: string; date?: string }>();
  const routine = routineById(String(id));
  const { isDone, toggleDone, ramps } = useStore();

  if (!routine) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Not found</Text>
      </View>
    );
  }

  const day = date ?? todayLocal();
  const meta = categoryMeta(routine.category);
  const isReference = routine.category === 'reference';
  const done = isDone(routine.id, day, routine.owner);

  const ramp = ramps.find((r) => r.personKey === routine.owner);
  const showRamp =
    !!ramp && (routine.category === 'sleep' || routine.id.startsWith('ahana-winddown'));
  const status = showRamp && ramp ? rampStatus(ramp, day) : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Stack.Screen options={{ title: meta.label }} />

      <View style={styles.header}>
        <CategoryDot category={routine.category} size={12} />
        <Text style={styles.eyebrow}>
          {meta.label} · {PERSON_LABEL[routine.owner]}
        </Text>
      </View>
      <Text style={styles.title}>{routine.title}</Text>
      {!isReference ? (
        <Text style={styles.when}>
          {label12h(routine.startLocal)}–{label12h(routine.endLocal)} · {dateHeading(day)}
        </Text>
      ) : null}
      {routine.noPhone ? <Text style={styles.noPhone}>📵 Phones physically out of the room</Text> : null}

      {status ? (
        <Card style={{ marginTop: 14, borderColor: status.done ? theme.done : '#eab308' }}>
          <Text style={styles.rampLabel}>TONIGHT’S RAMP TARGET</Text>
          <Text style={styles.rampValue}>{status.targetLabel}</Text>
          <Text style={styles.rampNote}>
            {status.done
              ? 'You’ve reached the end-state target — hold it here.'
              : 'Shift 15 min earlier every 3–4 nights toward the end-state. Wake time stays put during the ramp.'}
          </Text>
        </Card>
      ) : null}

      <View style={{ marginTop: 20 }}>
        <Runbook runbook={routine.runbook} />
      </View>

      {!isReference ? (
        <Card style={styles.doneCard}>
          <View>
            <Text style={styles.doneTitle}>{done ? 'Marked done' : 'Mark done'}</Text>
            <Text style={styles.doneSub}>Optional — just for your own glance and the Family view.</Text>
          </View>
          <DoneCheck done={done} onPress={() => toggleDone(routine.id, day, routine.owner)} />
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { color: theme.textDim, fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  title: { color: theme.text, fontSize: 24, fontWeight: '900', marginTop: 8 },
  when: { color: theme.textDim, fontSize: 14, marginTop: 6 },
  noPhone: { color: '#f472b6', fontSize: 13, fontWeight: '700', marginTop: 8 },
  rampLabel: { color: theme.textFaint, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  rampValue: { color: theme.text, fontSize: 30, fontWeight: '900', marginTop: 4 },
  rampNote: { color: theme.textDim, fontSize: 13, lineHeight: 19, marginTop: 6 },
  doneCard: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  doneTitle: { color: theme.text, fontSize: 16, fontWeight: '700' },
  doneSub: { color: theme.textFaint, fontSize: 12, marginTop: 2, maxWidth: 240 }
});
