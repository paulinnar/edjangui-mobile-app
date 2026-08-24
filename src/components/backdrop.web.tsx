import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

/**
 * Fond des écrans publics, **variante web** de `backdrop.tsx`.
 *
 * Metro choisit ce fichier pour l'aperçu web, l'autre pour les appareils. La
 * raison est que le rendu natif s'appuie sur Skia, dont la version web charge
 * CanvasKit en WebAssembly : quelques centaines de kilo-octets et une étape
 * d'amorçage, pour un aperçu qui ne sert qu'à contrôler une mise en page.
 *
 * On garde donc ici l'approximation d'avant le lot « météorites » : pas de
 * particules, et des aurores en dégradé plutôt que réellement floutées. C'est
 * volontairement moins riche que ce que voit un téléphone — l'aperçu web n'est
 * pas la cible.
 */
export function Backdrop() {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();

  // Les aurores débordent volontairement du cadre : leur centre reste hors
  // écran, comme côté web où elles sont posées en `-top-40` / `-bottom-40`.
  const large = Math.max(width, height) * 1.1;
  const medium = large * 0.7;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[theme.background, theme.background]}
        style={StyleSheet.absoluteFill}
      />

      <Aurora
        color={theme.brand}
        opacity={0.28}
        size={large}
        style={{ top: -large * 0.55, left: (width - large) / 2 }}
      />
      <Aurora
        color={theme.brandSoft}
        opacity={0.22}
        size={medium}
        style={{ top: -medium * 0.3, right: -medium * 0.25 }}
      />
      <Aurora
        color={theme.brand}
        opacity={0.18}
        size={medium}
        style={{ bottom: -medium * 0.45, left: -medium * 0.2 }}
      />
    </View>
  );
}

function Aurora({
  color,
  opacity,
  size,
  style,
}: {
  color: string;
  opacity: number;
  size: number;
  style: { top?: number; bottom?: number; left?: number; right?: number };
}) {
  return (
    <View style={[styles.aurora, { width: size, height: size, borderRadius: size / 2 }, style]}>
      {/* Trois arrêts plutôt que deux : la décroissance linéaire d'un dégradé à
          deux couleurs laisse un bord perceptible, celui-ci s'éteint plus tôt. */}
      <LinearGradient
        colors={[withAlpha(color, opacity), withAlpha(color, opacity * 0.35), withAlpha(color, 0)]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  aurora: { position: 'absolute', overflow: 'hidden' },
});
