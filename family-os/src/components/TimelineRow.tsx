import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Occurrence } from '@/lib/types';
import { categoryMeta, PERSON_LABEL } from '@/lib/categories';
import { label12h } from '@/lib/time';
import { theme } from '@/lib/theme';
import { CategoryDot, DoneCheck } from './ui';
import { useStore } from '@/lib/store';

export function TimelineRow({ occ, showOwner }: { occ: Occurrence; showOwner?: boolean }) {
  const router = useRouter();
  const { isDone, toggleDone } = useStore();
  const meta = categoryMeta(occ.routine.category);
  const done = isDone(occ.routine.id, occ.date, occ.effectiveOwner);

  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push({ pathname: '/routine/[id]', params: { id: occ.routine.id, date: occ.date } })}
    >
      <View style={styles.time}>
        <Text style={styles.timeText}>{occ.routine.marker ? '—' : label12h(occ.startLocal)}</Text>
      </View>
      <View style={[styles.rail, { backgroundColor: meta.color }]} />
      <View style={styles.body}>
        <Text style={[styles.title, done && styles.titleDone]} numberOfLines={2}>
          {occ.routine.terseLine}
        </Text>
        <View style={styles.metaRow}>
          <CategoryDot category={occ.routine.category} size={7} />
          <Text style={styles.metaText}>{meta.label}</Text>
          {showOwner ? <Text style={styles.metaText}>· {PERSON_LABEL[occ.effectiveOwner]}</Text> : null}
          {occ.routine.noPhone ? <Text style={styles.noPhone}>· 📵 no phones</Text> : null}
        </View>
      </View>
      {!occ.routine.marker ? (
        <DoneCheck done={done} onPress={() => toggleDone(occ.routine.id, occ.date, occ.effectiveOwner)} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 16
  },
  time: { width: 62 },
  timeText: { color: theme.textDim, fontSize: 12, fontWeight: '600', textAlign: 'right' },
  rail: { width: 3, alignSelf: 'stretch', borderRadius: 2, minHeight: 34 },
  body: { flex: 1 },
  title: { color: theme.text, fontSize: 15, fontWeight: '600', lineHeight: 20 },
  titleDone: { color: theme.textFaint, textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3, flexWrap: 'wrap' },
  metaText: { color: theme.textFaint, fontSize: 12 },
  noPhone: { color: '#f472b6', fontSize: 12, fontWeight: '600' }
});
