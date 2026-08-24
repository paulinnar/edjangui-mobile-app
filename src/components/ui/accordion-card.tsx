import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * La carte dépliable des listes du membre : un en-tête qu'on touche, un corps
 * qui s'ouvre dessous.
 *
 * C'est le geste de tout l'onglet « Groupe » — un message, un vote, une séance
 * se lisent sur place. Le mobile a d'abord eu des écrans de détail : deux
 * transitions pour trois phrases, et une pile à remonter pour passer au suivant.
 *
 * Repliée, la carte répond à la question qui se pose de l'extérieur ; dépliée,
 * elle donne le détail. Ce que l'appelant fournit, c'est le contenu des deux
 * parties — l'enveloppe, la zone tactile et le chevron sont tenus ici, pour que
 * trois listes ne les redessinent pas chacune à leur façon.
 */
export function AccordionCard({
  accessibilityLabel,
  leading,
  trailing,
  expanded,
  onToggle,
  faded = false,
  children,
}: {
  accessibilityLabel: string;
  /** À gauche de l'en-tête : l'avatar d'un expéditeur. */
  leading?: ReactNode;
  /** À droite, au-dessus du chevron : la pastille d'état d'un scrutin. */
  trailing?: ReactNode;
  expanded: boolean;
  /** Absent = carte sans corps : rien à déplier, pas de chevron ni d'appui. */
  onToggle?: () => void;
  /** Estompe la carte d'une séance déjà tenue. */
  faded?: boolean;
  /** L'en-tête, puis le corps : `[head, body]`. */
  children: [ReactNode, ReactNode];
}) {
  const theme = useTheme();
  const [head, body] = children;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        faded ? styles.faded : null,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded }}
        disabled={!onToggle}
        onPress={onToggle}
        style={({ pressed }) => [styles.head, pressed && styles.pressed]}
      >
        {leading}

        <View style={styles.identity}>{head}</View>

        {onToggle ? (
          <View style={styles.marks}>
            {trailing}
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.mutedForeground}
            />
          </View>
        ) : null}
      </Pressable>

      {expanded ? (
        <View style={[styles.body, { borderTopColor: theme.border }]}>{body}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: Radius['2xl'], overflow: 'hidden' },
  faded: { opacity: 0.75 },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.four },
  pressed: { opacity: 0.7 },
  identity: { flex: 1, gap: Spacing.one },
  marks: { alignItems: 'flex-end', gap: Spacing.two },
  body: { borderTopWidth: 1, padding: Spacing.four, gap: Spacing.three },
});
