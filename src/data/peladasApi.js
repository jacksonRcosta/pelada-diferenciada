import { supabase } from '../lib/supabaseClient'
import { INITIAL_STATE } from '../lib/constants'

// Lista as peladas visíveis para o usuário (dono ou membro), mais recentes primeiro.
export async function listMinhasPeladas() {
  const { data, error } = await supabase
    .from('peladas')
    .select('id, nome, owner_id, created_at, updated_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// Cria uma pelada (o trigger add_owner_as_member registra o dono como 'owner')
// e inicializa o estado de jogo vazio.
export async function criarPelada(nome) {
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData?.user?.id
  if (!uid) throw new Error('Sessão inválida')

  const { data, error } = await supabase
    .from('peladas')
    .insert({ nome: nome.trim(), owner_id: uid })
    .select()
    .single()
  if (error) throw error

  const { error: stErr } = await supabase
    .from('pelada_state')
    .insert({ pelada_id: data.id, data: INITIAL_STATE })
  if (stErr) throw stErr

  return data
}

export async function renomearPelada(id, nome) {
  const { error } = await supabase
    .from('peladas')
    .update({ nome: nome.trim(), updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function excluirPelada(id) {
  // pelada_state e pelada_members caem por ON DELETE CASCADE
  const { error } = await supabase.from('peladas').delete().eq('id', id)
  if (error) throw error
}
