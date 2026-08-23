import { Stack } from 'expo-router';

/**
 * Pile de l'onglet « Tontines » : liste → tontine → tour.
 *
 * Une pile propre à l'onglet, et non une pile globale : revenir sur l'onglet
 * doit retrouver le tour qu'on lisait, pas repartir de la liste.
 */
export default function TontinesLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
