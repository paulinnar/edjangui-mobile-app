import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useT } from '@/i18n';
import type { ApiCommitment } from '@/lib/api/contract';

/**
 * « Mes engagements du mois », toutes tontines confondues.
 *
 * Bloc partagé plutôt qu'inline : il ouvre la liste des tontines — c'est la
 * première question d'un membre qui ouvre l'app — et reste réutilisable ailleurs
 * sans dupliquer la mise en forme des lignes.
 */
export function CommitmentsSection({ commitments }: { commitments: ApiCommitment[] }) {
  const t = useT();

  return (
    <View style={styles.section}>
      <ThemedText type="subtitle">{t('dashboard.commitments.title')}</ThemedText>
      {commitments.length === 0 ? (
        <EmptyState icon="checkmark-circle-outline" message={t('dashboard.commitments.empty')} />
      ) : (
        <Card style={styles.list}>
          {commitments.map((commitment) => (
            <CommitmentRow key={commitment.id} commitment={commitment} />
          ))}
        </Card>
      )}
    </View>
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

const styles = StyleSheet.create({
  section: { gap: Spacing.three },
  list: { gap: Spacing.four },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  rowBody: { flex: 1, gap: 2 },
  rowEnd: { alignItems: 'flex-end', gap: Spacing.one },
});
