-- =====================================================================
-- Peladeiros — Schema multiusuário / multi-pelada + RLS (v2)
-- Rodar no Supabase (SQL Editor). Projeto: ptvtnifhnzyayqmbpxtg
-- Substitui o modelo antigo (pd_state id=main) por N usuários x N peladas.
-- A tabela pd_state é PRESERVADA até a migração ser validada.
-- =====================================================================

-- 1) PERFIL (1:1 com auth.users) --------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  nome_completo text,
  email         text,
  telefone      text,
  created_at    timestamptz default now()
);

-- 2) PELADAS ----------------------------------------------------------
create table if not exists public.peladas (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  nome       text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_peladas_owner on public.peladas(owner_id);

-- 3) MEMBROS DA PELADA ------------------------------------------------
create table if not exists public.pelada_members (
  pelada_id  uuid references public.peladas(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  role       text not null default 'editor',   -- 'owner' | 'editor' | 'viewer'
  created_at timestamptz default now(),
  primary key (pelada_id, user_id)
);

-- 4) ESTADO DE JOGO POR PELADA (substitui pd_state id=main) -----------
create table if not exists public.pelada_state (
  pelada_id  uuid primary key references public.peladas(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- =====================================================================
-- TRIGGER: ao criar uma pelada, registra o dono como membro 'owner'
-- =====================================================================
create or replace function public.add_owner_as_member()
returns trigger language plpgsql security definer as $$
begin
  insert into public.pelada_members (pelada_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists trg_add_owner_member on public.peladas;
create trigger trg_add_owner_member
  after insert on public.peladas
  for each row execute function public.add_owner_as_member();

-- TRIGGER: cria o perfil automaticamente para todo novo usuário do Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, nome_completo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: usuário é membro da pelada? (security definer evita recursão de RLS)
create or replace function public.is_member(p_pelada uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.pelada_members m
    where m.pelada_id = p_pelada and m.user_id = auth.uid()
  );
$$;

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.profiles       enable row level security;
alter table public.peladas        enable row level security;
alter table public.pelada_members enable row level security;
alter table public.pelada_state   enable row level security;

-- profiles: cada um cuida do seu
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
  for select using (id = auth.uid());
drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles
  for insert with check (id = auth.uid());
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (id = auth.uid());

-- peladas: dono OU membro pode ver; só o dono altera
drop policy if exists peladas_select on public.peladas;
create policy peladas_select on public.peladas
  for select using (owner_id = auth.uid() or public.is_member(id));
drop policy if exists peladas_insert on public.peladas;
create policy peladas_insert on public.peladas
  for insert with check (owner_id = auth.uid());
drop policy if exists peladas_update on public.peladas;
create policy peladas_update on public.peladas
  for update using (owner_id = auth.uid());
drop policy if exists peladas_delete on public.peladas;
create policy peladas_delete on public.peladas
  for delete using (owner_id = auth.uid());

-- pelada_members: o dono da pelada gerencia; o próprio usuário vê suas participações
drop policy if exists members_select on public.pelada_members;
create policy members_select on public.pelada_members
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.peladas p where p.id = pelada_id and p.owner_id = auth.uid())
  );
drop policy if exists members_write on public.pelada_members;
create policy members_write on public.pelada_members
  for all using (
    exists (select 1 from public.peladas p where p.id = pelada_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.peladas p where p.id = pelada_id and p.owner_id = auth.uid())
  );

-- pelada_state: membros (owner/editor) leem e escrevem
drop policy if exists state_select on public.pelada_state;
create policy state_select on public.pelada_state
  for select using (public.is_member(pelada_id));
drop policy if exists state_insert on public.pelada_state;
create policy state_insert on public.pelada_state
  for insert with check (public.is_member(pelada_id));
drop policy if exists state_update on public.pelada_state;
create policy state_update on public.pelada_state
  for update using (public.is_member(pelada_id));

-- updated_at automático no pelada_state (reaproveita update_updated_at do schema antigo,
-- recriado aqui para não depender de ordem de execução)
create or replace function public.update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
drop trigger if exists pelada_state_updated_at on public.pelada_state;
create trigger pelada_state_updated_at
  before update on public.pelada_state
  for each row execute function public.update_updated_at();
