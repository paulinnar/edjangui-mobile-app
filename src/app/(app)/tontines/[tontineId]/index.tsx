import { router, useLocalSearchParams } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TouchableCard } from '@/components/ui/row';
import { StatGrid } from '@/components/ui/stat';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';
import type { ApiRoundSummary, ApiTontineDetail } from '@/lib/api/contract';
import { useQuery } from '@/lib/api/use-query';

/**
 * Une tontine, vue par un de ses membres.
 *
 * L'écran web ouvre sur la synthèse du groupe ; ici c'est l'inverse qui prime :
 * ce que **je** dois passe en premier, le groupe ensuite. Sur téléphone, on
 * ouvre sa tontine pour savoir où on en est, pas pour lire un tableau de bord.
 */
export default function TontineDetailScreen() {
  const { tontineId } = useLocalSearchParams<{ tontineId: string }>();
  const t = useT();
  const format = useFormat();
  const theme = useTheme();

  const detail = useQuery<ApiTontineDetail>(`/api/v1/tontines/${tontineId}`);
  const rounds = useQuery<ApiRoundSummary[]>(`/api/v1/tontines/${tontineId}/rounds`);

  const refresh = () => {
    detail.refresh();
    rounds.refresh();
  };

  const data = detail.data;
  const money = (amount: number) => format.currency(amount, data?.currency ?? 'XAF');

  // Les brouillons ne sont pas montrés : un tour qui n'a pas démarré n'appelle
  // aucune cotisation, et le mobile n'expose aucune écriture qui permettrait
  // d'en faire quoi que ce soit. Le filtre est ici et non côté API : le web, lui,
  // laisse un administrateur voir se préparer le tour suivant.
  const otherRounds = rounds.data?.filter(
    (round) => round.status !== 'DRAFT' && round.id !== data?.activeRound?.id,
  );

  return (
    <Screen
      title={data?.name ?? t('nav.tontines')}
      back
      refreshing={detail.refreshing || rounds.refreshing}
      onRefresh={refresh}
    >
      {detail.loading ? <LoadingState /> : null}
      {detail.error && !data ? <ErrorState error={detail.error} onRetry={refresh} /> : null}

      {data ? (
        <>
          <View style={styles.badges}>
            <Badge label={t(`common.roles.${data.membership.role}`)} />
            <Badge label={t('mobile.members', { count: data.memberCount })} />
            {data.mailbox.unread > 0 ? (
              <Badge tone="brand" label={t('mailbox.unreadAlert', { count: data.mailbox.unread })} />
            ) : null}
          </View>

          {/* Ma situation d'abord — caution et fond de caisse, avec le reste dû
              mis en évidence : c'est la seule chose sur laquelle je peux agir. */}
          <StatGrid
            items={[
              {
                label: t('tontine.card.caution'),
                value: money(data.membership.cautionBalance),
                hint:
                  data.membership.cautionDue > 0
                    ? `${t('tontine.caution.columns.deficit')} : ${money(data.membership.cautionDue)}`
                    : t('tontine.caution.upToDate'),
                tone: data.membership.cautionDue > 0 ? 'destructive' : 'default',
              },
              {
                label: t('tontine.card.cashReserve'),
                value: money(data.membership.cashReserveBalance),
                hint:
                  data.membership.cashReserveDue > 0
                    ? `${t('tontine.caution.columns.deficit')} : ${money(data.membership.cashReserveDue)}`
                    : t('tontine.caution.upToDate'),
                tone: data.membership.cashReserveDue > 0 ? 'destructive' : 'default',
              },
            ]}
          />

          <View style={styles.section}>
            <ThemedText type="subtitle">{t('rounds.current.title')}</ThemedText>
            {data.activeRound ? (
              <RoundRow
                tontineId={data.id}
                round={data.activeRound}
                currency={data.currency}
                highlight
              />
            ) : (
              <EmptyState icon="calendar-outline" message={t('rounds.current.none')} />
            )}
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle">{t('rounds.title')}</ThemedText>
            {otherRounds?.length === 0 ? (
              <EmptyState icon="calendar-outline" message={t('rounds.empty')} />
            ) : null}
            {otherRounds?.map((round) => (
              <RoundRow key={round.id} tontineId={data.id} round={round} currency={data.currency} />
            ))}
          </View>

          {data.whatsappGroupUrl ? (
            <Button
              label={t('tontine.whatsappGroup.open')}
              variant="outline"
              style={{ borderColor: theme.whatsapp }}
              onPress={() => void Linking.openURL(data.whatsappGroupUrl as string)}
            />
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const ROUND_TONE = { DRAFT: 'neutral', ACTIVE: 'success', CLOSED: 'neutral' } as const;

function RoundRow({
  tontineId,
  round,
  currency,
  highlight = false,
}: {
  tontineId: string;
  round: ApiRoundSummary;
  currency: string;
  highlight?: boolean;
}) {
  const t = useT();
  const format = useFormat();
  const theme = useTheme();

  return (
    <TouchableCard
      accessibilityLabel={round.code}
      style={highlight ? { borderColor: theme.brand } : undefined}
      onPress={() =>
        router.push({
          pathname: '/(app)/tontines/[tontineId]/rounds/[roundId]',
          params: { tontineId, roundId: round.id },
        })
      }
    >
      <View style={styles.roundHead}>
        <ThemedText type="subtitle">{round.code}</ThemedText>
        <Badge tone={ROUND_TONE[round.status]} label={t(`rounds.status.${round.status}`)} />
      </View>

      <ThemedText type="small" themeColor="mutedForeground">
        {format.dateRange(round.startDate, round.endDate)}
      </ThemedText>

      <ThemedText type="small" themeColor="mutedForeground">
        {t('rounds.columns.monthlyAmount')} : {format.currency(round.monthlyAmount, currency)}
        {round.status === 'ACTIVE'
          ? ` · ${t('rounds.detail.kpi.monthOf', {
              month: round.currentMonth,
              total: round.durationMonths,
            })}`
          : ''}
      </ThemedText>
    </TouchableCard>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  section: { gap: Spacing.three },
  roundHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
