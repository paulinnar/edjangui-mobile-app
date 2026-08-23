import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'subtitle' | 'label' | 'small' | 'amount' | 'link';
  themeColor?: ThemeColor;
};

/**
 * Texte de l'app. La graisse passe par `fontFamily` et non `fontWeight` :
 * React Native ignore le second dès qu'une police personnalisée est posée.
 */
export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[{ color: theme[themeColor ?? 'foreground'] }, styles[type], style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: { fontSize: 15, lineHeight: 22, fontFamily: Fonts.regular },
  title: { fontSize: 26, lineHeight: 32, fontFamily: Fonts.heading, letterSpacing: -0.4 },
  subtitle: { fontSize: 16, lineHeight: 22, fontFamily: Fonts.semibold },
  label: { fontSize: 13, lineHeight: 18, fontFamily: Fonts.medium },
  small: { fontSize: 13, lineHeight: 18, fontFamily: Fonts.regular },
  link: { fontSize: 14, lineHeight: 20, fontFamily: Fonts.medium },
  // Les montants sont lus en colonne : le chasse fixe aligne les chiffres.
  amount: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: Fonts.mono,
    fontVariant: ['tabular-nums'],
  },
});
