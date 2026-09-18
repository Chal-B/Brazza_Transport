import type { ArretPrincipal, Ligne } from './types';

export type ObtenirTarif = (ligne: Ligne) => number;

export interface EtapeTrajet {
  ligne: Ligne;
  arrets: ArretPrincipal[];
  montee: string;
  descente: string;
}

export interface OptionTrajet {
  lignes: Ligne[];
  arretCorrespondance: string | null;
  tarifTotal: number;
  etapes: EtapeTrajet[];
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

function indexArret(ligne: Ligne, arret: string): number {
  const cible = normaliser(arret);
  return ligne.arrets_principaux.findIndex((a) => normaliser(a.nom) === cible);
}

function dessertArret(ligne: Ligne, arret: string): boolean {
  return indexArret(ligne, arret) !== -1;
}

function arretsCommuns(a: Ligne, b: Ligne): string[] {
  return a.arrets_principaux.filter((arret) => dessertArret(b, arret.nom)).map((arret) => arret.nom);
}

function meilleureCorrespondance(
  a: Ligne,
  b: Ligne,
  depart: string,
  arrivee: string,
): string | null {
  const departSurA = indexArret(a, depart);
  const arriveeSurB = indexArret(b, arrivee);

  let retenu: string | null = null;
  let coutRetenu = Number.POSITIVE_INFINITY;

  for (const arret of arretsCommuns(a, b)) {
    const cout =
      Math.abs(indexArret(a, arret) - departSurA) + Math.abs(arriveeSurB - indexArret(b, arret));
    if (cout < coutRetenu) {
      coutRetenu = cout;
      retenu = arret;
    }
  }

  return retenu;
}

export function segmentDeLigne(
  ligne: Ligne,
  montee: string,
  descente: string,
): ArretPrincipal[] | null {
  const debut = indexArret(ligne, montee);
  const fin = indexArret(ligne, descente);
  if (debut === -1 || fin === -1) return null;

  const tranche = ligne.arrets_principaux.slice(Math.min(debut, fin), Math.max(debut, fin) + 1);
  return debut <= fin ? tranche : [...tranche].reverse();
}

function construireEtape(ligne: Ligne, montee: string, descente: string): EtapeTrajet | null {
  const arrets = segmentDeLigne(ligne, montee, descente);
  if (arrets === null || arrets.length === 0) return null;

  return {
    ligne,
    arrets,
    montee: arrets[0].nom,
    descente: arrets[arrets.length - 1].nom,
  };
}

function construireEtapes(
  lignesDuTrajet: Ligne[],
  depart: string,
  arrivee: string,
  correspondance: string | null,
): EtapeTrajet[] {
  if (lignesDuTrajet.length === 1) {
    const etape = construireEtape(lignesDuTrajet[0], depart, arrivee);
    return etape === null ? [] : [etape];
  }

  if (correspondance === null) return [];

  const premiere = construireEtape(lignesDuTrajet[0], depart, correspondance);
  const seconde = construireEtape(lignesDuTrajet[1], correspondance, arrivee);
  return premiere === null || seconde === null ? [] : [premiere, seconde];
}

export function nombreDArrets(etapes: EtapeTrajet[]): number {
  if (etapes.length === 0) return 0;
  return etapes.reduce(
    (total, etape, index) => total + etape.arrets.length - (index > 0 ? 1 : 0),
    0,
  );
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
  if (memeArret(depart, arrivee)) {
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
        etapes: construireEtapes([ligne], depart, arrivee, null),
      });
    }
  }

  const optionsCorrespondance: OptionTrajet[] = [];
  for (const ligneA of lignesDepart) {
    for (const ligneB of lignesArrivee) {
      if (ligneA.id === ligneB.id) continue;
      const communs = arretsCommuns(ligneA, ligneB);
      const sontConnectees =
        (ligneA.correspondances_possibles ?? []).includes(ligneB.id) ||
        (ligneB.correspondances_possibles ?? []).includes(ligneA.id) ||
        communs.length > 0;
      if (!sontConnectees) continue;

      const dejaTrouvee = optionsCorrespondance.some(
        (o) =>
          (o.lignes[0].id === ligneA.id && o.lignes[1].id === ligneB.id) ||
          (o.lignes[0].id === ligneB.id && o.lignes[1].id === ligneA.id),
      );
      if (dejaTrouvee) continue;

      const correspondance = meilleureCorrespondance(ligneA, ligneB, depart, arrivee);
      if (
        correspondance !== null &&
        (memeArret(correspondance, depart) || memeArret(correspondance, arrivee))
      ) {
        continue;
      }

      optionsCorrespondance.push({
        lignes: [ligneA, ligneB],
        arretCorrespondance: correspondance,
        tarifTotal: obtenirTarif(ligneA) + obtenirTarif(ligneB),
        etapes: construireEtapes([ligneA, ligneB], depart, arrivee, correspondance),
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
