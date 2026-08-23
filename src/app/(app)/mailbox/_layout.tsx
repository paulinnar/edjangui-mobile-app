import { Stack } from 'expo-router';

/**
 * Pile de l'onglet « Messages » : boîte de réception → message.
 *
 * Une pile propre à l'onglet : passer sur un autre onglet et revenir doit
 * retrouver le message ouvert, pas la liste.
 */
export default function MailboxLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
