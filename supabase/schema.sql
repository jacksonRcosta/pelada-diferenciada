-- ============================================================
-- PELADA DIFERENCIADA — Schema Supabase
-- Execute no SQL Editor do seu projeto Supabase
-- ============================================================

create table if not exists pd_state (
  id text primary key default 'main',
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);

insert into pd_state (id, data)
values ('main', '{"players":[],"nextId":1,"teams":null,"schedule":[],"activeMatch":-1,"matchA":-1,"matchB":-1,"scoreA":0,"scoreB":0,"matchFinished":false,"matchHistory":[]}')
on conflict (id) do nothing;

alter table pd_state enable row level security;

create policy "leitura_publica" on pd_state for select using (true);
create policy "escrita_publica" on pd_state for all using (true);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger pd_state_updated_at
  before update on pd_state
  for each row execute function update_updated_at();
