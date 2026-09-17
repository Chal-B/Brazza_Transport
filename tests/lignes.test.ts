import { describe, expect, it } from 'vitest';
import {
  getAlertesActives,
  getConfigGlobale,
  getLigneParId,
  getTarifsReference,
  getToutesLesLignes,
} from '../src/lib/lignes';

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
