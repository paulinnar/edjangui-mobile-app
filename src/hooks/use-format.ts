import { useMemo } from 'react';

import {
  formatCalendarDate,
  formatCalendarRange,
  formatCurrency,
  formatDateTime,
  formatWallClockDateTime,
  roundMonths,
  type RoundMonth,
} from '@/lib/format';
import { usePreferences } from '@/lib/preferences';

/**
 * Les formateurs, liés à la langue courante.
 *
 * Passer la locale à chaque appel serait bruyant dans le rendu, et l'oublier
 * une fois suffirait à afficher une date en anglais au milieu d'un écran
 * français.
 */
export function useFormat() {
  const { locale } = usePreferences();

  return useMemo(
    () => ({
      currency: (amount: number, currency: string) => formatCurrency(amount, currency, locale),
      date: (iso: string) => formatCalendarDate(iso, locale),
      dateRange: (fromIso: string, toIso: string) => formatCalendarRange(fromIso, toIso, locale),
      dateTime: (iso: string) => formatDateTime(iso, locale),
      wallClock: (iso: string) => formatWallClockDateTime(iso, locale),
      months: (round: { startDate: string; durationMonths: number }): RoundMonth[] =>
        roundMonths(round, locale),
    }),
    [locale],
  );
}
