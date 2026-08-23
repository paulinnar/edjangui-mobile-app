import type { Locale } from '@/lib/preferences';

/**
 * Mise en forme des valeurs rendues brutes par l'API.
 *
 * Le serveur ne connaît pas la locale du téléphone : il renvoie des nombres,
 * des devises et des dates ISO, et c'est ici qu'on les habille. Les règles sont
 * celles de `src/lib/utils.ts` de l'app web, pour qu'un même montant se lise
 * pareil des deux côtés.
 */

const LOCALE_TAGS: Record<Locale, string> = { fr: 'fr-FR', en: 'en-GB' };

export function localeTag(locale: Locale): string {
  return LOCALE_TAGS[locale];
}

/**
 * Montant dans la devise de la tontine.
 *
 * Les décimales n'apparaissent que si le montant en a réellement : une
 * cotisation de 50 000 FCFA ou de 200 € se lit sans centimes inutiles, alors
 * qu'un montant fractionnaire doit s'afficher exactement.
 */
export function formatCurrency(amount: number, currency: string, locale: Locale): string {
  const tag = localeTag(locale);
  const isWhole = Number.isInteger(amount);

  try {
    return new Intl.NumberFormat(tag, {
      style: 'currency',
      currency,
      ...(isWhole ? { maximumFractionDigits: 0 } : {}),
    }).format(amount);
  } catch {
    // Devise inconnue d'Intl : repli lisible plutôt qu'une exception.
    return `${new Intl.NumberFormat(tag).format(amount)} ${currency}`;
  }
}

/**
 * Date **calendaire**, rendue en UTC.
 *
 * Les bornes d'un tour ne sont pas des instants mais des mois entiers, calés en
 * UTC côté serveur. Les rendre dans le fuseau du téléphone ferait glisser la
 * fin d'un tour au 1er du mois suivant à l'est de Greenwich — le tour affiché
 * contredirait son propre code `TOUR-MMAA-MMAA`.
 */
export function formatCalendarDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

/** Intervalle de dates calendaires : « 1 août 2026 – 31 juil. 2027 ». */
export function formatCalendarRange(fromIso: string, toIso: string, locale: Locale): string {
  // Deux dates mises bout à bout plutôt que `formatRange` : Hermes n'implémente
  // pas cette méthode, et l'absence se verrait à l'exécution seulement.
  return `${formatCalendarDate(fromIso, locale)} – ${formatCalendarDate(toIso, locale)}`;
}

/** Instant daté, dans le fuseau du téléphone : envoi d'un message, lecture… */
export function formatDateTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

/**
 * Date et heure **d'horloge murale**, rendues en UTC.
 *
 * L'échéance d'un vote et l'heure d'un événement sont annoncées par
 * l'administration, pas datées comme un instant : « jeudi 18h00 » doit se lire
 * « jeudi 18h00 » pour tout le monde, y compris le membre de la diaspora qui
 * consulte depuis un autre fuseau. Les caler sur le téléphone décalerait
 * l'heure du rendez-vous d'un lecteur à l'autre.
 */
export function formatWallClockDateTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

export type RoundMonth = {
  /** Rang du mois dans le tour, de 1 à `durationMonths`. */
  month: number;
  /** Étiquette courte de colonne : « janv. », ou « janv. 27 » à cheval sur deux ans. */
  label: string;
  /** Mois complet, pour les listes et les libellés d'accessibilité. */
  longLabel: string;
};

/**
 * Les mois d'un tour, étiquetés dans la langue de lecture — port de
 * `roundMonths` de l'app web.
 *
 * L'année n'apparaît que si le tour en traverse plusieurs : la répéter sur
 * douze colonnes d'une même année n'apprendrait rien et volerait la largeur
 * dont l'écran manque déjà.
 */
export function roundMonths(
  round: { startDate: string; durationMonths: number },
  locale: Locale,
): RoundMonth[] {
  const tag = localeTag(locale);
  const short = new Intl.DateTimeFormat(tag, { month: 'short', timeZone: 'UTC' });
  const shortWithYear = new Intl.DateTimeFormat(tag, {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  });
  const long = new Intl.DateTimeFormat(tag, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const start = new Date(round.startDate);
  const spansYears = start.getUTCMonth() + round.durationMonths - 1 > 11;

  return Array.from({ length: round.durationMonths }, (_, index) => {
    const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1));
    return {
      month: index + 1,
      label: (spansYears ? shortWithYear : short).format(date),
      longLabel: long.format(date),
    };
  });
}

/** Les deux premières initiales — repli quand aucun avatar n'est choisi. */
export function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

/** Identité publique d'un membre : `@mon-pseudo`. */
export function formatHandle(username: string): string {
  return `@${username}`;
}
