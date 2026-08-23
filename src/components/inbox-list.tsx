import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AccordionCard } from '@/components/ui/accordion-card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Fonts, Spacing } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useT } from '@/i18n';
import { api } from '@/lib/api/client';
import type { ApiInboxMessage, ApiReadReceipt } from '@/lib/api/contract';

/**
 * La boîte de réception, toutes tontines confondues — **une carte par message**,
 * dépliable, comme les votes et l'agenda.
 *
 * Le message avait d'abord son écran : on l'ouvrait, on lisait, on revenait. Un
 * message de tontine tient en quelques lignes — « réunion samedi 15h » — et ce
 * va-et-vient coûtait deux transitions pour trois phrases, plus une pile à
 * remonter pour passer au suivant.
 *
 * La messagerie reste à sens unique : l'administration écrit, le membre lit.
 * Rien ici ne permet de répondre, et c'est dit sous le message plutôt que laissé
 * à deviner par l'absence de bouton.
 */
export function InboxList({
  messages,
  onRead,
}: {
  messages: ApiInboxMessage[];
  /** Un message lu change le compteur de non-lus : il le fait relire. */
  onRead: () => void;
}) {
  return (
    <View style={styles.list}>
      {messages.map((message) => (
        <MessageCard key={message.id} message={message} onRead={onRead} />
      ))}
    </View>
  );
}

function MessageCard({ message, onRead }: { message: ApiInboxMessage; onRead: () => void }) {
  const t = useT();
  const format = useFormat();

  const [expanded, setExpanded] = useState(false);
  // Le constat de lecture, avant que la liste soit relue : la graisse et la
  // pastille doivent retomber sous le doigt, pas au prochain aller-retour.
  const [read, setRead] = useState(message.isRead);

  // Le marquage ne part qu'une fois : l'appel est idempotent côté serveur, mais
  // rien ne justifie de le refaire à chaque repli-dépli.
  const marked = useRef(message.isRead);

  const toggle = () => {
    setExpanded((open) => !open);
    if (expanded || marked.current) return;

    // Déplier vaut lecture : le contenu est à l'écran, il n'y a rien de plus à
    // ouvrir. Sans attendre l'appel pour autant — que le marquage échoue ne doit
    // pas empêcher de lire, il repartira au prochain dépli.
    marked.current = true;
    setRead(true);

    void api
      .post<ApiReadReceipt>(`/api/v1/tontines/${message.tontineId}/messages/${message.id}/read`)
      .then(onRead)
      .catch(() => {
        marked.current = false;
        setRead(message.isRead);
      });
  };

  return (
    <AccordionCard
      accessibilityLabel={message.subject}
      expanded={expanded}
      onToggle={toggle}
      leading={
        <Avatar
          fullName={message.sender.fullName}
          avatarName={message.sender.avatarName}
          size={40}
        />
      }
    >
      <>
        {/* Un message non lu se repère à sa graisse, comme dans toute boîte
            mail : la pastille seule se perdrait dans une longue liste. */}
        <ThemedText
          type="subtitle"
          style={read ? undefined : { fontFamily: Fonts.semibold }}
          numberOfLines={2}
        >
          {message.subject}
        </ThemedText>

        <ThemedText type="small" themeColor="mutedForeground" numberOfLines={1}>
          {message.sender.fullName} · {message.tontineName}
        </ThemedText>

        <ThemedText type="small" themeColor="mutedForeground">
          {format.dateTime(message.createdAt)}
        </ThemedText>

        {read ? null : (
          <View style={styles.tags}>
            <Badge tone="brand" label={t('mailbox.inbox.unreadBadge')} />
          </View>
        )}
      </>

      <>
        <ThemedText>{message.content}</ThemedText>
        <ThemedText type="small" themeColor="mutedForeground">
          {t('mailbox.detail.noReply')}
        </ThemedText>
      </>
    </AccordionCard>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.three },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
