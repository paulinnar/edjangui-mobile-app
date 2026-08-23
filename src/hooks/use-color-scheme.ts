import { useColorScheme as useSystemColorScheme } from 'react-native';

import { usePreferences } from '@/lib/preferences';

/**
 * Thème effectif de l'écran. `system` suit le réglage du téléphone ; `light` et
 * `dark` sont les choix explicites de la bascule du profil.
 */
export function useColorScheme(): 'light' | 'dark' {
  const { themeMode } = usePreferences();
  const system = useSystemColorScheme();

  if (themeMode === 'system') return system === 'dark' ? 'dark' : 'light';
  return themeMode;
}
