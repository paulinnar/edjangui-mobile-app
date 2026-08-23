import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Gabarit des écrans authentifiés : fond à la charte, titre, contenu défilant.
 *
 * Les encoches et la barre d'onglets sont gérées ici plutôt que dans chaque
 * écran — c'est le genre de marge qu'on oublie sur un seul écran et qu'on ne
 * voit qu'à la première capture sur un iPhone à encoche.
 */
export function Screen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.four },
        ]}
      >
        <View style={styles.column}>
          <View style={styles.heading}>
            <ThemedText type="title">{title}</ThemedText>
            {subtitle ? (
              <ThemedText type="small" themeColor="mutedForeground">
                {subtitle}
              </ThemedText>
            ) : null}
          </View>

          {children}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  column: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.five,
  },
  heading: { gap: Spacing.one },
});
