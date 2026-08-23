import { router } from 'expo-router';
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
import { validateEmailOnly, type FieldErrors } from '@/lib/validation';

export default function ForgotPasswordScreen() {
  const t = useT();
  const { requestPasswordReset } = useSession();

  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    const found = validateEmailOnly(email);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    setPending(true);
    const result = await requestPasswordReset(email);
    setPending(false);

    if (result.status === 'error') {
      setFormError(t(result.messageKey));
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell title={t('auth.forgotPassword.sentTitle')}>
        <View style={styles.form}>
          <ThemedText type="small" themeColor="mutedForeground">
            {t('auth.forgotPassword.sentBody', { email: email.trim() })}
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
    <AuthShell
      title={t('auth.forgotPassword.title')}
      subtitle={t('auth.forgotPassword.subtitle')}
    >
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
          onSubmitEditing={submit}
          returnKeyType="send"
        />

        <FormMessage status={formError ? 'error' : 'idle'} message={formError ?? undefined} />

        <Button label={t('auth.forgotPassword.submit')} loading={pending} onPress={submit} />
        <Button
          label={t('auth.forgotPassword.backToLogin')}
          variant="ghost"
          size="md"
          onPress={() => router.replace('/(auth)/login')}
        />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.four },
});
