import { useEffect, useMemo, useState } from 'preact/hooks';
import { nombreDArrets, rechercherTrajets } from '../lib/search-engine';
import { creerObtenirTarif } from '../lib/pricing';
import type { ConfigGlobale, Ligne } from '../lib/types';
import type { EtapeTrajet, OptionTrajet, ResultatRecherche } from '../lib/search-engine';

interface Props {
  lignes: Ligne[];
  config: ConfigGlobale;
}

interface PointTrajet {
  cle: string;
  nom: string;
  repere: string | null;
  role: string | null;
  bascule: string | null;
  terminus: boolean;
  correspondance: boolean;
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

function pointsDuTrajet(etapes: EtapeTrajet[]): PointTrajet[] {
  const points: PointTrajet[] = [];

  etapes.forEach((etape, indexEtape) => {
    const suivante = etapes[indexEtape + 1];

    etape.arrets.forEach((arret, indexArret) => {
      if (indexEtape > 0 && indexArret === 0) return;

      const premier = indexEtape === 0 && indexArret === 0;
      const dernierDeLEtape = indexArret === etape.arrets.length - 1;
      const correspondance = dernierDeLEtape && suivante !== undefined;
      const dernier = dernierDeLEtape && suivante === undefined;

      points.push({
        cle: `${etape.ligne.id}-${indexArret}-${arret.nom}`,
        nom: arret.nom,
        repere: arret.repere,
        role: premier ? 'Départ' : correspondance ? 'Correspondance' : dernier ? 'Arrivée' : null,
        bascule: premier
          ? `Monter dans ${etape.ligne.id}`
          : correspondance
            ? `Descendre, prendre ${suivante.ligne.id}`
            : null,
        terminus: premier || dernier,
        correspondance,
      });
    });
  });

  return points;
}

function ItineraireTrajet({ etapes }: { etapes: EtapeTrajet[] }) {
  const points = pointsDuTrajet(etapes);

  return (
    <ol class="timeline timeline-trajet">
      {points.map((point) => (
        <li
          key={point.cle}
          class={[
            'arret',
            point.terminus ? 'arret-terminus' : '',
            point.correspondance ? 'arret-correspondance' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div class="nom-arret">
            {point.nom}
            {point.role && <span class="role-arret">{point.role}</span>}
          </div>
          {point.repere && <div class="repere-arret">{point.repere}</div>}
          {point.bascule && (
            <span class="bascule-ligne">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 9h16l-4-4"></path>
                <path d="M20 15H4l4 4"></path>
              </svg>
              {point.bascule}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

function CarteTrajet({ option }: { option: OptionTrajet }) {
  const correspondance = option.lignes.length > 1;
  const nbArrets = nombreDArrets(option.etapes);

  const resume =
    nbArrets > 0
      ? `${correspondance ? '1 correspondance' : 'Trajet direct'} · ${nbArrets} arrêts`
      : correspondance
        ? `1 correspondance${option.arretCorrespondance ? ` · via ${option.arretCorrespondance}` : ''}`
        : 'Trajet direct, sans correspondance';

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

      <p class="sous-texte">{resume}</p>

      {option.etapes.length > 0 && <ItineraireTrajet etapes={option.etapes} />}

      <p class="liens-trajet">
        {option.lignes.map((ligne) => (
          <a key={ligne.id} href={`/lignes/${ligne.id}`} class="bouton-contour">
            {correspondance ? `Ligne ${ligne.id} en entier` : 'Voir la ligne en entier'}
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
