# Onglet « Groupe » — routes attendues d'`edjangui-app`

L'onglet **Groupe** du mobile réunit trois volets : la messagerie (déjà servie),
les **votes** et l'**agenda**. Ces deux derniers n'ont pas encore de Route
Handler côté web : ce document est la demande, à implémenter dans une session
`edjangui-app` (jamais depuis ce dépôt).

Tant qu'elles n'existent pas, les écrans se typent sur
[`src/lib/api/contract-pending.ts`](../src/lib/api/contract-pending.ts). Une
fois les handlers écrits :

1. les types rejoignent `src/lib/api/contract.ts` **côté web** ;
2. `docs/api-v1.md` côté web décrit les nouvelles routes ;
3. `npm run sync-messages` les ramène ici ;
4. `contract-pending.ts` se supprime, les trois imports des écrans changent de
   fichier.

Les conventions du contrat existant tiennent toutes : jeton Supabase en
`Authorization: Bearer`, dates ISO 8601 en UTC, rien de formaté, erreurs
`{ error: { code, messageKey } }`, et `requireMembership` sur chaque route —
un super-administrateur qui ne siège nulle part obtient des listes vides.

## 1. `GET /api/v1/me/polls` → `ApiMemberPoll[]`

Les votes de **toutes** les tontines du demandeur, comme `/me/messages` fait
pour la messagerie : l'onglet n'est pas cadré sur un groupe.

```json
[
  {
    "id": "…",
    "tontineId": "…",
    "tontineName": "Les Sœurs de Bonapriso",
    "question": "Où tenir l'assemblée générale de décembre ?",
    "createdAt": "2026-08-01T09:00:00.000Z",
    "closesAt": "2026-08-20T18:00:00.000Z",
    "creator": { "fullName": "Marie Ngo", "avatarName": "avatar_12" },
    "isClosed": false,
    "myOptionId": null,
    "totalVotes": 4,
    "memberCount": 9,
    "options": [
      { "id": "…", "label": "Chez la présidente", "votes": 3, "share": 75 },
      { "id": "…", "label": "Salle des fêtes", "votes": 1, "share": 25 }
    ]
  }
]
```

- **Ordre** : `splitPolls` (`src/lib/polls.ts`) — les scrutins ouverts d'abord,
  échéance la plus proche en tête ; les clos ensuite, du plus récent. Le client
  ne réordonne rien : la règle d'échéance est de l'horloge murale, et un tri
  fait dans le fuseau du téléphone divergerait du web.
- **`isClosed`** est constaté par `isPollClosed` à l'heure du serveur, pour la
  même raison. Le mobile ne compare jamais `closesAt` à sa propre horloge.
- **`share`** vient de `tallyOptions` : part des bulletins **exprimés**, arrondie
  à l'entier. `memberCount` est donné à part, pour la ligne de participation.
- **`options`** dans l'ordre de saisie (`position`), jamais celui du décompte.
- **`myOptionId`** : le bulletin du demandeur, et lui seul.

Le mobile n'affiche le décompte qu'une fois le bulletin déposé ou le scrutin
clos — mais le filtrage reste **cosmétique côté client**. Si l'on veut que les
voix ne fuitent pas avant le vote, c'est au handler de renvoyer `votes: 0` et
`share: 0` tant que `myOptionId === null && !isClosed` ; à décider côté web,
l'écran s'accommode des deux.

## 2. `POST /api/v1/tontines/{tontineId}/polls/{pollId}/vote` → `ApiPollBallot`

La deuxième écriture exposée au mobile, après le marquage de lecture. Elle
mérite d'être notée dans `docs/api-v1.md`, dont le paragraphe « la seule
écriture exposée » devient faux.

Corps : `{ "optionId": "…" }`

```json
{
  "pollId": "…",
  "myOptionId": "…",
  "totalVotes": 5,
  "options": [
    { "id": "…", "label": "Chez la présidente", "votes": 4, "share": 80 },
    { "id": "…", "label": "Salle des fêtes", "votes": 1, "share": 20 }
  ]
}
```

Les trois règles de `votePollAction` (`src/app/actions/polls.ts`) s'appliquent
telles quelles, et sont **retenues côté serveur**, jamais laissées à l'écran :

| Situation | Statut | `messageKey` |
| --- | --- | --- |
| pas membre de la tontine | `403` | `polls.errors.notMember` |
| scrutin inexistant dans cette tontine | `404` | `polls.errors.notFound` |
| échéance passée | `422` | `polls.errors.closed` |
| bulletin déjà déposé | `422` | `polls.errors.alreadyVoted` |
| option étrangère au scrutin | `422` | `polls.errors.optionNotFound` |
| `optionId` absent ou mal formé | `422` | `polls.validation.choice` |

L'option se relit depuis le scrutin visé, jamais prise telle quelle, et le
doublon est tranché par l'unicité `(pollId, userId)`. La carte du mobile affiche
le `messageKey` sous les options : ces clés existent déjà dans les catalogues.

Le corps de réponse permet à la carte de basculer du bulletin au dépouillement
sans attendre un second aller-retour ; la liste est tout de même relue derrière,
pour les compteurs de l'en-tête.

Côté web, l'écriture doit faire retomber le cache du **layout** de la tontine
(`revalidatePath("/tontines/<tontineId>", "layout")`), comme le fait
`revalidatePolls` : la pastille « votes en attente » y vit, et un vote déposé
depuis le téléphone doit l'éteindre sur le web.

## 3. `GET /api/v1/me/events` → `ApiMemberEvent[]`

L'agenda de toutes les tontines du demandeur.

```json
[
  {
    "id": "…",
    "tontineId": "…",
    "tontineName": "Les Sœurs de Bonapriso",
    "seriesId": null,
    "title": "Assemblée générale trimestrielle",
    "eventDate": "2026-09-12T00:00:00.000Z",
    "startTime": "15:00",
    "endTime": "18:00",
    "location": "Chez la présidente, Bonapriso",
    "description": "Ordre du jour : …",
    "protocol": null,
    "recurrence": "NONE",
    "occurrence": 1,
    "cycles": 1,
    "organizer": { "fullName": "Marie Ngo", "avatarName": null },
    "isPast": false
  }
]
```

- **Ordre** : `splitAgenda` (`src/lib/events.ts`) — à venir d'abord, du plus
  proche ; puis les séances tenues, de la plus récente. Le mobile les met bout à
  bout en une seule liste, comme le web.
- **`isPast`** est calculé par `isEventPast` à l'heure du serveur (fin de
  séance, pas début de journée) et voyage avec l'occurrence.
- **`eventDate`** est une date calendaire calée à minuit UTC ; `startTime` et
  `endTime` sont des chaînes d'horloge murale. Le mobile rend la date en UTC et
  les heures telles quelles : « samedi 15h » doit rester « samedi 15h » pour un
  membre de la diaspora.

Aucune écriture : l'agenda est administratif, le membre le consulte.

## Volume

Ces deux listes ne sont pas paginées, comme `/me/messages` : une tontine tient
quelques votes par an et quelques dizaines de séances. Si une borne devient
nécessaire, la couper par ancienneté côté serveur (les séances de plus d'un an,
les scrutins clos depuis plus d'un an) vaut mieux qu'un curseur que trois écrans
devraient porter.

## Facultatif — pastille de l'onglet

La barre d'onglets ne porte aujourd'hui aucun compteur : l'écran ne connaît le
nombre de votes en attente qu'une fois le volet ouvert. Une route de service
légère l'allumerait sans charger trois listes :

`GET /api/v1/me/badges` → `{ unreadMessages: number, pendingPolls: number, upcomingEvents: number }`

À décider seulement si la pastille est voulue — trois `count` sur une requête
appelée à chaque venue sur l'onglet, contre rien du tout aujourd'hui.

## Plus tard — les mêmes listes cadrées sur une tontine

L'écran d'une tontine ne montre ni ses votes ni son agenda pour l'instant.
Quand ce sera le cas, deux routes symétriques de celles de la messagerie
suffiront, avec les mêmes formes de réponse :

- `GET /api/v1/tontines/{tontineId}/polls` → `ApiMemberPoll[]`
- `GET /api/v1/tontines/{tontineId}/events` → `ApiMemberEvent[]`

`ApiTontineDetail.polls { running, pending }` existe déjà et sert le compteur ;
un compteur équivalent pour l'agenda (`events { upcoming }`) serait à ajouter au
même endroit.
