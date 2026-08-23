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
import type { ApiCommitment, ApiMemberContributions } from '@/lib/api/contract';
import { useQuery } from '@/lib/api/use-query';

/**
 * Mes cotisations, toutes tontines confondues.
 *
 * Deux questions, dans cet ordre : **ce que je dois maintenant**, puis ce que
 * j'ai versé jusqu'ici. L'app web répartit les deux entre le tableau de bord et
 * la page d'une tontine ; sur téléphone, un membre qui ouvre « Cotisations »
 * cherche d'abord son échéance du mois, quel que soit le groupe concerné.
 */
export default function ContributionsScreen() {
  const t = useT();

  const commitments = useQuery<ApiCommitment[]>('/api/v1/me/commitments');
  const rounds = useQuery<ApiMemberContributions[]>('/api/v1/me/contributions');

  const refresh = () => {
    commitments.refresh();
    rounds.refresh();
  };

  const loading = commitments.loading || rounds.loading;
  const error = commitments.error ?? rounds.error;
  const nothingLoaded = !commitments.data && !rounds.data;

  return (
    <Screen
      title={t('mobile.tabs.contributions')}
      refreshing={commitments.refreshing || rounds.refreshing}
      onRefresh={refresh}
    >
      {loading && nothingLoaded ? <LoadingState /> : null}
      {error && nothingLoaded ? <ErrorState error={error} onRetry={refresh} /> : null}

      {commitments.data ? (
        <View style={styles.section}>
          <ThemedText type="subtitle">{t('dashboard.commitments.title')}</ThemedText>
          {commitments.data.length === 0 ? (
            <EmptyState icon="checkmark-circle-outline" message={t('dashboard.commitments.empty')} />
          ) : (
            <Card style={styles.list}>
              {commitments.data.map((commitment) => (
                <CommitmentRow key={commitment.id} commitment={commitment} />
              ))}
            </Card>
          )}
        </View>
      ) : null}

      {rounds.data ? (
        <View style={styles.section}>
          <ThemedText type="subtitle">{t('rounds.contributions.title')}</ThemedText>
          {rounds.data.length === 0 ? (
            <EmptyState icon="calendar-outline" message={t('rounds.empty')} />
          ) : (
            rounds.data.map((round) => (
              <RoundContributions key={round.roundId} round={round} />
            ))
          )}
        </View>
      ) : null}
    </Screen>
  );
}

function CommitmentRow({ commitment }: { commitment: ApiCommitment }) {
  const t = useT();
  const format = useFormat();

  return (
    <View style={styles.row}>
      <View style={styles.rowBody}>
        <ThemedText type="small">{t(`dashboard.commitments.kinds.${commitment.kind}`)}</ThemedText>
        <ThemedText type="small" themeColor="mutedForeground" numberOfLines={2}>
          {commitment.tontineName}
          {commitment.detail ? ` · ${commitment.detail}` : ''}
        </ThemedText>
        {commitment.dueDate ? (
          <ThemedText type="small" themeColor="mutedForeground">
            {t('dashboard.commitments.columns.dueDate')} : {format.date(commitment.dueDate)}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.rowEnd}>
        <ThemedText type="small">
          {format.currency(commitment.amount, commitment.currency)}
        </ThemedText>
        {commitment.isOverdue ? (
          <Badge tone="destructive" label={t('dashboard.commitments.overdueBadge')} />
        ) : null}
      </View>
    </View>
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
  list: { gap: Spacing.four },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  rowBody: { flex: 1, gap: 2 },
  rowEnd: { alignItems: 'flex-end', gap: Spacing.one },
  round: { gap: Spacing.three },
  roundHead: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  months: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  month: { alignItems: 'center', gap: 2, minWidth: 34 },
});
