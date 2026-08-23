import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

export type FormMessageProps = {
  status: 'idle' | 'success' | 'error';
  /** Message déjà traduit. */
  message?: string;
};

/** Retour d'un formulaire, à l'aplomb du bouton d'envoi. */
export function FormMessage({ status, message }: FormMessageProps) {
  const theme = useTheme();
  if (status === 'idle' || !message) return null;

  const tone = status === 'error' ? theme.destructive : theme.brand;

  return (
    <View
      accessibilityLiveRegion="polite"
      // `role="alert"` du web : le message doit être annoncé sans que le focus
      // ait à s'y déplacer.
      accessibilityRole="alert"
      style={[styles.box, { backgroundColor: withAlpha(tone, 0.12), borderColor: withAlpha(tone, 0.35) }]}
    >
      <ThemedText type="small" style={{ color: tone }}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
});
