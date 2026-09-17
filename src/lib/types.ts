export type TypeLigne = 'bus';

export type ModeTransport = 'bus_standard';

export type StatutVerification = 'verifie' | 'a_verifier' | 'signale_incorrect';

export interface ArretPrincipal {
  nom: string;
  repere: string | null;
}

export interface Creneau {
  debut: string;
  fin: string;
}

export interface TarifNormal {
  jour_fcfa: number;
}

export interface TarifHeurePointe {
  creneaux: Creneau[];
  fcfa: number;
  note?: string;
}

export interface TarifCriseCarburant {
  fcfa: number;
}

export interface Tarification {
  normal: TarifNormal;
  heure_pointe?: TarifHeurePointe;
  crise_carburant?: TarifCriseCarburant;
}

export interface Ligne {
  id: string;
  nom: string;
  type: TypeLigne;
  mode: ModeTransport;
  depart: string;
  arrivee: string;
  arrets_principaux: ArretPrincipal[];
  tarification: Tarification;
  particularites?: string[];
  correspondances_possibles?: string[];
  derniere_verification: string | null;
  statut_verification: StatutVerification;
}

export interface LignesData {
  lignes: Ligne[];
}

export interface AlerteReseau {
  id: string;
  actif: boolean;
  type: string;
  message: string;
  date_debut: string | null;
  date_fin: string | null;
}

export interface ConfigGlobale {
  isFuelCrisisActive: boolean;
  alertes_reseau: AlerteReseau[];
}

export interface TarifReference {
  categorie: string;
  tarif_jour_fcfa: number;
  note?: string;
}

export interface TarifsReferenceData {
  tarifs: TarifReference[];
  derniere_mise_a_jour: string | null;
}
