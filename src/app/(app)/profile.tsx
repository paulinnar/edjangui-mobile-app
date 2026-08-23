import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AvatarPicker } from '@/components/avatar-picker';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { FormMessage } from '@/components/ui/form-message';
import { Segmented } from '@/components/ui/segmented';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useT } from '@/i18n';
import { ApiFailure, api } from '@/lib/api/client';
import type { ApiMe } from '@/lib/api/contract';
import { useQuery } from '@/lib/api/use-query';
import { formatHandle } from '@/lib/format';
import { usePreferences, type Locale, type ThemeMode } from '@/lib/preferences';
import { useSession } from '@/lib/session';

/**
 * Mon profil : qui je suis, où j'adhère, et les réglages de l'app.
 *
 * La seule écriture de tout le mobile hors marquage de lecture — nom affiché et
 * avatar. Tout le reste du profil (rôle, adhésions, soldes) se lit : il se
 * modifie depuis l'app web, par un administrateur.
 */
export default function ProfileScreen() {
  const t = useT();
  const format = useFormat();
  const { signOut } = useSession();
  const { themeMode, setThemeMode, locale, setLocale } = usePreferences();

  const { data, loading, refreshing, error, refresh } = useQuery<ApiMe>('/api/v1/me');

  return (
    <Screen title={t('profile.title')} refreshing={refreshing} onRefresh={refresh}>
      {loading ? <LoadingState /> : null}
      {error && !data ? <ErrorState error={error} onRetry={refresh} /> : null}

      {data ? <Identity me={data} /> : null}
      {data ? <EditProfile me={data} onSaved={refresh} /> : null}

      {data ? (
        <View style={styles.section}>
          <ThemedText type="subtitle">{t('profile.memberships')}</ThemedText>
          {data.memberships.length === 0 ? (
            <Card>
              <ThemedText type="small" themeColor="mutedForeground">
                {t('profile.noMemberships')}
              </ThemedText>
            </Card>
          ) : (
            <Card style={styles.list}>
              {data.memberships.map((membership) => (
                <View key={membership.tontineId} style={styles.membership}>
                  <View style={styles.membershipBody}>
                    <ThemedText type="small" numberOfLines={1}>
                      {membership.tontineName}
                    </ThemedText>
                    <ThemedText type="small" themeColor="mutedForeground">
                      {t('profile.joinedOn', { date: format.date(membership.joinedAt) })}
                    </ThemedText>
                  </View>
                  <Badge label={t(`common.roles.${membership.role}`)} />
                </View>
              ))}
            </Card>
          )}
        </View>
      ) : null}

      <Card style={styles.block}>
        <View style={styles.field}>
          <ThemedText type="label" themeColor="mutedForeground">
            {t('mobile.profile.appearance')}
          </ThemedText>
          <Segmented<ThemeMode>
            options={[
              { value: 'system', label: t('mobile.profile.themeMode.system') },
              { value: 'light', label: t('mobile.profile.themeMode.light') },
              { value: 'dark', label: t('mobile.profile.themeMode.dark') },
            ]}
            value={themeMode}
            onChange={setThemeMode}
            accessibilityLabel={t('mobile.profile.appearance')}
          />
        </View>

        <View style={styles.field}>
          <ThemedText type="label" themeColor="mutedForeground">
            {t('mobile.profile.language')}
          </ThemedText>
          {/* Les noms de langue restent dans leur propre langue : c'est ce
              qu'on cherche des yeux quand l'interface est dans une langue
              qu'on ne lit pas. */}
          <Segmented<Locale>
            options={[
              { value: 'fr', label: 'Français' },
              { value: 'en', label: 'English' },
            ]}
            value={locale}
            onChange={setLocale}
            accessibilityLabel={t('mobile.profile.language')}
          />
        </View>
      </Card>

      <ThemedText type="small" themeColor="mutedForeground">
        {t('mobile.profile.memberScope')}
      </ThemedText>

      <Button label={t('auth.signout')} variant="outline" onPress={() => void signOut()} />
    </Screen>
  );
}

function Identity({ me }: { me: ApiMe }) {
  const t = useT();
  const format = useFormat();

  return (
    <Card style={styles.identity}>
      <Avatar fullName={me.fullName} avatarName={me.avatarName} size={56} />
      <View style={styles.identityBody}>
        <ThemedText type="subtitle" numberOfLines={1}>
          {me.fullName}
        </ThemedText>
        <ThemedText type="small" themeColor="mutedForeground">
          {formatHandle(me.username)}
        </ThemedText>
        <ThemedText type="small" themeColor="mutedForeground" numberOfLines={1}>
          {me.email}
        </ThemedText>
        <ThemedText type="small" themeColor="mutedForeground">
          {t('profile.memberSince')} {format.date(me.createdAt)}
        </ThemedText>
      </View>
    </Card>
  );
}

function EditProfile({ me, onSaved }: { me: ApiMe; onSaved: () => void }) {
  const t = useT();

  const [fullName, setFullName] = useState(me.fullName);
  const [avatarName, setAvatarName] = useState<string | null>(me.avatarName);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error'; message: string } | null>(
    null,
  );

  // Un rafraîchissement au retour sur l'écran rapporte les valeurs du serveur :
  // le formulaire les reprend, sinon il resterait sur une saisie abandonnée.
  useEffect(() => {
    setFullName(me.fullName);
    setAvatarName(me.avatarName);
  }, [me.fullName, me.avatarName]);

  const dirty = fullName.trim() !== me.fullName || avatarName !== me.avatarName;

  async function submit() {
    if (fullName.trim().length < 2) {
      setFeedback({ status: 'error', message: t('auth.validation.fullNameMin') });
      return;
    }

    setPending(true);
    setFeedback(null);
    try {
      await api.patch<ApiMe>('/api/v1/me', { fullName: fullName.trim(), avatarName });
      setFeedback({ status: 'success', message: t('profile.success') });
      onSaved();
    } catch (failure) {
      setFeedback({
        status: 'error',
        message: t(
          failure instanceof ApiFailure ? failure.messageKey : 'common.errors.unexpected',
        ),
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card style={styles.block}>
      <View style={styles.field}>
        <ThemedText type="subtitle">{t('profile.edit')}</ThemedText>
        <ThemedText type="small" themeColor="mutedForeground">
          {t('profile.editHint')}
        </ThemedText>
      </View>

      <Field
        label={t('common.labels.fullName')}
        value={fullName}
        onChangeText={setFullName}
        autoComplete="name"
        textContentType="name"
      />

      <AvatarPicker fullName={fullName || me.fullName} value={avatarName} onChange={setAvatarName} />

      <FormMessage status={feedback?.status ?? 'idle'} message={feedback?.message} />

      <Button
        label={t('common.actions.save')}
        loading={pending}
        disabled={!dirty}
        onPress={submit}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.three },
  block: { gap: Spacing.five },
  field: { gap: Spacing.two },
  list: { gap: Spacing.four },
  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
  identityBody: { flex: 1, gap: 2 },
  membership: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  membershipBody: { flex: 1, gap: 2 },
});
