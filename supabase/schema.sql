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
