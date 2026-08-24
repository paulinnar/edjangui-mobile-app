// Import par sous-chemin et non depuis la racine du paquet : l'index réexporte
// toute la famille (thin, black, italiques…) et Metro embarquerait alors une
// vingtaine de fichiers .ttf inutiles dans l'APK.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Roboto_700Bold } from '@expo-google-fonts/roboto/700Bold';
import { useFonts } from 'expo-font';
// Depuis le SDK 56, expo-router n'utilise plus `@react-navigation/native` : il
// réexporte lui-même le fournisseur de thème et ses deux thèmes de base.
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SplashView } from '@/components/splash-view';
import { Colors } from '@/constants/theme';
import { useThemeName } from '@/hooks/use-theme';
import { PreferencesProvider, usePreferences } from '@/lib/preferences';
import { SessionProvider, useSession } from '@/lib/session';

// L'écran de démarrage reste affiché tant que les polices, les préférences et
// la session enregistrée ne sont pas lues : sans cela, l'app clignote entre un
// premier rendu système et le rendu à la charte.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Roboto_700Bold,
  });

  return (
    <PreferencesProvider>
      <SessionProvider>
        <SafeAreaProvider>
          <Navigation fontsLoaded={fontsLoaded} />
        </SafeAreaProvider>
      </SessionProvider>
    </PreferencesProvider>
  );
}

function Navigation({ fontsLoaded }: { fontsLoaded: boolean }) {
  const themeName = useThemeName();
  const { ready: preferencesReady } = usePreferences();
  const { loading: sessionLoading } = useSession();
  const theme = Colors[themeName];

  const ready = fontsLoaded && preferencesReady && !sessionLoading;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  // Le fond animé plutôt qu'un écran vide : le démarrage natif couvre le
  // lancement à froid, celui-ci couvre la lecture des polices, des préférences
  // et de la session — et les rechargements, où le natif est déjà retombé.
  if (!ready) return <SplashView />;

  // Le thème de React Navigation pilote le fond des transitions et des écrans
  // non peints : sans lui, un éclair blanc traverse chaque navigation en sombre.
  const navigationTheme = {
    ...(themeName === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(themeName === 'dark' ? DarkTheme : DefaultTheme).colors,
      primary: theme.brand,
      background: theme.background,
      card: theme.card,
      text: theme.foreground,
      border: theme.border,
      notification: theme.brand,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="reset-password" />
      </Stack>
    </ThemeProvider>
  );
}
