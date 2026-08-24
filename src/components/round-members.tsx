import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { ContributionMark } from '@/components/ui/contribution-mark';
import { Radius, Spacing } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';
import type { ApiRoundMember } from '@/lib/api/contract';
import { withAlpha } from '@/lib/color';

/**
 * Le suivi des cotisations d'un tour : **une carte par membre**, dépliable.
 *
 * Le web pose un tableau large — un membre par ligne, un mois par colonne. Le
 * mobile en a d'abord copié la grille, au prix d'un défilement latéral : on ne
 * voyait jamais les douze mois et le nom en même temps, et il fallait compter
 * les colonnes pour savoir de quel mois parlait une case.
 *
 * La carte inverse le compromis. Repliée, elle répond à la seule question qui
 * se pose de l'extérieur — **où en est cette personne ?** — par deux signes :
 * le constat de sa dernière cotisation dépouillée, et la cagnotte si elle l'a
 * déjà touchée. Dépliée, elle donne le détail mois par mois, en pleine largeur
 * et légendé, sans rien faire glisser.
 */
export function RoundMemberList({
  members,
  startDate,
  durationMonths,
  currency,
}: {
  members: ApiRoundMember[];
  startDate: string;
  durationMonths: number;
  currency: string;
}) {
  return (
    <View style={styles.list}>
      {members.map((member) => (
        <MemberCard
          key={member.userId}
          member={member}
          startDate={startDate}
          durationMonths={durationMonths}
          currency={currency}
        />
      ))}
    </View>
  );
}

function MemberCard({
  member,
  startDate,
  durationMonths,
  currency,
}: {
  member: ApiRoundMember;
  startDate: string;
  durationMonths: number;
  currency: string;
}) {
  const t = useT();
  const format = useFormat();
  const theme = useTheme();

  // Ma carte s'ouvre d'elle-même : c'est la seule dont on vient déjà chercher
  // le détail, les autres se parcourent d'abord du regard.
  const [expanded, setExpanded] = useState(member.isMe);

  const months = format.months({ startDate, durationMonths });
  const last = lastConstat(member.contributions);

  const statusLabel = (status: ApiRoundMember['contributions'][number], monthLabel: string) =>
    `${monthLabel} — ${t(`rounds.contributions.statuses.${status ?? 'NONE'}`)}`;

  return (
    <View
      style={[
        styles.card,
        { borderColor: theme.border, backgroundColor: theme.card },
        member.isMe && {
          borderColor: theme.brand,
          backgroundColor: withAlpha(theme.brand, 0.06),
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={member.fullName}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((open) => !open)}
        style={({ pressed }) => [styles.head, pressed && styles.pressed]}
      >
        <Avatar fullName={member.fullName} avatarName={member.avatarName} size={40} />

        <View style={styles.identity}>
          <ThemedText type="subtitle" numberOfLines={1}>
            {member.fullName}
          </ThemedText>
          <ThemedText type="small" themeColor="mutedForeground" numberOfLines={1}>
            {member.payoutOrder === null
              ? t('rounds.rotation.unassigned')
              : `${t('rounds.rotation.columns.order')} ${member.payoutOrder}`}
            {' · '}
            {t('scoring.columns.score')} {member.score}
          </ThemedText>
        </View>

        {/* Serrés entre eux : sur un écran étroit, chaque point gagné ici est
            un caractère de plus au nom du membre. */}
        <View style={styles.marks}>
          {member.isDistributed ? <PayoutMark /> : null}

          <ContributionMark
            status={last.status}
            label={
              last.month === null
                ? t('rounds.contributions.statuses.NONE')
                : statusLabel(last.status, months[last.month].longLabel)
            }
          />

          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.mutedForeground}
          />
        </View>
      </Pressable>

      {expanded ? (
        <View style={[styles.body, { borderTopColor: theme.border }]}>
          {member.isDistributed && member.payoutAmount !== null ? (
            <ThemedText type="small" themeColor="mutedForeground">
              {t('rounds.rotation.distributed')} : {format.currency(member.payoutAmount, currency)}
              {member.distributedAt ? ` — ${format.date(member.distributedAt)}` : ''}
            </ThemedText>
          ) : null}

          {/* Les cases s'enroulent au lieu de défiler : la carte tient la
              largeur de l'écran, chaque mois garde donc son étiquette. */}
          <View style={styles.months}>
            {months.map((month) => (
              <View key={month.month} style={styles.month}>
                <ContributionMark
                  status={member.contributions[month.month - 1] ?? null}
                  label={statusLabel(member.contributions[month.month - 1] ?? null, month.longLabel)}
                  size={24}
                />
                <ThemedText type="small" themeColor="mutedForeground">
                  {month.label}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Le dernier mois **dépouillé**, et non le dernier mois écoulé : un tour dont
 * l'administrateur a pris du retard n'a pas à afficher un « — » là où le membre
 * a bien versé le mois d'avant.
 */
function lastConstat(contributions: ApiRoundMember['contributions']) {
  for (let index = contributions.length - 1; index >= 0; index -= 1) {
    const status = contributions[index] ?? null;
    if (status !== null) return { status, month: index };
  }
  return { status: null, month: null };
}

/** La cagnotte a été touchée — signe distinct du vert d'une cotisation reçue. */
function PayoutMark() {
  const t = useT();
  const theme = useTheme();

  return (
    <View
      accessibilityLabel={`${t('rounds.rotation.columns.payout')} — ${t('rounds.rotation.distributed')}`}
      style={[
        styles.payout,
        {
          backgroundColor: withAlpha(theme.brand, 0.12),
          borderColor: withAlpha(theme.brand, 0.3),
        },
      ]}
    >
      <Ionicons name="cash" size={14} color={theme.brand} />
    </View>
  );
}

/** Ce que veulent dire les signes portés par les cartes. */
export function ContributionLegend() {
  const t = useT();
  const statuses = ['RECEIVED', 'LATE', 'MISSED', 'NONE'] as const;

  return (
    <View style={styles.legend}>
      {statuses.map((status) => (
        <View key={status} style={styles.legendItem}>
          <ContributionMark status={status === 'NONE' ? null : status} label="" size={20} />
          <ThemedText type="small" themeColor="mutedForeground">
            {t(`rounds.contributions.statuses.${status}`)}
          </ThemedText>
        </View>
      ))}

      <View style={styles.legendItem}>
        <PayoutMark />
        <ThemedText type="small" themeColor="mutedForeground">
          {t('rounds.rotation.columns.payout')}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.three },
  card: { borderWidth: 1, borderRadius: Radius['2xl'], overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.four },
  pressed: { opacity: 0.7 },
  identity: { flex: 1 },
  marks: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  body: { borderTopWidth: 1, padding: Spacing.four, gap: Spacing.three },
  months: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  month: { alignItems: 'center', gap: 2, minWidth: 34 },
  payout: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
});
