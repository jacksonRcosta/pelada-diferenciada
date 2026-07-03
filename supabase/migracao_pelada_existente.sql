-- =====================================================================
-- Migração da pelada existente (pd_state id=main) -> conta raiz
-- >>> RODAR SÓ DEPOIS que jackson.computacao@gmail.com fizer o 1º login <<<
-- (o login com Google cria as linhas em auth.users e em public.profiles)
-- Idempotente: não duplica se a conta raiz já tiver alguma pelada.
-- =====================================================================
do $$
declare
  v_owner  uuid;
  v_pelada uuid;
  v_data   jsonb;
begin
  select id into v_owner from public.profiles
    where email = 'jackson.computacao@gmail.com' limit 1;

  if v_owner is null then
    raise notice 'Conta raiz ainda nao logou; migracao ignorada.';
    return;
  end if;

  if exists (select 1 from public.peladas where owner_id = v_owner) then
    raise notice 'Conta raiz ja possui peladas; migracao ignorada.';
    return;
  end if;

  select data into v_data from public.pd_state where id = 'main' limit 1;

  insert into public.peladas (owner_id, nome)
  values (v_owner, 'Pelada Diferenciada')
  returning id into v_pelada;

  -- o trigger trg_add_owner_member já cria o membership 'owner'
  insert into public.pelada_state (pelada_id, data)
  values (v_pelada, coalesce(v_data, '{}'::jsonb))
  on conflict (pelada_id) do update set data = excluded.data;

  raise notice 'Migracao concluida: pelada % criada para %', v_pelada, v_owner;
end $$;
