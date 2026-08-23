import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useT } from '@/i18n';
import { api } from '@/lib/api/client';
import type { ApiInboxMessage, ApiReadReceipt } from '@/lib/api/contract';
import { useQuery } from '@/lib/api/use-query';

/**
 * Lecture d'un message.
 *
 * L'ouverture vaut lecture : le marquage part dès que le contenu est à l'écran,
 * sans bouton. C'est la seule écriture que l'API expose au mobile, et elle ne
 * peut porter que sur l'exemplaire du demandeur.
 */
export default function MessageScreen() {
  const { tontineId, messageId } = useLocalSearchParams<{
    tontineId: string;
    messageId: string;
  }>();
  const t = useT();
  const format = useFormat();

  const { data, loading, refreshing, error, refresh } = useQuery<ApiInboxMessage>(
    `/api/v1/tontines/${tontineId}/messages/${messageId}`,
  );

  // Le marquage ne part qu'une fois : `useQuery` recharge à chaque retour sur
  // l'écran, et l'appel est idempotent côté serveur, mais rien ne justifie de
  // le refaire à chaque passage.
  const marked = useRef(false);

  useEffect(() => {
    if (!data || data.isRead || marked.current) return;
    marked.current = true;

    // Sans `await` sur l'affichage : que le marquage échoue ne doit pas empêcher
    // de lire le message. Il repartira à la prochaine ouverture.
    void api
      .post<ApiReadReceipt>(`/api/v1/tontines/${tontineId}/messages/${messageId}/read`)
      .catch(() => {
        marked.current = false;
      });
  }, [data, tontineId, messageId]);

  return (
    <Screen
      title={data?.subject ?? t('mailbox.title')}
      back
      refreshing={refreshing}
      onRefresh={refresh}
    >
      {loading ? <LoadingState /> : null}
      {error && !data ? <ErrorState error={error} onRetry={refresh} /> : null}

      {data ? (
        <>
          <Card style={styles.card}>
            <View style={styles.sender}>
              <Avatar
                fullName={data.sender.fullName}
                avatarName={data.sender.avatarName}
                size={40}
              />
              <View style={styles.senderBody}>
                <ThemedText type="small">{data.sender.fullName}</ThemedText>
                <ThemedText type="small" themeColor="mutedForeground">
                  {data.tontineName} · {format.dateTime(data.createdAt)}
                </ThemedText>
              </View>
            </View>

            <ThemedText>{data.content}</ThemedText>
          </Card>

          <ThemedText type="small" themeColor="mutedForeground">
            {t('mailbox.detail.noReply')}
          </ThemedText>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.four },
  sender: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  senderBody: { flex: 1 },
});
