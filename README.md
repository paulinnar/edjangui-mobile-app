# edjangui-mobile-app

Application mobile de la tontine **Tontiin** (Edjangui) — client Expo / React
Native, pendant mobile de l'app web `edjangui-app`.

L'application ne porte que le **rôle membre** : même un compte administrateur
n'y voit que ses propres données. Aucun écran d'administration n'est porté.

## Démarrer

```bash
npm install
cp .env.example .env   # puis renseigner les clés Supabase
npx expo start
```

Scannez le QR code avec **Expo Go** (Android ou iOS) pour lancer l'app sur un
téléphone.

| Commande | Effet |
| --- | --- |
| `npm start` | serveur de développement Expo |
| `npm run android` | ouvre sur un émulateur ou un appareil Android |
| `npm run ios` | ouvre sur le simulateur iOS (macOS uniquement) |
| `npm run typecheck` | vérification TypeScript |
| `npm run sync-messages` | recopie les catalogues de traduction depuis l'app web |

## Variables d'environnement

`.env` porte uniquement des valeurs publiques — le préfixe `EXPO_PUBLIC_` les
inscrit dans le bundle, aucune clé secrète ne doit y figurer.

| Variable | Rôle |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | projet Supabase (identique à l'app web) |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | clé publiable Supabase |
| `EXPO_PUBLIC_API_URL` | base des Route Handlers `/api/v1/*` de l'app web |

Sur un **téléphone physique**, `localhost` désigne le téléphone lui-même :
`EXPO_PUBLIC_API_URL` doit porter l'adresse de l'ordinateur sur le réseau local
(`http://192.168.x.y:3000`), et l'app web doit écouter sur toutes les interfaces
(`next dev -H 0.0.0.0`). Un émulateur Android, lui, atteint la machine hôte par
`http://10.0.2.2:3000`.

## Architecture

```
src/app/(auth)      login, register, forgot-password — écrans publics
src/app/(app)       onglets membre : tontines, contributions, mailbox, profile
src/app/reset-password  arrivée du lien de réinitialisation (hors garde `(auth)`)
src/components      primitives partagées et gabarits d'écran
src/components/ui   Button, Field, Card, Segmented, Badge, Avatar, états…
src/constants       theme.ts — couleurs, Fonts, Spacing, Radius
src/hooks           useTheme, useColorScheme, useFormat
src/i18n            catalogues et interpolation ICU réduite
src/lib             Supabase, session, stockage chiffré, validation
src/lib/api         contrat, client HTTP, hook de lecture
```

Les onglets « Tontines » et « Messages » sont des **piles** et non des écrans
simples : quitter un onglet et y revenir doit retrouver le tour qu'on lisait, pas
repartir de la liste.

### Données

`src/lib/api/contract.ts` est **copié** de l'app web par `npm run sync-messages`,
comme les catalogues : toute divergence de forme devient une erreur de
compilation des deux côtés plutôt qu'un écran vide à l'exécution.

Le jeton Supabase part en `Authorization: Bearer` à chaque appel — relu plutôt
que mémorisé, il expire en une heure et `getSession()` le renouvelle au passage.
Un `401` ferme la session : le garde de navigation ramène au login, ce qui vaut
mieux qu'un écran d'erreur dont on ne peut rien faire.

Pas de bibliothèque de cache : chaque écran lit sa route et la recharge au
retour dessus (`useFocusEffect`), avec tirer-pour-rafraîchir. Le seul cas qui
demanderait davantage — la pastille de non-lus après lecture d'un message — se
règle par ce rechargement au focus.

Les **avatars** ne sont pas embarqués : les 32 fichiers de la planche pèsent 4 Mo
et sont servis par `public/avatars` de l'app web. Faute de réseau, les initiales
prennent le relais.

### Authentification

Supabase Auth en direct, sans intermédiaire : `signInWithPassword`, `signUp` et
`resetPasswordForEmail` sont appelés depuis l'app. Le jeton est conservé dans
`expo-secure-store`, **découpé** — le Keystore Android refuse toute valeur de
plus de 2 048 octets, qu'une session Supabase dépasse systématiquement.

La réinitialisation de mot de passe passe par un lien profond
`edjangui://reset-password` en flux PKCE. Cette URL doit figurer dans les
**Redirect URLs** du projet Supabase, sinon le lien reçu par e-mail retombe sur
le site web.

### Thème

`src/constants/theme.ts` transpose en hexadécimal les tokens `oklch` de
`.theme-brand` du `globals.css` de l'app web : React Native ne lit pas `oklch`.
**Toute retouche de charte se fait côté web d'abord**, puis se reporte ici.

Les thèmes clair et sombre sont obligatoires sur chaque écran. Le réglage
`Système / Clair / Sombre` vit dans l'onglet Profil.

### Traductions

Les catalogues de `src/i18n/messages/{fr,en}.json` sont **copiés** de l'app web
par `npm run sync-messages` : mêmes libellés d'un client à l'autre. Les libellés
propres au mobile (noms d'onglets, réglages) vivent à part dans
`mobile.{fr,en}.json`, sous la branche `mobile`, pour que la resynchronisation
ne les emporte pas.

## État d'avancement

- [x] **Socle** — auth Supabase, gate de session, onglets membre, thèmes, i18n
- [x] **Backend** — Route Handlers `/api/v1/*` dans `edjangui-app` (`docs/api-v1.md`)
- [x] **Écrans membre** — tontines, tour, cotisations, messagerie, profil
- [ ] **Effet météorites** — port de `hero-canvas.tsx` vers Skia + Reanimated
- [ ] **APK** — `eas build -p android --profile preview`
