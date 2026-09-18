import { describe, expect, it } from 'vitest';
import {
  estArretConnu,
  lignesDesservantArret,
  normaliser,
  rechercherTrajets,
  suggererArrets,
  tousLesArrets,
} from '../src/lib/search-engine';
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

describe('lignesDesservantArret', () => {
  it('retrouve toutes les lignes passant par un arret partage', () => {
    const ids = lignesDesservantArret('Marché Moungali', lignes).map((l) => l.id);

    expect(ids).toContain('L01');
    expect(ids).toContain('L03');
  });

  it('ignore la casse et les espaces autour du nom', () => {
    const ids = lignesDesservantArret('  marché moungali ', lignes).map((l) => l.id);

    expect(ids).toEqual(lignesDesservantArret('Marché Moungali', lignes).map((l) => l.id));
  });

  it('renvoie une liste vide pour un arret inconnu', () => {
    expect(lignesDesservantArret('Arret inexistant', lignes)).toEqual([]);
  });
});

describe('suggestions par prefixe (saisie assistee)', () => {
  it('« ma » sort les arrets dont un mot commence par ma', () => {
    const suggestions = suggererArrets('ma', lignes);

    expect(suggestions).toContain('Marché Moungali');
    expect(suggestions).toContain('Makiémba');
    expect(suggestions).toContain('Mazala');
    expect(suggestions).toContain('La Mairie');
  });

  it('un fragment au milieu d un mot ne suggere rien', () => {
    expect(suggererArrets('oto', lignes)).toEqual([]);
  });

  it('un mot interieur compte comme un debut', () => {
    const suggestions = suggererArrets('moun', lignes);

    expect(suggestions).toContain('Rond-point Moungali');
    expect(suggestions).toContain('Marché Moungali');
  });

  it('les arrets commencant vraiment par la requete passent devant', () => {
    const suggestions = suggererArrets('ma', lignes);

    expect(suggestions.indexOf('Marché Total')).toBeLessThan(suggestions.indexOf('La Mairie'));
  });

  it('ne suggere jamais un arret absent des donnees', () => {
    const tousLesArrets = new Set(lignes.flatMap((l) => l.arrets_principaux.map((a) => a.nom)));

    for (const suggestion of suggererArrets('', lignes)) {
      expect(tousLesArrets.has(suggestion)).toBe(true);
    }
  });
});

describe('insensibilite aux accents', () => {
  it('normaliser retire les accents et la casse', () => {
    expect(normaliser('  Marché Talangaï ')).toBe('marche talangai');
  });

  it('la suggestion donne le meme resultat avec et sans accent', () => {
    expect(suggererArrets('marche', lignes)).toEqual(suggererArrets('marché', lignes));
  });

  it('un trajet saisi sans accent aboutit comme avec accent', () => {
    const sansAccent = rechercherTrajets('Marche Moungali', 'La Gare', lignes);
    const avecAccent = rechercherTrajets('Marché Moungali', 'La Gare', lignes);

    expect(sansAccent.statut).toBe('resultats');
    expect(sansAccent.statut).toBe(avecAccent.statut);
    expect(sansAccent.options.length).toBe(avecAccent.options.length);
  });

  it('lignesDesservantArret ignore aussi les accents', () => {
    expect(lignesDesservantArret('marche moungali', lignes).map((l) => l.id)).toEqual(
      lignesDesservantArret('Marché Moungali', lignes).map((l) => l.id),
    );
  });
});

describe('estArretConnu — la recherche n accepte que la base', () => {
  const arrets = tousLesArrets(lignes);

  it('reconnait un arret reel, accents ou pas', () => {
    expect(estArretConnu('Marché Moungali', arrets)).toBe(true);
    expect(estArretConnu('marche moungali', arrets)).toBe(true);
    expect(estArretConnu('  MARCHE MOUNGALI  ', arrets)).toBe(true);
  });

  it('refuse une saisie libre qui ne correspond a aucun arret', () => {
    expect(estArretConnu('Chez ma tante', arrets)).toBe(false);
    expect(estArretConnu('Marché', arrets)).toBe(false);
    expect(estArretConnu('', arrets)).toBe(false);
    expect(estArretConnu('   ', arrets)).toBe(false);
  });

  it('tousLesArrets ne contient aucun doublon', () => {
    expect(new Set(arrets).size).toBe(arrets.length);
  });
});
