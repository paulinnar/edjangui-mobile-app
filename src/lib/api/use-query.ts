import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiFailure, api } from '@/lib/api/client';
import { supabase } from '@/lib/supabase';

export type QueryState<T> = {
  data: T | null;
  /** Premier chargement seulement : les rafraîchissements ne le rallument pas. */
  loading: boolean;
  refreshing: boolean;
  error: ApiFailure | null;
  refresh: () => void;
};

/**
 * Lecture d'une route de l'API, avec rafraîchissement au retour sur l'écran.
 *
 * Pas de bibliothèque de cache : les écrans du mobile lisent chacun une route,
 * n'en partagent aucune, et un tour rechargé au moment où on l'ouvre vaut mieux
 * qu'un cache à invalider. Le seul cas qui demanderait plus — la pastille de
 * non-lus après lecture d'un message — se règle par un `refresh()` explicite.
 *
 * Le premier chargement passe par `loading` (l'écran est vide, on montre un
 * indicateur) ; les suivants par `refreshing` (l'écran a déjà du contenu, il ne
 * doit pas disparaître sous les yeux du lecteur).
 */
export function useQuery<T>(path: string | null): QueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ApiFailure | null>(null);

  // Le résultat d'une requête abandonnée ne doit pas écraser celui de la
  // suivante : seule la dernière lancée a le droit d'écrire dans l'état.
  const currentRequest = useRef<AbortController | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      currentRequest.current?.abort();
    };
  }, []);

  const run = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (path === null) return;

      currentRequest.current?.abort();
      const controller = new AbortController();
      currentRequest.current = controller;

      if (mode === 'refresh') setRefreshing(true);
      else setLoading(true);

      try {
        const payload = await api.get<T>(path, controller.signal);
        if (controller.signal.aborted || !mounted.current) return;
        setData(payload);
        setError(null);
      } catch (failure) {
        if (controller.signal.aborted || !mounted.current) return;

        if (failure instanceof ApiFailure) {
          setError(failure);
          // Jeton expiré ou révoqué : fermer la session renvoie au login par le
          // garde de navigation, plutôt que de laisser un écran d'erreur dont
          // on ne peut rien faire.
          if (failure.code === 'unauthenticated') void supabase.auth.signOut();
        } else {
          setError(new ApiFailure('server_error', 'common.errors.unexpected'));
        }
      } finally {
        if (mounted.current && !controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [path],
  );

  // Au montage **et** à chaque retour sur l'écran : revenir d'un détail de tour
  // doit montrer la liste à jour, pas celle d'il y a dix minutes.
  useFocusEffect(
    useCallback(() => {
      void run(data === null ? 'initial' : 'refresh');
      // `data` est volontairement hors des dépendances : l'inclure relancerait
      // une requête à chaque réponse reçue.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [run]),
  );

  const refresh = useCallback(() => {
    void run('refresh');
  }, [run]);

  return { data, loading, refreshing, error, refresh };
}
