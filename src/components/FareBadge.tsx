import { useEffect, useState } from 'preact/hooks';
import { estimerTarif } from '../lib/pricing';
import type { EstimationTarif } from '../lib/pricing';
import type { ConfigGlobale, Ligne } from '../lib/types';

interface Props {
  ligne: Ligne;
  config: ConfigGlobale;
}

export default function FareBadge({ ligne, config }: Props) {
  const [estimation, setEstimation] = useState<EstimationTarif | null>(null);

  useEffect(() => {
    const rafraichir = () => setEstimation(estimerTarif(ligne, config, new Date()));
    rafraichir();
    const minuteur = setInterval(rafraichir, 60_000);
    return () => clearInterval(minuteur);
  }, [ligne, config]);

  if (estimation === null) {
    return null;
  }

  return (
    <div class="bloc-tarif" aria-live="polite">
      <div>
        <div class="tarif-label">En ce moment</div>
        <div class="tarif-note">{estimation.libelle}</div>
        {estimation.note && <div class="tarif-note">{estimation.note}</div>}
      </div>
      <span class={`badge badge-${estimation.badge}`}>{estimation.fcfa} FCFA</span>
    </div>
  );
}
