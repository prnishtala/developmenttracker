import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { theme } from '@/lib/theme';
import { categoryMeta } from '@/lib/categories';
import { Category } from '@/lib/types';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function CategoryDot({ category, size = 10 }: { category: Category; size?: number }) {
  const meta = categoryMeta(category);
  return (
    <View
      style={{ width: size, height: size, borderRadius: size, backgroundColor: meta.color }}
    />
  );
}

export function Chip({
  label,
  active,
  onPress,
  color
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && { backgroundColor: color ?? theme.accent, borderColor: color ?? theme.accent }
      ]}
    >
      <Text style={[styles.chipText, active && { color: '#0b1220', fontWeight: '700' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Optional one-tap done — never required. A calm circle, no nagging. */
export function DoneCheck({ done, onPress }: { done: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={styles.check}>
      <View style={[styles.checkCircle, done && styles.checkCircleDone]}>
        {done && <Text style={styles.checkMark}>✓</Text>}
      </View>
    </Pressable>
  );
}

export function Screen({ children }: { children: React.ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  card: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface
  },
  chipText: { color: theme.textDim, fontSize: 14, fontWeight: '600' },
  check: { padding: 4 },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: theme.textFaint,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkCircleDone: { backgroundColor: theme.done, borderColor: theme.done },
  checkMark: { color: '#06210f', fontWeight: '900', fontSize: 16, lineHeight: 18 }
});
