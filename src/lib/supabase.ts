// Le polyfill doit précéder l'import de `supabase-js` : le client construit ses
// URL avec `URL`/`URLSearchParams`, absents du moteur Hermes.
import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { chunkedSecureStore } from '@/lib/secure-store';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY sont requis. ' +
      'Copiez `.env.example` en `.env`.',
  );
}

export const supabase = createClient(url, publishableKey, {
  auth: {
    storage: chunkedSecureStore,
    autoRefreshToken: true,
    persistSession: true,
    // PKCE : le lien reçu par e-mail ne porte qu'un code à usage unique, que
    // seul le téléphone qui l'a demandé peut échanger — le vérificateur reste
    // dans le stockage chiffré. Un lien intercepté ne donne donc rien.
    flowType: 'pkce',
    // Il n'y a pas de barre d'adresse sur mobile : les liens de confirmation et
    // de réinitialisation sont traités par le lien profond, pas par l'URL.
    detectSessionInUrl: false,
  },
});

/**
 * Le rafraîchissement automatique tourne sur une minuterie : laissé actif en
 * arrière-plan, il consomme la batterie et échoue hors ligne. On le suspend
 * dès que l'app quitte le premier plan.
 */
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
});
