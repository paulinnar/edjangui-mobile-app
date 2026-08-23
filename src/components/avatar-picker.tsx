import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';

/**
 * Nombre de fichiers `public/avatars/avatar_N.png` livrés avec l'app web.
 * À tenir en phase avec `AVATAR_COUNT` de `src/lib/avatars.ts` côté web — c'est
 * la seule chose qui lie ce composant à la planche.
 */
const AVATAR_COUNT = 32;

const NAMES = Array.from({ length: AVATAR_COUNT }, (_, index) => `avatar_${index + 1}`);

/**
 * Choix d'un avatar dans la planche livrée.
 *
 * Aucun envoi d'image : la liste est fermée, et seul le nom du fichier part au
 * serveur. C'est ce qui permet de se passer de bucket, de politique de stockage
 * et de modération.
 *
 * Une bande qui défile plutôt qu'une grille : trente-deux vignettes en grille
 * pousseraient le bouton d'enregistrement hors de l'écran.
 */
export function AvatarPicker({
  fullName,
  value,
  onChange,
}: {
  /** Sert d'aperçu aux initiales quand aucun avatar n'est choisi. */
  fullName: string;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const t = useT();
  const theme = useTheme();

  return (
    <View style={styles.group}>
      <ThemedText type="label" themeColor="mutedForeground">
        {t('profile.avatar.legend')}
      </ThemedText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        <Option
          selected={value === null}
          label={t('profile.avatar.none')}
          onPress={() => onChange(null)}
        >
          <Avatar fullName={fullName} avatarName={null} size={48} />
        </Option>

        {NAMES.map((name, index) => (
          <Option
            key={name}
            selected={value === name}
            label={t('profile.avatar.option', { index: index + 1 })}
            onPress={() => onChange(name)}
          >
            <Avatar fullName={fullName} avatarName={name} size={48} />
          </Option>
        ))}
      </ScrollView>

      <ThemedText type="small" themeColor="mutedForeground">
        {t('profile.avatar.hint')}
      </ThemedText>

      {/* La coche seule porterait le choix : un anneau de couleur ne se voit pas
          en niveaux de gris ni pour un daltonien. */}
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <ThemedText type="small" themeColor="mutedForeground" style={styles.selectedHint}>
          <Ionicons name="checkmark-circle" size={13} color={theme.brand} />{' '}
          {value === null ? t('profile.avatar.none') : t('profile.avatar.option', { index: NAMES.indexOf(value) + 1 })}
        </ThemedText>
      </View>
    </View>
  );
}

function Option({
  selected,
  label,
  onPress,
  children,
}: {
  selected: boolean;
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.option,
        { borderColor: selected ? theme.brand : 'transparent' },
      ]}
    >
      {children}
      {selected ? (
        <View style={[styles.check, { backgroundColor: theme.brand }]}>
          <Ionicons name="checkmark" size={12} color={theme.brandForeground} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
  strip: { gap: Spacing.two, paddingVertical: Spacing.one },
  option: {
    padding: 3,
    borderWidth: 2,
    borderRadius: Radius['3xl'],
  },
  check: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedHint: { flexDirection: 'row', alignItems: 'center' },
});
