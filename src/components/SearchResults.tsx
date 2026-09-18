import { useEffect, useMemo, useState } from 'preact/hooks';
import { rechercherTrajets } from '../lib/search-engine';
import { creerObtenirTarif } from '../lib/pricing';
import type { ConfigGlobale, Ligne } from '../lib/types';
import type { OptionTrajet, ResultatRecherche } from '../lib/search-engine';

interface Props {
  lignes: Ligne[];
  config: ConfigGlobale;
}

function journaliser(depart: string, arrivee: string, nbResultats: number) {
  try {
    fetch('/api/log-recherche', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ depart, arrivee, nb_resultats: nbResultats }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* le log ne doit jamais empecher l affichage des resultats */
  }
}

function CarteTrajet({ option }: { option: OptionTrajet }) {
  const correspondance = option.lignes.length > 1;

  return (
    <li class="carte carte-trajet">
      <div class="entete-trajet">
        <p class="trajet-ligne">
          {option.lignes.map((ligne, index) => (
            <span key={ligne.id}>
              {index > 0 && <span class="fleche-correspondance"> + </span>}
              <span class="puce-ligne">{ligne.id}</span>
            </span>
          ))}
        </p>
        <span class="badge badge-frais">{option.tarifTotal} FCFA</span>
      </div>

      <p class="sous-texte">
        {correspondance
          ? `1 correspondance · via ${option.arretCorrespondance}`
          : 'Trajet direct, sans correspondance'}
      </p>

      <p class="liens-trajet">
        {option.lignes.map((ligne) => (
          <a key={ligne.id} href={`/lignes/${ligne.id}`} class="bouton-contour">
            {correspondance ? `Voir ${ligne.id}` : 'Voir le détail'}
          </a>
        ))}
      </p>
    </li>
  );
}

function SansResultat({ depart, arrivee }: { depart: string; arrivee: string }) {
  return (
    <div class="carte etat-vide">
      <p class="titre-etat">Aucune ligne trouvée entre {depart} et {arrivee}</p>
      <p class="sous-texte">
        Le corridor documenté ne couvre pas encore ce trajet, ou il demande plus d’une
        correspondance. D’autres axes arrivent bientôt.
      </p>
      <a href="/signalement" class="cta">Signaler une ligne manquante</a>
    </div>
  );
}

export default function SearchResults({ lignes, config }: Props) {
  const [parametres, setParametres] = useState<{ depart: string; arrivee: string } | null>(null);

  useEffect(() => {
    const url = new URLSearchParams(window.location.search);
    setParametres({
      depart: (url.get('depart') ?? '').trim(),
      arrivee: (url.get('arrivee') ?? '').trim(),
    });
  }, []);

  const resultat: ResultatRecherche | null = useMemo(() => {
    if (parametres === null || parametres.depart === '' || parametres.arrivee === '') return null;
    return rechercherTrajets(
      parametres.depart,
      parametres.arrivee,
      lignes,
      creerObtenirTarif(config),
    );
  }, [parametres, lignes, config]);

  useEffect(() => {
    if (parametres === null || resultat === null) return;
    journaliser(parametres.depart, parametres.arrivee, resultat.nbResultatsPourLog);
  }, [parametres, resultat]);

  if (parametres === null) {
    return <p class="sous-texte">Lecture de votre recherche…</p>;
  }

  if (parametres.depart === '' || parametres.arrivee === '') {
    return (
      <div class="carte etat-vide">
        <p class="titre-etat">Aucune recherche à afficher</p>
        <p class="sous-texte">Choisissez un départ et une arrivée pour voir les trajets.</p>
        <a href="/" class="cta">Faire une recherche</a>
      </div>
    );
  }

  return (
    <>
      <p class="champ-resume">
        <span class="quartier">{parametres.depart}</span>
        <span class="fleche-mini" aria-hidden="true">→</span>
        <span class="quartier">{parametres.arrivee}</span>
      </p>

      {resultat !== null && resultat.statut === 'meme_arret' && (
        <div class="carte etat-vide">
          <p class="titre-etat">Le départ et l’arrivée sont le même arrêt</p>
          <p class="sous-texte">Choisissez deux arrêts différents.</p>
          <a href="/" class="cta">Modifier la recherche</a>
        </div>
      )}

      {resultat !== null &&
        (resultat.statut === 'aucun_resultat' || resultat.statut === 'trop_de_correspondances') && (
          <SansResultat depart={parametres.depart} arrivee={parametres.arrivee} />
        )}

      {resultat !== null && resultat.statut === 'resultats' && (
        <>
          <p class="titre-bloc compte-resultats">
            {resultat.options.length === 1
              ? '1 trajet trouvé'
              : `${resultat.options.length} trajets trouvés`}
          </p>
          <ul class="liste-trajets">
            {resultat.options.map((option) => (
              <CarteTrajet key={option.lignes.map((l) => l.id).join('-')} option={option} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}
