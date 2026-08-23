import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AccordionCard } from '@/components/ui/accordion-card';
import { Badge } from '@/components/ui/badge';
import { Spacing } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';
import type { ApiMemberEvent } from '@/lib/api/contract-pending';

/**
 * L'agenda du membre, toutes tontines confondues — **une carte par séance**,
 * dépliable.
 *
 * Le web propose deux lectures, liste et semaine. Le mobile n'en garde qu'une :
 * sept colonnes sur un écran de téléphone ne laissent pas la place d'un titre,
 * et le calendrier du système reste à un geste de là pour qui veut la grille.
 *
 * L'ordre vient du serveur — les rendez-vous à venir d'abord, du plus proche,
 * puis les séances tenues, de la plus récente. Le passé n'est pas une section à
 * part, seulement une étiquette sur la carte.
 *
 * Les heures sont **de l'horloge murale** : `startTime` et `endTime` s'affichent
 * tels quels et la date se rend en UTC. « Samedi 15h » doit rester « samedi
 * 15h », y compris pour un membre qui consulte depuis un autre fuseau.
 */
export function EventList({ events }: { events: ApiMemberEvent[] }) {
  return (
    <View style={styles.list}>
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </View>
  );
}

function EventCard({ event }: { event: ApiMemberEvent }) {
  const t = useT();
  const format = useFormat();
  const theme = useTheme();

  const [expanded, setExpanded] = useState(false);
  const hasBody = Boolean(event.description) || Boolean(event.protocol);

  return (
    <AccordionCard
      accessibilityLabel={event.title}
      expanded={expanded}
      // Une séance sans description ni protocole n'a rien à déplier : la carte
      // perd son chevron plutôt que d'ouvrir sur du vide.
      onToggle={hasBody ? () => setExpanded((open) => !open) : undefined}
      faded={event.isPast}
    >
      <>
        <ThemedText type="subtitle" numberOfLines={2}>
          {event.title}
        </ThemedText>

        <ThemedText type="small" themeColor="mutedForeground">
          {format.date(event.eventDate)} · {event.startTime} – {event.endTime}
        </ThemedText>

        <View style={styles.place}>
          <Ionicons name="location-outline" size={14} color={theme.mutedForeground} />
          <ThemedText type="small" themeColor="mutedForeground" numberOfLines={1}>
            {event.location} · {event.tontineName}
          </ThemedText>
        </View>

        <View style={styles.tags}>
          {event.isPast ? <Badge label={t('events.status.past')} /> : null}
          {event.seriesId ? (
            <Badge
              label={`${t(`events.recurrence.${event.recurrence}`)} · ${t('events.occurrence', {
                occurrence: event.occurrence,
                cycles: event.cycles,
              })}`}
            />
          ) : null}
          {event.protocol ? <Badge tone="brand" label={t('events.protocolLabel')} /> : null}
        </View>
      </>

      <>
        <ThemedText type="small" themeColor="mutedForeground">
          {t('events.organizer', { name: event.organizer.fullName })}
        </ThemedText>

        {event.description ? <ThemedText type="small">{event.description}</ThemedText> : null}

        {/* Le protocole est ce qu'on vient chercher sur une séance passée :
            ordre du jour avant, compte rendu après. */}
        {event.protocol ? (
          <View style={styles.protocol}>
            <ThemedText type="small" style={{ color: theme.brand }}>
              {t('events.protocolLabel')}
            </ThemedText>
            <ThemedText type="small">{event.protocol}</ThemedText>
          </View>
        ) : null}
      </>
    </AccordionCard>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.three },
  place: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  protocol: { gap: Spacing.one },
});
