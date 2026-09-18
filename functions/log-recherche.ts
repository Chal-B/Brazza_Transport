interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

interface Contexte {
  request: Request;
  env: Env;
}

const LONGUEUR_MAX = 120;

interface EntreeLog {
  depart: string;
  arrivee: string;
  nb_resultats: number;
}

function lireEntree(charge: unknown): EntreeLog | null {
  if (typeof charge !== 'object' || charge === null) return null;
  const brut = charge as Record<string, unknown>;

  const depart = typeof brut.depart === 'string' ? brut.depart.trim() : '';
  const arrivee = typeof brut.arrivee === 'string' ? brut.arrivee.trim() : '';
  const nbResultats = brut.nb_resultats;

  if (depart.length === 0 || depart.length > LONGUEUR_MAX) return null;
  if (arrivee.length === 0 || arrivee.length > LONGUEUR_MAX) return null;
  if (typeof nbResultats !== 'number' || !Number.isInteger(nbResultats) || nbResultats < -1) {
    return null;
  }

  return { depart, arrivee, nb_resultats: nbResultats };
}

export async function onRequestPost({ request, env }: Contexte): Promise<Response> {
  const sansContenu = new Response(null, { status: 204 });

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return sansContenu;
  }

  let entree: EntreeLog | null = null;
  try {
    entree = lireEntree(await request.json());
  } catch {
    return new Response(null, { status: 400 });
  }

  if (entree === null) {
    return new Response(null, { status: 400 });
  }

  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/logs_recherche`, {
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
    return sansContenu;
  }

  return sansContenu;
}
