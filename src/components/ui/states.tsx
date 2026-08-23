import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useT } from '@/i18n';
import { useTheme } from '@/hooks/use-theme';
import type { ApiFailure } from '@/lib/api/client';

/** Premier chargement d'un écran : rien à montrer encore. */
export function LoadingState() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator />
    </View>
  );
}

/**
 * Échec de lecture, avec le bouton qui va avec.
 *
 * « Serveur injoignable » et « accès refusé » ne demandent pas la même chose au
 * lecteur : le premier se retente, le second non. Le code de l'erreur décide
 * donc de la présence du bouton.
 */
export function ErrorState({ error, onRetry }: { error: ApiFailure; onRetry?: () => void }) {
  const t = useT();
  const theme = useTheme();
  const retryable = error.code === 'unreachable' || error.code === 'server_error';

  return (
    <Card style={styles.card}>
      <Ionicons
        name={error.code === 'unreachable' ? 'cloud-offline-outline' : 'alert-circle-outline'}
        size={32}
        color={theme.destructive}
      />
      <ThemedText type="small" themeColor="mutedForeground" style={styles.text}>
        {t(error.messageKey)}
      </ThemedText>
      {retryable && onRetry ? (
        <Button label={t('common.actions.retry')} variant="outline" size="md" onPress={onRetry} />
      ) : null}
    </Card>
  );
}

/** Liste vide — cas normal, pas une panne : ton neutre et aucune action. */
export function EmptyState({
  icon = 'file-tray-outline',
  message,
  children,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  message: string;
  children?: ReactNode;
}) {
  const theme = useTheme();

  return (
    <Card style={styles.card}>
      <Ionicons name={icon} size={28} color={theme.mutedForeground} />
      <ThemedText type="small" themeColor="mutedForeground" style={styles.text}>
        {message}
      </ThemedText>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  centered: { paddingVertical: Spacing.seven, alignItems: 'center' },
  card: { alignItems: 'center', paddingVertical: Spacing.six },
  text: { textAlign: 'center' },
});
