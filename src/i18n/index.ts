import { useCallback } from 'react';

import { formatMessage, type FormatVars } from '@/i18n/format';
import en from '@/i18n/messages/en.json';
import fr from '@/i18n/messages/fr.json';
import mobileEn from '@/i18n/messages/mobile.en.json';
import mobileFr from '@/i18n/messages/mobile.fr.json';
import { usePreferences, type Locale } from '@/lib/preferences';

/**
 * Catalogues repris tels quels de l'app web (`node scripts/sync-messages.mjs`).
 * Le mobile n'en utilise qu'une partie — les écrans d'administration ne sont
 * pas portés — mais garder les fichiers entiers évite d'entretenir un sous-
 * ensemble qui dérive à chaque libellé ajouté côté web.
 */
const catalogs: Record<Locale, unknown> = { fr, en };

/**
 * Libellés propres au mobile — noms d'onglets, réglages d'apparence — que l'app
 * web n'a pas. Ils vivent dans des fichiers séparés, sous la branche `mobile`,
 * pour que `scripts/sync-messages.mjs` puisse écraser les catalogues du web
 * sans jamais les emporter.
 */
const mobileCatalogs: Record<Locale, unknown> = { fr: mobileFr, en: mobileEn };

function lookup(catalog: unknown, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>((node, part) => {
    if (node && typeof node === 'object' && part in node) {
      return (node as Record<string, unknown>)[part];
    }
    return undefined;
  }, catalog);

  return typeof value === 'string' ? value : undefined;
}

export function translate(key: string, locale: Locale, vars: FormatVars = {}): string {
  // Repli sur le français avant de rendre la clé : une traduction anglaise
  // manquante doit afficher un texte lisible, pas `tontine.rounds.frozen`.
  const template =
    lookup(mobileCatalogs[locale], key) ??
    lookup(catalogs[locale], key) ??
    lookup(mobileCatalogs.fr, key) ??
    lookup(catalogs.fr, key);
  if (template === undefined) {
    if (__DEV__) console.warn(`[i18n] clé absente : ${key}`);
    return key;
  }
  return formatMessage(template, vars, locale);
}

export type Translate = (key: string, vars?: FormatVars) => string;

/**
 * `t('auth.login.title')`. Un préfixe facultatif évite de répéter la branche du
 * catalogue : `useT('auth.login')` puis `t('title')`.
 */
export function useT(prefix?: string): Translate {
  const { locale } = usePreferences();

  return useCallback(
    (key: string, vars?: FormatVars) =>
      translate(prefix ? `${prefix}.${key}` : key, locale, vars),
    [locale, prefix],
  );
}
