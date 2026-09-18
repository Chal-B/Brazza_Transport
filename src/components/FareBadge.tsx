import { useEffect, useState } from 'preact/hooks';
import { estimerTarif } from '../lib/pricing';
import type { ContexteTarifaire, EstimationTarif } from '../lib/pricing';
import type { ConfigGlobale, Ligne } from '../lib/types';

interface Props {
  ligne: Ligne;
  config: ConfigGlobale;
}

const LIBELLE_COURT: Record<ContexteTarifaire, string> = {
  normal: 'Tarif normal',
  heure_pointe: 'Heure de pointe',
  crise_carburant: 'Crise carburant',
};

export default function FareBadge({ ligne, config }: Props) {
  const [estimation, setEstimation] = useState<EstimationTarif | null>(null);

  useEffect(() => {
    const rafraichir = () => setEstimation(estimerTarif(ligne, config, new Date()));
    rafraichir();
    const minuteur = setInterval(rafraichir, 60_000);
    return () => clearInterval(minuteur);
  }, [ligne, config]);

  if (estimation === null) {
    return (
      <div class="tarif-actuel">
        <p class="titre-bloc">En ce moment</p>
        <div class="attente-tarif" role="status">
          <span class="sr-only">Calcul du tarif en cours</span>
        </div>
      </div>
    );
  }

  return (
    <div class="tarif-actuel" aria-live="polite">
      <div class="tarif-actuel-corps">
        <p class="titre-bloc">En ce moment</p>
        <strong class="montant-actuel">{estimation.fcfa} FCFA</strong>
        <span class={`badge badge-${estimation.badge} contexte-actuel`}>
          {LIBELLE_COURT[estimation.contexte]}
        </span>
      </div>
    </div>
  );
}
