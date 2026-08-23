import { supabase } from '@/lib/supabase';

/**
 * Client de l'API `/api/v1/*` de l'app web.
 *
 * Toutes les requêtes portent le jeton Supabase en `Authorization: Bearer` :
 * l'app mobile n'a pas de cookies, c'est l'en-tête qui établit la session côté
 * serveur. Le jeton est relu à **chaque** appel plutôt que mémorisé — il expire
 * en une heure, et `getSession()` le renouvelle au passage si besoin.
 */

/** Codes d'erreur du contrat, plus ceux que seul le client peut constater. */
export type ApiFailureCode =
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'invalid_request'
  | 'server_error'
  /** Serveur injoignable : pas de réseau, mauvaise URL, app web éteinte. */
  | 'unreachable';

export class ApiFailure extends Error {
  readonly code: ApiFailureCode;
  /** Clé du catalogue — l'écran la traduit dans la langue de l'appareil. */
  readonly messageKey: string;

  constructor(code: ApiFailureCode, messageKey: string) {
    super(`${code}: ${messageKey}`);
    this.name = 'ApiFailure';
    this.code = code;
    this.messageKey = messageKey;
  }
}

function baseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) {
    throw new ApiFailure('unreachable', 'common.errors.unexpected');
  }
  return url.replace(/\/+$/, '');
}

/**
 * Adresse d'un avatar de la planche livrée avec l'app web.
 *
 * Les 32 fichiers pèsent 4 Mo : les servir depuis `public/avatars` plutôt que
 * de les embarquer garde l'APK léger et évite qu'une planche modifiée côté web
 * ne laisse le mobile sur d'anciennes images. `expo-image` les met en cache.
 */
export function avatarUrl(avatarName: string | null | undefined): string | null {
  if (!avatarName || !/^avatar_\d+$/.test(avatarName)) return null;
  return `${baseUrl()}/avatars/${avatarName}.png`;
}

type ErrorBody = { error?: { code?: string; messageKey?: string } };

const KNOWN_CODES: ApiFailureCode[] = [
  'unauthenticated',
  'forbidden',
  'not_found',
  'invalid_request',
  'server_error',
];

async function failureFrom(response: Response): Promise<ApiFailure> {
  let body: ErrorBody | null = null;
  // Un 502 d'un proxy ou une page d'erreur HTML ne portent pas le corps du
  // contrat : on ne laisse pas l'analyse JSON masquer le vrai statut.
  try {
    body = (await response.json()) as ErrorBody;
  } catch {
    body = null;
  }

  const code = body?.error?.code;
  const known = KNOWN_CODES.find((candidate) => candidate === code);

  if (known) {
    return new ApiFailure(known, body?.error?.messageKey ?? 'common.errors.unexpected');
  }

  if (response.status === 401) {
    return new ApiFailure('unauthenticated', 'common.errors.unauthorized');
  }
  return new ApiFailure('server_error', 'common.errors.unexpected');
}

async function request<T>(
  path: string,
  init?: { method?: string; body?: unknown; signal?: AbortSignal },
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new ApiFailure('unauthenticated', 'common.errors.unauthorized');
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method: init?.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        ...(init?.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
      signal: init?.signal,
    });
  } catch (error) {
    // `fetch` ne rejette que sur un échec réseau — un 500 passe par la branche
    // suivante. L'abandon volontaire, lui, doit remonter tel quel.
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiFailure('unreachable', 'common.errors.unexpected');
  }

  if (!response.ok) throw await failureFrom(response);

  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(path, { method: 'POST', body: body ?? {}, signal }),
  patch: <T>(path: string, body: unknown, signal?: AbortSignal) =>
    request<T>(path, { method: 'PATCH', body, signal }),
};
