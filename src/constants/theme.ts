/**
 * Jeton de couleurs du mobile. Les valeurs sont la transposition en hexadécimal
 * des tokens `oklch` de `.theme-brand` dans le `globals.css` de l'app web :
 * React Native ne sait pas lire `oklch`, mais la charte doit rester la même
 * d'un client à l'autre. Toute retouche de la charte se fait côté web d'abord,
 * puis se reporte ici.
 */

import { Platform } from 'react-native';

const palette = {
  light: {
    brand: '#fc6c0f',
    brandSoft: '#fcaa2b',
    /** Blanc sur l'orange : le couple est fixe, il ne change pas de thème. */
    brandForeground: '#ffffff',
    /**
     * Le fond du thème clair est **gris**, quand les cartes restent blanches :
     * c'est ce qui les détache. Avec un fond blanc, une carte ne se distinguait
     * que par sa bordure, et une liste entière se lisait comme une seule
     * surface. Le thème sombre tient déjà cet écart par ses deux gris.
     */
    background: '#f9f9f9',
    foreground: '#120c08',
    card: '#ffffff',
    cardForeground: '#120c08',
    secondary: '#fbf3eb',
    secondaryForeground: '#411e0d',
    muted: '#faf3ec',
    mutedForeground: '#725f52',
    accent: '#ffedda',
    accentForeground: '#501a00',
    border: '#e7ded7',
    destructive: '#e7000b',
    /**
     * Constats de cotisation. L'app web les prend directement dans la palette
     * Tailwind (`emerald-700`, `amber-700` en clair ; les variantes `-400` en
     * sombre) plutôt que dans ses tokens de marque : on transpose donc les
     * mêmes valeurs, sans chercher à les rattacher à la charte.
     */
    success: '#047857',
    warning: '#b45309',
    /**
     * Vert officiel de WhatsApp, identique dans les deux thèmes — donc porté par
     * un texte noir et non par la couleur du thème : sur ce vert clair, le blanc
     * du mode sombre serait illisible.
     */
    whatsapp: '#25d366',
  },
  dark: {
    brand: '#ff7b25',
    brandSoft: '#fcba43',
    brandForeground: '#ffffff',
    background: '#090605',
    foreground: '#faf6f1',
    card: '#14100e',
    cardForeground: '#faf6f1',
    secondary: '#27201b',
    secondaryForeground: '#f6f1eb',
    muted: '#231d19',
    mutedForeground: '#aea396',
    accent: '#372419',
    accentForeground: '#fbe0c1',
    /** `oklch(0.78 0.06 60 / 16%)` côté web : l'alpha est porté ici. */
    border: '#d5af9129',
    destructive: '#ff6467',
    success: '#34d399',
    warning: '#fbbf24',
    whatsapp: '#25d366',
  },
} as const;

export const Colors = palette;

export type ThemeName = keyof typeof palette;
export type ThemeColor = keyof (typeof palette)['light'];

/**
 * Familles chargées par `expo-font` au démarrage (voir `src/app/_layout.tsx`).
 * L'app web compose Inter en texte courant et Roboto en titres : on reprend le
 * même couple. Sur React Native, une graisse = une famille — `fontWeight` est
 * ignoré dès qu'une police personnalisée est posée, donc on choisit la famille.
 */
export const Fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  /** `--font-heading` côté web. */
  heading: 'Roboto_700Bold',
  /** Aucune police monospace n'est embarquée : celle du système suffit. */
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }) as string,
} as const;

/** Échelle de 4 px, alignée sur celle de Tailwind côté web. */
export const Spacing = {
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
  seven: 48,
} as const;

/** `--radius: 0.625rem` côté web, décliné avec les mêmes facteurs. */
export const Radius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
  '2xl': 18,
  '3xl': 22,
  /**
   * Pilule : la valeur dépasse toujours la moitié de la hauteur, ce qui donne
   * des extrémités parfaitement demi-circulaires quelle que soit la taille du
   * contrôle. Réservée à ce qui se touche — boutons, onglets, pastilles.
   */
  full: 999,
} as const;

export const MaxContentWidth = 720;
