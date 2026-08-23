import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Backdrop } from '@/components/backdrop';
import { Logo } from '@/components/logo';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useT } from '@/i18n';

/**
 * Enveloppe des écrans publics d'authentification.
 *
 * Ces écrans sont la suite immédiate de la vitrine : ils en reprennent le fond
 * animé, pour qu'on n'ait pas l'impression de changer de produit entre la page
 * d'accueil et le formulaire.
 *
 * Le contenu défile : sur un petit téléphone, clavier ouvert, le formulaire
 * d'inscription ne tient pas dans la hauteur restante.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const t = useT();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <Backdrop />

      <KeyboardAvoidingView
        // Sur iOS le clavier recouvre la vue ; sur Android le système
        // redimensionne déjà la fenêtre, et `padding` y ajouterait un décalage.
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + Spacing.five, paddingBottom: insets.bottom + Spacing.six },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.column}>
            <Logo label={t('app.name')} />

            <Card translucent style={styles.card}>
              <View style={styles.heading}>
                <ThemedText type="title">{title}</ThemedText>
                {subtitle ? (
                  <ThemedText type="small" themeColor="mutedForeground">
                    {subtitle}
                  </ThemedText>
                ) : null}
              </View>

              {children}
            </Card>

            {footer}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  column: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.five,
  },
  card: { gap: Spacing.five },
  heading: { gap: Spacing.one },
});
