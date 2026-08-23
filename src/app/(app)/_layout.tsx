import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';

import { Fonts } from '@/constants/theme';
import { useT } from '@/i18n';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/lib/session';

/**
 * Espace membre.
 *
 * Quatre onglets seulement : le mobile ne porte pas l'administration, et même
 * un compte administrateur n'y voit que son propre périmètre de membre. Le
 * filtrage réel se fait côté serveur, dans les Route Handlers — ce garde-ci ne
 * fait que vérifier qu'une session existe.
 */
export default function AppLayout() {
  const t = useT('mobile.tabs');
  const theme = useTheme();
  const { session } = useSession();

  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.brand,
        tabBarInactiveTintColor: theme.mutedForeground,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
        tabBarLabelStyle: { fontFamily: Fonts.medium, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="tontines"
        options={{
          title: t('tontines'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="contributions"
        options={{
          title: t('contributions'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="mailbox"
        options={{
          title: t('mailbox'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
