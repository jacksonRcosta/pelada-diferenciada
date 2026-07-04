import { supabase, SITE_URL } from '../lib/supabaseClient'
import { INITIAL_STATE } from '../lib/constants'

// Lista as peladas visíveis para o usuário (dono ou membro), com o papel dele.
export async function listMinhasPeladas() {
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData?.user?.id

  const { data, error } = await supabase
    .from('peladas')
    .select('id, nome, cidade, estado, horario, local, owner_id, created_at, updated_at')
    .order('created_at', { ascending: false })
  if (error) throw error

  const { data: mems } = await supabase
    .from('pelada_members')
    .select('pelada_id, role')
    .eq('user_id', uid)
  const roleMap = new Map((mems || []).map(m => [m.pelada_id, m.role]))

  return (data || []).map(p => ({
    ...p,
    role: p.owner_id === uid ? 'owner' : (roleMap.get(p.id) || 'viewer'),
  }))
}

export async function criarPelada(nome, cidade = '', estado = '', horario = '', local = '') {
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData?.user?.id
  if (!uid) throw new Error('Sessão inválida')

  const { data, error } = await supabase
    .from('peladas')
    .insert({
      nome: nome.trim(), owner_id: uid,
      cidade: cidade.trim() || null,
      estado: estado.trim() || null,
      horario: horario.trim() || null,
      local: local.trim() || null,
    })
    .select()
    .single()
  if (error) throw error

  const { error: stErr } = await supabase
    .from('pelada_state')
    .insert({ pelada_id: data.id, data: INITIAL_STATE })
  if (stErr) throw stErr

  return data
}

// Atualiza dados cadastrais da pelada (nome / cidade / estado).
export async function atualizarPelada(id, { nome, cidade, estado, horario, local }) {
  const campos = { updated_at: new Date().toISOString() }
  if (nome !== undefined)    campos.nome    = nome.trim()
  if (cidade !== undefined)  campos.cidade  = (cidade || '').trim() || null
  if (estado !== undefined)  campos.estado  = (estado || '').trim() || null
  if (horario !== undefined) campos.horario = (horario || '').trim() || null
  if (local !== undefined)   campos.local   = (local || '').trim() || null
  const { error } = await supabase.from('peladas').update(campos).eq('id', id)
  if (error) throw error
}

// Mantida por compatibilidade (renomear rápido).
export async function renomearPelada(id, nome) {
  return atualizarPelada(id, { nome })
}

export async function excluirPelada(id) {
  const { error } = await supabase.from('peladas').delete().eq('id', id)
  if (error) throw error
}

// ---------- Compartilhamento / membros ----------

// Links de convite (um por papel). Só o dono enxerga os tokens (RLS).
export async function getInviteLinks(peladaId) {
  const { data, error } = await supabase
    .from('peladas')
    .select('token_editor, token_viewer')
    .eq('id', peladaId)
    .single()
  if (error) throw error
  const base = SITE_URL.replace(/\/$/, '')
  return {
    editor: `${base}/?join=${data.token_editor}`,
    viewer: `${base}/?join=${data.token_viewer}`,
  }
}

export async function listMembers(peladaId) {
  const { data, error } = await supabase.rpc('list_pelada_members', { p_pelada: peladaId })
  if (error) throw error
  return data || []
}

// Retorna 'OK' ou 'NAO_ENCONTRADO' (e-mail ainda não cadastrado).
export async function addMemberByEmail(peladaId, email, role) {
  const { data, error } = await supabase.rpc('add_member_by_email', {
    p_pelada: peladaId, p_email: email, p_role: role,
  })
  if (error) throw error
  return data
}

export async function changeMemberRole(peladaId, userId, role) {
  const { error } = await supabase
    .from('pelada_members')
    .update({ role })
    .eq('pelada_id', peladaId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function removeMember(peladaId, userId) {
  const { error } = await supabase
    .from('pelada_members')
    .delete()
    .eq('pelada_id', peladaId)
    .eq('user_id', userId)
  if (error) throw error
}

// Entra numa pelada via token de convite; retorna { pelada_id, nome, role }.
export async function joinByToken(token) {
  const { data, error } = await supabase.rpc('join_pelada_by_token', { p_token: token })
  if (error) throw error
  return Array.isArray(data) ? data[0] : data
}

// ---------- Busca de peladas + solicitações de entrada ----------

// Procura peladas por nome/cidade/UF. Termo vazio lista as mais recentes.
// Cada item traz: { id, nome, cidade, estado, owner_nome, membros, ja_membro, solicitacao }.
export async function buscarPeladas(termo = '') {
  const { data, error } = await supabase.rpc('search_peladas', { p_termo: termo })
  if (error) throw error
  return data || []
}

// Solicita entrada numa pelada. Retorna 'OK' | 'JA_MEMBRO' | 'JA_SOLICITADO'.
export async function solicitarEntrada(peladaId, mensagem = '') {
  const { data, error } = await supabase.rpc('request_join_pelada', {
    p_pelada: peladaId, p_msg: mensagem,
  })
  if (error) throw error
  return data
}

// Lista solicitações pendentes recebidas pelo dono (todas as suas peladas).
export async function listarSolicitacoesRecebidas() {
  const { data, error } = await supabase.rpc('list_owner_pending_requests')
  if (error) throw error
  return data || []
}

// Responde uma solicitação: aprovar (vira membro) ou recusar.
// Retorna 'APROVADO' | 'RECUSADO'.
export async function responderSolicitacao(requestId, aprovar, role = 'editor') {
  const { data, error } = await supabase.rpc('respond_join_request', {
    p_request: requestId, p_aprovar: aprovar, p_role: role,
  })
  if (error) throw error
  return data
}
