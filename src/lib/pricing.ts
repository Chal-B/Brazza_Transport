import type { ConfigGlobale, Creneau, Ligne } from './types';
import type { ObtenirTarif } from './search-engine';

export type ContexteTarifaire = 'normal' | 'heure_pointe' | 'crise_carburant';

export type BadgeTarif = 'frais' | 'pointe' | 'alerte';

export interface EstimationTarif {
  contexte: ContexteTarifaire;
  fcfa: number;
  majoration: boolean;
  badge: BadgeTarif;
  libelle: string;
  note: string | null;
}

function minutesDepuisMinuit(heure: string): number {
  const [h, m] = heure.split(':').map(Number);
  return h * 60 + m;
}

function estDansCreneau(creneau: Creneau, minutes: number): boolean {
  return minutes >= minutesDepuisMinuit(creneau.debut) && minutes <= minutesDepuisMinuit(creneau.fin);
}

export function estEnHeureDePointe(ligne: Ligne, maintenant: Date = new Date()): boolean {
  const creneaux = ligne.tarification.heure_pointe?.creneaux ?? [];
  const minutes = maintenant.getHours() * 60 + maintenant.getMinutes();
  return creneaux.some((creneau) => estDansCreneau(creneau, minutes));
}

export function estimerTarif(
  ligne: Ligne,
  config: ConfigGlobale,
  maintenant: Date = new Date(),
): EstimationTarif {
  const tarifNormal = ligne.tarification.normal.jour_fcfa;

  if (config.isFuelCrisisActive) {
    const fcfa = ligne.tarification.crise_carburant?.fcfa ?? tarifNormal;
    const majoration = fcfa > tarifNormal;
    return {
      contexte: 'crise_carburant',
      fcfa,
      majoration,
      badge: majoration ? 'alerte' : 'frais',
      libelle: majoration ? 'Tarif crise carburant' : 'Tarif normal',
      note: null,
    };
  }

  const heurePointe = ligne.tarification.heure_pointe;
  if (heurePointe && estEnHeureDePointe(ligne, maintenant)) {
    const fcfa = heurePointe.fcfa;
    const majoration = fcfa > tarifNormal;
    return {
      contexte: 'heure_pointe',
      fcfa,
      majoration,
      badge: majoration ? 'pointe' : 'frais',
      libelle: majoration ? 'Tarif heure de pointe (tronçonnage constaté)' : 'Tarif normal',
      note: heurePointe.note ?? null,
    };
  }

  return {
    contexte: 'normal',
    fcfa: tarifNormal,
    majoration: false,
    badge: 'frais',
    libelle: 'Tarif normal',
    note: null,
  };
}

export function creerObtenirTarif(config: ConfigGlobale, maintenant?: Date): ObtenirTarif {
  return (ligne: Ligne) => estimerTarif(ligne, config, maintenant ?? new Date()).fcfa;
}
