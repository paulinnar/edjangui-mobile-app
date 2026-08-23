/**
 * Contrat **proposé** pour les routes que l'onglet « Groupe » attend de
 * l'app web, et qui n'existent pas encore : les votes et l'agenda.
 *
 * Fichier **temporaire**, et volontairement séparé de `contract.ts` : ce
 * dernier est copié de `edjangui-app` par `npm run sync-messages` et ne
 * s'édite jamais ici. Le jour où les Route Handlers correspondants sont
 * écrits côté web, leurs types rejoignent `src/lib/api/contract.ts` là-bas,
 * la synchronisation les ramène ici, et **ce fichier se supprime** — les
 * écrans n'ont alors qu'à changer d'import.
 *
 * La forme retenue est celle du reste du contrat : dates ISO 8601 en UTC,
 * rien de formaté, et les décisions de temps (« clos », « passé ») prises
 * côté serveur. Le détail des routes attendues est dans
 * [`docs/api-v1-group.md`](../../../docs/api-v1-group.md).
 */

// --------------------------------------------------------------------------
// Votes — GET /api/v1/me/polls, POST …/polls/{pollId}/vote
// --------------------------------------------------------------------------

/**
 * Une option et son décompte. `share` est la part des **bulletins exprimés**
 * (0 à 100), pas de l'effectif : « 3 voix sur 4 exprimées » et « 3 voix sur 9
 * membres » ne décrivent pas le même rapport de force, et c'est le premier que
 * la barre représente. L'effectif est donné à part par `memberCount`.
 */
export type ApiPollOption = {
  id: string;
  label: string;
  votes: number;
  share: number;
};

export type ApiMemberPoll = {
  id: string;
  tontineId: string;
  tontineName: string;
  question: string;
  createdAt: string;
  closesAt: string;
  creator: { fullName: string; avatarName: string | null };
  /**
   * Échéance dépassée, constatée à l'horloge du **serveur**. Le téléphone ne
   * la recalcule pas : `closesAt` est de l'horloge murale calée en UTC, et un
   * client qui la comparerait à son fuseau fermerait le scrutin trop tôt.
   */
  isClosed: boolean;
  /** L'option choisie par le demandeur, `null` s'il n'a pas encore voté. */
  myOptionId: string | null;
  /** Bulletins déposés, tous membres confondus. */
  totalVotes: number;
  /** Effectif de la tontine, pour lire la participation. */
  memberCount: number;
  /** Dans l'ordre de saisie de l'administrateur, jamais celui du décompte. */
  options: ApiPollOption[];
};

/** Corps de `POST /api/v1/tontines/{tontineId}/polls/{pollId}/vote`. */
export type ApiVoteBody = { optionId: string };

/**
 * Le scrutin tel qu'il est après le bulletin : l'écran met sa carte à jour
 * sans relire toute la liste, et le décompte affiché est celui que le serveur
 * vient d'arrêter.
 */
export type ApiPollBallot = {
  pollId: string;
  myOptionId: string;
  totalVotes: number;
  options: ApiPollOption[];
};

// --------------------------------------------------------------------------
// Agenda — GET /api/v1/me/events
// --------------------------------------------------------------------------

export type ApiEventRecurrence = 'NONE' | 'WEEKLY' | 'MONTHLY';

export type ApiMemberEvent = {
  id: string;
  tontineId: string;
  tontineName: string;
  /** Partagé par les occurrences d'une même récurrence, `null` si unique. */
  seriesId: string | null;
  title: string;
  /** Date calendaire, calée à minuit UTC : à rendre en UTC, jamais localisée. */
  eventDate: string;
  /** Horloge murale `HH:MM`, à afficher telle quelle, sans conversion. */
  startTime: string;
  endTime: string;
  location: string;
  description: string | null;
  /** Ordre du jour puis compte rendu ; souvent rédigé après la séance. */
  protocol: string | null;
  recurrence: ApiEventRecurrence;
  occurrence: number;
  cycles: number;
  organizer: { fullName: string; avatarName: string | null };
  /** Séance terminée, constatée côté serveur — même raison que `isClosed`. */
  isPast: boolean;
};
