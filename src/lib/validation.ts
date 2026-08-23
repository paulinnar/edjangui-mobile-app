/**
 * Contrôles de saisie des formulaires d'authentification. Mêmes règles et mêmes
 * clés de message que les schémas Zod de l'app web (`src/lib/validation.ts`) —
 * sans Zod : trois champs ne justifient pas la dépendance côté mobile, et le
 * serveur revalide de toute façon.
 */
export type FieldErrors = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN_LENGTH = 8;

export function validateSignIn(values: { email: string; password: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!EMAIL.test(values.email.trim())) errors.email = 'auth.validation.email';
  if (values.password.length < PASSWORD_MIN_LENGTH)
    errors.password = 'auth.validation.passwordMin';
  return errors;
}

export function validateSignUp(values: {
  fullName: string;
  email: string;
  password: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (values.fullName.trim().length < 2) errors.fullName = 'auth.validation.fullNameMin';
  if (!EMAIL.test(values.email.trim())) errors.email = 'auth.validation.email';
  if (values.password.length < PASSWORD_MIN_LENGTH)
    errors.password = 'auth.validation.passwordMin';
  return errors;
}

export function validateEmailOnly(email: string): FieldErrors {
  return EMAIL.test(email.trim()) ? {} : { email: 'auth.validation.email' };
}

export function validateResetPassword(values: {
  password: string;
  confirmPassword: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (values.password.length < PASSWORD_MIN_LENGTH)
    errors.password = 'auth.validation.passwordMin';
  else if (values.password !== values.confirmPassword)
    errors.confirmPassword = 'auth.validation.passwordMismatch';
  return errors;
}
