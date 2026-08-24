import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'destructive';

/** Pastille de statut : rôle, état d'un tour, « non lu ». */
export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const theme = useTheme();

  const color = {
    neutral: theme.mutedForeground,
    brand: theme.brand,
    success: theme.success,
    warning: theme.warning,
    destructive: theme.destructive,
  }[tone];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: withAlpha(color, 0.12), borderColor: withAlpha(color, 0.3) },
      ]}
    >
      <ThemedText style={[styles.label, { color }]}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  label: { fontFamily: Fonts.medium, fontSize: 12, lineHeight: 16 },
});
