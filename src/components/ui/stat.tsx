import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type StatProps = {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'brand' | 'destructive';
};

/**
 * Un chiffre et ce qu'il désigne. Les tuiles de KPI de l'app web, réduites à ce
 * qui tient sur deux colonnes de téléphone.
 */
export function Stat({ label, value, hint, tone = 'default' }: StatProps) {
  const theme = useTheme();
  const color = { default: theme.foreground, brand: theme.brand, destructive: theme.destructive }[
    tone
  ];

  return (
    <View style={[styles.tile, { backgroundColor: theme.muted, borderColor: theme.border }]}>
      <ThemedText type="label" themeColor="mutedForeground" numberOfLines={2}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </ThemedText>
      {hint ? (
        <ThemedText type="small" themeColor="mutedForeground" numberOfLines={2}>
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

/** Deux colonnes : au-delà, les montants en FCFA ne tiennent plus. */
export function StatGrid({ items }: { items: StatProps[] }) {
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <View key={item.label} style={styles.cell}>
          <Stat {...item} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.three,
  },
  value: { fontFamily: Fonts.bold, fontSize: 18, lineHeight: 24, fontVariant: ['tabular-nums'] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  cell: { flexBasis: '47%', flexGrow: 1 },
});
