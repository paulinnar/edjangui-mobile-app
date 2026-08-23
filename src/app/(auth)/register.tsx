import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FormMessage } from '@/components/ui/form-message';
import { Spacing } from '@/constants/theme';
import { useT } from '@/i18n';
import { useSession } from '@/lib/session';
import { validateSignUp, type FieldErrors } from '@/lib/validation';

export default function RegisterScreen() {
  const t = useT();
  const { signUp } = useSession();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  /** Compte créé mais e-mail à confirmer : l'écran bascule sur un accusé. */
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  async function submit() {
    const found = validateSignUp({ fullName, email, password });
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    setPending(true);
    const result = await signUp({ fullName, email, password });
    setPending(false);

    if (result.status === 'error') {
      setFormError(t(result.messageKey));
      return;
    }

    // Sans confirmation d'e-mail, la session est déjà ouverte et le layout
    // redirige de lui-même : il n'y a rien à faire de plus ici.
    if (result.messageKey === 'auth.register.confirmEmail') setAwaitingConfirmation(true);
  }

  if (awaitingConfirmation) {
    return (
      <AuthShell title={t('auth.register.confirmTitle')}>
        <View style={styles.form}>
          <ThemedText type="small" themeColor="mutedForeground">
            {t('auth.register.confirmBody', { email: email.trim() })}
          </ThemedText>
          <ThemedText type="small" themeColor="mutedForeground">
            {t('auth.register.confirmSpam')}
          </ThemedText>
          <Button
            label={t('auth.forgotPassword.backToLogin')}
            variant="outline"
            onPress={() => router.replace('/(auth)/login')}
          />
        </View>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('auth.register.title')} subtitle={t('auth.register.subtitle')}>
      <View style={styles.form}>
        <Field
          label={t('common.labels.fullName')}
          value={fullName}
          onChangeText={setFullName}
          error={errors.fullName ? t(errors.fullName) : undefined}
          autoComplete="name"
          textContentType="name"
        />

        <Field
          label={t('common.labels.email')}
          value={email}
          onChangeText={setEmail}
          error={errors.email ? t(errors.email) : undefined}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          inputMode="email"
        />

        <Field
          label={t('common.labels.password')}
          value={password}
          onChangeText={setPassword}
          error={errors.password ? t(errors.password) : undefined}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          secureTextEntry
          onSubmitEditing={submit}
          returnKeyType="go"
        />

        <FormMessage status={formError ? 'error' : 'idle'} message={formError ?? undefined} />

        <Button label={t('auth.register.submit')} loading={pending} onPress={submit} />
      </View>

      <View style={styles.footer}>
        <ThemedText type="label">{t('auth.register.haveAccount')}</ThemedText>
        <Link href="/(auth)/login" asChild>
          <Button label={t('auth.login.submit')} variant="outline" />
        </Link>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.four },
  footer: { gap: Spacing.three },
});
