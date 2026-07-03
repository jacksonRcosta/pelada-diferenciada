-- =====================================================================
-- Busca de peladas + solicitações de entrada (localização por cidade/UF)
-- Rodar no SQL Editor. Requer schema_v2_multitenant.sql + compartilhamento.sql.
-- Idempotente: pode rodar mais de uma vez.
-- =====================================================================

-- 1) Localização da pelada (cidade / estado-UF) -----------------------
alter table public.peladas
  add column if not exists cidade text,
  add column if not exists estado text;   -- UF, ex: 'AL', 'SP'

create index if not exists idx_peladas_cidade on public.peladas (lower(cidade));
create index if not exists idx_peladas_estado on public.peladas (estado);

-- 2) Solicitações de entrada em pelada --------------------------------
create table if not exists public.pelada_join_requests (
  id           uuid primary key default gen_random_uuid(),
  pelada_id    uuid not null references public.peladas(id)  on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'pending',   -- 'pending' | 'approved' | 'rejected'
  mensagem     text,
  created_at   timestamptz default now(),
  responded_at timestamptz,
  unique (pelada_id, user_id)
);
create index if not exists idx_join_req_pelada on public.pelada_join_requests(pelada_id);
create index if not exists idx_join_req_user   on public.pelada_join_requests(user_id);

alter table public.pelada_join_requests enable row level security;

-- O solicitante vê as próprias solicitações; o dono da pelada vê as dela.
-- (As escritas são feitas apenas pelas funções SECURITY DEFINER abaixo.)
drop policy if exists join_req_select on public.pelada_join_requests;
create policy join_req_select on public.pelada_join_requests
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.peladas p where p.id = pelada_id and p.owner_id = auth.uid())
  );

-- =====================================================================
-- 3) Buscar peladas por nome / cidade / UF ----------------------------
--    Busca pública (autenticado). Retorna dados mínimos + situação do
--    solicitante (já é membro? tem solicitação? qual status?).
--    Termo vazio lista as peladas mais recentes (para navegar).
-- =====================================================================
create or replace function public.search_peladas(p_termo text default '')
returns table (
  id           uuid,
  nome         text,
  cidade       text,
  estado       text,
  owner_nome   text,
  membros      bigint,
  ja_membro    boolean,
  solicitacao  text
)
language sql security definer stable as $$
  select
    p.id, p.nome, p.cidade, p.estado,
    pr.nome_completo as owner_nome,
    (select count(*) from public.pelada_members m where m.pelada_id = p.id) as membros,
    exists (select 1 from public.pelada_members m
              where m.pelada_id = p.id and m.user_id = auth.uid()) as ja_membro,
    (select r.status from public.pelada_join_requests r
              where r.pelada_id = p.id and r.user_id = auth.uid()) as solicitacao
  from public.peladas p
  left join public.profiles pr on pr.id = p.owner_id
  where
    coalesce(trim(p_termo), '') = ''
    or p.nome   ilike '%' || trim(p_termo) || '%'
    or p.cidade ilike '%' || trim(p_termo) || '%'
    or p.estado ilike '%' || trim(p_termo) || '%'
  order by p.created_at desc
  limit 40;
$$;

-- =====================================================================
-- 4) Solicitar entrada numa pelada ------------------------------------
--    Retorna 'OK' | 'JA_MEMBRO' | 'JA_SOLICITADO'.
-- =====================================================================
create or replace function public.request_join_pelada(p_pelada uuid, p_msg text default null)
returns text language plpgsql security definer as $$
begin
  if auth.uid() is null then
    raise exception 'Precisa estar autenticado';
  end if;

  if not exists (select 1 from public.peladas where id = p_pelada) then
    raise exception 'Pelada nao encontrada';
  end if;

  if exists (select 1 from public.pelada_members m
             where m.pelada_id = p_pelada and m.user_id = auth.uid()) then
    return 'JA_MEMBRO';
  end if;

  if exists (select 1 from public.pelada_join_requests r
             where r.pelada_id = p_pelada and r.user_id = auth.uid()
               and r.status = 'pending') then
    return 'JA_SOLICITADO';
  end if;

  -- Cria (ou reabre, se antes recusada/aprovada) a solicitação como pendente.
  insert into public.pelada_join_requests (pelada_id, user_id, status, mensagem)
  values (p_pelada, auth.uid(), 'pending', nullif(trim(coalesce(p_msg,'')), ''))
  on conflict (pelada_id, user_id) do update
    set status = 'pending',
        mensagem = excluded.mensagem,
        created_at = now(),
        responded_at = null;

  return 'OK';
end $$;

-- =====================================================================
-- 5) Solicitações pendentes recebidas pelo dono (todas as suas peladas)
-- =====================================================================
create or replace function public.list_owner_pending_requests()
returns table (
  request_id  uuid,
  pelada_id   uuid,
  pelada_nome text,
  user_id     uuid,
  nome        text,
  email       text,
  telefone    text,
  mensagem    text,
  created_at  timestamptz
)
language sql security definer stable as $$
  select
    r.id, r.pelada_id, p.nome,
    r.user_id, pr.nome_completo, pr.email, pr.telefone,
    r.mensagem, r.created_at
  from public.pelada_join_requests r
  join public.peladas  p  on p.id  = r.pelada_id
  join public.profiles pr on pr.id = r.user_id
  where r.status = 'pending'
    and p.owner_id = auth.uid()
  order by r.created_at asc;
$$;

-- =====================================================================
-- 6) Responder solicitação (aprovar => vira membro / recusar) ---------
--    Só o dono da pelada. Retorna 'APROVADO' | 'RECUSADO'.
-- =====================================================================
create or replace function public.respond_join_request(
  p_request uuid, p_aprovar boolean, p_role text default 'editor'
)
returns text language plpgsql security definer as $$
declare v_req public.pelada_join_requests%rowtype;
begin
  select * into v_req from public.pelada_join_requests where id = p_request;
  if not found then
    raise exception 'Solicitacao nao encontrada';
  end if;

  if not exists (select 1 from public.peladas p
                 where p.id = v_req.pelada_id and p.owner_id = auth.uid()) then
    raise exception 'Apenas o proprietario pode responder';
  end if;

  if p_aprovar then
    if coalesce(p_role,'') not in ('editor','viewer') then
      p_role := 'editor';
    end if;
    insert into public.pelada_members (pelada_id, user_id, role)
    values (v_req.pelada_id, v_req.user_id, p_role)
    on conflict (pelada_id, user_id) do update
      set role = case when public.pelada_members.role = 'owner'
                      then 'owner' else excluded.role end;
    update public.pelada_join_requests
      set status = 'approved', responded_at = now()
      where id = p_request;
    return 'APROVADO';
  else
    update public.pelada_join_requests
      set status = 'rejected', responded_at = now()
      where id = p_request;
    return 'RECUSADO';
  end if;
end $$;

-- 7) Grants -----------------------------------------------------------
grant execute on function public.search_peladas(text)                       to authenticated;
grant execute on function public.request_join_pelada(uuid, text)            to authenticated;
grant execute on function public.list_owner_pending_requests()              to authenticated;
grant execute on function public.respond_join_request(uuid, boolean, text)  to authenticated;
