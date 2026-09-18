import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { estArretConnu, filtrerArrets, memeArret } from '../lib/search-engine';

interface Props {
  arrets: string[];
  departInitial?: string;
  arriveeInitial?: string;
}

interface ChampProps {
  identifiant: string;
  repere: string;
  etiquette: string;
  placeholder: string;
  arrets: string[];
  valeur: string;
  onValeur: (valeur: string) => void;
  invalide: boolean;
}

const MAX_SUGGESTIONS = 8;

function ChampArret({
  identifiant,
  repere,
  etiquette,
  placeholder,
  arrets,
  valeur,
  onValeur,
  invalide,
}: ChampProps) {
  const [ouvert, setOuvert] = useState(false);
  const [indexActif, setIndexActif] = useState(-1);
  const conteneur = useRef<HTMLDivElement>(null);

  const correspondances = useMemo(() => filtrerArrets(valeur, arrets), [valeur, arrets]);
  const suggestions = correspondances.slice(0, MAX_SUGGESTIONS);
  const total = correspondances.length;

  useEffect(() => {
    const fermerSiDehors = (evenement: MouseEvent) => {
      if (conteneur.current && !conteneur.current.contains(evenement.target as Node)) {
        setOuvert(false);
      }
    };
    document.addEventListener('pointerdown', fermerSiDehors);
    return () => document.removeEventListener('pointerdown', fermerSiDehors);
  }, []);

  const choisir = (arret: string) => {
    onValeur(arret);
    setOuvert(false);
    setIndexActif(-1);
  };

  const auClavier = (evenement: KeyboardEvent) => {
    if (evenement.key === 'ArrowDown' || evenement.key === 'ArrowUp') {
      evenement.preventDefault();
      if (!ouvert) {
        setOuvert(true);
        return;
      }
      const pas = evenement.key === 'ArrowDown' ? 1 : -1;
      const prochain = (indexActif + pas + suggestions.length) % Math.max(suggestions.length, 1);
      setIndexActif(suggestions.length === 0 ? -1 : prochain);
      return;
    }
    if (evenement.key === 'Enter' && ouvert && indexActif >= 0) {
      evenement.preventDefault();
      choisir(suggestions[indexActif]);
      return;
    }
    if (evenement.key === 'Escape') {
      setOuvert(false);
      setIndexActif(-1);
    }
  };

  const idListe = `${identifiant}-liste`;

  return (
    <div class="champ-arret" ref={conteneur}>
      <label class="champ-quartier" for={identifiant}>
        <span class="repere">{repere}</span>
        <span class="sr-only">{etiquette}</span>
        <input
          id={identifiant}
          name={identifiant}
          type="text"
          autocomplete="off"
          role="combobox"
          aria-expanded={ouvert}
          aria-controls={idListe}
          aria-autocomplete="list"
          aria-invalid={invalide}
          aria-activedescendant={indexActif >= 0 ? `${identifiant}-option-${indexActif}` : undefined}
          placeholder={placeholder}
          value={valeur}
          onInput={(evenement) => {
            onValeur((evenement.currentTarget as HTMLInputElement).value);
            setOuvert(true);
            setIndexActif(-1);
          }}
          onFocus={() => setOuvert(true)}
          onKeyDown={auClavier}
        />
      </label>

      {ouvert && (
        <ul class="liste-suggestions" id={idListe} role="listbox" aria-label={etiquette}>
          {suggestions.length === 0 && (
            <li class="suggestion-vide" role="presentation">
              Aucun arrêt ne commence par « {valeur} »
            </li>
          )}
          {suggestions.map((arret, index) => (
            <li
              id={`${identifiant}-option-${index}`}
              key={arret}
              role="option"
              aria-selected={memeArret(arret, valeur)}
              class={index === indexActif ? 'suggestion suggestion-active' : 'suggestion'}
              onPointerDown={(evenement) => {
                evenement.preventDefault();
                choisir(arret);
              }}
            >
              {arret}
            </li>
          ))}
          {total > suggestions.length && (
            <li class="suggestion-vide" role="presentation">
              {total - suggestions.length} autres — précisez votre saisie
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default function SearchBar({ arrets, departInitial = '', arriveeInitial = '' }: Props) {
  const [depart, setDepart] = useState(departInitial);
  const [arrivee, setArrivee] = useState(arriveeInitial);
  const [soumis, setSoumis] = useState(false);

  const departConnu = estArretConnu(depart, arrets);
  const arriveeConnue = estArretConnu(arrivee, arrets);
  const identiques = departConnu && arriveeConnue && memeArret(depart, arrivee);
  const pretAChercher = departConnu && arriveeConnue && !identiques;

  const departInvalide = soumis && depart.length > 0 && !departConnu;
  const arriveeInvalide = soumis && arrivee.length > 0 && !arriveeConnue;

  let message: string | null = null;
  if (identiques) {
    message = 'Le départ et l’arrivée sont le même arrêt. Choisissez deux arrêts différents.';
  } else if (soumis && !pretAChercher) {
    message = 'Choisissez un arrêt dans la liste proposée pour le départ et pour l’arrivée.';
  }

  const envoyer = (evenement: SubmitEvent) => {
    setSoumis(true);
    if (!pretAChercher) {
      evenement.preventDefault();
    }
  };

  return (
    <form class="carte-recherche" action="/recherche" method="get" onSubmit={envoyer} novalidate>
      <ChampArret
        identifiant="depart"
        repere="DE"
        etiquette="Quartier ou arrêt de départ"
        placeholder="Quartier ou arrêt de départ"
        arrets={arrets}
        valeur={depart}
        onValeur={setDepart}
        invalide={departInvalide || identiques}
      />
      <ChampArret
        identifiant="arrivee"
        repere="À"
        etiquette="Quartier ou arrêt d’arrivée"
        placeholder="Quartier ou arrêt d’arrivée"
        arrets={arrets}
        valeur={arrivee}
        onValeur={setArrivee}
        invalide={arriveeInvalide || identiques}
      />

      {message && (
        <p class="message-saisie" role="alert">
          {message}
        </p>
      )}

      <button type="submit" class="cta" aria-disabled={!pretAChercher}>
        Chercher un trajet
      </button>
    </form>
  );
}
