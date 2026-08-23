# edjangui-mobile-app

Application mobile de la tontine Edjangui. Client **Expo / React Native**, pendant
mobile de l'app web `edjangui-app` (Next.js).

## Périmètre

- **Rôle membre uniquement.** Même si un administrateur se connecte, il ne voit
  que ses propres données, filtrées à son périmètre de membre. Aucun écran
  d'administration n'est porté sur le mobile.
- Cross-platform **Android + iOS**.
- Livrable final : un **APK** installable pour test.

## Parité avec l'app web

L'app web est la source de vérité pour la charte et le métier. Elle vit dans
`C:\Workspace\pynsoft\edjangui-app` et se consulte **en lecture seule** depuis ce
projet : on n'y commite rien depuis une session mobile.

- **Couleurs** : `src/constants/theme.ts` transpose en hexadécimal les tokens
  `oklch` de `.theme-brand` (`src/app/globals.css` côté web). React Native ne lit
  pas `oklch`. Toute retouche de charte se fait **côté web d'abord**, puis se
  reporte ici.
- Thèmes **light et dark** obligatoires sur chaque écran.
- Les blocs et modules peuvent être réagencés pour le mobile — l'objectif est la
  même identité visuelle, pas la même mise en page au pixel près.

## Stack

Expo SDK 57 · React Native 0.86 · React 19.2 · expo-router (typedRoutes) ·
TypeScript strict · alias `@/*` → `./src/*`.

Depuis le SDK 56, expo-router **n'utilise plus `@react-navigation/native`** : le
fournisseur de thème et les thèmes de base se réimportent depuis `expo-router`.
Toute dépendance directe à react-navigation fait échouer le bundle.

`web.output` vaut `single` et non `static` : le prérendu statique fait tourner
les routes dans Node, où aucun module natif n'existe — `expo-secure-store` y
casse au chargement. L'aperçu web ne sert qu'à contrôler une mise en page, la
cible reste l'APK, et le stockage y retombe sur `localStorage`.

Polices : Inter (courant) et Roboto (titres), comme le web. Elles s'importent
par sous-chemin — `@expo-google-fonts/inter/400Regular` — car l'index du paquet
réexporte toute la famille et Metro embarquerait une vingtaine de `.ttf`
inutiles. Sur React Native, une graisse = une famille : `fontWeight` est ignoré
dès qu'une police personnalisée est posée, on choisit donc `fontFamily`.

## Arborescence

```
src/app/(auth)         routes publiques : login, register, forgot-password
src/app/(app)          routes authentifiées : tabs membre
src/app/reset-password arrivée du lien de réinitialisation
src/components         gabarits partagés (AuthShell, Screen, Backdrop, Logo)
src/components/ui      Button, Field, Card, Segmented, FormMessage, Placeholder
src/constants          theme.ts — couleurs, Fonts, Spacing, Radius
src/hooks              useTheme, useColorScheme
src/i18n               catalogues copiés du web + interpolation ICU réduite
src/lib                Supabase, session, stockage chiffré, validation
src/features           code par domaine métier (tontines, cotisations, messages…)
```

`reset-password` est **hors du groupe `(auth)`** volontairement : l'échange du
code du lien ouvre une session, et le garde de `(auth)` renverrait vers l'espace
membre avant que le nouveau mot de passe soit saisi.

Les catalogues `src/i18n/messages/{fr,en}.json` sont copiés de l'app web par
`npm run sync-messages`. Les libellés propres au mobile vivent à part, dans
`mobile.{fr,en}.json` sous la branche `mobile`, pour que la resynchronisation ne
les écrase pas.

## Accès aux données — décision arrêtée : option A

L'app web n'expose **aucune** route `/api` : ses 17 fichiers `src/app/actions/`
sont des Server Actions Next qui tapent Prisma en direct, donc inatteignables
depuis React Native.

**Le mobile consomme des Route Handlers `/api/v1/*` ajoutés dans `edjangui-app`**,
qui réutilisent la logique déjà écrite dans `src/lib/*.ts` (`scoring.ts`,
`rounds.ts`, `penalties.ts`, `contributions.ts`…). Une seule implémentation des
règles métier, partagée par le web et le mobile.

- Authentification : JWT Supabase porté en `Authorization: Bearer`.
- Chaque handler revérifie le périmètre membre côté serveur — le filtrage n'est
  jamais laissé au client.
- Écarté : l'accès direct aux tables via PostgREST, qui imposerait des policies
  RLS sur les 28 modèles Prisma et une duplication du métier en SQL.

## Ordre de travail

1. ~~**Socle**~~ — fait : auth Supabase (SecureStore chunké — le Keystore Android
   refuse au-delà de 2 048 octets), gate de session, onglets membre, bascule
   Système/Clair/Sombre, i18n fr/en.
2. **Backend** — les Route Handlers `/api/v1/*` et le contrat d'API.
3. **Écrans membre** — Mes tontines → détail du tour → mes cotisations →
   messages et annonces → profil.
4. **Effet météorites** — port de `src/components/landing/hero-canvas.tsx`
   (canvas 2D côté web) vers `@shopify/react-native-skia` + Reanimated pour les
   particules, `expo-linear-gradient` et flou Skia pour les aurores. Appliqué au
   splash et aux écrans `(auth)`.
5. **APK** — `eas build -p android --profile preview`.

## À configurer côté Supabase

Le lien de réinitialisation part vers le lien profond `edjangui://reset-password`
en flux PKCE. Cette URL doit figurer dans les **Redirect URLs** du projet
Supabase, sinon le courriel renvoie vers le site web au lieu de l'app.

## Sessions Claude Code

Ce dossier est la racine de travail. `edjangui-app` s'ajoute en dossier
secondaire de lecture. Ne pas travailler sur les deux repos depuis une même
session : les commits et les conventions dérivent.
