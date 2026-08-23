import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

/**
 * Fond des écrans publics — transposition de `PageBackdrop` du web.
 *
 * Le web empile un quadrillage masqué, trois aurores floutées en
 * `blur-[120px]`, la poussière d'étoiles du canvas et un grain. Sans Skia, React
 * Native ne sait pas flouter une forme : on approche donc les aurores par des
 * disques en dégradé radial dégradé-vers-transparent, ce qui donne le même
 * halo chaud sans netteté de bord.
 *
 * Le lot « météorites » remplacera ce composant par un rendu Skia — aurores
 * réellement floutées et particules animées. L'interface est déjà celle-là :
 * les écrans qui l'utilisent n'auront pas à changer.
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
