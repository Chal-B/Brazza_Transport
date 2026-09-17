import lignesJson from '../data/lignes.json';
import type { AlerteReseau, ConfigGlobale, Ligne, LignesData, TarifsReferenceData } from './types';
import configGlobaleJson from '../data/config_globale.json';
import tarifsReferenceJson from '../data/tarifs_reference.json';

class DonneesInvalidesError extends Error {
  constructor(message: string) {
    super(`Donnees invalides dans lignes.json : ${message}`);
    this.name = 'DonneesInvalidesError';
  }
}

function validerLigne(valeur: unknown, index: number): Ligne {
  if (typeof valeur !== 'object' || valeur === null) {
    throw new DonneesInvalidesError(`element ${index} n'est pas un objet`);
  }
  const ligne = valeur as Record<string, unknown>;

  const champsRequis: Array<keyof Ligne> = [
    'id', 'nom', 'type', 'mode', 'depart', 'arrivee',
    'arrets_principaux', 'tarification', 'derniere_verification', 'statut_verification',
  ];
  for (const champ of champsRequis) {
    if (!(champ in ligne)) {
      throw new DonneesInvalidesError(`ligne a l'index ${index} : champ obligatoire "${champ}" manquant`);
    }
  }

  if (typeof ligne.id !== 'string' || ligne.id.length === 0) {
    throw new DonneesInvalidesError(`ligne a l'index ${index} : "id" doit etre une chaine non vide`);
  }
  if (ligne.type !== 'bus' && ligne.type !== 'taxi_collectif') {
    throw new DonneesInvalidesError(`ligne "${ligne.id}" : "type" invalide (${String(ligne.type)})`);
  }
  if (ligne.mode !== 'bus_standard' && ligne.mode !== 'taxi_collectif') {
    throw new DonneesInvalidesError(`ligne "${ligne.id}" : "mode" invalide (${String(ligne.mode)})`);
  }
  if (!Array.isArray(ligne.arrets_principaux) || ligne.arrets_principaux.length === 0) {
    throw new DonneesInvalidesError(`ligne "${ligne.id}" : "arrets_principaux" doit etre un tableau non vide`);
  }
  for (const arret of ligne.arrets_principaux as unknown[]) {
    if (typeof arret !== 'object' || arret === null || typeof (arret as Record<string, unknown>).nom !== 'string') {
      throw new DonneesInvalidesError(`ligne "${ligne.id}" : un arret n'a pas de champ "nom" valide`);
    }
  }

  const tarification = ligne.tarification as Record<string, unknown> | undefined;
  if (typeof tarification !== 'object' || tarification === null) {
    throw new DonneesInvalidesError(`ligne "${ligne.id}" : "tarification" doit etre un objet`);
  }
  const normal = tarification.normal as Record<string, unknown> | undefined;
  if (typeof normal !== 'object' || normal === null || typeof normal.jour_fcfa !== 'number') {
    throw new DonneesInvalidesError(`ligne "${ligne.id}" : "tarification.normal.jour_fcfa" doit etre un nombre`);
  }

  const statutsValides = ['verifie', 'a_verifier', 'signale_incorrect'];
  if (!statutsValides.includes(ligne.statut_verification as string)) {
    throw new DonneesInvalidesError(`ligne "${ligne.id}" : "statut_verification" invalide (${String(ligne.statut_verification)})`);
  }

  return ligne as unknown as Ligne;
}

function validerEtChargerLignes(donnees: unknown): Ligne[] {
  if (typeof donnees !== 'object' || donnees === null || !('lignes' in donnees)) {
    throw new DonneesInvalidesError('le fichier doit exposer une cle "lignes"');
  }
  const brut = (donnees as { lignes: unknown }).lignes;
  if (!Array.isArray(brut)) {
    throw new DonneesInvalidesError('"lignes" doit etre un tableau');
  }

  const lignes = brut.map((valeur, index) => validerLigne(valeur, index));

  const idsVus = new Set<string>();
  for (const ligne of lignes) {
    if (idsVus.has(ligne.id)) {
      throw new DonneesInvalidesError(`id de ligne en double : "${ligne.id}"`);
    }
    idsVus.add(ligne.id);
  }

  for (const ligne of lignes) {
    for (const correspondance of ligne.correspondances_possibles ?? []) {
      if (!idsVus.has(correspondance)) {
        throw new DonneesInvalidesError(
          `ligne "${ligne.id}" reference une correspondance inexistante : "${correspondance}"`,
        );
      }
    }
  }

  return lignes;
}

const lignesValidees = validerEtChargerLignes(lignesJson as LignesData);

export function getToutesLesLignes(): Ligne[] {
  return lignesValidees;
}

export function getLigneParId(id: string): Ligne | undefined {
  return lignesValidees.find((ligne) => ligne.id === id);
}

export function getConfigGlobale(): ConfigGlobale {
  return configGlobaleJson as ConfigGlobale;
}

export function getAlertesActives(): AlerteReseau[] {
  return getConfigGlobale().alertes_reseau.filter((alerte) => alerte.actif);
}

export function getTarifsReference(): TarifsReferenceData {
  return tarifsReferenceJson as TarifsReferenceData;
}
