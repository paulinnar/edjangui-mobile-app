import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { CommitmentsSection } from '@/components/commitments-section';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { TouchableCard } from '@/components/ui/row';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useT } from '@/i18n';
import type { ApiCommitment, ApiTontineSummary } from '@/lib/api/contract';
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

  const commitments = useQuery<ApiCommitment[]>('/api/v1/me/commitments');
  const tontines = useQuery<ApiTontineSummary[]>('/api/v1/tontines');

  const refresh = () => {
    commitments.refresh();
    tontines.refresh();
  };

  const data = tontines.data;
  const nothingLoaded = !commitments.data && !data;
  const error = tontines.error ?? commitments.error;

  return (
    <Screen
      title={t('dashboard.title')}
      refreshing={commitments.refreshing || tontines.refreshing}
      onRefresh={refresh}
    >
      {(tontines.loading || commitments.loading) && nothingLoaded ? <LoadingState /> : null}
      {error && nothingLoaded ? <ErrorState error={error} onRetry={refresh} /> : null}

      {commitments.data ? <CommitmentsSection commitments={commitments.data} /> : null}

      {data ? (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <ThemedText type="subtitle">{t('nav.tontines')}</ThemedText>
            <ThemedText type="small" themeColor="mutedForeground">
              {t('tontine.list.subtitle', { count: data.length })}
            </ThemedText>
          </View>

          {data.length === 0 ? (
            <EmptyState icon="people-outline" message={t('dashboard.empty.description')} />
          ) : (
            data.map((tontine) => <TontineCard key={tontine.id} tontine={tontine} />)
          )}
        </View>
      ) : null}
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
  section: { gap: Spacing.three },
  sectionHead: { gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  name: { flex: 1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
