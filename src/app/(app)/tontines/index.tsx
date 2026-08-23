import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { TouchableCard } from '@/components/ui/row';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useT } from '@/i18n';
import type { ApiTontineSummary } from '@/lib/api/contract';
import { useQuery } from '@/lib/api/use-query';

/**
 * WF1 — les tontines du membre.
 *
 * Une carte par groupe, avec ce qui décide d'y entrer : le tour en cours et les
 * messages non lus. Le reste — effectif, caution, fond de caisse — attend le
 * détail : sur un téléphone, une carte qui dit tout ne dit plus rien.
 */
export default function TontinesScreen() {
  const t = useT();
  const { data, loading, refreshing, error, refresh } = useQuery<ApiTontineSummary[]>(
    '/api/v1/tontines',
  );

  return (
    <Screen
      title={t('nav.tontines')}
      subtitle={data ? t('tontine.list.subtitle', { count: data.length }) : undefined}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      {loading ? <LoadingState /> : null}
      {error && !data ? <ErrorState error={error} onRetry={refresh} /> : null}

      {data?.length === 0 ? (
        <EmptyState icon="people-outline" message={t('dashboard.empty.description')} />
      ) : null}

      {data?.map((tontine) => (
        <TontineCard key={tontine.id} tontine={tontine} />
      ))}
    </Screen>
  );
}

function TontineCard({ tontine }: { tontine: ApiTontineSummary }) {
  const t = useT();
  const format = useFormat();
  const round = tontine.activeRound;

  return (
    <TouchableCard
      accessibilityLabel={tontine.name}
      // Forme objet et non littéral interpolé : `typedRoutes` vérifie alors le
      // nom du paramètre, pas seulement la forme du chemin.
      onPress={() =>
        router.push({
          pathname: '/(app)/tontines/[tontineId]',
          params: { tontineId: tontine.id },
        })
      }
    >
      <View style={styles.titleRow}>
        <ThemedText type="subtitle" style={styles.name} numberOfLines={2}>
          {tontine.name}
        </ThemedText>
        {tontine.unreadMessages > 0 ? (
          <Badge tone="brand" label={String(tontine.unreadMessages)} />
        ) : null}
      </View>

      <View style={styles.badges}>
        <Badge label={t(`common.roles.${tontine.role}`)} />
        <Badge label={t('mobile.members', { count: tontine.memberCount })} />
      </View>

      {round ? (
        <ThemedText type="small" themeColor="mutedForeground">
          {t('rounds.current.summary', {
            code: round.code,
            amount: format.currency(round.monthlyAmount, tontine.currency),
            month: round.currentMonth,
            total: round.durationMonths,
            end: format.date(round.endDate),
          })}
        </ThemedText>
      ) : (
        <ThemedText type="small" themeColor="mutedForeground">
          {t('rounds.current.none')}
        </ThemedText>
      )}
    </TouchableCard>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  name: { flex: 1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
