import { StyleSheet, View } from 'react-native';

import { Backdrop } from '@/components/backdrop';
import { Logo } from '@/components/logo';
import { useT } from '@/i18n';

/**
 * Écran d'attente de l'application, entre le démarrage natif et le premier
 * écran peint.
 *
 * L'écran de démarrage natif (`expo-splash-screen`) est une image fixe : il
 * couvre le lancement à froid, où rien de JavaScript ne tourne encore. Celui-ci
 * prend le relais — mêmes couleurs, même logotype, mais le fond animé des
 * écrans publics — pendant que les polices, les préférences et la session
 * enregistrée se lisent, et lors des rechargements où le natif est déjà retombé.
 *
 * Le logotype seul, aucun texte : les polices ne sont justement pas encore
 * chargées, un libellé s'afficherait dans la police système puis sauterait.
 */
export function SplashView() {
  const t = useT();

  return (
    <View style={styles.root}>
      <Backdrop />
      <Logo label={t('app.name')} height={40} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
