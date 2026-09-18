import { describe, expect, it } from 'vitest';
import {
  CONTACT_MAX,
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  LIBELLE_MOTIF,
  MOTIFS,
  brouillonVide,
  estMotifConnu,
  validerSignalement,
} from '../src/lib/signalement';
import { getToutesLesLignes } from '../src/lib/lignes';

const idsConnus = getToutesLesLignes().map((ligne) => ligne.id);

function brouillon(surcharge: Partial<ReturnType<typeof brouillonVide>> = {}) {
  return {
    ...brouillonVide(),
    description: 'Le receveur demande 300 FCFA au lieu de 150 le matin.',
    ...surcharge,
  };
}

describe('US-05 scenario 1 — signalement valide', () => {
  it('accepte un motif, une ligne et une description', () => {
    const resultat = validerSignalement(
      brouillon({ motif: 'tronconnage_abusif', ligneId: 'L01' }),
      idsConnus,
    );

    expect(resultat.ok).toBe(true);
    if (!resultat.ok) return;
    expect(resultat.valeur.motif).toBe('tronconnage_abusif');
    expect(resultat.valeur.ligne_id).toBe('L01');
    expect(resultat.valeur.description).toContain('300 FCFA');
  });

  it('normalise en null les champs optionnels laisses vides', () => {
    const resultat = validerSignalement(brouillon({ ligneId: '  ', contact: '   ' }), idsConnus);

    expect(resultat.ok).toBe(true);
    if (!resultat.ok) return;
    expect(resultat.valeur.ligne_id).toBeNull();
    expect(resultat.valeur.contact).toBeNull();
  });

  it('conserve un contact renseigne', () => {
    const resultat = validerSignalement(brouillon({ contact: '06 000 00 00' }), idsConnus);

    expect(resultat.ok).toBe(true);
    if (!resultat.ok) return;
    expect(resultat.valeur.contact).toBe('06 000 00 00');
  });
});

describe('Motifs', () => {
  it('chaque motif a un libelle affichable', () => {
    for (const motif of MOTIFS) {
      expect(LIBELLE_MOTIF[motif].length).toBeGreaterThan(0);
    }
  });

  it('refuse un motif invente', () => {
    expect(estMotifConnu('vol_de_sac')).toBe(false);

    const resultat = validerSignalement(brouillon({ motif: 'vol_de_sac' }), idsConnus);

    expect(resultat.ok).toBe(false);
    if (resultat.ok) return;
    expect(resultat.erreurs.motif).toBeDefined();
  });
});

describe('Description obligatoire', () => {
  it('refuse une description vide', () => {
    const resultat = validerSignalement(brouillon({ description: '' }), idsConnus);

    expect(resultat.ok).toBe(false);
    if (resultat.ok) return;
    expect(resultat.erreurs.description).toBeDefined();
  });

  it('refuse une description trop courte', () => {
    const resultat = validerSignalement(
      brouillon({ description: 'a'.repeat(DESCRIPTION_MIN - 1) }),
      idsConnus,
    );

    expect(resultat.ok).toBe(false);
  });

  it('refuse une description trop longue', () => {
    const resultat = validerSignalement(
      brouillon({ description: 'a'.repeat(DESCRIPTION_MAX + 1) }),
      idsConnus,
    );

    expect(resultat.ok).toBe(false);
    if (resultat.ok) return;
    expect(resultat.erreurs.description).toContain('trop longue');
  });

  it('ne compte pas les espaces autour', () => {
    const resultat = validerSignalement(
      brouillon({ description: `   ${'a'.repeat(DESCRIPTION_MIN - 2)}   ` }),
      idsConnus,
    );

    expect(resultat.ok).toBe(false);
  });
});

describe('Ligne concernee', () => {
  it('accepte l absence de ligne, le champ est optionnel', () => {
    expect(validerSignalement(brouillon({ ligneId: '' }), idsConnus).ok).toBe(true);
  });

  it('refuse un identifiant de ligne absent des donnees', () => {
    const resultat = validerSignalement(brouillon({ ligneId: 'L99' }), idsConnus);

    expect(resultat.ok).toBe(false);
    if (resultat.ok) return;
    expect(resultat.erreurs.ligneId).toBeDefined();
  });

  it('accepte chaque ligne reellement presente dans lignes.json', () => {
    for (const id of idsConnus) {
      expect(validerSignalement(brouillon({ ligneId: id }), idsConnus).ok).toBe(true);
    }
  });
});

describe('Contact', () => {
  it('refuse un contact trop long', () => {
    const resultat = validerSignalement(
      brouillon({ contact: 'a'.repeat(CONTACT_MAX + 1) }),
      idsConnus,
    );

    expect(resultat.ok).toBe(false);
    if (resultat.ok) return;
    expect(resultat.erreurs.contact).toBeDefined();
  });
});

describe('Brouillon initial', () => {
  it('part sur un motif valide et peut etre pre-rempli avec une ligne', () => {
    const vide = brouillonVide('L03');

    expect(estMotifConnu(vide.motif)).toBe(true);
    expect(vide.ligneId).toBe('L03');
    expect(vide.description).toBe('');
    expect(vide.contact).toBe('');
  });
});
