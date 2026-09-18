import { useEffect, useRef, useState } from 'preact/hooks';
import {
  CONTACT_MAX,
  DESCRIPTION_MAX,
  LIBELLE_MOTIF,
  MOTIFS,
  brouillonVide,
  validerSignalement,
} from '../lib/signalement';
import type { BrouillonSignalement, ChampSignalement } from '../lib/signalement';

interface LigneOption {
  id: string;
  nom: string;
}

interface Props {
  lignes: LigneOption[];
  cleSiteTurnstile: string;
}

interface Turnstile {
  render: (
    conteneur: HTMLElement,
    options: {
      sitekey: string;
      callback: (jeton: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
      language?: string;
    },
  ) => string;
  reset: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

type EtatEnvoi = 'saisie' | 'envoi' | 'confirme';

const MESSAGES_ERREUR: Record<string, string> = {
  service_non_configure:
    'L’envoi n’est pas encore branché sur le serveur. Réessayez un peu plus tard.',
  anti_spam_manquant: 'La vérification anti-spam n’a pas abouti. Rechargez la page.',
  anti_spam_refuse: 'La vérification anti-spam a échoué. Réessayez.',
  signalement_invalide: 'Le signalement a été refusé par le serveur. Vérifiez les champs.',
  ecriture_impossible: 'Le serveur n’a pas pu enregistrer le signalement. Réessayez.',
  ecriture_refusee: 'Le serveur n’a pas pu enregistrer le signalement. Réessayez.',
};

export default function ReportForm({ lignes, cleSiteTurnstile }: Props) {
  const [brouillon, setBrouillon] = useState<BrouillonSignalement>(brouillonVide());
  const [erreurs, setErreurs] = useState<Partial<Record<ChampSignalement, string>>>({});
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null);
  const [etat, setEtat] = useState<EtatEnvoi>('saisie');
  const [jeton, setJeton] = useState('');

  const conteneurTurnstile = useRef<HTMLDivElement>(null);
  const idWidget = useRef<string | null>(null);

  useEffect(() => {
    const url = new URLSearchParams(window.location.search);
    const ligne = (url.get('ligne') ?? '').trim();
    if (ligne.length > 0) {
      setBrouillon((precedent) => ({ ...precedent, ligneId: ligne }));
    }
  }, []);

  useEffect(() => {
    let annule = false;
    const monter = () => {
      if (annule || !conteneurTurnstile.current || !window.turnstile) return false;
      if (idWidget.current !== null) return true;
      idWidget.current = window.turnstile.render(conteneurTurnstile.current, {
        sitekey: cleSiteTurnstile,
        callback: (nouveauJeton) => setJeton(nouveauJeton),
        'expired-callback': () => setJeton(''),
        'error-callback': () => setJeton(''),
        language: 'fr',
      });
      return true;
    };

    if (monter()) return;
    const minuteur = setInterval(() => {
      if (monter()) clearInterval(minuteur);
    }, 150);
    return () => {
      annule = true;
      clearInterval(minuteur);
    };
  }, [cleSiteTurnstile]);

  const modifier = (champ: keyof BrouillonSignalement) => (valeur: string) => {
    setBrouillon((precedent) => ({ ...precedent, [champ]: valeur }));
    setErreurs((precedent) => ({ ...precedent, [champ]: undefined }));
  };

  const envoyer = async (evenement: SubmitEvent) => {
    evenement.preventDefault();
    setErreurEnvoi(null);

    const validation = validerSignalement(
      brouillon,
      lignes.map((ligne) => ligne.id),
    );
    if (!validation.ok) {
      setErreurs(validation.erreurs);
      return;
    }
    setErreurs({});

    if (jeton.length === 0) {
      setErreurEnvoi('Patientez le temps de la vérification anti-spam, puis renvoyez.');
      return;
    }

    setEtat('envoi');
    try {
      const reponse = await fetch('/api/signalement', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...validation.valeur, turnstile_token: jeton }),
      });

      const estJson = (reponse.headers.get('content-type') ?? '').includes('application/json');
      const corps = estJson
        ? ((await reponse.json().catch(() => null)) as { ok?: boolean; erreur?: string } | null)
        : null;

      if (!reponse.ok || corps === null || corps.ok !== true) {
        setErreurEnvoi(
          MESSAGES_ERREUR[corps?.erreur ?? ''] ?? 'L’envoi a échoué. Réessayez dans un instant.',
        );
        setEtat('saisie');
        if (window.turnstile && idWidget.current) {
          window.turnstile.reset(idWidget.current);
          setJeton('');
        }
        return;
      }

      setEtat('confirme');
    } catch {
      setErreurEnvoi('Connexion impossible. Vérifiez votre réseau et réessayez.');
      setEtat('saisie');
    }
  };

  if (etat === 'confirme') {
    return (
      <div class="confirmation" role="status">
        <span class="puce-confirmation" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M5 12.5l4.5 4.5L19 7.5"></path>
          </svg>
        </span>
        <div>
          <p class="titre-confirmation">Merci&nbsp;! Votre signalement a été transmis à l’équipe.</p>
          <p class="sous-texte">
            Nous le vérifions sur le terrain avant de corriger la fiche.
          </p>
          <a href="/" class="bouton-contour retour-accueil">Retour à l’accueil</a>
        </div>
      </div>
    );
  }

  return (
    <form class="formulaire-signalement" onSubmit={envoyer} novalidate>
      <div class="groupe-champ">
        <label class="etiquette" for="motif">Type de signalement</label>
        <select
          id="motif"
          class="select"
          value={brouillon.motif}
          onInput={(evenement) => modifier('motif')((evenement.currentTarget as HTMLSelectElement).value)}
        >
          {MOTIFS.map((motif) => (
            <option key={motif} value={motif}>
              {LIBELLE_MOTIF[motif]}
            </option>
          ))}
        </select>
        {erreurs.motif && <p class="erreur-champ">{erreurs.motif}</p>}
      </div>

      <div class="groupe-champ">
        <label class="etiquette" for="ligne">Ligne concernée (optionnel)</label>
        <select
          id="ligne"
          class="select"
          value={brouillon.ligneId}
          onInput={(evenement) => modifier('ligneId')((evenement.currentTarget as HTMLSelectElement).value)}
        >
          <option value="">Je ne sais pas / autre</option>
          {lignes.map((ligne) => (
            <option key={ligne.id} value={ligne.id}>
              {ligne.id} · {ligne.nom}
            </option>
          ))}
        </select>
        {erreurs.ligneId && <p class="erreur-champ">{erreurs.ligneId}</p>}
      </div>

      <div class="groupe-champ">
        <label class="etiquette" for="description">Description</label>
        <textarea
          id="description"
          class="textarea"
          maxLength={DESCRIPTION_MAX}
          placeholder="Décrivez ce que vous avez constaté sur le terrain…"
          aria-invalid={erreurs.description !== undefined}
          value={brouillon.description}
          onInput={(evenement) =>
            modifier('description')((evenement.currentTarget as HTMLTextAreaElement).value)
          }
        ></textarea>
        {erreurs.description && <p class="erreur-champ">{erreurs.description}</p>}
      </div>

      <div class="groupe-champ">
        <label class="etiquette" for="contact">Contact (optionnel, jamais public)</label>
        <input
          id="contact"
          class="input-texte"
          type="text"
          maxLength={CONTACT_MAX}
          placeholder="Téléphone ou email"
          aria-invalid={erreurs.contact !== undefined}
          value={brouillon.contact}
          onInput={(evenement) =>
            modifier('contact')((evenement.currentTarget as HTMLInputElement).value)
          }
        />
        {erreurs.contact && <p class="erreur-champ">{erreurs.contact}</p>}
      </div>

      <div class="zone-turnstile" ref={conteneurTurnstile}></div>

      {erreurEnvoi && (
        <p class="message-saisie" role="alert">
          {erreurEnvoi}
        </p>
      )}

      <button type="submit" class="cta" aria-disabled={etat === 'envoi'}>
        {etat === 'envoi' ? 'Envoi en cours…' : 'Envoyer le signalement'}
      </button>
    </form>
  );
}
