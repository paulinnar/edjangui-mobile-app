import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Stockage chiffré à l'épreuve de la limite de taille d'Android.
 *
 * Le Keystore Android refuse toute valeur dépassant 2 048 octets, et une
 * session Supabase (JWT d'accès + jeton de rafraîchissement + profil) la
 * dépasse systématiquement. On découpe donc la valeur, et la clé d'origine ne
 * porte plus que le nombre de morceaux.
 *
 * Le découpage est fait en **caractères** avec une taille volontairement basse :
 * un caractère UTF-8 pèse jusqu'à 4 octets, donc 500 caractères ne peuvent
 * jamais franchir la limite, quel que soit le contenu (accents d'un nom
 * complet, emoji dans un pseudo…).
 */
const CHUNK_SIZE = 500;

/** Marqueur inscrit à la place de la valeur quand elle a été découpée. */
const MANIFEST = '__chunked__:';

const chunkKey = (key: string, index: number) => `${key}.${index}`;

async function getItem(key: string): Promise<string | null> {
  const head = await SecureStore.getItemAsync(key);
  if (head === null || !head.startsWith(MANIFEST)) return head;

  const count = Number(head.slice(MANIFEST.length));
  const parts = await Promise.all(
    Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(chunkKey(key, i))),
  );

  // Un morceau manquant rend l'ensemble inexploitable : on rend `null` plutôt
  // qu'une session tronquée, ce qui renvoie proprement l'utilisateur au login.
  if (parts.some((part) => part === null)) {
    await removeItem(key);
    return null;
  }

  return parts.join('');
}

async function setItem(key: string, value: string): Promise<void> {
  // Toujours purger d'abord : passer d'une valeur longue à une valeur courte
  // laisserait sinon traîner les anciens morceaux.
  await removeItem(key);

  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE));
  }

  await Promise.all(
    chunks.map((chunk, i) => SecureStore.setItemAsync(chunkKey(key, i), chunk)),
  );
  // Le manifeste s'écrit en dernier : si l'écriture d'un morceau échoue, la
  // clé d'origine reste absente et la lecture ne verra pas de session partielle.
  await SecureStore.setItemAsync(key, `${MANIFEST}${chunks.length}`);
}

async function removeItem(key: string): Promise<void> {
  const head = await SecureStore.getItemAsync(key);
  if (head?.startsWith(MANIFEST)) {
    const count = Number(head.slice(MANIFEST.length));
    await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(chunkKey(key, i))),
    );
  }
  await SecureStore.deleteItemAsync(key);
}

/**
 * Repli hors Android et iOS.
 *
 * `expo-secure-store` s'adosse au Keystore et au Trousseau : il n'existe ni
 * dans le navigateur, ni dans le Node qui prérend l'export web. Le stockage y
 * retombe donc sur `localStorage`, et sur rien du tout côté serveur — un rendu
 * serveur n'a de toute façon aucune session à restaurer.
 *
 * Ce repli ne sert qu'aux aperçus web pendant le développement : la cible du
 * projet reste l'APK, où c'est bien le stockage chiffré qui s'applique.
 */
const webStore = {
  async getItem(key: string) {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  },
};

/** Adaptateur au format attendu par `supabase-js`. */
export const chunkedSecureStore =
  Platform.OS === 'android' || Platform.OS === 'ios'
    ? { getItem, setItem, removeItem }
    : webStore;
