import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Rendu à gauche du libellé — icône, pastille. */
  leading?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  variant = 'primary',
  size = 'lg',
  loading = false,
  leading,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const inactive = disabled || loading;

  const surface: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: theme.brand },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.brand },
    ghost: { backgroundColor: 'transparent' },
    destructive: { backgroundColor: theme.destructive },
  };

  const labelColor =
    variant === 'primary' || variant === 'destructive' ? theme.brandForeground : theme.brand;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(inactive), busy: loading }}
      disabled={inactive}
      // L'opacité au doigt remplace le `:hover` du web : sur mobile il n'y a pas
      // de survol, seul l'appui doit se voir.
      style={({ pressed }) => [
        styles.base,
        styles[size],
        surface[variant],
        pressed && styles.pressed,
        inactive && styles.inactive,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} size="small" />
      ) : (
        <View style={styles.content}>
          {leading}
          <ThemedText style={[styles.label, { color: labelColor }]}>{label}</ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.four,
  },
  md: { minHeight: 40 },
  lg: { minHeight: 50 },
  content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  label: { fontFamily: Fonts.semibold, fontSize: 15, lineHeight: 20 },
  pressed: { opacity: 0.85 },
  inactive: { opacity: 0.5 },
});
