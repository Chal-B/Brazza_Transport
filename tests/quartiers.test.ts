import { describe, expect, it } from 'vitest';
import {
  extraireQuartier,
  ligneDessertQuartier,
  quartiersDeLigne,
  quartiersDistincts,
} from '../src/lib/quartiers';
import { getToutesLesLignes } from '../src/lib/lignes';

describe('extraireQuartier', () => {
  it('retire la precision entre parentheses', () => {
    expect(extraireQuartier('Centre-ville (La Gare)')).toBe('Centre-ville');
    expect(extraireQuartier('Bacongo (Marché Total)')).toBe('Bacongo');
  });

  it('laisse un nom sans precision inchange', () => {
    expect(extraireQuartier('Moungali')).toBe('Moungali');
    expect(extraireQuartier('Marché Talangaï')).toBe('Marché Talangaï');
  });
});

describe('quartiersDeLigne', () => {
  it('renvoie le quartier de depart et d arrivee, dedoublonnes', () => {
    const lignes = getToutesLesLignes();
    const l01 = lignes.find((l) => l.id === 'L01')!;

    expect(quartiersDeLigne(l01)).toEqual(['Centre-ville', 'Moungali']);
  });
});

describe('quartiersDistincts', () => {
  it('fonctionne sur N lignes sans nombre code en dur', () => {
    const lignes = getToutesLesLignes();
    const quartiers = quartiersDistincts(lignes);

    expect(quartiers.length).toBeGreaterThan(0);
    expect(new Set(quartiers).size).toBe(quartiers.length);
  });

  it('est trie alphabetiquement en francais', () => {
    const quartiers = quartiersDistincts(getToutesLesLignes());
    const tries = [...quartiers].sort((a, b) => a.localeCompare(b, 'fr'));

    expect(quartiers).toEqual(tries);
  });

  it('chaque quartier distinct dessert au moins une ligne reelle', () => {
    const lignes = getToutesLesLignes();
    for (const quartier of quartiersDistincts(lignes)) {
      expect(lignes.some((ligne) => ligneDessertQuartier(ligne, quartier))).toBe(true);
    }
  });

  it('sur un jeu de donnees reduit a une seule ligne, ne renvoie que ses deux quartiers', () => {
    const uneLigne = getToutesLesLignes().slice(0, 1);
    expect(quartiersDistincts(uneLigne)).toEqual(quartiersDeLigne(uneLigne[0]).sort((a, b) => a.localeCompare(b, 'fr')));
  });
});

describe('ligneDessertQuartier', () => {
  it('reconnait le quartier de depart et celui d arrivee', () => {
    const l01 = getToutesLesLignes().find((l) => l.id === 'L01')!;

    expect(ligneDessertQuartier(l01, 'Centre-ville')).toBe(true);
    expect(ligneDessertQuartier(l01, 'Moungali')).toBe(true);
  });

  it('refuse un quartier que la ligne ne dessert pas', () => {
    const l01 = getToutesLesLignes().find((l) => l.id === 'L01')!;

    expect(ligneDessertQuartier(l01, 'Bacongo')).toBe(false);
  });
});
