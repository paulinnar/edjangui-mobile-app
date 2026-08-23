import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  isObfuscatedExistingUser,
  isRateLimitError,
  mapSignInError,
  mapSignUpError,
} from '@/lib/auth-errors';
import { supabase } from '@/lib/supabase';

/**
 * Résultat d'une action d'authentification. `messageKey` est une clé du
 * catalogue : l'écran la traduit, ce qui garde ce module indépendant de la
 * langue choisie.
 */
export type AuthResult =
  | { status: 'success'; messageKey?: string }
  | { status: 'error'; messageKey: string };

type SessionValue = {
  session: Session | null;
  user: User | null;
  /** `true` tant que la session enregistrée n'a pas été relue au démarrage. */
  loading: boolean;
  signIn: (values: { email: string; password: string }) => Promise<AuthResult>;
  signUp: (values: {
    fullName: string;
    email: string;
    password: string;
  }) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Relecture du jeton stocké : c'est ce qui évite de redemander le mot de
    // passe à chaque ouverture de l'app.
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null))
      .finally(() => setLoading(false));

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(
    async ({ email, password }: { email: string; password: string }): Promise<AuthResult> => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) return { status: 'error', messageKey: mapSignInError(error) };
      return { status: 'success' };
    },
    [],
  );

  const signUp = useCallback(
    async ({
      fullName,
      email,
      password,
    }: {
      fullName: string;
      email: string;
      password: string;
    }): Promise<AuthResult> => {
      // Contrairement au web, aucune ligne applicative n'est créée ici : le
      // mobile n'a pas accès à Prisma. Le profil est provisionné côté serveur
      // au premier appel `/api/v1/*`, par `getCurrentUser()` — qui sait déjà
      // créer un utilisateur à partir des métadonnées d'inscription.
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });

      if (error || !data.user) {
        return {
          status: 'error',
          messageKey: error ? mapSignUpError(error) : 'common.errors.unexpected',
        };
      }

      if (isObfuscatedExistingUser(data.user)) {
        return { status: 'error', messageKey: 'auth.register.emailTaken' };
      }

      // Sans session, la confirmation d'e-mail est activée sur le projet.
      if (!data.session) {
        return { status: 'success', messageKey: 'auth.register.confirmEmail' };
      }

      return { status: 'success' };
    },
    [],
  );

  const requestPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      // Lien profond : le mail ramène dans l'app, pas dans le navigateur.
      // L'URL doit figurer dans les « Redirect URLs » du projet Supabase.
      redirectTo: Linking.createURL('/reset-password'),
    });

    if (error && isRateLimitError(error)) {
      return { status: 'error', messageKey: 'auth.register.rateLimited' };
    }

    // Réponse identique que l'adresse existe ou non : un message différencié
    // transformerait ce formulaire public en oracle des comptes existants.
    return { status: 'success', messageKey: 'auth.forgotPassword.sent' };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signIn,
      signUp,
      requestPasswordReset,
      signOut,
    }),
    [session, loading, signIn, signUp, requestPasswordReset, signOut],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionValue {
  const value = use(SessionContext);
  if (!value) throw new Error('useSession doit être appelé sous <SessionProvider>.');
  return value;
}
