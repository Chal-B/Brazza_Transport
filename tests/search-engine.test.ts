import { describe, expect, it } from 'vitest';
import { rechercherTrajets, suggererArrets } from '../src/lib/search-engine';
import { getToutesLesLignes } from '../src/lib/lignes';

const lignes = getToutesLesLignes();

describe('suggererArrets', () => {
  it('retrouve un arret par recherche partielle insensible a la casse', () => {
    const suggestions = suggererArrets('chu', lignes);
    expect(suggestions).toContain('CHU-B');
  });

  it('retourne toutes les valeurs si la recherche est vide', () => {
    expect(suggererArrets('', lignes).length).toBeGreaterThan(0);
  });
});

describe('rechercherTrajets — scenario 1 : recherche avec resultat existant (US-02 sc.1)', () => {
  it('« CHU » ne retourne que les lignes desservant le CHU, triees par tarif croissant', () => {
    const [arretChu] = suggererArrets('chu', lignes);
    const resultat = rechercherTrajets(arretChu, 'Texaco', lignes);

    expect(resultat.statut).toBe('resultats');
    expect(resultat.options).toHaveLength(1);
    expect(resultat.options[0].lignes.map((l) => l.id)).toEqual(['L03']);
    expect(resultat.options[0].arretCorrespondance).toBeNull();
  });

  it('trie les resultats directs avant les resultats a 1 correspondance', () => {
    const resultat = rechercherTrajets('La Gare', 'Marché Moukondo', lignes);
    expect(resultat.statut).toBe('resultats');
    const indexDirect = resultat.options.findIndex((o) => o.lignes.length === 1);
    const indexCorrespondance = resultat.options.findIndex((o) => o.lignes.length === 2);
    if (indexDirect !== -1 && indexCorrespondance !== -1) {
      expect(indexDirect).toBeLessThan(indexCorrespondance);
    }
  });

  it('trie par tarif total croissant', () => {
    const resultat = rechercherTrajets('La Gare', 'Marché Moukondo', lignes);
    const tarifs = resultat.options.map((o) => o.tarifTotal);
    const tries = [...tarifs].sort((a, b) => a - b);
    expect(tarifs).toEqual(tries);
  });
});

describe('rechercherTrajets — scenario 2 : recherche sans resultat (US-02 sc.2)', () => {
  it("un arret non couvert par le corridor retourne le statut aucun_resultat", () => {
    const resultat = rechercherTrajets('La Gare', 'Quartier Inexistant', lignes);
    expect(resultat.statut).toBe('aucun_resultat');
    expect(resultat.options).toHaveLength(0);
    expect(resultat.nbResultatsPourLog).toBe(0);
  });
});

describe('rechercherTrajets — scenario 3 : plus d\'une correspondance necessaire (US-02 sc.3)', () => {
  it('un trajet a 2+ correspondances ne retourne aucune option, avec un log distinct', () => {
    const resultat = rechercherTrajets('La Gare', 'Marché Talangaï', lignes);
    expect(resultat.statut).toBe('trop_de_correspondances');
    expect(resultat.options).toHaveLength(0);
    expect(resultat.nbResultatsPourLog).toBe(-1);
  });
});

describe('rechercherTrajets — scenario 4 : depart = arrivee (US-02 sc.4)', () => {
  it('retourne le statut meme_arret sans chercher de trajet', () => {
    const resultat = rechercherTrajets('La Gare', 'La Gare', lignes);
    expect(resultat.statut).toBe('meme_arret');
    expect(resultat.options).toHaveLength(0);
  });

  it('ignore la casse et les espaces pour detecter le meme arret', () => {
    const resultat = rechercherTrajets('  la gare  ', 'La Gare', lignes);
    expect(resultat.statut).toBe('meme_arret');
  });
});

describe('correspondance a Rond-point Moungali (L01, L07, L08)', () => {
  it('relie L01 et L08 via Rond-point Moungali', () => {
    const resultat = rechercherTrajets('Marché Poto-Poto', 'Marché Moukondo', lignes);
    expect(resultat.statut).toBe('resultats');
    const option = resultat.options.find(
      (o) => o.lignes.map((l) => l.id).sort().join(',') === 'L01,L08',
    );
    expect(option).toBeDefined();
    expect(option?.arretCorrespondance).toBe('Rond-point Moungali');
  });

  it('relie L07 et L08 via Rond-point Moungali', () => {
    const resultat = rechercherTrajets('Marché Total', 'Marché Moukondo', lignes);
    expect(resultat.statut).toBe('resultats');
    const option = resultat.options.find(
      (o) => o.lignes.map((l) => l.id).sort().join(',') === 'L07,L08',
    );
    expect(option).toBeDefined();
  });
});

describe('recherche traversant La Gare — comportement decide en #9', () => {
  it('L01, L02 et L04 sont bien connectees via La Gare, un arret unique normalise', () => {
    const versL02 = rechercherTrajets('La Gare', 'Marché Total', lignes);
    expect(versL02.statut).toBe('resultats');
    expect(versL02.options[0].lignes.map((l) => l.id)).toEqual(['L02']);

    const versL04 = rechercherTrajets('La Gare', 'Hôpital Talangaï', lignes);
    expect(versL04.statut).toBe('resultats');
    expect(versL04.options[0].lignes.map((l) => l.id)).toEqual(['L04']);
  });

  it('L01 et L02 sont detectees comme correspondantes via La Gare', () => {
    const resultat = rechercherTrajets('Marché Poto-Poto', 'SNE', lignes);
    expect(resultat.statut).toBe('resultats');
    const option = resultat.options.find(
      (o) => o.lignes.map((l) => l.id).sort().join(',') === 'L01,L02',
    );
    expect(option).toBeDefined();
    expect(option?.arretCorrespondance).toBe('La Gare');
  });
});

describe('tarif injectable (prepare F4)', () => {
  it('utilise le tarif normal par defaut', () => {
    const resultat = rechercherTrajets('CHU-B', 'Texaco', lignes);
    expect(resultat.options[0].tarifTotal).toBe(150);
  });

  it('accepte un calculateur de tarif personnalise', () => {
    const resultat = rechercherTrajets('CHU-B', 'Texaco', lignes, () => 999);
    expect(resultat.options[0].tarifTotal).toBe(999);
  });
});
