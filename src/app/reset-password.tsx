import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FormMessage } from '@/components/ui/form-message';
import { Spacing } from '@/constants/theme';
import { useT } from '@/i18n';
import { mapUpdatePasswordError } from '@/lib/auth-errors';
import { supabase } from '@/lib/supabase';
import { validateResetPassword, type FieldErrors } from '@/lib/validation';

type Stage = 'exchanging' | 'ready' | 'invalid';

/**
 * Écran d'arrivée du lien de réinitialisation.
 *
 * Il est **hors du groupe `(auth)`** volontairement : l'échange du code ouvre
 * une session, et le garde de `(auth)` renverrait alors vers l'espace membre
 * avant même que le nouveau mot de passe ait été saisi.
 */
export default function ResetPasswordScreen() {
  const t = useT();
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();

  const [stage, setStage] = useState<Stage>('exchanging');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const code = params.code;

  useEffect(() => {
    if (!code) {
      setStage('invalid');
      return;
    }

    let cancelled = false;

    // Le code du lien est à usage unique : l'échanger ouvre la session de
    // récupération, sans laquelle Supabase refuse le changement de mot de passe.
    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        if (cancelled) return;
        setStage(error ? 'invalid' : 'ready');
      })
      .catch(() => {
        if (!cancelled) setStage('invalid');
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  async function submit() {
    const found = validateResetPassword({ password, confirmPassword });
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    setPending(true);
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (error) {
      setFormError(t(mapUpdatePasswordError(error)));
      return;
    }

    router.replace('/(app)/tontines');
  }

  if (stage === 'exchanging') {
    return (
      <AuthShell title={t('auth.resetPassword.title')}>
        <View style={styles.centered}>
          <ActivityIndicator />
          <ThemedText type="small" themeColor="mutedForeground">
            {t('common.actions.loading')}
          </ThemedText>
        </View>
      </AuthShell>
    );
  }

  if (stage === 'invalid') {
    return (
      <AuthShell title={t('auth.resetPassword.title')}>
        <View style={styles.form}>
          <FormMessage status="error" message={t('auth.resetPassword.linkExpired')} />
          <Button
            label={t('auth.forgotPassword.backToLogin')}
            variant="outline"
            onPress={() => router.replace('/(auth)/forgot-password')}
          />
        </View>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('auth.resetPassword.title')}>
      <View style={styles.form}>
        <Field
          label={t('auth.resetPassword.newPassword')}
          value={password}
          onChangeText={setPassword}
          error={errors.password ? t(errors.password) : undefined}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          secureTextEntry
        />

        <Field
          label={t('auth.resetPassword.confirmPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={errors.confirmPassword ? t(errors.confirmPassword) : undefined}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          secureTextEntry
          onSubmitEditing={submit}
          returnKeyType="go"
        />

        <FormMessage status={formError ? 'error' : 'idle'} message={formError ?? undefined} />

        <Button label={t('auth.resetPassword.submit')} loading={pending} onPress={submit} />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.four },
  centered: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.five },
});
