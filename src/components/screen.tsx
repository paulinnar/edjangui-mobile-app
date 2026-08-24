import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useT } from '@/i18n';
import { useTheme } from '@/hooks/use-theme';

/**
 * Gabarit des écrans authentifiés : fond à la charte, en-tête, contenu
 * défilant, tirer-pour-rafraîchir.
 *
 * Les encoches sont gérées ici plutôt que dans chaque écran — c'est le genre de
 * marge qu'on n'oublie que sur un seul écran, et qu'on ne voit qu'à la première
 * capture sur un téléphone à encoche.
 */
export function Screen({
  title,
  subtitle,
  back = false,
  refreshing,
  onRefresh,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Affiche la flèche de retour : les écrans de détail, jamais les onglets. */
  back?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  children?: ReactNode;
}) {
  const t = useT();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.four }]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={onRefresh}
              tintColor={theme.brand}
              colors={[theme.brand]}
            />
          ) : undefined
        }
      >
        <View style={styles.column}>
          <View style={styles.heading}>
            {back ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.actions.back')}
                onPress={() => router.back()}
                // Cible tactile élargie : la flèche seule ferait 20 px de côté.
                hitSlop={12}
                style={styles.back}
              >
                <Ionicons name="chevron-back" size={20} color={theme.brand} />
                <ThemedText type="link" style={{ color: theme.brand }}>
                  {t('common.actions.back')}
                </ThemedText>
              </Pressable>
            ) : null}

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
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    marginLeft: -4,
    marginBottom: Spacing.one,
  },
});
