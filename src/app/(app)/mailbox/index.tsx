import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TouchableCard } from '@/components/ui/row';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { Fonts, Spacing } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useT } from '@/i18n';
import type { ApiInboxMessage } from '@/lib/api/contract';
import { useQuery } from '@/lib/api/use-query';

/**
 * Boîte de réception, toutes tontines confondues.
 *
 * La messagerie est à sens unique : l'administration écrit, le membre lit. Rien
 * ici ne permet de répondre, et c'est dit dans l'écran de lecture plutôt que
 * laissé à deviner par l'absence de bouton.
 */
export default function MailboxScreen() {
  const t = useT();
  const { data, loading, refreshing, error, refresh } =
    useQuery<ApiInboxMessage[]>('/api/v1/me/messages');

  const unread = data?.filter((message) => !message.isRead).length ?? 0;

  return (
    <Screen
      title={t('mailbox.title')}
      subtitle={
        data ? t('mailbox.summary', { total: data.length, unread }) : undefined
      }
      refreshing={refreshing}
      onRefresh={refresh}
    >
      {loading ? <LoadingState /> : null}
      {error && !data ? <ErrorState error={error} onRetry={refresh} /> : null}

      {data?.length === 0 ? (
        <EmptyState icon="mail-outline" message={t('mailbox.inbox.empty')} />
      ) : null}

      {data?.map((message) => (
        <MessageRow key={message.id} message={message} />
      ))}
    </Screen>
  );
}

function MessageRow({ message }: { message: ApiInboxMessage }) {
  const t = useT();
  const format = useFormat();

  return (
    <TouchableCard
      accessibilityLabel={message.subject}
      onPress={() =>
        router.push({
          pathname: '/(app)/mailbox/[tontineId]/[messageId]',
          params: { tontineId: message.tontineId, messageId: message.id },
        })
      }
    >
      <View style={styles.head}>
        <Avatar
          fullName={message.sender.fullName}
          avatarName={message.sender.avatarName}
          size={32}
        />
        <View style={styles.headBody}>
          {/* Un message non lu se repère à sa graisse, comme dans toute boîte
              mail : la pastille seule se perdrait dans une longue liste. */}
          <ThemedText
            type="small"
            style={message.isRead ? undefined : { fontFamily: Fonts.semibold }}
            numberOfLines={2}
          >
            {message.subject}
          </ThemedText>
          <ThemedText type="small" themeColor="mutedForeground" numberOfLines={1}>
            {message.sender.fullName} · {message.tontineName}
          </ThemedText>
        </View>
        {message.isRead ? null : <Badge tone="brand" label={t('mailbox.inbox.unreadBadge')} />}
      </View>

      <ThemedText type="small" themeColor="mutedForeground">
        {format.dateTime(message.createdAt)}
      </ThemedText>
    </TouchableCard>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  headBody: { flex: 1, gap: 2 },
});
