import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip } from './ui';
import { useStore } from '@/lib/store';
import { View as ViewKey } from '@/lib/types';
import { theme } from '@/lib/theme';

const OPTIONS: { key: ViewKey; label: string; color: string }[] = [
  { key: 'prakash', label: 'Prakash', color: '#38bdf8' },
  { key: 'shraddha', label: 'Shraddha', color: '#f472b6' },
  { key: 'family', label: 'Family', color: '#34d399' }
];

export function ViewSwitcher() {
  const { view, setView } = useStore();
  return (
    <View style={styles.row}>
      {OPTIONS.map((o) => (
        <Chip
          key={o.key}
          label={o.label}
          active={view === o.key}
          color={o.color}
          onPress={() => setView(o.key)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: theme.bg
  }
});
