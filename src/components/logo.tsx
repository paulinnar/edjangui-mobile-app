import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { useThemeName } from '@/hooks/use-theme';

const wordmarks = {
  light: require('../../assets/images/wordmark-on-light.png'),
  dark: require('../../assets/images/wordmark-on-dark.png'),
} as const;

/**
 * Logotype de l'application — les mêmes fichiers que le web.
 *
 * Il n'est pas monochrome : il ne peut donc pas suivre la couleur du texte, et
 * chaque thème a son fichier.
 */
export function Logo({ label, height = 34 }: { label: string; height?: number }) {
  const theme = useThemeName();

  return (
    <Image
      source={wordmarks[theme]}
      accessibilityLabel={label}
      contentFit="contain"
      // Le fichier fait 972 × 250 : le rapport est reporté ici pour que la
      // hauteur pilote seule le dimensionnement.
      style={[styles.logo, { height, width: height * (972 / 250) }]}
    />
  );
}

const styles = StyleSheet.create({
  logo: { alignSelf: 'flex-start' },
});
