create table if not exists public.logs_recherche (
  id bigint generated always as identity primary key,
  depart text not null check (char_length(depart) between 1 and 120),
  arrivee text not null check (char_length(arrivee) between 1 and 120),
  nb_resultats integer not null check (nb_resultats >= -1),
  cree_le timestamptz not null default now()
);

create index if not exists logs_recherche_cree_le_idx
  on public.logs_recherche (cree_le desc);

alter table public.logs_recherche enable row level security;

drop policy if exists "insertion anonyme d une recherche" on public.logs_recherche;

create policy "insertion anonyme d une recherche"
  on public.logs_recherche
  for insert
  to anon
  with check (true);

create table if not exists public.signalements (
  id bigint generated always as identity primary key,
  motif text not null check (
    motif in (
      'tronconnage_abusif',
      'tarif_incorrect',
      'ligne_arret_incorrect',
      'ligne_supprimee',
      'autre'
    )
  ),
  ligne_id text check (ligne_id is null or char_length(ligne_id) between 1 and 20),
  description text not null check (char_length(description) between 10 and 2000),
  contact text check (contact is null or char_length(contact) between 1 and 120),
  statut text not null default 'nouveau' check (statut in ('nouveau', 'traite')),
  cree_le timestamptz not null default now()
);

create index if not exists signalements_statut_cree_le_idx
  on public.signalements (statut, cree_le desc);

alter table public.signalements enable row level security;

drop policy if exists "depot anonyme d un signalement" on public.signalements;

create policy "depot anonyme d un signalement"
  on public.signalements
  for insert
  to anon
  with check (statut = 'nouveau');
