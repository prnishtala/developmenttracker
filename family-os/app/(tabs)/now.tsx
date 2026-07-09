import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DateTime } from 'luxon';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ViewSwitcher } from '@/components/ViewSwitcher';
import { TimelineRow } from '@/components/TimelineRow';
import { Card, CategoryDot, DoneCheck } from '@/components/ui';
import { useStore } from '@/lib/store';
import { dayOccurrences, splitNow } from '@/lib/schedule';
import { Occurrence } from '@/lib/types';
import { TZ, dateHeading, label12h, nowMinutes, todayLocal } from '@/lib/time';
import { categoryMeta, PERSON_LABEL } from '@/lib/categories';
import { fetchWeekBrief } from '@/lib/brief';
import { theme } from '@/lib/theme';

export default function NowScreen() {
  const insets = useSafeAreaInsets();
  const { view, decisions, ready } = useStore();
  const [clock, setClock] = useState(() => DateTime.now().setZone(TZ));
  const [briefing, setBriefing] = useState(false);

  const showBrief = async () => {
    setBriefing(true);
    try {
      const brief = await fetchWeekBrief(view, decisions);
      Alert.alert('Week ahead', brief);
    } finally {
      setBriefing(false);
    }
  };

  // Re-evaluate "right now" every 30s.
  useEffect(() => {
    const t = setInterval(() => setClock(DateTime.now().setZone(TZ)), 30_000);
    return () => clearInterval(t);
  }, []);

  const date = todayLocal(clock);
  const min = nowMinutes(clock);
  const occ = useMemo(() => dayOccurrences(date, view, decisions), [date, view, decisions]);
  const { current, next, rest, markers } = useMemo(() => splitNow(occ, min), [occ, min]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.h1}>Right now</Text>
          <Text style={styles.sub}>{dateHeading(date)} · {label12h(`${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`)}</Text>
        </View>
        <Pressable style={styles.brief} onPress={showBrief} disabled={briefing}>
          {briefing ? (
            <ActivityIndicator color={theme.accent} size="small" />
          ) : (
            <Text style={styles.briefText}>✨ Week</Text>
          )}
        </Pressable>
      </View>
      <ViewSwitcher />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {markers.length ? (
          <View style={styles.markers}>
            {markers.map((m) => (
              <Text key={m.routine.id} style={styles.marker}>
                {categoryMeta(m.routine.category).emoji} {m.routine.terseLine}
              </Text>
            ))}
          </View>
        ) : null}

        {current ? <NowCard occ={current} label="Doing now" big /> : <IdleCard ready={ready} />}
        {next ? <NowCard occ={next} label="Next up" /> : null}

        {rest.length ? (
          <>
            <Text style={styles.section}>Later today</Text>
            {rest.map((o) => (
              <TimelineRow key={`${o.routine.id}-${o.date}`} occ={o} showOwner={view === 'family'} />
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function NowCard({ occ, label, big }: { occ: Occurrence; label: string; big?: boolean }) {
  const router = useRouter();
  const { isDone, toggleDone } = useStore();
  const meta = categoryMeta(occ.routine.category);
  const done = isDone(occ.routine.id, occ.date, occ.effectiveOwner);
  return (
    <Card style={{ marginHorizontal: 16, marginTop: 12, borderColor: meta.color }}>
      <View style={styles.cardTop}>
        <View style={styles.cardLabel}>
          <CategoryDot category={occ.routine.category} />
          <Text style={[styles.cardLabelText, { color: meta.color }]}>{label.toUpperCase()}</Text>
        </View>
        <Text style={styles.cardTime}>
          {label12h(occ.startLocal)}–{label12h(occ.endLocal)}
        </Text>
      </View>
      <Pressable
        onPress={() => router.push({ pathname: '/routine/[id]', params: { id: occ.routine.id, date: occ.date } })}
      >
        <Text style={[styles.cardTitle, big && styles.cardTitleBig]}>{occ.routine.title}</Text>
        {occ.routine.runbook.summary ? (
          <Text style={styles.cardSummary} numberOfLines={big ? 4 : 2}>
            {occ.routine.runbook.summary}
          </Text>
        ) : null}
      </Pressable>
      <View style={styles.cardFoot}>
        <Text style={styles.cardOwner}>
          {meta.emoji} {PERSON_LABEL[occ.effectiveOwner]}
          {occ.routine.noPhone ? '  · 📵 no phones' : ''}
        </Text>
        <View style={styles.cardFootRight}>
          <Text style={styles.tapHint}>tap for the runbook →</Text>
          <DoneCheck done={done} onPress={() => toggleDone(occ.routine.id, occ.date, occ.effectiveOwner)} />
        </View>
      </View>
    </Card>
  );
}

function IdleCard({ ready }: { ready: boolean }) {
  return (
    <Card style={{ marginHorizontal: 16, marginTop: 12 }}>
      <Text style={styles.cardTitle}>{ready ? 'Nothing scheduled right now' : 'Loading…'}</Text>
      <Text style={styles.cardSummary}>Open time — check “Next up” below, or switch views up top.</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  brief: {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 74,
    alignItems: 'center'
  },
  briefText: { color: theme.accent, fontWeight: '700', fontSize: 13 },
  h1: { color: theme.text, fontSize: 28, fontWeight: '900' },
  sub: { color: theme.textDim, fontSize: 13, marginTop: 2 },
  markers: { paddingHorizontal: 16, paddingTop: 8, gap: 4 },
  marker: { color: theme.textDim, fontSize: 13 },
  section: {
    color: theme.textFaint,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 4
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardLabelText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6 },
  cardTime: { color: theme.textDim, fontSize: 12, fontWeight: '600' },
  cardTitle: { color: theme.text, fontSize: 19, fontWeight: '800', marginTop: 10 },
  cardTitleBig: { fontSize: 24 },
  cardSummary: { color: theme.textDim, fontSize: 14, lineHeight: 20, marginTop: 6 },
  cardFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14
  },
  cardOwner: { color: theme.textDim, fontSize: 13, fontWeight: '600' },
  cardFootRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tapHint: { color: theme.textFaint, fontSize: 12 }
});
