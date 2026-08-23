import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/lib/session';

/**
 * Écrans publics. Un utilisateur déjà connecté n'a rien à y faire — le
 * renvoyer évite qu'un retour arrière ramène sur le formulaire de connexion
 * après une session ouverte.
 */
export default function AuthLayout() {
  const { session } = useSession();

  if (session) return <Redirect href="/(app)/tontines" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Le fond animé est le même d'un écran à l'autre : le fondu ne le
        // fait pas sauter, contrairement au glissement latéral par défaut.
        animation: 'fade',
      }}
    />
  );
}
