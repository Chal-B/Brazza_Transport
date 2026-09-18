import { useState } from 'preact/hooks';

interface Props {
  quartiers: string[];
}

const TOUS = 'Tous les quartiers';

export default function LineFilter({ quartiers }: Props) {
  const [actif, setActif] = useState(TOUS);

  const choisir = (quartier: string) => {
    setActif(quartier);
    const cartes = document.querySelectorAll<HTMLElement>('[data-quartiers]');
    for (const carte of cartes) {
      const dessert = quartier === TOUS || carte.dataset.quartiers?.split('|').includes(quartier);
      carte.hidden = !dessert;
    }
  };

  return (
    <div class="filtres" role="group" aria-label="Filtrer par quartier">
      {[TOUS, ...quartiers].map((quartier) => (
        <button
          key={quartier}
          type="button"
          class="pilule"
          aria-pressed={actif === quartier}
          onClick={() => choisir(quartier)}
        >
          {quartier}
        </button>
      ))}
    </div>
  );
}
