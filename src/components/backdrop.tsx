import {
  Blur,
  Canvas,
  Circle,
  Group,
  Line,
  LinearGradient as SkiaGradient,
  Points,
  vec,
} from '@shopify/react-native-skia';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo } from 'react';
import { AppState, StyleSheet, View, useWindowDimensions } from 'react-native';
import {
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

/**
 * Fond animé des écrans publics — port de `hero-canvas.tsx` de l'app web.
 *
 * Le web anime un canvas 2D à la main : poussière d'étoiles qui dérive, étoiles
 * filantes en diagonale, aurores floutées en CSS. Ici, Skia dessine et
 * Reanimated cadence, **sur le fil d'interface** : le fil JavaScript est occupé
 * à valider un formulaire et à parler au réseau, une animation qui en dépendrait
 * saccaderait à chaque frappe.
 *
 * ## Deux différences assumées avec le web
 *
 * - **Pas d'interaction.** Le web accroche la poussière au pointeur et projette
 *   des étincelles au clic. Sur téléphone il n'y a pas de survol, et un fond qui
 *   capterait les appuis les volerait au formulaire posé dessus.
 * - **Pas de quadrillage ni de grain.** Deux couches de texture qui coûtent un
 *   remplissage plein écran par image pour un effet que l'écran d'un téléphone
 *   ne rend pas.
 *
 * ## Pourquoi deux toiles
 *
 * Les aurores sont trois grands disques réellement floutés (`Blur`, l'équivalent
 * du `blur-[120px]` du web). Un flou de ce rayon est cher, et refaire ce calcul
 * soixante fois par seconde parce que des particules bougent au-dessus serait du
 * gâchis. Elles vivent donc dans une toile **immobile**, que le système compose
 * sans la redessiner ; seule la seconde toile est animée.
 *
 * L'animation s'arrête quand l'application passe en arrière-plan, et ne démarre
 * pas du tout si le système annonce une préférence de mouvement réduit — le
 * champ d'étoiles reste alors figé, ce qui est un fond parfaitement acceptable.
 */
export function Backdrop() {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  // Millisecondes écoulées, entretenues sur le fil d'interface. Tout le reste
  // en découle par le calcul : aucune position n'est stockée, donc rien à
  // remettre à jour image par image depuis JavaScript.
  const time = useSharedValue(0);
  const frame = useFrameCallback(({ timeSinceFirstFrame }) => {
    'worklet';
    time.value = timeSinceFirstFrame;
  }, false);

  useEffect(() => {
    if (reducedMotion) {
      frame.setActive(false);
      return;
    }

    frame.setActive(AppState.currentState === 'active');
    // Application masquée : rien à animer, on rend la main au système plutôt
    // que de faire tourner une boucle que personne ne regarde.
    const subscription = AppState.addEventListener('change', (state) => {
      frame.setActive(state === 'active');
    });

    return () => {
      subscription.remove();
      frame.setActive(false);
    };
  }, [frame, reducedMotion]);

  const dust = useMemo(() => seedDust(width, height), [width, height]);
  const meteors = useMemo(() => seedMeteors(width, height), [width, height]);
  const auroras = useMemo(() => layoutAuroras(width, height), [width, height]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        // Le fond n'est pas tout à fait plat : un soupçon de la teinte de marque
        // en haut, là d'où viennent les aurores, évite la coupure nette entre le
        // halo et l'aplat.
        colors={[withAlpha(theme.brand, 0.05), theme.background]}
        locations={[0, 0.45]}
        style={StyleSheet.absoluteFill}
      />

      <Canvas style={StyleSheet.absoluteFill}>
        {auroras.map((aurora, index) => (
          <Circle
            key={index}
            cx={aurora.cx}
            cy={aurora.cy}
            r={aurora.r}
            opacity={aurora.opacity}
            color={index === 1 ? theme.brandSoft : theme.brand}
          >
            {/* Le flou déborde la toile : `mode="decal"` évite que Skia répète
                le bord du disque au-delà, ce qui ferait une bande claire. */}
            <Blur blur={aurora.blur} mode="decal" />
          </Circle>
        ))}
      </Canvas>

      <Canvas style={StyleSheet.absoluteFill}>
        {dust.map((layer, index) => (
          <DustLayer
            key={index}
            layer={layer}
            time={time}
            width={width}
            height={height}
            color={theme.brand}
          />
        ))}

        {meteors.map((meteor, index) => (
          <Meteor
            key={index}
            meteor={meteor}
            time={time}
            trail={theme.brand}
            head={theme.foreground}
          />
        ))}
      </Canvas>
    </View>
  );
}

// --------------------------------------------------------------------------
// Poussière d'étoiles
// --------------------------------------------------------------------------

type DustSeed = { x: number; y: number; vx: number; vy: number };
type DustLayerSeed = { seeds: DustSeed[]; radius: number; opacity: number };

/** Marge de renouvellement : la particule réapparaît hors cadre, pas sur le bord. */
const WRAP = 12;

/**
 * Trois couches plutôt qu'une, et c'est ce qui fait la profondeur : le web fait
 * varier taille et opacité particule par particule, ce qui demanderait ici un
 * nœud de dessin par point. Une couche entière se dessine d'un seul appel —
 * même variété, trois nœuds au lieu de cent.
 */
function seedDust(width: number, height: number): DustLayerSeed[] {
  // Densité du web (90 particules par million de pixels), un peu relevée : un
  // téléphone fait le tiers d'un million de pixels en points logiques.
  const total = Math.min(120, Math.round(((width * height) / 1_000_000) * 130));

  return [
    { count: Math.round(total * 0.45), radius: 0.7, opacity: 0.28 },
    { count: Math.round(total * 0.35), radius: 1.1, opacity: 0.45 },
    { count: Math.round(total * 0.2), radius: 1.7, opacity: 0.62 },
  ].map(({ count, radius, opacity }) => ({
    radius,
    opacity,
    seeds: Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      // Pixels par milliseconde : le web raisonne en pixels par image, ce qui
      // fait dériver la vitesse avec la fréquence de l'écran — un 120 Hz irait
      // deux fois plus vite.
      vx: rand(-0.008, 0.008),
      vy: rand(-0.008, 0.008),
    })),
  }));
}

function DustLayer({
  layer,
  time,
  width,
  height,
  color,
}: {
  layer: DustLayerSeed;
  time: SharedValue<number>;
  width: number;
  height: number;
  color: string;
}) {
  const { seeds, radius, opacity } = layer;

  const points = useDerivedValue(() => {
    const wrapAxis = (value: number, span: number) => {
      'worklet';
      const range = span + WRAP * 2;
      return (((value + WRAP) % range) + range) % range - WRAP;
    };

    return seeds.map((seed) => ({
      x: wrapAxis(seed.x + seed.vx * time.value, width),
      y: wrapAxis(seed.y + seed.vy * time.value, height),
    }));
  });

  return (
    <Points
      points={points}
      mode="points"
      color={color}
      opacity={opacity}
      style="stroke"
      strokeWidth={radius * 2}
      strokeCap="round"
    />
  );
}

// --------------------------------------------------------------------------
// Étoiles filantes
// --------------------------------------------------------------------------

type MeteorSeed = {
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** Vecteur unitaire de la course, pour poser la traînée derrière la tête. */
  unit: { x: number; y: number };
  length: number;
  /** Durée de la traversée, puis de l'attente avant la suivante. */
  travel: number;
  period: number;
  delay: number;
};

/**
 * Trois trajectoires fixes, rejouées en boucle à des rythmes premiers entre eux
 * plutôt qu'une file d'attente d'apparitions.
 *
 * Le web tire une nouvelle étoile toutes les 0,9 à 2,6 seconde et la range dans
 * un tableau qu'il vide au fur et à mesure. Ici tout se déduit de l'horloge :
 * pas d'état à faire vivre sur le fil d'interface, et des périodes qui ne
 * tombent jamais juste suffisent à ce qu'on ne reconnaisse pas la boucle.
 */
function seedMeteors(width: number, height: number): MeteorSeed[] {
  const span = Math.hypot(width, height);

  return [0, 1, 2].map((index) => {
    const slope = rand(0.45, 0.75);
    const norm = Math.hypot(1, slope);
    const unit = { x: 1 / norm, y: slope / norm };
    const distance = span * 1.4;

    const from = {
      x: rand(-0.3 * width, width * 0.55),
      y: rand(-0.2 * height, height * 0.4),
    };

    return {
      from,
      to: { x: from.x + unit.x * distance, y: from.y + unit.y * distance },
      unit,
      length: rand(80, 190),
      travel: rand(750, 1150),
      // Nombres décimaux et non ronds : trois périodes entières finiraient par
      // se resynchroniser et lâcheraient les trois étoiles ensemble.
      period: 5200 + index * 1730 + rand(0, 900),
      delay: index * 1900 + rand(0, 700),
    };
  });
}

function Meteor({
  meteor,
  time,
  trail,
  head,
}: {
  meteor: MeteorSeed;
  time: SharedValue<number>;
  trail: string;
  head: string;
}) {
  const { from, to, unit, length, travel, period, delay } = meteor;

  const progress = useDerivedValue(() => ((time.value + delay) % period) / travel);

  const transform = useDerivedValue(() => {
    const p = progress.value;
    // Hors de la fenêtre de traversée, l'étoile est invisible : sa position
    // n'a plus d'importance, autant ne pas la recalculer.
    if (p > 1) return [{ translateX: to.x }, { translateY: to.y }];
    return [
      { translateX: from.x + (to.x - from.x) * p },
      { translateY: from.y + (to.y - from.y) * p },
    ];
  });

  // Apparition et disparition en fondu, comme le web : une étoile qui surgirait
  // à pleine intensité au milieu de l'écran se lirait comme un défaut d'affichage.
  const opacity = useDerivedValue(() => {
    const p = progress.value;
    return p > 1 ? 0 : Math.sin(p * Math.PI) * 0.9;
  });

  // La traînée est dessinée **derrière l'origine**, dans le repère local du
  // groupe : sa géométrie et son dégradé sont donc constants, seul le
  // déplacement du groupe est animé.
  const tail = vec(-unit.x * length, -unit.y * length);

  return (
    <Group transform={transform} opacity={opacity}>
      <Line p1={tail} p2={vec(0, 0)} style="stroke" strokeWidth={2} strokeCap="round">
        <SkiaGradient
          start={tail}
          end={vec(0, 0)}
          colors={[withAlpha(trail, 0), trail]}
        />
      </Line>
      <Circle cx={0} cy={0} r={1.8} color={head} />
    </Group>
  );
}

// --------------------------------------------------------------------------
// Aurores
// --------------------------------------------------------------------------

type AuroraLayout = { cx: number; cy: number; r: number; blur: number; opacity: number };

/**
 * Les trois halos du web (`-top-40` centré, en haut à droite, en bas à gauche),
 * transposés en proportions de l'écran. Leur centre reste volontairement hors
 * cadre : c'est ce qui donne un dégradé qui traverse l'écran plutôt qu'une tache
 * ronde posée dessus.
 */
function layoutAuroras(width: number, height: number): AuroraLayout[] {
  const base = Math.max(width, height);

  return [
    { cx: width / 2, cy: -base * 0.12, r: base * 0.42, blur: 70, opacity: 0.3 },
    { cx: width * 1.02, cy: height * 0.12, r: base * 0.28, blur: 60, opacity: 0.24 },
    { cx: -width * 0.05, cy: height * 1.05, r: base * 0.32, blur: 70, opacity: 0.2 },
  ];
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}
