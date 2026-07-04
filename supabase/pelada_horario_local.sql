-- Horário e local da pelada.
-- Adiciona colunas de exibição no cadastro da pelada.
-- Idempotente: pode ser rodado mais de uma vez sem erro.
-- DEPENDE de: schema_v2_multitenant.sql (tabela peladas).

alter table public.peladas
  add column if not exists horario text,
  add column if not exists local   text;

-- Observação: 'search_peladas' (busca_e_solicitacoes.sql) NÃO retorna estes
-- campos por padrão. Se quiser exibi-los nos resultados de busca no futuro,
-- inclua horario/local no retorno daquela função.
