import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ContributionMark } from '@/components/ui/contribution-mark';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';
import type { ApiMemberContributions } from '@/lib/api/contract';
import { useQuery } from '@/lib/api/use-query';

/**
 * Mes cotisations, toutes tontines confondues : ce que j'ai versé, tour par
 * tour.
 *
 * Ce que je dois **ce mois-ci** vit désormais en tête de « Mes tontines », le
 * premier écran ouvert : l'échéance du mois se voit sans changer d'onglet.
 */
export default function ContributionsScreen() {
  const t = useT();

  const { data, loading, refreshing, error, refresh } =
    useQuery<ApiMemberContributions[]>('/api/v1/me/contributions');

  return (
    <Screen title={t('mobile.tabs.contributions')} refreshing={refreshing} onRefresh={refresh}>
      {loading ? <LoadingState /> : null}
      {error && !data ? <ErrorState error={error} onRetry={refresh} /> : null}

      {data ? (
        <View style={styles.section}>
          <ThemedText type="subtitle">{t('rounds.contributions.title')}</ThemedText>
          {data.length === 0 ? (
            <EmptyState icon="calendar-outline" message={t('rounds.empty')} />
          ) : (
            data.map((round) => <RoundContributions key={round.roundId} round={round} />)
          )}
        </View>
      ) : null}
    </Screen>
  );
}

/**
 * Un tour, et mes constats mois par mois.
 *
 * Les cases s'enroulent au lieu de défiler : il n'y a ici qu'une seule ligne —
 * la mienne — donc rien à garder aligné avec une colonne fixe, contrairement à
 * la grille du groupe.
 */
function RoundContributions({ round }: { round: ApiMemberContributions }) {
  const t = useT();
  const format = useFormat();
  const theme = useTheme();

  const months = format.months(round);
  const tone = { DRAFT: 'neutral', ACTIVE: 'success', CLOSED: 'neutral' } as const;

  return (
    <Card style={styles.round}>
      <View style={styles.roundHead}>
        <View style={styles.rowBody}>
          <ThemedText type="subtitle">{round.code}</ThemedText>
          <ThemedText type="small" themeColor="mutedForeground" numberOfLines={1}>
            {round.tontineName}
          </ThemedText>
        </View>
        <Badge tone={tone[round.status]} label={t(`rounds.status.${round.status}`)} />
      </View>

      <ThemedText type="small" themeColor="mutedForeground">
        {t('rounds.columns.monthlyAmount')} :{' '}
        {format.currency(round.monthlyAmount, round.currency)} ·{' '}
        <ThemedText type="small" style={{ color: theme.foreground }}>
          {round.collectedCount} / {round.durationMonths}
        </ThemedText>
      </ThemedText>

      <View style={styles.months}>
        {months.map((month) => (
          <View key={month.month} style={styles.month}>
            <ContributionMark
              status={round.cells[month.month - 1] ?? null}
              label={`${month.longLabel} — ${t(
                `rounds.contributions.statuses.${round.cells[month.month - 1] ?? 'NONE'}`,
              )}`}
              size={24}
            />
            <ThemedText type="small" themeColor="mutedForeground">
              {month.label}
            </ThemedText>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.three },
  rowBody: { flex: 1, gap: 2 },
  round: { gap: Spacing.three },
  roundHead: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  months: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  month: { alignItems: 'center', gap: 2, minWidth: 34 },
});
