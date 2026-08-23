import { StyleSheet, View, type ViewProps } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type CardProps = ViewProps & {
  /** Retire le fond et la bordure : utile quand la carte est posée sur un fond animé. */
  translucent?: boolean;
};

export function Card({ style, translucent = false, ...rest }: CardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: translucent ? `${theme.card}e6` : theme.card,
          borderColor: theme.border,
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius['2xl'],
    padding: Spacing.five,
    gap: Spacing.four,
  },
});
