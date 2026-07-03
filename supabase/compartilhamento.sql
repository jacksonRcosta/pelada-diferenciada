-- =====================================================================
-- Compartilhamento de acesso: link de convite + membros por e-mail
-- Rodar no SQL Editor. Requer schema_v2_multitenant.sql já aplicado.
-- =====================================================================

-- 1) Tokens de convite por papel (um link para editor, outro para viewer)
alter table public.peladas
  add column if not exists token_editor uuid default gen_random_uuid(),
  add column if not exists token_viewer uuid default gen_random_uuid();

update public.peladas set token_editor = gen_random_uuid() where token_editor is null;
update public.peladas set token_viewer = gen_random_uuid() where token_viewer is null;

-- 2) Entrar numa pelada usando um token de convite (o papel vem do token,
--    então o usuário não consegue escalar de viewer para editor).
create or replace function public.join_pelada_by_token(p_token uuid)
returns table(pelada_id uuid, nome text, role text)
language plpgsql security definer as $$
declare
  v public.peladas%rowtype;
  v_role text;
begin
  if auth.uid() is null then
    raise exception 'Precisa estar autenticado';
  end if;

  select * into v from public.peladas
    where token_editor = p_token or token_viewer = p_token
    limit 1;
  if not found then
    raise exception 'Convite invalido ou expirado';
  end if;

  v_role := case when v.token_editor = p_token then 'editor' else 'viewer' end;

  insert into public.pelada_members (pelada_id, user_id, role)
  values (v.id, auth.uid(), v_role)
  on conflict (pelada_id, user_id) do update
    set role = case when public.pelada_members.role = 'owner'
                    then 'owner' else excluded.role end;

  return query
    select v.id, v.nome,
      (select m.role from public.pelada_members m
        where m.pelada_id = v.id and m.user_id = auth.uid());
end $$;

-- 3) Adicionar membro por e-mail (só o dono da pelada). O usuário precisa
--    já ter se cadastrado (existir em profiles).
create or replace function public.add_member_by_email(p_pelada uuid, p_email text, p_role text)
returns text language plpgsql security definer as $$
declare v_uid uuid;
begin
  if not exists (select 1 from public.peladas where id = p_pelada and owner_id = auth.uid()) then
    raise exception 'Apenas o proprietario pode adicionar membros';
  end if;
  if p_role not in ('editor','viewer') then
    raise exception 'Papel invalido';
  end if;

  select id into v_uid from public.profiles where lower(email) = lower(trim(p_email)) limit 1;
  if v_uid is null then
    return 'NAO_ENCONTRADO';
  end if;

  insert into public.pelada_members (pelada_id, user_id, role)
  values (p_pelada, v_uid, p_role)
  on conflict (pelada_id, user_id) do update
    set role = case when public.pelada_members.role = 'owner'
                    then 'owner' else excluded.role end;
  return 'OK';
end $$;

-- 4) Listar membros de uma pelada com nome/e-mail (só membros da pelada).
create or replace function public.list_pelada_members(p_pelada uuid)
returns table(user_id uuid, nome text, email text, role text)
language plpgsql security definer as $$
begin
  if not exists (
    select 1 from public.pelada_members m
    where m.pelada_id = p_pelada and m.user_id = auth.uid()
  ) then
    raise exception 'Sem acesso';
  end if;

  return query
    select p.id, p.nome_completo, p.email, m.role
    from public.pelada_members m
    join public.profiles p on p.id = m.user_id
    where m.pelada_id = p_pelada
    order by case m.role when 'owner' then 0 when 'editor' then 1 else 2 end,
             p.nome_completo nulls last;
end $$;

-- 5) Grants
grant execute on function public.join_pelada_by_token(uuid) to authenticated;
grant execute on function public.add_member_by_email(uuid, text, text) to authenticated;
grant execute on function public.list_pelada_members(uuid) to authenticated;
