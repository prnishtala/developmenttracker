import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DateTime } from 'luxon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ViewSwitcher } from '@/components/ViewSwitcher';
import { TimelineRow } from '@/components/TimelineRow';
import { useStore } from '@/lib/store';
import { dayOccurrences } from '@/lib/schedule';
import { TZ, addDaysISO, dateHeading, todayLocal } from '@/lib/time';
import { theme } from '@/lib/theme';

export default function TimelineScreen() {
  const insets = useSafeAreaInsets();
  const { view, decisions } = useStore();
  const today = todayLocal();
  const [date, setDate] = useState(today);

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDaysISO(today, i)), [today]);
  const occ = useMemo(() => dayOccurrences(date, view, decisions), [date, view, decisions]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.h1}>Timeline</Text>
      <ViewSwitcher />

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
          {days.map((d) => {
            const dt = DateTime.fromISO(d, { zone: TZ });
            const active = d === date;
            return (
              <Pressable key={d} onPress={() => setDate(d)} style={[styles.day, active && styles.dayActive]}>
                <Text style={[styles.dayName, active && styles.dayTextActive]}>{dt.toFormat('ccc')}</Text>
                <Text style={[styles.dayNum, active && styles.dayTextActive]}>{dt.toFormat('d')}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <Text style={styles.heading}>{dateHeading(date)}</Text>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {occ.length === 0 ? (
          <Text style={styles.empty}>Nothing scheduled for this view.</Text>
        ) : (
          occ.map((o) => (
            <TimelineRow key={`${o.routine.id}-${o.date}`} occ={o} showOwner={view === 'family'} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  h1: { color: theme.text, fontSize: 28, fontWeight: '900', paddingHorizontal: 16, paddingBottom: 12 },
  dayStrip: { gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  day: {
    width: 52,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    alignItems: 'center'
  },
  dayActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  dayName: { color: theme.textDim, fontSize: 12, fontWeight: '600' },
  dayNum: { color: theme.text, fontSize: 18, fontWeight: '800' },
  dayTextActive: { color: '#0b1220' },
  heading: {
    color: theme.textFaint,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 4
  },
  empty: { color: theme.textFaint, paddingHorizontal: 16, paddingTop: 20 }
});
