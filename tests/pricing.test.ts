import { describe, expect, it } from 'vitest';
import { creerObtenirTarif, estEnHeureDePointe, estimerTarif } from '../src/lib/pricing';
import { getConfigGlobale, getLigneParId, getToutesLesLignes } from '../src/lib/lignes';
import { rechercherTrajets } from '../src/lib/search-engine';
import type { ConfigGlobale, Ligne } from '../src/lib/types';

const lignes = getToutesLesLignes();

const criseInactive: ConfigGlobale = { isFuelCrisisActive: false, alertes_reseau: [] };
const criseActive: ConfigGlobale = { isFuelCrisisActive: true, alertes_reseau: [] };

function ligne(id: string): Ligne {
  const trouvee = getLigneParId(id);
  if (!trouvee) throw new Error(`Ligne ${id} absente de lignes.json`);
  return trouvee;
}

function le(heure: number, minute: number): Date {
  return new Date(2026, 8, 18, heure, minute);
}

describe('US-03 scenario 1 — heure creuse', () => {
  it('L01 a 11h00 hors crise affiche le tarif normal avec un badge vert', () => {
    const estimation = estimerTarif(ligne('L01'), criseInactive, le(11, 0));

    expect(estimation.fcfa).toBe(150);
    expect(estimation.contexte).toBe('normal');
    expect(estimation.majoration).toBe(false);
    expect(estimation.badge).toBe('frais');
    expect(estimation.libelle).toBe('Tarif normal');
  });
});

describe('US-03 scenario 2 — heure de pointe sur une ligne AVEC tronconnage', () => {
  it('L01 a 17h30 affiche le tarif majore avec un badge orange', () => {
    const estimation = estimerTarif(ligne('L01'), criseInactive, le(17, 30));

    expect(estimation.fcfa).toBe(300);
    expect(estimation.contexte).toBe('heure_pointe');
    expect(estimation.majoration).toBe(true);
    expect(estimation.badge).toBe('pointe');
    expect(estimation.libelle).toBe('Tarif heure de pointe (tronçonnage constaté)');
  });
});

describe('US-03 scenario 2bis — heure de pointe sur une ligne SANS tronconnage', () => {
  it('L02 a 17h30 reste a 150 FCFA sans badge d alerte tarifaire', () => {
    const estimation = estimerTarif(ligne('L02'), criseInactive, le(17, 30));

    expect(estimation.fcfa).toBe(150);
    expect(estimation.majoration).toBe(false);
    expect(estimation.badge).toBe('frais');
    expect(estimation.libelle).toBe('Tarif normal');
  });

  it('signale quand meme le creneau de pointe et la note terrain neutre', () => {
    const estimation = estimerTarif(ligne('L02'), criseInactive, le(17, 30));

    expect(estimation.contexte).toBe('heure_pointe');
    expect(estimation.note).toContain('tarif stable');
  });

  it('aucune ligne sans majoration enregistree ne recoit de badge pointe', () => {
    for (const l of lignes) {
      const heurePointe = l.tarification.heure_pointe;
      if (!heurePointe) continue;
      const [creneau] = heurePointe.creneaux;
      const debut = creneau.debut.split(':').map(Number);
      const estimation = estimerTarif(l, criseInactive, le(debut[0], debut[1]));

      if (heurePointe.fcfa === l.tarification.normal.jour_fcfa) {
        expect(estimation.badge).toBe('frais');
        expect(estimation.fcfa).toBe(l.tarification.normal.jour_fcfa);
      } else {
        expect(estimation.badge).toBe('pointe');
      }
    }
  });
});

describe('US-03 scenario 3 — mode crise carburant', () => {
  it('L01 en crise affiche 450 FCFA avec un badge rouge', () => {
    const estimation = estimerTarif(ligne('L01'), criseActive, le(11, 0));

    expect(estimation.fcfa).toBe(450);
    expect(estimation.contexte).toBe('crise_carburant');
    expect(estimation.majoration).toBe(true);
    expect(estimation.badge).toBe('alerte');
    expect(estimation.libelle).toBe('Tarif crise carburant');
  });

  it('les deux niveaux de tarif de crise releves sur le terrain coexistent', () => {
    expect(estimerTarif(ligne('L01'), criseActive, le(11, 0)).fcfa).toBe(450);
    expect(estimerTarif(ligne('L05'), criseActive, le(11, 0)).fcfa).toBe(450);
    expect(estimerTarif(ligne('L06'), criseActive, le(11, 0)).fcfa).toBe(300);
    expect(estimerTarif(ligne('L08'), criseActive, le(11, 0)).fcfa).toBe(300);
  });

  it('la crise prime sur le creneau de pointe', () => {
    const estimation = estimerTarif(ligne('L01'), criseActive, le(17, 30));

    expect(estimation.contexte).toBe('crise_carburant');
    expect(estimation.fcfa).toBe(450);
  });

  it('le booleen global pilote seul le basculement, ligne par ligne', () => {
    for (const l of lignes) {
      const enCrise = estimerTarif(l, criseActive, le(13, 0));
      const horsCrise = estimerTarif(l, criseInactive, le(13, 0));

      expect(enCrise.fcfa).toBe(l.tarification.crise_carburant?.fcfa ?? l.tarification.normal.jour_fcfa);
      expect(horsCrise.fcfa).toBe(l.tarification.normal.jour_fcfa);
    }
  });
});

describe('creneaux propres a chaque ligne, jamais codes en dur', () => {
  it('L07 est en pointe a 09h30 grace a son creneau matinal atypique 08h00-11h00', () => {
    const estimation = estimerTarif(ligne('L07'), criseInactive, le(9, 30));

    expect(estimation.contexte).toBe('heure_pointe');
    expect(estimation.fcfa).toBe(300);
  });

  it('a la meme heure, L01 est deja revenue au tarif normal', () => {
    const estimation = estimerTarif(ligne('L01'), criseInactive, le(9, 30));

    expect(estimation.contexte).toBe('normal');
    expect(estimation.fcfa).toBe(150);
  });

  it('les bornes du creneau sont incluses', () => {
    expect(estEnHeureDePointe(ligne('L01'), le(7, 0))).toBe(true);
    expect(estEnHeureDePointe(ligne('L01'), le(9, 0))).toBe(true);
    expect(estEnHeureDePointe(ligne('L01'), le(9, 1))).toBe(false);
    expect(estEnHeureDePointe(ligne('L01'), le(6, 59))).toBe(false);
  });

  it('toutes les lignes sont au tarif normal a 13h00', () => {
    for (const l of lignes) {
      expect(estimerTarif(l, criseInactive, le(13, 0)).contexte).toBe('normal');
    }
  });
});

describe('tarification absente des donnees', () => {
  it('une ligne sans creneau ni tarif de crise retombe sur le tarif normal', () => {
    const sansTarifsVariables: Ligne = {
      ...ligne('L01'),
      tarification: { normal: { jour_fcfa: 150 } },
    };

    expect(estimerTarif(sansTarifsVariables, criseActive, le(17, 30)).fcfa).toBe(150);
    expect(estimerTarif(sansTarifsVariables, criseInactive, le(17, 30)).badge).toBe('frais');
  });
});

describe('branchement sur le moteur de recherche (#2)', () => {
  it('creerObtenirTarif respecte la signature ObtenirTarif', () => {
    const obtenirTarif = creerObtenirTarif(criseInactive, le(17, 30));
    expect(obtenirTarif(ligne('L01'))).toBe(300);
    expect(obtenirTarif(ligne('L02'))).toBe(150);
  });

  it('rechercherTrajets calcule un tarif de crise sans modification du moteur', () => {
    const resultat = rechercherTrajets(
      'CHU-B',
      'Texaco',
      lignes,
      creerObtenirTarif(criseActive, le(11, 0)),
    );

    expect(resultat.options[0].lignes.map((l) => l.id)).toEqual(['L03']);
    expect(resultat.options[0].tarifTotal).toBe(300);
  });

  it('un trajet a correspondance additionne les deux tarifs dynamiques', () => {
    const resultat = rechercherTrajets(
      'Marché Poto-Poto',
      'Marché Moukondo',
      lignes,
      creerObtenirTarif(criseInactive, le(17, 30)),
    );

    const option = resultat.options.find(
      (o) => o.lignes.map((l) => l.id).sort().join(',') === 'L01,L08',
    );
    expect(option?.tarifTotal).toBe(600);
  });
});

describe('config_globale.json livree', () => {
  it('expose isFuelCrisisActive comme un booleen', () => {
    expect(typeof getConfigGlobale().isFuelCrisisActive).toBe('boolean');
  });
});
