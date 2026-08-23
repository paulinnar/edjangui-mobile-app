import { Colors, type ThemeName } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeName(): ThemeName {
  return useColorScheme();
}

/** Palette du thème courant. `theme.brand`, `theme.card`, etc. */
export function useTheme() {
  return Colors[useThemeName()];
}
