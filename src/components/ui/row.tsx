import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Carte cliquable d'une liste — une tontine, un tour, un message.
 *
 * Le chevron est posé ici et non par l'appelant : c'est lui qui annonce qu'on
 * peut ouvrir, et une liste où il manquerait sur une carte se lirait comme si
 * cette carte-là n'était pas ouvrable.
 */
export function TouchableCard({
  onPress,
  children,
  style,
  accessibilityLabel,
}: {
  onPress: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.body}>{children}</View>
      <Ionicons name="chevron-forward" size={18} color={theme.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius['2xl'],
    padding: Spacing.four,
  },
  body: { flex: 1, gap: Spacing.two },
  pressed: { opacity: 0.7 },
});
