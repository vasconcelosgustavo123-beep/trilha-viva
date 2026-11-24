-- Biblioteca independente de PDFs: os materiais não precisam estar vinculados a uma aula.
create table if not exists public.library_pdfs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Materiais gerais',
  file_url text not null,
  storage_path text not null unique,
  created_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.library_pdfs enable row level security;
grant select on public.library_pdfs to authenticated;
grant insert, delete on public.library_pdfs to authenticated;
grant all on public.library_pdfs to service_role;

drop policy if exists "read library pdfs" on public.library_pdfs;
drop policy if exists "admin add library pdfs" on public.library_pdfs;
drop policy if exists "admin delete library pdfs" on public.library_pdfs;

create policy "read library pdfs" on public.library_pdfs
  for select to authenticated using (true);

create policy "admin add library pdfs" on public.library_pdfs
  for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') and created_by = auth.uid());

create policy "admin delete library pdfs" on public.library_pdfs
  for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));
