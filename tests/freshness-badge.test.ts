import { describe, expect, it } from 'vitest';
import { badgeFraicheurDeLigne, calculerBadgeFraicheur, formaterDate } from '../src/lib/freshness-badge';
import { getToutesLesLignes } from '../src/lib/lignes';

const maintenant = new Date('2026-09-18T12:00:00Z');

function ilYA(heures: number): string {
  return new Date(maintenant.getTime() - heures * 60 * 60 * 1000).toISOString();
}

describe('US-01 scenario 2 — badge de fraicheur', () => {
  it('affiche un badge vert "moins de 24h" pour une verification de ce matin', () => {
    const badge = calculerBadgeFraicheur(ilYA(3), 'verifie', maintenant);

    expect(badge.etat).toBe('frais_24h');
    expect(badge.classe).toBe('badge-frais');
    expect(badge.libelle).toBe('Vérifié il y a moins de 24h');
  });

  it('expose la date du dernier releve terrain a cote du libelle', () => {
    const badge = calculerBadgeFraicheur('2026-09-18', 'verifie', maintenant);

    expect(badge.dateFormatee).toBe('18 septembre 2026');
  });
});

describe('Bareme PRD 7.3', () => {
  it('date manquante — badge gris', () => {
    const badge = calculerBadgeFraicheur(null, 'verifie', maintenant);

    expect(badge.etat).toBe('inconnu');
    expect(badge.classe).toBe('badge-inconnu');
    expect(badge.libelle).toBe('Date de vérification à confirmer');
    expect(badge.dateFormatee).toBeNull();
  });

  it('moins de 30 jours — badge vert date', () => {
    const badge = calculerBadgeFraicheur('2026-09-01', 'verifie', maintenant);

    expect(badge.etat).toBe('frais');
    expect(badge.classe).toBe('badge-frais');
    expect(badge.libelle).toBe('Vérifié le 1 septembre 2026');
  });

  it('plus de 30 jours — badge orange', () => {
    const badge = calculerBadgeFraicheur('2026-07-15', 'verifie', maintenant);

    expect(badge.etat).toBe('a_confirmer');
    expect(badge.classe).toBe('badge-pointe');
    expect(badge.libelle).toBe('Info à confirmer, vérifié le 15 juillet 2026');
  });

  it('statut signale_incorrect — badge rouge', () => {
    const badge = calculerBadgeFraicheur('2026-09-18', 'signale_incorrect', maintenant);

    expect(badge.etat).toBe('incorrect');
    expect(badge.classe).toBe('badge-alerte');
    expect(badge.libelle).toBe('Signalé comme incorrect, en attente de vérification');
  });

  it('signale_incorrect prime sur une date fraiche comme sur une date absente', () => {
    expect(calculerBadgeFraicheur(ilYA(1), 'signale_incorrect', maintenant).classe).toBe('badge-alerte');
    expect(calculerBadgeFraicheur(null, 'signale_incorrect', maintenant).classe).toBe('badge-alerte');
  });

  it('a_verifier suit le bareme des dates, il ne force aucune couleur', () => {
    expect(calculerBadgeFraicheur(ilYA(2), 'a_verifier', maintenant).classe).toBe('badge-frais');
    expect(calculerBadgeFraicheur('2026-01-01', 'a_verifier', maintenant).classe).toBe('badge-pointe');
  });
});

describe('Bornes du bareme', () => {
  it('exactement 24h bascule du libelle "moins de 24h" vers le libelle date', () => {
    expect(calculerBadgeFraicheur(ilYA(23.9), 'verifie', maintenant).etat).toBe('frais_24h');
    expect(calculerBadgeFraicheur(ilYA(24), 'verifie', maintenant).etat).toBe('frais');
  });

  it('exactement 30 jours bascule du vert vers l orange', () => {
    expect(calculerBadgeFraicheur(ilYA(30 * 24 - 1), 'verifie', maintenant).classe).toBe('badge-frais');
    expect(calculerBadgeFraicheur(ilYA(30 * 24), 'verifie', maintenant).classe).toBe('badge-pointe');
  });

  it('une date future reste verte plutot que de produire une anciennete negative', () => {
    expect(calculerBadgeFraicheur(ilYA(-5), 'verifie', maintenant).etat).toBe('frais_24h');
  });

  it('une date illisible est traitee comme une date manquante', () => {
    const badge = calculerBadgeFraicheur('pas-une-date', 'verifie', maintenant);

    expect(badge.etat).toBe('inconnu');
    expect(badge.classe).toBe('badge-inconnu');
  });

  it('une chaine vide est traitee comme une date manquante', () => {
    expect(calculerBadgeFraicheur('   ', 'verifie', maintenant).etat).toBe('inconnu');
  });
});

describe('formaterDate', () => {
  it('formate en francais sans decalage de fuseau', () => {
    expect(formaterDate(new Date('2026-01-01T00:00:00Z'))).toBe('1 janvier 2026');
    expect(formaterDate(new Date('2026-12-31T00:00:00Z'))).toBe('31 décembre 2026');
  });
});

describe('Application au jeu de donnees reel', () => {
  it('chaque ligne de lignes.json produit un badge, quel que soit leur nombre', () => {
    const lignes = getToutesLesLignes();

    expect(lignes.length).toBeGreaterThan(0);
    for (const ligne of lignes) {
      const badge = badgeFraicheurDeLigne(ligne, maintenant);
      expect(badge.libelle.length).toBeGreaterThan(0);
      expect(['badge-frais', 'badge-pointe', 'badge-alerte', 'badge-inconnu']).toContain(badge.classe);
    }
  });

  it('chaque ligne porte une date de releve terrain lisible (#9)', () => {
    for (const ligne of getToutesLesLignes()) {
      expect(ligne.derniere_verification, ligne.id).not.toBeNull();
      expect(Number.isNaN(new Date(ligne.derniere_verification as string).getTime())).toBe(false);
    }
  });

  it('au lendemain du releve du 2026-09-13, les 8 lignes sont vertes', () => {
    const lendemain = new Date('2026-09-14T08:00:00Z');

    for (const ligne of getToutesLesLignes()) {
      expect(badgeFraicheurDeLigne(ligne, lendemain).classe, ligne.id).toBe('badge-frais');
    }
  });
});
