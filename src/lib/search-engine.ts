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
  correspondances: string[];
  tarifTotal: number;
  etapes: EtapeTrajet[];
}

export type StatutRecherche = 'resultats' | 'aucun_resultat' | 'meme_arret';

export interface ResultatRecherche {
  statut: StatutRecherche;
  options: OptionTrajet[];
  nbResultatsPourLog: number;
}

const MAX_OPTIONS = 4;
const MAX_SEQUENCES_EXPLOREES = 400;

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

function construireVoisinages(lignes: Ligne[]): Map<string, Ligne[]> {
  const voisinages = new Map<string, Ligne[]>();

  for (const ligne of lignes) {
    voisinages.set(
      ligne.id,
      lignes.filter((autre) => autre.id !== ligne.id && arretsCommuns(ligne, autre).length > 0),
    );
  }

  return voisinages;
}

function sequencesMinimales(depart: string, arrivee: string, lignes: Ligne[]): Ligne[][] {
  const lignesDepart = lignes.filter((ligne) => dessertArret(ligne, depart));
  const idsArrivee = new Set(
    lignes.filter((ligne) => dessertArret(ligne, arrivee)).map((ligne) => ligne.id),
  );
  if (lignesDepart.length === 0 || idsArrivee.size === 0) return [];

  const voisinages = construireVoisinages(lignes);
  const distance = new Map<string, number>();
  let front = lignesDepart;
  for (const ligne of front) distance.set(ligne.id, 1);

  let profondeurArrivee = 0;
  while (front.length > 0 && profondeurArrivee === 0) {
    const suivant: Ligne[] = [];
    for (const ligne of front) {
      if (idsArrivee.has(ligne.id)) {
        profondeurArrivee = distance.get(ligne.id) as number;
        break;
      }
      for (const voisine of voisinages.get(ligne.id) ?? []) {
        if (distance.has(voisine.id)) continue;
        distance.set(voisine.id, (distance.get(ligne.id) as number) + 1);
        suivant.push(voisine);
      }
    }
    if (profondeurArrivee !== 0) break;
    front = suivant;
  }

  if (profondeurArrivee === 0) return [];

  const sequences: Ligne[][] = [];
  const parcourir = (chemin: Ligne[]) => {
    if (sequences.length >= MAX_SEQUENCES_EXPLOREES) return;
    const derniere = chemin[chemin.length - 1];

    if (chemin.length === profondeurArrivee) {
      if (idsArrivee.has(derniere.id)) sequences.push(chemin);
      return;
    }

    for (const voisine of voisinages.get(derniere.id) ?? []) {
      if (distance.get(voisine.id) !== chemin.length + 1) continue;
      parcourir([...chemin, voisine]);
    }
  };

  for (const ligne of lignesDepart) {
    if (distance.get(ligne.id) === 1) parcourir([ligne]);
  }

  return sequences;
}

function correspondancesLesPlusCourtes(
  sequence: Ligne[],
  depart: string,
  arrivee: string,
): string[] | null {
  if (sequence.length === 1) {
    return indexArret(sequence[0], depart) === indexArret(sequence[0], arrivee) ? null : [];
  }

  let etats = new Map<string, { cout: number; arrets: string[] }>();
  for (const arret of arretsCommuns(sequence[0], sequence[1])) {
    const cout = Math.abs(indexArret(sequence[0], arret) - indexArret(sequence[0], depart));
    if (cout === 0) continue;
    const connu = etats.get(arret);
    if (connu === undefined || cout < connu.cout) etats.set(arret, { cout, arrets: [arret] });
  }

  for (let rang = 1; rang < sequence.length - 1; rang += 1) {
    const suivants = new Map<string, { cout: number; arrets: string[] }>();

    for (const [precedent, etat] of etats) {
      for (const arret of arretsCommuns(sequence[rang], sequence[rang + 1])) {
        const trajet = Math.abs(
          indexArret(sequence[rang], arret) - indexArret(sequence[rang], precedent),
        );
        if (trajet === 0) continue;
        const cout = etat.cout + trajet;
        const connu = suivants.get(arret);
        if (connu === undefined || cout < connu.cout) {
          suivants.set(arret, { cout, arrets: [...etat.arrets, arret] });
        }
      }
    }

    etats = suivants;
  }

  const derniere = sequence[sequence.length - 1];
  let retenu: string[] | null = null;
  let coutRetenu = Number.POSITIVE_INFINITY;

  for (const [precedent, etat] of etats) {
    const trajet = Math.abs(indexArret(derniere, arrivee) - indexArret(derniere, precedent));
    if (trajet === 0) continue;
    const cout = etat.cout + trajet;
    if (cout < coutRetenu) {
      coutRetenu = cout;
      retenu = etat.arrets;
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

function construireEtapes(
  sequence: Ligne[],
  depart: string,
  arrivee: string,
  correspondances: string[],
): EtapeTrajet[] {
  const jalons = [depart, ...correspondances, arrivee];
  const etapes: EtapeTrajet[] = [];

  for (const [rang, ligne] of sequence.entries()) {
    const arrets = segmentDeLigne(ligne, jalons[rang], jalons[rang + 1]);
    if (arrets === null || arrets.length < 2) return [];
    etapes.push({
      ligne,
      arrets,
      montee: arrets[0].nom,
      descente: arrets[arrets.length - 1].nom,
    });
  }

  return etapes;
}

export function arretsParcourus(etapes: EtapeTrajet[]): string[] {
  return etapes.flatMap((etape, rang) =>
    etape.arrets.slice(rang > 0 ? 1 : 0).map((arret) => arret.nom),
  );
}

export function nombreDArrets(etapes: EtapeTrajet[]): number {
  return arretsParcourus(etapes).length;
}

function repasseParLeMemeArret(etapes: EtapeTrajet[]): boolean {
  const visites = arretsParcourus(etapes).map(normaliser);
  return new Set(visites).size !== visites.length;
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

  const options: OptionTrajet[] = [];
  const vues = new Set<string>();

  for (const sequence of sequencesMinimales(depart, arrivee, lignes)) {
    const correspondances = correspondancesLesPlusCourtes(sequence, depart, arrivee);
    if (correspondances === null) continue;

    const etapes = construireEtapes(sequence, depart, arrivee, correspondances);
    if (etapes.length === 0 || repasseParLeMemeArret(etapes)) continue;

    const signature = etapes.map((etape) => `${etape.ligne.id}:${etape.montee}`).join('>');
    if (vues.has(signature)) continue;
    vues.add(signature);

    options.push({
      lignes: sequence,
      correspondances,
      tarifTotal: sequence.reduce((total, ligne) => total + obtenirTarif(ligne), 0),
      etapes,
    });
  }

  if (options.length === 0) {
    return { statut: 'aucun_resultat', options: [], nbResultatsPourLog: 0 };
  }

  options.sort(
    (a, b) =>
      a.lignes.length - b.lignes.length ||
      a.tarifTotal - b.tarifTotal ||
      nombreDArrets(a.etapes) - nombreDArrets(b.etapes),
  );

  const retenues = options.slice(0, MAX_OPTIONS);
  return { statut: 'resultats', options: retenues, nbResultatsPourLog: retenues.length };
}
