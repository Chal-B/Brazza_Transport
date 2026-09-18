import type { Ligne, StatutVerification } from './types';

export type EtatFraicheur = 'incorrect' | 'inconnu' | 'frais_24h' | 'frais' | 'a_confirmer';

export type ClasseBadge = 'badge-frais' | 'badge-pointe' | 'badge-alerte' | 'badge-inconnu';

export interface BadgeFraicheur {
  etat: EtatFraicheur;
  classe: ClasseBadge;
  libelle: string;
  dateFormatee: string | null;
}

const MS_PAR_HEURE = 60 * 60 * 1000;
const SEUIL_24H = 24 * MS_PAR_HEURE;
const SEUIL_30_JOURS = 30 * 24 * MS_PAR_HEURE;

const formateurDateFr = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formaterDate(date: Date): string {
  return formateurDateFr.format(date);
}

function parserDate(valeur: string | null): Date | null {
  if (valeur === null || valeur.trim().length === 0) return null;
  const date = new Date(valeur);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function calculerBadgeFraicheur(
  derniereVerification: string | null,
  statutVerification: StatutVerification,
  maintenant: Date = new Date(),
): BadgeFraicheur {
  const date = parserDate(derniereVerification);
  const dateFormatee = date === null ? null : formaterDate(date);

  if (statutVerification === 'signale_incorrect') {
    return {
      etat: 'incorrect',
      classe: 'badge-alerte',
      libelle: 'Signalé comme incorrect, en attente de vérification',
      dateFormatee,
    };
  }

  if (date === null) {
    return {
      etat: 'inconnu',
      classe: 'badge-inconnu',
      libelle: 'Date de vérification à confirmer',
      dateFormatee: null,
    };
  }

  const anciennete = maintenant.getTime() - date.getTime();

  if (anciennete < SEUIL_24H) {
    return {
      etat: 'frais_24h',
      classe: 'badge-frais',
      libelle: 'Vérifié il y a moins de 24h',
      dateFormatee,
    };
  }

  if (anciennete < SEUIL_30_JOURS) {
    return {
      etat: 'frais',
      classe: 'badge-frais',
      libelle: `Vérifié le ${dateFormatee}`,
      dateFormatee,
    };
  }

  return {
    etat: 'a_confirmer',
    classe: 'badge-pointe',
    libelle: `Info à confirmer, vérifié le ${dateFormatee}`,
    dateFormatee,
  };
}

export function badgeFraicheurDeLigne(ligne: Ligne, maintenant: Date = new Date()): BadgeFraicheur {
  return calculerBadgeFraicheur(ligne.derniere_verification, ligne.statut_verification, maintenant);
}
