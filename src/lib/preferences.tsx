import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
export type Locale = 'fr' | 'en';

const THEME_KEY = 'preferences.themeMode';
const LOCALE_KEY = 'preferences.locale';

/** Langue par défaut : celle du téléphone si on la parle, français sinon. */
function deviceLocale(): Locale {
  const tag = getLocales()[0]?.languageCode;
  return tag === 'en' ? 'en' : 'fr';
}

type Preferences = {
  themeMode: ThemeMode;
  locale: Locale;
  setThemeMode: (mode: ThemeMode) => void;
  setLocale: (locale: Locale) => void;
  /** `false` tant que les valeurs enregistrées n'ont pas été relues. */
  ready: boolean;
};

const PreferencesContext = createContext<Preferences | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [locale, setLocaleState] = useState<Locale>(deviceLocale);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.multiGet([THEME_KEY, LOCALE_KEY])
      .then((entries) => {
        if (cancelled) return;
        const stored = Object.fromEntries(entries);
        const mode = stored[THEME_KEY];
        const lang = stored[LOCALE_KEY];
        if (mode === 'light' || mode === 'dark' || mode === 'system') setThemeModeState(mode);
        if (lang === 'fr' || lang === 'en') setLocaleState(lang);
      })
      // Un stockage illisible ne doit pas bloquer le démarrage : on repart des
      // valeurs par défaut.
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    void AsyncStorage.setItem(THEME_KEY, mode);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    void AsyncStorage.setItem(LOCALE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({ themeMode, locale, setThemeMode, setLocale, ready }),
    [themeMode, locale, setThemeMode, setLocale, ready],
  );

  return <PreferencesContext value={value}>{children}</PreferencesContext>;
}

export function usePreferences(): Preferences {
  const value = use(PreferencesContext);
  if (!value) throw new Error('usePreferences doit être appelé sous <PreferencesProvider>.');
  return value;
}
