import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type FieldProps = TextInputProps & {
  label: string;
  /** Message d'erreur déjà traduit, affiché sous le champ. */
  error?: string;
};

/**
 * Libellé, champ et message d'erreur d'un seul tenant : sur mobile ils ne se
 * séparent jamais, et les garder ensemble évite d'oublier de relier le message
 * au champ pour les lecteurs d'écran.
 */
export function Field({ label, error, style, ...rest }: FieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? theme.destructive : focused ? theme.brand : theme.border;

  return (
    <View style={styles.group}>
      <ThemedText type="label" themeColor="mutedForeground">
        {label}
      </ThemedText>

      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.mutedForeground}
        selectionColor={theme.brand}
        onFocus={(event) => {
          setFocused(true);
          rest.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          rest.onBlur?.(event);
        }}
        style={[
          styles.input,
          {
            backgroundColor: theme.card,
            borderColor,
            color: theme.foreground,
          },
          style,
        ]}
        {...rest}
      />

      {error ? (
        <ThemedText type="small" themeColor="destructive">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
  input: {
    // 48 px : la cible tactile minimale recommandée sur Android comme sur iOS.
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    fontFamily: Fonts.regular,
    fontSize: 15,
  },
});
