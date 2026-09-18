export const MOTIFS = [
  'tronconnage_abusif',
  'tarif_incorrect',
  'ligne_arret_incorrect',
  'ligne_supprimee',
  'autre',
] as const;

export type MotifSignalement = (typeof MOTIFS)[number];

export const LIBELLE_MOTIF: Record<MotifSignalement, string> = {
  tronconnage_abusif: 'Tronçonnage abusif',
  tarif_incorrect: 'Tarif incorrect',
  ligne_arret_incorrect: 'Ligne ou arrêt incorrect',
  ligne_supprimee: 'La ligne n’existe plus',
  autre: 'Autre',
};

export const DESCRIPTION_MIN = 10;
export const DESCRIPTION_MAX = 2000;
export const CONTACT_MAX = 120;

export type StatutSignalement = 'nouveau' | 'traite';

export interface BrouillonSignalement {
  motif: string;
  ligneId: string;
  description: string;
  contact: string;
}

export interface SignalementValide {
  motif: MotifSignalement;
  ligne_id: string | null;
  description: string;
  contact: string | null;
}

export type ChampSignalement = 'motif' | 'ligneId' | 'description' | 'contact';

export type ResultatValidation =
  | { ok: true; valeur: SignalementValide }
  | { ok: false; erreurs: Partial<Record<ChampSignalement, string>> };

export function estMotifConnu(valeur: string): valeur is MotifSignalement {
  return (MOTIFS as readonly string[]).includes(valeur);
}

export function brouillonVide(ligneId = ''): BrouillonSignalement {
  return { motif: MOTIFS[0], ligneId, description: '', contact: '' };
}

export function validerSignalement(
  brouillon: BrouillonSignalement,
  idsDeLigneConnus: string[],
): ResultatValidation {
  const erreurs: Partial<Record<ChampSignalement, string>> = {};

  const motif = brouillon.motif.trim();
  if (!estMotifConnu(motif)) {
    erreurs.motif = 'Choisissez un motif dans la liste.';
  }

  const ligneId = brouillon.ligneId.trim();
  if (ligneId.length > 0 && !idsDeLigneConnus.includes(ligneId)) {
    erreurs.ligneId = 'Cette ligne n’existe pas dans les données.';
  }

  const description = brouillon.description.trim();
  if (description.length < DESCRIPTION_MIN) {
    erreurs.description = `Décrivez ce que vous avez constaté, en ${DESCRIPTION_MIN} caractères au moins.`;
  } else if (description.length > DESCRIPTION_MAX) {
    erreurs.description = `Description trop longue, ${DESCRIPTION_MAX} caractères au maximum.`;
  }

  const contact = brouillon.contact.trim();
  if (contact.length > CONTACT_MAX) {
    erreurs.contact = `Contact trop long, ${CONTACT_MAX} caractères au maximum.`;
  }

  if (Object.keys(erreurs).length > 0) {
    return { ok: false, erreurs };
  }

  return {
    ok: true,
    valeur: {
      motif: motif as MotifSignalement,
      ligne_id: ligneId.length > 0 ? ligneId : null,
      description,
      contact: contact.length > 0 ? contact : null,
    },
  };
}
