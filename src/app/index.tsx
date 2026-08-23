import { Redirect } from 'expo-router';

import { useSession } from '@/lib/session';

/**
 * Aiguillage d'entrée. Le layout racine n'affiche rien tant que la session
 * enregistrée n'est pas relue : quand cet écran est monté, `session` est donc
 * déjà la valeur définitive et la redirection ne se corrige pas après coup.
 */
export default function Index() {
  const { session } = useSession();
  return <Redirect href={session ? '/(app)/tontines' : '/(auth)/login'} />;
}
