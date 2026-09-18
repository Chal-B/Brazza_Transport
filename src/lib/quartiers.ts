import type { Ligne } from './types';

const SEPARATEUR_PRECISION = ' (';

export function extraireQuartier(nomPoint: string): string {
  const index = nomPoint.indexOf(SEPARATEUR_PRECISION);
  return index === -1 ? nomPoint : nomPoint.slice(0, index);
}

export function quartiersDeLigne(ligne: Ligne): string[] {
  const quartiers = new Set([extraireQuartier(ligne.depart), extraireQuartier(ligne.arrivee)]);
  return [...quartiers];
}

export function quartiersDistincts(lignes: Ligne[]): string[] {
  const tous = new Set<string>();
  for (const ligne of lignes) {
    for (const quartier of quartiersDeLigne(ligne)) {
      tous.add(quartier);
    }
  }
  return [...tous].sort((a, b) => a.localeCompare(b, 'fr'));
}

export function ligneDessertQuartier(ligne: Ligne, quartier: string): boolean {
  return quartiersDeLigne(ligne).includes(quartier);
}
