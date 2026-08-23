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
Skia 2.6 + Reanimated 4 pour le fond animé · TypeScript strict ·
alias `@/*` → `./src/*`.

expo-router **n'utilise plus `@react-navigation/native`** depuis le SDK 56 : le
fournisseur de thème et les thèmes de base se réimportent depuis `expo-router`.
Toute dépendance directe à react-navigation fait échouer le bundle. C'est aussi
ce qui fixe le **plancher de version** : redescendre en SDK 55 obligerait à
réintroduire react-navigation dans `src/app/_layout.tsx`.

## Essayer sur un téléphone

**Expo Go ne convient pas.** Un client Expo Go ne charge que les projets de son
propre SDK, et celui du magasin suit le dernier publié : dès que les deux
divergent, le projet est refusé — c'est l'écart de version qui bloque, pas ce
qu'embarque le client.

Il faut donc un **development build** : le même rôle qu'Expo Go, mais compilé
avec les modules natifs de *ce* projet, Skia compris. Il s'installe une fois et
sert ensuite pour tout le développement, `npx expo start` compris.

```
npx eas-cli build --platform android --profile development
```

Les profils sont dans `eas.json` : `development` (APK, client de développement),
`preview` (APK de test, lot 5) et `production` (bundle Play).

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
src/app/(app)/group.tsx  onglet Groupe : messages, votes, agenda (cartes dépliables)
src/app/reset-password arrivée du lien de réinitialisation
src/components         gabarits partagés (AuthShell, Screen, Backdrop, Logo)
                       backdrop.tsx = Skia ; backdrop.web.tsx = dégradés
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

**Le mobile consomme les Route Handlers `/api/v1/*` d'`edjangui-app`**, qui
réutilisent la logique déjà écrite dans `src/lib/*.ts` (`scoring.ts`,
`rounds.ts`, `penalties.ts`, `contributions.ts`…). Une seule implémentation des
règles métier, partagée par le web et le mobile. Le contrat est documenté dans
`docs/api-v1.md` côté web.

- Authentification : JWT Supabase porté en `Authorization: Bearer`.
- Chaque handler revérifie le périmètre membre côté serveur — le filtrage n'est
  jamais laissé au client. Un super-administrateur qui se connecte depuis le
  mobile obtient une liste de tontines vide, par construction.
- La seule écriture exposée, hors profil, est le marquage de lecture d'un
  message.
- Écarté : l'accès direct aux tables via PostgREST, qui imposerait des policies
  RLS sur les 28 modèles Prisma et une duplication du métier en SQL.

`src/lib/api/contract.ts` est **copié** du web par `npm run sync-messages`, au
même titre que les catalogues : une divergence de forme devient une erreur de
compilation des deux côtés, pas un écran vide à l'exécution. Ne jamais l'éditer
ici — la source est l'app web.

## Ordre de travail

1. ~~**Socle**~~ — fait : auth Supabase (SecureStore chunké — le Keystore Android
   refuse au-delà de 2 048 octets), gate de session, onglets membre, bascule
   Système/Clair/Sombre, i18n fr/en.
2. ~~**Backend**~~ — fait dans `edjangui-app` : Route Handlers `/api/v1/*` et
   contrat (`docs/api-v1.md`).
3. ~~**Écrans membre**~~ — fait : mes tontines → tontine → détail du tour → mes
   cotisations → groupe (messages, votes, agenda) → profil. Lecture seule, sauf
   le nom/avatar du profil, le marquage de lecture d'un message et le bulletin
   d'un vote.

   L'onglet **Groupe** reprend le regroupement `nav.groups.group` du web sous un
   seul onglet, à trois volets. Les votes et l'agenda attendent leurs Route
   Handlers côté web : la demande est dans `docs/api-v1-group.md`, et leurs
   types vivent dans `src/lib/api/contract-pending.ts` — fichier temporaire, à
   supprimer dès que `sync-messages` ramènera les vrais.
4. ~~**Effet météorites**~~ — fait : `hero-canvas.tsx` du web porté sur Skia +
   Reanimated dans `src/components/backdrop.tsx`, appliqué aux écrans `(auth)`
   et à l'écran d'attente (`SplashView`, pendant la lecture des polices, des
   préférences et de la session).

   Tout se déduit d'une horloge tenue **sur le fil d'interface** : aucune
   position n'est stockée, le fil JavaScript reste libre pour le formulaire et
   le réseau. Deux toiles — les aurores floutées sont immobiles, donc composées
   sans être redessinées ; seules les particules et les étoiles filantes
   s'animent. L'animation s'arrête en arrière-plan et ne démarre pas si le
   système annonce un mouvement réduit.

   Écarté du web, faute de sens sur téléphone : l'accroche de la poussière au
   pointeur, les étincelles au clic (un fond qui capterait les appuis les
   volerait au formulaire), le quadrillage et le grain.

   `backdrop.web.tsx` garde l'ancienne approximation en dégradés : la version
   web de Skia charge CanvasKit en WebAssembly, ce qui ne se justifie pas pour
   un aperçu qui ne sert qu'à contrôler une mise en page.
5. **APK** — `eas build -p android --profile preview`.

## À configurer côté Supabase

Le lien de réinitialisation part vers le lien profond `edjangui://reset-password`
en flux PKCE. Cette URL doit figurer dans les **Redirect URLs** du projet
Supabase, sinon le courriel renvoie vers le site web au lieu de l'app.

## Sessions Claude Code

Ce dossier est la racine de travail. `edjangui-app` s'ajoute en dossier
secondaire de lecture. Ne pas travailler sur les deux repos depuis une même
session : les commits et les conventions dérivent.
