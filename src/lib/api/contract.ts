/**
 * Contrat de l'API `/api/v1/*` — le JSON que rendent les Route Handlers.
 *
 * Fichier **sans dépendance** : ni Prisma, ni Next. Il se recopie tel quel dans
 * `edjangui-mobile-app` pour typer le client HTTP, ce qui fait de toute
 * divergence de forme une erreur de compilation des deux côtés.
 *
 * Deux règles tenues partout :
 *
 * - **Les dates sont des chaînes ISO 8601 en UTC.** `JSON.stringify` le ferait
 *   de lui-même sur un `Date`, mais le type le dirait alors faux ; les handlers
 *   convertissent donc explicitement (`iso()`).
 * - **Rien n'est formaté.** Ni montant, ni date, ni libellé de mois : le
 *   serveur ne connaît pas la locale du téléphone. Le client formate à partir
 *   de la devise et des dates brutes, exactement comme le fait l'app web.
 *
 * Les unions de chaînes reprennent les enums Prisma. Elles sont redéclarées ici
 * plutôt qu'importées pour garder le fichier autonome ; l'affectation depuis le
 * client généré reste vérifiée par TypeScript.
 */

export type ApiRole = "SUPER_ADMIN" | "TONTINE_ADMIN" | "MEMBER";
export type ApiRoundStatus = "DRAFT" | "ACTIVE" | "CLOSED";
export type ApiContributionStatus = "RECEIVED" | "LATE" | "MISSED";
export type ApiPenaltyType =
  | "RETARD_COTISATION"
  | "RETARD_COMPLEMENT_FONDS"
  | "RETARD_COMPLEMENT_CAUTION"
  | "ABSENCE_AG"
  | "RETARD_REMBOURSEMENT_PRET";
export type ApiCommitmentKind =
  | "CONTRIBUTION"
  | "CASH_RESERVE"
  | "CAUTION"
  | "LOAN";

// --------------------------------------------------------------------------
// Profil — GET/PATCH /api/v1/me
// --------------------------------------------------------------------------

export type ApiMembership = {
  tontineId: string;
  tontineName: string;
  currency: string;
  role: ApiRole;
  joinedAt: string;
  /** Solde de caution d'adhésion du membre dans cette tontine. */
  cautionBalance: number;
  /** Solde de son fond de caisse. */
  cashReserveBalance: number;
};

export type ApiMe = {
  id: string;
  email: string;
  fullName: string;
  username: string;
  /** Nom d'un fichier de la planche livrée avec l'app (`avatar_12`), ou `null`. */
  avatarName: string | null;
  role: ApiRole;
  createdAt: string;
  memberships: ApiMembership[];
};

/** Corps accepté par `PATCH /api/v1/me`. `avatarName: null` retire l'avatar. */
export type ApiUpdateMeBody = {
  fullName: string;
  avatarName?: string | null;
};

// --------------------------------------------------------------------------
// Tontines
// --------------------------------------------------------------------------

export type ApiRoundSummary = {
  id: string;
  code: string;
  status: ApiRoundStatus;
  startDate: string;
  endDate: string;
  monthlyAmount: number;
  durationMonths: number;
  /** Rang du mois courant dans le tour, borné à sa durée. */
  currentMonth: number;
};

/** Une carte de la liste « Mes tontines » — `GET /api/v1/tontines`. */
export type ApiTontineSummary = {
  id: string;
  name: string;
  currency: string;
  memberCount: number;
  joiningFee: number;
  cashReserveAmount: number;
  role: ApiRole;
  joinedAt: string;
  unreadMessages: number;
  activeRound: ApiRoundSummary | null;
};

/** `GET /api/v1/tontines/{tontineId}` — cadré sur le membre qui demande. */
export type ApiTontineDetail = {
  id: string;
  name: string;
  currency: string;
  countryCode: string | null;
  whatsappGroupUrl: string | null;
  memberCount: number;
  joiningFee: number;
  cashReserveAmount: number;
  membership: {
    role: ApiRole;
    joinedAt: string;
    cautionBalance: number;
    cashReserveBalance: number;
    /** Reste à verser sur la caution d'adhésion, `0` si elle est complète. */
    cautionDue: number;
    /** Reste à renflouer sur le fond de caisse, `0` s'il est au seuil. */
    cashReserveDue: number;
  };
  activeRound: ApiRoundSummary | null;
  mailbox: { total: number; unread: number };
  polls: { running: number; pending: number };
};

// --------------------------------------------------------------------------
// Tours — GET /api/v1/tontines/{tontineId}/rounds[/{roundId}]
// --------------------------------------------------------------------------

/**
 * Une ligne du tour, membre par membre : sa place dans l'ordre de passage, ses
 * constats de cotisation et son score. Les trois blocs de l'écran web
 * (rotation, grille des cotisations, tableau des scores) parlent des mêmes
 * personnes — les réunir ici épargne au client de recroiser trois listes par
 * identifiant.
 */
export type ApiRoundMember = {
  userId: string;
  fullName: string;
  username: string;
  avatarName: string | null;
  role: ApiRole;
  /** Vrai pour la ligne du demandeur : de quoi la détacher en tête d'écran. */
  isMe: boolean;
  payoutOrder: number | null;
  isDistributed: boolean;
  /** Montant figé au moment de la remise, `null` tant qu'elle n'a pas eu lieu. */
  payoutAmount: number | null;
  distributedAt: string | null;
  /**
   * Constat du mois `n` en position `n - 1`. `null` = mois non dépouillé, ce
   * qui n'est **pas** un défaut de paiement.
   */
  contributions: (ApiContributionStatus | null)[];
  score: number;
  penaltyCount: number;
  penaltyAmount: number;
};

export type ApiPenalty = {
  id: string;
  userId: string;
  fullName: string;
  avatarName: string | null;
  type: ApiPenaltyType;
  pointsDeducted: number;
  amount: number;
  description: string | null;
  createdAt: string;
};

export type ApiRoundDetail = {
  tontine: { id: string; name: string; currency: string };
  round: ApiRoundSummary & {
    memberCount: number;
    /** Ce que touche le bénéficiaire du mois : cotisation × effectif. */
    monthlyPot: number;
  };
  members: ApiRoundMember[];
  penalties: ApiPenalty[];
};

// --------------------------------------------------------------------------
// Engagements et cotisations du membre
// --------------------------------------------------------------------------

/** `GET /api/v1/me/commitments` — ce qu'il doit ce mois-ci, tous groupes. */
export type ApiCommitment = {
  id: string;
  kind: ApiCommitmentKind;
  tontineId: string;
  tontineName: string;
  amount: number;
  currency: string;
  /** `null` quand l'obligation n'a pas d'échéance annoncée (caution). */
  dueDate: string | null;
  isOverdue: boolean;
  /** Précision affichée sous l'intitulé : code du tour, mois de rotation… */
  detail: string | null;
};

/** `GET /api/v1/me/contributions` — ses versements, tour par tour. */
export type ApiMemberContributions = {
  tontineId: string;
  tontineName: string;
  currency: string;
  roundId: string;
  code: string;
  status: ApiRoundStatus;
  startDate: string;
  durationMonths: number;
  monthlyAmount: number;
  /** Ses constats, du mois 1 au dernier ; `null` = mois non dépouillé. */
  cells: (ApiContributionStatus | null)[];
  /** Ses mois encaissés (reçus ou en retard) sur ce tour. */
  collectedCount: number;
};

// --------------------------------------------------------------------------
// Messagerie — sens unique : l'administration écrit, le membre lit
// --------------------------------------------------------------------------

export type ApiInboxMessage = {
  /** Identifiant du message, celui que reprennent les routes de détail. */
  id: string;
  tontineId: string;
  tontineName: string;
  subject: string;
  content: string;
  createdAt: string;
  sender: { fullName: string; avatarName: string | null };
  isRead: boolean;
  readAt: string | null;
};

/** `POST /api/v1/tontines/{tontineId}/messages/{messageId}/read` */
export type ApiReadReceipt = {
  /** Vrai si l'appel a fait basculer l'exemplaire en « lu ». */
  changed: boolean;
};

// --------------------------------------------------------------------------
// Service
// --------------------------------------------------------------------------

export type ApiHealth = { status: "ok"; time: string };
