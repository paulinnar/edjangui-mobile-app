import type { AuthError, User } from '@supabase/supabase-js';

/**
 * Traduction des erreurs Supabase Auth en clés du catalogue — port de
 * `src/lib/supabase/auth-errors.ts` de l'app web, pour que les deux clients
 * disent la même chose face à la même erreur.
 */
export function mapSignInError(error: AuthError): string {
  const code = error.code ?? '';
  const normalized = error.message.toLowerCase();

  if (code === 'email_not_confirmed' || normalized.includes('email not confirmed'))
    return 'auth.login.emailNotConfirmed';
  if (code === 'invalid_credentials' || normalized.includes('invalid login credentials'))
    return 'auth.login.invalidCredentials';
  if (isRateLimit(code, normalized)) return 'auth.register.rateLimited';
  return 'common.errors.unexpected';
}

export function mapSignUpError(error: AuthError): string {
  const code = error.code ?? '';
  const normalized = error.message.toLowerCase();

  if (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    normalized.includes('already registered') ||
    normalized.includes('already been registered') ||
    normalized.includes('user already exists')
  ) {
    return 'auth.register.emailTaken';
  }
  if (isRateLimit(code, normalized)) return 'auth.register.rateLimited';
  if (code === 'weak_password' || normalized.includes('password'))
    return 'auth.validation.passwordMin';
  return 'common.errors.unexpected';
}

export function isRateLimitError(error: AuthError): boolean {
  return isRateLimit(error.code ?? '', error.message.toLowerCase());
}

/**
 * Les quotas d'envoi du SMTP intégré (quelques e-mails par heure pour tout le
 * projet) frappent le deuxième ou le troisième compte créé dans l'heure, pas le
 * premier — d'où des échecs qui semblent aléatoires.
 */
function isRateLimit(code: string, normalized: string): boolean {
  return (
    code === 'over_email_send_rate_limit' ||
    code === 'over_request_rate_limit' ||
    normalized.includes('rate limit') ||
    normalized.includes('for security purposes')
  );
}

/**
 * Supabase masque les comptes existants quand la protection contre
 * l'énumération est active : `signUp` réussit mais renvoie un utilisateur
 * factice, sans identité. Le détecter permet de renvoyer vers la connexion au
 * lieu d'annoncer une inscription qui n'a pas eu lieu.
 */
export function isObfuscatedExistingUser(user: User | null): boolean {
  return Boolean(user && (user.identities?.length ?? 0) === 0);
}

/**
 * Erreurs rencontrées en fixant le nouveau mot de passe, une fois le lien de
 * réinitialisation suivi.
 */
export function mapUpdatePasswordError(error: AuthError): string {
  const code = error.code ?? '';
  const normalized = error.message.toLowerCase();

  // Le lien a expiré ou a déjà servi : la session de récupération n'existe plus.
  if (
    code === 'session_not_found' ||
    code === 'refresh_token_not_found' ||
    normalized.includes('auth session missing') ||
    normalized.includes('session from session_id claim in jwt does not exist')
  ) {
    return 'auth.resetPassword.linkExpired';
  }
  if (code === 'same_password' || normalized.includes('should be different'))
    return 'auth.resetPassword.samePassword';
  if (isRateLimit(code, normalized)) return 'auth.register.rateLimited';
  if (code === 'weak_password' || normalized.includes('password'))
    return 'auth.validation.passwordMin';
  return 'common.errors.unexpected';
}
