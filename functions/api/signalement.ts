import { MOTIFS, CONTACT_MAX, DESCRIPTION_MAX, DESCRIPTION_MIN } from '../../src/lib/signalement';

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
}

interface Contexte {
  request: Request;
  env: Env;
}

interface Entree {
  motif: string;
  ligne_id: string | null;
  description: string;
  contact: string | null;
  statut: 'nouveau';
}

const URL_VERIFICATION_TURNSTILE =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

function reponse(statut: number, corps: Record<string, unknown>): Response {
  return new Response(JSON.stringify(corps), {
    status: statut,
    headers: { 'content-type': 'application/json' },
  });
}

function lireEntree(charge: unknown): Entree | null {
  if (typeof charge !== 'object' || charge === null) return null;
  const brut = charge as Record<string, unknown>;

  const motif = typeof brut.motif === 'string' ? brut.motif.trim() : '';
  if (!(MOTIFS as readonly string[]).includes(motif)) return null;

  const description = typeof brut.description === 'string' ? brut.description.trim() : '';
  if (description.length < DESCRIPTION_MIN || description.length > DESCRIPTION_MAX) return null;

  const ligneBrute = typeof brut.ligne_id === 'string' ? brut.ligne_id.trim() : '';
  if (ligneBrute.length > 20) return null;

  const contactBrut = typeof brut.contact === 'string' ? brut.contact.trim() : '';
  if (contactBrut.length > CONTACT_MAX) return null;

  return {
    motif,
    ligne_id: ligneBrute.length > 0 ? ligneBrute : null,
    description,
    contact: contactBrut.length > 0 ? contactBrut : null,
    statut: 'nouveau',
  };
}

async function turnstileValide(jeton: string, secret: string, ip: string | null): Promise<boolean> {
  const corps = new FormData();
  corps.append('secret', secret);
  corps.append('response', jeton);
  if (ip) corps.append('remoteip', ip);

  try {
    const reponseCloudflare = await fetch(URL_VERIFICATION_TURNSTILE, {
      method: 'POST',
      body: corps,
    });
    const resultat = (await reponseCloudflare.json()) as { success?: boolean };
    return resultat.success === true;
  } catch {
    return false;
  }
}

export async function onRequestPost({ request, env }: Contexte): Promise<Response> {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.TURNSTILE_SECRET_KEY) {
    return reponse(503, { erreur: 'service_non_configure' });
  }

  let charge: unknown;
  try {
    charge = await request.json();
  } catch {
    return reponse(400, { erreur: 'corps_illisible' });
  }

  const jeton =
    typeof (charge as Record<string, unknown>)?.turnstile_token === 'string'
      ? ((charge as Record<string, unknown>).turnstile_token as string)
      : '';
  if (jeton.length === 0) {
    return reponse(400, { erreur: 'anti_spam_manquant' });
  }

  const ip = request.headers.get('cf-connecting-ip');
  if (!(await turnstileValide(jeton, env.TURNSTILE_SECRET_KEY, ip))) {
    return reponse(403, { erreur: 'anti_spam_refuse' });
  }

  const entree = lireEntree(charge);
  if (entree === null) {
    return reponse(400, { erreur: 'signalement_invalide' });
  }

  let ecriture: Response;
  try {
    ecriture = await fetch(`${env.SUPABASE_URL}/rest/v1/signalements`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        apikey: env.SUPABASE_ANON_KEY,
        authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        prefer: 'return=minimal',
      },
      body: JSON.stringify(entree),
    });
  } catch {
    return reponse(502, { erreur: 'ecriture_impossible' });
  }

  if (!ecriture.ok) {
    return reponse(502, { erreur: 'ecriture_refusee' });
  }

  return reponse(201, { ok: true });
}
