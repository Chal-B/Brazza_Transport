import type { Ligne } from './types';

export type ObtenirTarif = (ligne: Ligne) => number;

export interface OptionTrajet {
  lignes: Ligne[];
  arretCorrespondance: string | null;
  tarifTotal: number;
}

export type StatutRecherche =
  | 'resultats'
  | 'aucun_resultat'
  | 'trop_de_correspondances'
  | 'meme_arret';

export interface ResultatRecherche {
  statut: StatutRecherche;
  options: OptionTrajet[];
  nbResultatsPourLog: number;
}

export function normaliser(valeur: string): string {
  return valeur
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function motsDe(valeur: string): string[] {
  return normaliser(valeur)
    .split(/[^a-z0-9]+/)
    .filter((mot) => mot.length > 0);
}

function commencePar(nom: string, requeteNormalisee: string): boolean {
  if (requeteNormalisee.length === 0) return true;
  if (normaliser(nom).startsWith(requeteNormalisee)) return true;
  return motsDe(nom).some((mot) => mot.startsWith(requeteNormalisee));
}

function tarifNormalParDefaut(ligne: Ligne): number {
  return ligne.tarification.normal.jour_fcfa;
}

function dessertArret(ligne: Ligne, arret: string): boolean {
  const cible = normaliser(arret);
  return ligne.arrets_principaux.some((a) => normaliser(a.nom) === cible);
}

function arretCommun(a: Ligne, b: Ligne): string | null {
  for (const arretA of a.arrets_principaux) {
    if (b.arrets_principaux.some((arretB) => normaliser(arretB.nom) === normaliser(arretA.nom))) {
      return arretA.nom;
    }
  }
  return null;
}

export function lignesDesservantArret(arret: string, lignes: Ligne[]): Ligne[] {
  return lignes.filter((ligne) => dessertArret(ligne, arret));
}

export function memeArret(a: string, b: string): boolean {
  return normaliser(a) === normaliser(b);
}

export function tousLesArrets(lignes: Ligne[]): string[] {
  const trouves = new Set<string>();
  for (const ligne of lignes) {
    for (const arret of ligne.arrets_principaux) {
      trouves.add(arret.nom);
    }
  }
  return [...trouves].sort((a, b) => a.localeCompare(b, 'fr'));
}

export function filtrerArrets(recherche: string, arrets: string[]): string[] {
  const q = normaliser(recherche);
  return arrets
    .filter((arret) => commencePar(arret, q))
    .sort((a, b) => {
      const debutA = normaliser(a).startsWith(q);
      const debutB = normaliser(b).startsWith(q);
      if (debutA !== debutB) return debutA ? -1 : 1;
      return a.localeCompare(b, 'fr');
    });
}

export function suggererArrets(recherche: string, lignes: Ligne[]): string[] {
  return filtrerArrets(recherche, tousLesArrets(lignes));
}

export function estArretConnu(valeur: string, arrets: string[]): boolean {
  if (normaliser(valeur).length === 0) return false;
  return arrets.some((arret) => memeArret(arret, valeur));
}

export function rechercherTrajets(
  depart: string,
  arrivee: string,
  lignes: Ligne[],
  obtenirTarif: ObtenirTarif = tarifNormalParDefaut,
): ResultatRecherche {
  if (normaliser(depart) === normaliser(arrivee)) {
    return { statut: 'meme_arret', options: [], nbResultatsPourLog: 0 };
  }

  const lignesDepart = lignes.filter((l) => dessertArret(l, depart));
  const lignesArrivee = lignes.filter((l) => dessertArret(l, arrivee));

  const optionsDirectes: OptionTrajet[] = [];
  for (const ligne of lignesDepart) {
    if (lignesArrivee.some((l) => l.id === ligne.id)) {
      optionsDirectes.push({
        lignes: [ligne],
        arretCorrespondance: null,
        tarifTotal: obtenirTarif(ligne),
      });
    }
  }

  const optionsCorrespondance: OptionTrajet[] = [];
  for (const ligneA of lignesDepart) {
    for (const ligneB of lignesArrivee) {
      if (ligneA.id === ligneB.id) continue;
      const sontConnectees =
        (ligneA.correspondances_possibles ?? []).includes(ligneB.id) ||
        (ligneB.correspondances_possibles ?? []).includes(ligneA.id) ||
        arretCommun(ligneA, ligneB) !== null;
      if (!sontConnectees) continue;

      const dejaTrouvee = optionsCorrespondance.some(
        (o) =>
          (o.lignes[0].id === ligneA.id && o.lignes[1].id === ligneB.id) ||
          (o.lignes[0].id === ligneB.id && o.lignes[1].id === ligneA.id),
      );
      if (dejaTrouvee) continue;

      optionsCorrespondance.push({
        lignes: [ligneA, ligneB],
        arretCorrespondance: arretCommun(ligneA, ligneB),
        tarifTotal: obtenirTarif(ligneA) + obtenirTarif(ligneB),
      });
    }
  }

  if (optionsDirectes.length === 0 && optionsCorrespondance.length === 0) {
    if (lignesDepart.length > 0 && lignesArrivee.length > 0) {
      return { statut: 'trop_de_correspondances', options: [], nbResultatsPourLog: -1 };
    }
    return { statut: 'aucun_resultat', options: [], nbResultatsPourLog: 0 };
  }

  const options = [
    ...optionsDirectes.sort((a, b) => a.tarifTotal - b.tarifTotal),
    ...optionsCorrespondance.sort((a, b) => a.tarifTotal - b.tarifTotal),
  ];

  return { statut: 'resultats', options, nbResultatsPourLog: options.length };
}
