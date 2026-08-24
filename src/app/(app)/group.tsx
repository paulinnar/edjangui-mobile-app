import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EventList } from '@/components/event-list';
import { InboxList } from '@/components/inbox-list';
import { PollList } from '@/components/poll-list';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Segmented } from '@/components/ui/segmented';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { useT } from '@/i18n';
import type { ApiInboxMessage } from '@/lib/api/contract';
import type { ApiMemberEvent, ApiMemberPoll } from '@/lib/api/contract-pending';
import { useQuery } from '@/lib/api/use-query';

/**
 * L'onglet « Groupe » : ce que l'administration adresse aux membres, et ce
 * qu'elle leur demande.
 *
 * Trois volets sous un seul onglet — **messages, votes, agenda** — au lieu de
 * la seule boîte de réception d'avant. C'est le regroupement de la navigation
 * web (`nav.groups.group`), et la barre d'onglets n'avait pas trois places de
 * plus à donner : un quatrième et un cinquième onglet auraient réduit les
 * libellés à des icônes.
 *
 * Les trois volets sont **transversaux aux tontines**, comme la messagerie
 * l'était déjà : on ouvre l'onglet pour savoir ce qui attend, pas pour
 * inspecter un groupe en particulier. Le nom de la tontine est porté par chaque
 * carte.
 *
 * Seul le volet affiché interroge l'API. Charger les trois à chaque venue
 * tripleraient le trafic d'un écran dont on ne lit qu'un tiers ; `useQuery`
 * s'en charge de lui-même — un chemin `null` ne part pas.
 *
 * L'onglet n'a **aucun écran de détail** : message, scrutin et séance se lisent
 * dans leur carte dépliable. C'est un seul geste au lieu de deux transitions,
 * et le passage d'un élément au suivant ne demande plus de remonter une pile.
 */
type Panel = 'messages' | 'polls' | 'events';

export default function GroupScreen() {
  const t = useT();
  const [panel, setPanel] = useState<Panel>('messages');

  const messages = useQuery<ApiInboxMessage[]>(
    panel === 'messages' ? '/api/v1/me/messages' : null,
  );
  const polls = useQuery<ApiMemberPoll[]>(panel === 'polls' ? '/api/v1/me/polls' : null);
  const events = useQuery<ApiMemberEvent[]>(panel === 'events' ? '/api/v1/me/events' : null);

  const active = { messages, polls, events }[panel];

  const unread = messages.data?.filter((message) => !message.isRead).length ?? 0;
  const running = polls.data?.filter((poll) => !poll.isClosed).length ?? 0;
  const pending =
    polls.data?.filter((poll) => !poll.isClosed && poll.myOptionId === null).length ?? 0;
  const upcoming = events.data?.filter((event) => !event.isPast).length ?? 0;

  // Le décompte suit le sélecteur au lieu de coiffer l'écran : il parle du
  // volet affiché, pas de l'onglet. Sous le titre, il changerait sous les yeux
  // du lecteur à chaque bascule sans qu'on sache de quoi il compte.
  const summary = {
    messages: messages.data
      ? t('mailbox.summary', { total: messages.data.length, unread })
      : undefined,
    polls: polls.data ? t('polls.summary', { running, pending }) : undefined,
    events: events.data
      ? t('mobile.group.agendaSummary', {
          upcoming,
          past: events.data.length - upcoming,
        })
      : undefined,
  }[panel];

  return (
    <Screen
      title={t('mobile.tabs.group')}
      refreshing={active.refreshing}
      onRefresh={active.refresh}
    >
      <View style={styles.picker}>
        <Segmented
          accessibilityLabel={t('mobile.group.panels')}
          value={panel}
          onChange={setPanel}
          options={[
            { value: 'messages', label: t('mobile.group.messages') },
            { value: 'polls', label: t('mobile.group.polls') },
            { value: 'events', label: t('mobile.group.events') },
          ]}
        />

        {summary ? (
          <ThemedText type="small" themeColor="mutedForeground">
            {summary}
          </ThemedText>
        ) : null}
      </View>

      {active.loading ? <LoadingState /> : null}
      {active.error && !active.data ? (
        <ErrorState error={active.error} onRetry={active.refresh} />
      ) : null}

      {panel === 'messages' && messages.data ? (
        messages.data.length === 0 ? (
          <EmptyState icon="mail-outline" message={t('mailbox.inbox.empty')} />
        ) : (
          // Le message lu change le décompte de non-lus posé sous les
          // onglets : la liste se relit, la carte n'en tient pas sa propre
          // version.
          <InboxList messages={messages.data} onRead={messages.refresh} />
        )
      ) : null}

      {panel === 'polls' && polls.data ? (
        polls.data.length === 0 ? (
          <EmptyState icon="checkbox-outline" message={t('mobile.group.pollsEmpty')} />
        ) : (
          // Le bulletin déposé change la pastille de la carte **et** le
          // décompte posé sous les onglets : la liste se relit plutôt que de
          // tenir deux compteurs en parallèle.
          <PollList polls={polls.data} onVoted={polls.refresh} />
        )
      ) : null}

      {panel === 'events' && events.data ? (
        events.data.length === 0 ? (
          <EmptyState icon="calendar-outline" message={t('events.agenda.empty')} />
        ) : (
          <EventList events={events.data} />
        )
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  picker: { gap: Spacing.two },
});
