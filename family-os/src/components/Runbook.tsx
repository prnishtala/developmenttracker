import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Runbook as RunbookType } from '@/lib/types';
import { theme } from '@/lib/theme';

/** Renders the full "no decision to make, just execution" detail for a block. */
export function Runbook({ runbook }: { runbook: RunbookType }) {
  return (
    <View style={{ gap: 18 }}>
      {runbook.summary ? <Text style={styles.summary}>{runbook.summary}</Text> : null}

      {runbook.gating ? (
        <View style={[styles.callout, { borderColor: '#eab308' }]}>
          <Text style={styles.calloutLabel}>GATE</Text>
          <Text style={styles.calloutText}>{runbook.gating}</Text>
        </View>
      ) : null}

      {runbook.sections.map((s, i) => (
        <View key={i} style={{ gap: 8 }}>
          {s.heading ? <Text style={styles.heading}>{s.heading}</Text> : null}
          {s.steps.map((step, j) => (
            <View key={j} style={styles.stepRow}>
              <Text style={styles.bullet}>{s.ordered ? `${j + 1}.` : '•'}</Text>
              <Text style={styles.step}>{step}</Text>
            </View>
          ))}
        </View>
      ))}

      {runbook.notes?.length ? (
        <View style={{ gap: 6 }}>
          {runbook.notes.map((n, i) => (
            <Text key={i} style={styles.note}>
              {n}
            </Text>
          ))}
        </View>
      ) : null}

      {runbook.minViable ? (
        <View style={[styles.callout, { borderColor: theme.done }]}>
          <Text style={[styles.calloutLabel, { color: theme.done }]}>MINIMUM VIABLE</Text>
          <Text style={styles.calloutText}>{runbook.minViable}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { color: theme.text, fontSize: 16, lineHeight: 23 },
  heading: { color: theme.accent, fontSize: 13, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  stepRow: { flexDirection: 'row', gap: 10, paddingRight: 8 },
  bullet: { color: theme.textFaint, fontSize: 15, lineHeight: 22, minWidth: 18 },
  step: { color: theme.text, fontSize: 15, lineHeight: 22, flex: 1 },
  note: { color: theme.textDim, fontSize: 13, lineHeight: 19, fontStyle: 'italic' },
  callout: { borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 6, gap: 4 },
  calloutLabel: { color: '#eab308', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  calloutText: { color: theme.text, fontSize: 14, lineHeight: 20 }
});
