import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AccordionCard } from '@/components/ui/accordion-card';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';
import { ApiFailure, api } from '@/lib/api/client';
import type {
  ApiMemberPoll,
  ApiPollBallot,
  ApiPollOption,
} from '@/lib/api/contract-pending';
import { withAlpha } from '@/lib/color';

/**
 * Les votes du membre, toutes tontines confondues — **une carte par scrutin**,
 * dépliable.
 *
 * Le web ouvre un popup pour voter et y lire le résultat. Sur téléphone, un
 * popup par-dessus une liste défilante coûte un geste de plus et masque le
 * reste de l'écran : la carte porte les deux, et bascule d'elle-même du
 * bulletin au dépouillement une fois la voix déposée.
 *
 * Repliée, elle répond à la seule question qui se pose de l'extérieur —
 * **est-ce que ça m'attend ?** — par une pastille : à voter, voté, ou clos.
 */
export function PollList({
  polls,
  onVoted,
}: {
  polls: ApiMemberPoll[];
  /** Le bulletin déposé change les compteurs de l'écran : il les fait relire. */
  onVoted: () => void;
}) {
  return (
    <View style={styles.list}>
      {polls.map((poll) => (
        <PollCard key={poll.id} poll={poll} onVoted={onVoted} />
      ))}
    </View>
  );
}

const STATUS: Record<'toVote' | 'voted' | 'closed', BadgeTone> = {
  toVote: 'warning',
  voted: 'success',
  closed: 'neutral',
};

function PollCard({ poll, onVoted }: { poll: ApiMemberPoll; onVoted: () => void }) {
  const t = useT();
  const format = useFormat();

  // Le bulletin que le serveur vient d'arrêter, tant que la liste n'a pas été
  // relue : le décompte doit bouger sous le doigt, pas au prochain aller-retour.
  const [ballot, setBallot] = useState<ApiPollBallot | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const myOptionId = ballot?.myOptionId ?? poll.myOptionId;
  const options = ballot?.options ?? poll.options;
  const totalVotes = ballot?.totalVotes ?? poll.totalVotes;

  const canVote = !poll.isClosed && myOptionId === null;
  const status = poll.isClosed ? 'closed' : myOptionId === null ? 'toVote' : 'voted';

  // Un scrutin qui m'attend s'ouvre de lui-même : les autres se parcourent
  // d'abord du regard, celui-là demande un geste.
  const [expanded, setExpanded] = useState(canVote);

  const submit = async () => {
    if (!choice) return;
    setPending(true);
    setFailure(null);

    try {
      const receipt = await api.post<ApiPollBallot>(
        `/api/v1/tontines/${poll.tontineId}/polls/${poll.id}/vote`,
        { optionId: choice },
      );
      setBallot(receipt);
      onVoted();
    } catch (error) {
      // Échéance passée entre l'affichage et l'appui, bulletin déjà déposé
      // depuis le web : le serveur tranche, l'écran rapporte sa raison.
      setFailure(
        error instanceof ApiFailure ? t(error.messageKey) : t('common.errors.unexpected'),
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <AccordionCard
      accessibilityLabel={poll.question}
      expanded={expanded}
      onToggle={() => setExpanded((open) => !open)}
      trailing={<Badge tone={STATUS[status]} label={t(`polls.status.${status}`)} />}
    >
      <>
        <ThemedText type="subtitle" numberOfLines={2}>
          {poll.question}
        </ThemedText>
        <ThemedText type="small" themeColor="mutedForeground" numberOfLines={1}>
          {poll.tontineName} · {t('polls.closesAt', { date: format.wallClock(poll.closesAt) })}
        </ThemedText>
      </>

      <>
        <ThemedText type="small" themeColor="mutedForeground">
          {t('polls.dialog.window', {
            start: format.wallClock(poll.createdAt),
            end: format.wallClock(poll.closesAt),
          })}
        </ThemedText>

        {canVote ? (
          <>
            <ThemedText type="small">{t('polls.dialog.choose')}</ThemedText>
            {options.map((option) => (
              <OptionChoice
                key={option.id}
                option={option}
                selected={choice === option.id}
                onPress={() => setChoice(option.id)}
              />
            ))}

            <FormMessage status={failure ? 'error' : 'idle'} message={failure ?? undefined} />

            <Button
              label={pending ? t('polls.dialog.pending') : t('polls.dialog.submit')}
              size="md"
              loading={pending}
              disabled={choice === null}
              onPress={() => void submit()}
            />
          </>
        ) : (
          <>
            {options.map((option) => (
              <OptionTally key={option.id} option={option} isMine={option.id === myOptionId} />
            ))}

            <ThemedText type="small" themeColor="mutedForeground">
              {t('polls.dialog.turnout', {
                voters: totalVotes,
                members: poll.memberCount,
              })}
            </ThemedText>
            <ThemedText type="small" themeColor="mutedForeground">
              {poll.isClosed ? t('polls.dialog.closedNotice') : t('polls.dialog.votedNotice')}
            </ThemedText>
          </>
        )}
      </>
    </AccordionCard>
  );
}

/** Une option encore ouverte au bulletin : un choix, pas un résultat. */
function OptionChoice({
  option,
  selected,
  onPress,
}: {
  option: ApiPollOption;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={option.label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        {
          borderColor: selected ? theme.brand : theme.border,
          backgroundColor: selected ? withAlpha(theme.brand, 0.08) : 'transparent',
        },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={20}
        color={selected ? theme.brand : theme.mutedForeground}
      />
      <ThemedText type="small" style={styles.optionLabel}>
        {option.label}
      </ThemedText>
    </Pressable>
  );
}

/**
 * Une option dépouillée. Le décompte n'apparaît qu'une fois le bulletin déposé
 * ou le scrutin clos — lire les scores avant de voter orienterait la voix.
 */
function OptionTally({ option, isMine }: { option: ApiPollOption; isMine: boolean }) {
  const t = useT();
  const theme = useTheme();

  return (
    <View style={styles.tally}>
      <View style={styles.tallyHead}>
        <ThemedText
          type="small"
          style={[styles.optionLabel, isMine ? { fontFamily: Fonts.semibold } : null]}
        >
          {option.label}
        </ThemedText>
        <ThemedText type="small" themeColor="mutedForeground">
          {t('polls.dialog.optionVotes', { count: option.votes })} · {option.share}%
        </ThemedText>
      </View>

      <View style={[styles.gauge, { backgroundColor: theme.muted }]}>
        <View
          style={[
            styles.gaugeFill,
            {
              width: `${option.share}%`,
              backgroundColor: isMine ? theme.brand : theme.brandSoft,
            },
          ]}
        />
      </View>

      {isMine ? (
        <ThemedText type="small" style={{ color: theme.brand }}>
          {t('polls.dialog.myChoice')}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.three },
  pressed: { opacity: 0.7 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  optionLabel: { flex: 1 },
  tally: { gap: Spacing.one },
  tallyHead: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.two },
  gauge: { height: 6, borderRadius: Radius.sm, overflow: 'hidden' },
  gaugeFill: { height: '100%' },
});
