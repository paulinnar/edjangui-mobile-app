import { Link } from 'expo-router';
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
import { validateSignIn, type FieldErrors } from '@/lib/validation';

export default function LoginScreen() {
  const t = useT();
  const { signIn } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    const found = validateSignIn({ email, password });
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    setPending(true);
    const result = await signIn({ email, password });
    setPending(false);

    // Succès : `onAuthStateChange` pose la session et le layout redirige. Aucun
    // `router.replace` ici — il entrerait en concurrence avec cette
    // redirection.
    if (result.status === 'error') setFormError(t(result.messageKey));
  }

  return (
    <AuthShell title={t('auth.login.title')} subtitle={t('auth.login.subtitle')}>
      <View style={styles.form}>
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
          autoComplete="current-password"
          textContentType="password"
          secureTextEntry
          onSubmitEditing={submit}
          returnKeyType="go"
        />

        <FormMessage status={formError ? 'error' : 'idle'} message={formError ?? undefined} />

        <Button label={t('auth.login.submit')} loading={pending} onPress={submit} />

        <Link href="/(auth)/forgot-password" style={styles.link}>
          <ThemedText type="link" themeColor="mutedForeground">
            {t('auth.login.forgotPassword')}
          </ThemedText>
        </Link>
      </View>

      <View style={styles.footer}>
        <ThemedText type="label">{t('auth.login.noAccount')}</ThemedText>
        <Link href="/(auth)/register" asChild>
          <Button label={t('auth.register.cta')} variant="outline" />
        </Link>
        <ThemedText type="small" themeColor="mutedForeground">
          {t('auth.login.inviteOnly')}
        </ThemedText>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.four },
  link: { alignSelf: 'center' },
  footer: { gap: Spacing.three },
});
