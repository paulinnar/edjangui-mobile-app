import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Segmented } from '@/components/ui/segmented';
import { Spacing } from '@/constants/theme';
import { useT } from '@/i18n';
import { usePreferences, type Locale, type ThemeMode } from '@/lib/preferences';
import { useSession } from '@/lib/session';

export default function ProfileScreen() {
  const t = useT();
  const { user, signOut } = useSession();
  const { themeMode, setThemeMode, locale, setLocale } = usePreferences();

  const themeOptions: readonly { value: ThemeMode; label: string }[] = [
    { value: 'system', label: t('mobile.profile.themeMode.system') },
    { value: 'light', label: t('mobile.profile.themeMode.light') },
    { value: 'dark', label: t('mobile.profile.themeMode.dark') },
  ];

  // Les noms de langue restent dans leur propre langue : c'est ce qu'on cherche
  // des yeux quand l'interface est dans une langue qu'on ne lit pas.
  const localeOptions: readonly { value: Locale; label: string }[] = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
  ];

  return (
    <Screen title={t('nav.profile')}>
      <Card style={styles.block}>
        <View style={styles.field}>
          <ThemedText type="label" themeColor="mutedForeground">
            {t('mobile.profile.signedInAs')}
          </ThemedText>
          <ThemedText type="subtitle">{user?.email ?? '—'}</ThemedText>
        </View>

        <ThemedText type="small" themeColor="mutedForeground">
          {t('mobile.profile.memberScope')}
        </ThemedText>
      </Card>

      <Card style={styles.block}>
        <View style={styles.field}>
          <ThemedText type="label" themeColor="mutedForeground">
            {t('mobile.profile.appearance')}
          </ThemedText>
          <Segmented
            options={themeOptions}
            value={themeMode}
            onChange={setThemeMode}
            accessibilityLabel={t('mobile.profile.appearance')}
          />
        </View>

        <View style={styles.field}>
          <ThemedText type="label" themeColor="mutedForeground">
            {t('mobile.profile.language')}
          </ThemedText>
          <Segmented
            options={localeOptions}
            value={locale}
            onChange={setLocale}
            accessibilityLabel={t('mobile.profile.language')}
          />
        </View>
      </Card>

      <Button label={t('auth.signout')} variant="outline" onPress={() => void signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: Spacing.five },
  field: { gap: Spacing.two },
});
