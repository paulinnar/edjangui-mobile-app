import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { ContributionMark } from '@/components/ui/contribution-mark';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';
import type { ApiRoundMember } from '@/lib/api/contract';
import { withAlpha } from '@/lib/color';

/**
 * La grille des cotisations d'un tour : un membre par ligne, un mois par
 * colonne.
 *
 * Le web pose un tableau large ; un téléphone ne peut pas montrer douze
 * colonnes et un nom en même temps. La colonne des noms reste donc fixe et
 * seules les cases défilent latéralement — le lecteur garde toujours sous les
 * yeux **de qui** parle la ligne qu'il fait glisser.
 *
 * Les hauteurs de ligne sont figées des deux côtés : c'est ce qui garde les
 * deux moitiés alignées, une colonne fixe et une colonne défilante ne partageant
 * aucune contrainte de mise en page.
 */
const ROW_HEIGHT = 52;
const HEADER_HEIGHT = 28;
const NAME_WIDTH = 132;
const CELL_WIDTH = 38;

export function RoundBoard({
  members,
  startDate,
  durationMonths,
}: {
  members: ApiRoundMember[];
  startDate: string;
  durationMonths: number;
}) {
  const t = useT();
  const format = useFormat();
  const theme = useTheme();

  const months = format.months({ startDate, durationMonths });

  const statusLabel = (status: ApiRoundMember['contributions'][number], monthLabel: string) =>
    `${monthLabel} — ${t(`rounds.contributions.statuses.${status ?? 'NONE'}`)}`;

  return (
    <View style={[styles.board, { borderColor: theme.border, backgroundColor: theme.card }]}>
      <View style={styles.split}>
        <View style={[styles.names, { borderRightColor: theme.border }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]} />
          {members.map((member) => (
            <View
              key={member.userId}
              style={[
                styles.nameRow,
                { borderBottomColor: theme.border },
                member.isMe && { backgroundColor: withAlpha(theme.brand, 0.08) },
              ]}
            >
              <Avatar fullName={member.fullName} avatarName={member.avatarName} size={26} />
              <View style={styles.nameText}>
                <ThemedText type="small" numberOfLines={1}>
                  {member.fullName}
                </ThemedText>
                <ThemedText type="small" themeColor="mutedForeground" numberOfLines={1}>
                  {member.payoutOrder === null
                    ? t('rounds.rotation.unassigned')
                    : `${t('rounds.rotation.columns.order')} ${member.payoutOrder}`}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              {months.map((month) => (
                <View key={month.month} style={styles.cell}>
                  <ThemedText style={[styles.monthLabel, { color: theme.mutedForeground }]}>
                    {month.label}
                  </ThemedText>
                </View>
              ))}
            </View>

            {members.map((member) => (
              <View
                key={member.userId}
                style={[
                  styles.markRow,
                  { borderBottomColor: theme.border },
                  member.isMe && { backgroundColor: withAlpha(theme.brand, 0.08) },
                ]}
              >
                {months.map((month) => (
                  <View key={month.month} style={styles.cell}>
                    <ContributionMark
                      status={member.contributions[month.month - 1] ?? null}
                      label={statusLabel(
                        member.contributions[month.month - 1] ?? null,
                        month.longLabel,
                      )}
                    />
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

/** Ce que veulent dire les quatre signes de la grille. */
export function ContributionLegend() {
  const t = useT();
  const statuses = ['RECEIVED', 'LATE', 'MISSED', 'NONE'] as const;

  return (
    <View style={styles.legend}>
      {statuses.map((status) => (
        <View key={status} style={styles.legendItem}>
          <ContributionMark
            status={status === 'NONE' ? null : status}
            label=""
            size={20}
          />
          <ThemedText type="small" themeColor="mutedForeground">
            {t(`rounds.contributions.statuses.${status}`)}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { borderWidth: 1, borderRadius: Radius['2xl'], overflow: 'hidden' },
  split: { flexDirection: 'row' },
  names: { width: NAME_WIDTH, borderRightWidth: 1 },
  header: { height: HEADER_HEIGHT, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  nameRow: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderBottomWidth: 1,
  },
  nameText: { flex: 1 },
  markRow: { height: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  cell: { width: CELL_WIDTH, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontFamily: Fonts.medium, fontSize: 11 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
});
