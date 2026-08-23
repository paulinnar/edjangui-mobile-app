import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ContributionLegend, RoundMemberList } from '@/components/round-members';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { StatGrid } from '@/components/ui/stat';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';
import type { ApiPenalty, ApiRoundDetail, ApiRoundMember } from '@/lib/api/contract';
import { useQuery } from '@/lib/api/use-query';

const ROUND_TONE = { DRAFT: 'neutral', ACTIVE: 'success', CLOSED: 'neutral' } as const;

/**
 * Le détail d'un tour : ma ligne, celle des autres, et les pénalités.
 *
 * L'API renvoie **une seule** liste de membres là où l'écran web en croise
 * trois — ordre de passage, cotisations, scores. On garde cette unité : un
 * membre est une carte, et la même carte porte son rang, ses versements et son
 * score. La mienne s'y distingue et s'ouvre d'emblée, plutôt que d'être
 * recopiée au-dessus : c'est pour elle qu'on ouvre l'écran, pas pour la lire
 * deux fois.
 */
export default function RoundDetailScreen() {
  const { tontineId, roundId } = useLocalSearchParams<{ tontineId: string; roundId: string }>();
  const t = useT();
  const format = useFormat();

  const { data, loading, refreshing, error, refresh } = useQuery<ApiRoundDetail>(
    `/api/v1/tontines/${tontineId}/rounds/${roundId}`,
  );

  const distributed = data?.members.filter((member) => member.isDistributed).length ?? 0;

  return (
    <Screen
      title={data?.round.code ?? t('rounds.title')}
      subtitle={data?.tontine.name}
      back
      refreshing={refreshing}
      onRefresh={refresh}
    >
      {loading ? <LoadingState /> : null}
      {error && !data ? <ErrorState error={error} onRetry={refresh} /> : null}

      {data ? (
        <>
          <View style={styles.badges}>
            <Badge tone={ROUND_TONE[data.round.status]} label={t(`rounds.status.${data.round.status}`)} />
            <Badge label={format.dateRange(data.round.startDate, data.round.endDate)} />
          </View>

          <StatGrid
            items={[
              {
                label: t('rounds.detail.kpi.monthlyAmount'),
                value: format.currency(data.round.monthlyAmount, data.tontine.currency),
                hint: t('rounds.detail.kpi.monthlyAmountHint'),
              },
              {
                label: t('rounds.detail.kpi.pot'),
                value: format.currency(data.round.monthlyPot, data.tontine.currency),
                hint: t('rounds.detail.kpi.potHint', { count: data.round.memberCount }),
              },
              {
                label: t('mobile.roundMonth'),
                value: `${data.round.currentMonth} / ${data.round.durationMonths}`,
                hint: t('rounds.detail.kpi.periodHint', { date: format.date(data.round.endDate) }),
              },
              {
                label: t('rounds.detail.kpi.progress'),
                value: `${distributed} / ${data.round.memberCount}`,
                hint: t('rounds.detail.kpi.progressHint', { count: distributed }),
              },
            ]}
          />

          <View style={styles.section}>
            <ThemedText type="subtitle">{t('rounds.contributions.title')}</ThemedText>
            <ThemedText type="small" themeColor="mutedForeground">
              {t('rounds.contributions.subtitle', {
                amount: format.currency(data.round.monthlyAmount, data.tontine.currency),
              })}
            </ThemedText>
            <RoundMemberList
              members={data.members}
              startDate={data.round.startDate}
              durationMonths={data.round.durationMonths}
              currency={data.tontine.currency}
            />
            <ContributionLegend />
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle">{t('scoring.title')}</ThemedText>
            <Card style={styles.list}>
              {data.members.map((member) => (
                <ScoreRow key={member.userId} member={member} currency={data.tontine.currency} />
              ))}
            </Card>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle">{t('scoring.penalties.title')}</ThemedText>
            {data.penalties.length === 0 ? (
              <EmptyState icon="shield-checkmark-outline" message={t('scoring.penalties.empty')} />
            ) : (
              <Card style={styles.list}>
                {data.penalties.map((penalty) => (
                  <PenaltyRow
                    key={penalty.id}
                    penalty={penalty}
                    currency={data.tontine.currency}
                  />
                ))}
              </Card>
            )}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function ScoreRow({ member, currency }: { member: ApiRoundMember; currency: string }) {
  const format = useFormat();
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <Avatar fullName={member.fullName} avatarName={member.avatarName} size={32} />
      <View style={styles.rowBody}>
        <ThemedText type="small" numberOfLines={1}>
          {member.fullName}
        </ThemedText>
        {member.penaltyCount > 0 ? (
          <ThemedText type="small" themeColor="mutedForeground">
            {member.penaltyCount} · {format.currency(member.penaltyAmount, currency)}
          </ThemedText>
        ) : null}
      </View>
      <ThemedText
        type="subtitle"
        style={{ color: member.score < 0 ? theme.destructive : theme.foreground }}
      >
        {member.score}
      </ThemedText>
    </View>
  );
}

function PenaltyRow({ penalty, currency }: { penalty: ApiPenalty; currency: string }) {
  const t = useT();
  const format = useFormat();

  return (
    <View style={styles.row}>
      <Avatar fullName={penalty.fullName} avatarName={penalty.avatarName} size={32} />
      <View style={styles.rowBody}>
        <ThemedText type="small" numberOfLines={2}>
          {t(`scoring.types.${penalty.type}`)}
        </ThemedText>
        <ThemedText type="small" themeColor="mutedForeground" numberOfLines={1}>
          {penalty.fullName} · {format.date(penalty.createdAt)}
        </ThemedText>
      </View>
      <View style={styles.penaltyAmounts}>
        <ThemedText type="small" themeColor="destructive">
          {penalty.pointsDeducted}
        </ThemedText>
        {penalty.amount > 0 ? (
          <ThemedText type="small" themeColor="mutedForeground">
            {format.currency(penalty.amount, currency)}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  section: { gap: Spacing.three },
  list: { gap: Spacing.four },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  rowBody: { flex: 1 },
  penaltyAmounts: { alignItems: 'flex-end' },
});
