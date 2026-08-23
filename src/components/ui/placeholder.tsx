import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useT } from '@/i18n';
import { useTheme } from '@/hooks/use-theme';

/**
 * Écran de lot 3 pas encore branché. Provisoire et assumé : il indique ce qui
 * manque plutôt que d'afficher une liste vide qu'on prendrait pour un bug.
 */
export function Placeholder({ icon }: { icon: keyof typeof Ionicons.glyphMap }) {
  const t = useT('mobile.placeholder');
  const theme = useTheme();

  return (
    <Card style={styles.card}>
      <Ionicons name={icon} size={32} color={theme.brand} />
      <View style={styles.text}>
        <ThemedText type="subtitle">{t('title')}</ThemedText>
        <ThemedText type="small" themeColor="mutedForeground">
          {t('body')}
        </ThemedText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', paddingVertical: Spacing.six },
  text: { alignItems: 'center', gap: Spacing.two },
});
