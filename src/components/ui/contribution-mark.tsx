import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ApiContributionStatus } from '@/lib/api/contract';
import { withAlpha } from '@/lib/color';

/**
 * Constat d'une cotisation — port de `contribution-mark.tsx` du web.
 *
 * Trois signes qui se lisent sans être lus : coche verte pour un versement
 * reçu, horloge orange pour un retard, croix rouge pour un manquant. Un tour de
 * douze mois fait douze cases : le libellé n'y tient pas, il vit dans la
 * légende et dans le nom accessible.
 *
 * Le « — » d'un mois **non dépouillé** est un quatrième état, et non un défaut
 * de paiement : la nuance décide de ce qu'un membre doit comprendre en la
 * voyant, elle ne peut pas se confondre avec `MISSED`.
 */
export function ContributionMark({
  status,
  label,
  size = 26,
}: {
  status: ApiContributionStatus | null;
  /** Libellé traduit, porté par le nom accessible de la case. */
  label: string;
  size?: number;
}) {
  const theme = useTheme();

  if (status === null) {
    return (
      <View accessibilityLabel={label} style={[styles.cell, { width: size, height: size }]}>
        <ThemedText type="small" themeColor="mutedForeground">
          —
        </ThemedText>
      </View>
    );
  }

  const { icon, color } = {
    RECEIVED: { icon: 'checkmark' as const, color: theme.success },
    LATE: { icon: 'time-outline' as const, color: theme.warning },
    MISSED: { icon: 'close' as const, color: theme.destructive },
  }[status];

  return (
    <View
      accessibilityLabel={label}
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          backgroundColor: withAlpha(color, 0.12),
          borderColor: withAlpha(color, 0.3),
        },
      ]}
    >
      <Ionicons name={icon} size={size * 0.55} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  cell: { alignItems: 'center', justifyContent: 'center' },
});
