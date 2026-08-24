import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { avatarUrl } from '@/lib/api/client';
import { initials } from '@/lib/format';

/**
 * Portrait d'un membre : l'image de la planche, ou ses initiales.
 *
 * Les avatars sont servis par l'app web (`public/avatars`) et non embarqués :
 * les 32 fichiers pèsent 4 Mo, et les charger permet à une planche modifiée
 * côté web d'apparaître sans nouvelle version de l'app. Faute de réseau, les
 * initiales prennent le relais — jamais de trou dans une liste.
 */
export function Avatar({
  fullName,
  avatarName,
  size = 40,
}: {
  fullName: string;
  avatarName: string | null;
  size?: number;
}) {
  const theme = useTheme();
  const uri = avatarUrl(avatarName);

  return (
    <View
      accessibilityLabel={fullName}
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.secondary,
          borderColor: theme.border,
        },
      ]}
    >
      {uri ? (
        <Image source={{ uri }} contentFit="cover" style={styles.image} transition={120} />
      ) : (
        <ThemedText
          style={{ fontFamily: Fonts.semibold, fontSize: size * 0.36, color: theme.brand }}
        >
          {initials(fullName)}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1 },
  image: { width: '100%', height: '100%' },
});
