import { describe, expect, it } from 'vitest';
import {
  filtrerAlertesAffichables,
  getAlertesActives,
  getConfigGlobale,
  getLigneParId,
  getTarifsReference,
  getToutesLesLignes,
} from '../src/lib/lignes';
import type { AlerteReseau } from '../src/lib/types';

describe('getToutesLesLignes', () => {
  it("charge les lignes sans supposer un nombre fixe", () => {
    const lignes = getToutesLesLignes();
    expect(lignes.length).toBeGreaterThan(0);
  });

  it('retourne des objets avec tous les champs obligatoires', () => {
    for (const ligne of getToutesLesLignes()) {
      expect(ligne.id).toBeTruthy();
      expect(ligne.nom).toBeTruthy();
      expect(ligne.type).toBe('bus');
      expect(ligne.tarification.normal.jour_fcfa).toBeGreaterThan(0);
      expect(Array.isArray(ligne.arrets_principaux)).toBe(true);
      expect(ligne.arrets_principaux.length).toBeGreaterThan(0);
    }
  });

  it('a des ids de ligne uniques', () => {
    const lignes = getToutesLesLignes();
    const ids = new Set(lignes.map((l) => l.id));
    expect(ids.size).toBe(lignes.length);
  });

  it('a des correspondances symetriques : si A cite B, B cite A', () => {
    const lignes = getToutesLesLignes();
    const parId = new Map(lignes.map((l) => [l.id, new Set(l.correspondances_possibles ?? [])]));
    for (const ligne of lignes) {
      for (const correspondance of ligne.correspondances_possibles ?? []) {
        const inverse = parId.get(correspondance);
        expect(inverse?.has(ligne.id)).toBe(true);
      }
    }
  });
});

describe('getLigneParId', () => {
  it('retrouve une ligne existante par son id', () => {
    const [premiere] = getToutesLesLignes();
    expect(getLigneParId(premiere.id)?.id).toBe(premiere.id);
  });

  it("retourne undefined pour un id qui n'existe pas", () => {
    expect(getLigneParId('LIGNE_INEXISTANTE')).toBeUndefined();
  });
});

describe('getConfigGlobale', () => {
  it('expose isFuelCrisisActive et alertes_reseau', () => {
    const config = getConfigGlobale();
    expect(typeof config.isFuelCrisisActive).toBe('boolean');
    expect(Array.isArray(config.alertes_reseau)).toBe(true);
  });
});

describe('getAlertesActives', () => {
  it('ne retourne que les alertes avec actif=true', () => {
    for (const alerte of getAlertesActives()) {
      expect(alerte.actif).toBe(true);
    }
  });
});

describe('getTarifsReference', () => {
  it('expose une liste de tarifs de reference', () => {
    const { tarifs } = getTarifsReference();
    expect(Array.isArray(tarifs)).toBe(true);
    expect(tarifs.length).toBeGreaterThan(0);
    for (const tarif of tarifs) {
      expect(tarif.tarif_jour_fcfa).toBeGreaterThan(0);
    }
  });

  it("ne contient aucune categorie taxi collectif non verifiee", () => {
    const { tarifs } = getTarifsReference();
    const categories = tarifs.map((t) => t.categorie.toLowerCase());
    expect(categories.some((c) => c.includes('taxi'))).toBe(false);
  });
});

describe('US-04 — le bandeau carburant suit isFuelCrisisActive', () => {
  const alerteCarburant: AlerteReseau = {
    id: 'ALERT-01',
    actif: true,
    type: 'penurie_carburant',
    message: 'Tensions sur le carburant',
    date_debut: null,
    date_fin: null,
  };
  const alerteTravaux: AlerteReseau = {
    id: 'ALERT-02',
    actif: true,
    type: 'travaux',
    message: 'Avenue coupee',
    date_debut: null,
    date_fin: null,
  };

  it('masque l alerte carburant quand la crise n est pas active cote tarifs', () => {
    const affichables = filtrerAlertesAffichables({
      isFuelCrisisActive: false,
      alertes_reseau: [alerteCarburant],
    });

    expect(affichables).toEqual([]);
  });

  it('affiche l alerte carburant quand la crise est active', () => {
    const affichables = filtrerAlertesAffichables({
      isFuelCrisisActive: true,
      alertes_reseau: [alerteCarburant],
    });

    expect(affichables).toHaveLength(1);
  });

  it('laisse passer les autres types d alerte, crise ou pas', () => {
    for (const crise of [true, false]) {
      const affichables = filtrerAlertesAffichables({
        isFuelCrisisActive: crise,
        alertes_reseau: [alerteTravaux],
      });

      expect(affichables.map((a) => a.id)).toEqual(['ALERT-02']);
    }
  });

  it('ignore toujours une alerte inactive', () => {
    const affichables = filtrerAlertesAffichables({
      isFuelCrisisActive: true,
      alertes_reseau: [{ ...alerteCarburant, actif: false }],
    });

    expect(affichables).toEqual([]);
  });
});
