-- =====================================================================
-- Cria/garante o perfil (public.profiles) automaticamente para todo
-- usuário do Supabase Auth. Padrão recomendado do Supabase (server-side),
-- não depende do frontend carregar. Inclui backfill dos já existentes.
-- Rodar no SQL Editor.
-- =====================================================================

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

-- Backfill: cria o perfil de quem já autenticou (ex.: o 1º login que já ocorreu)
insert into public.profiles (id, email, nome_completo)
select id, email,
       coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', '')
from auth.users
on conflict (id) do nothing;
