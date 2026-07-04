// Estado de jogo escopado por PELADA (tabela pelada_state), via SDK autenticado.
// Substituiu o acesso REST anônimo ao registro global pd_state id=main.
import { supabase } from './supabaseClient'

// Reexport para compatibilidade com imports antigos.
export { supabase }

export async function loadState(peladaId) {
  if (!peladaId) return null
  const { data, error } = await supabase
    .from('pelada_state')
    .select('data')
    .eq('pelada_id', peladaId)
    .maybeSingle()
  if (error) throw new Error('loadState: ' + error.message)
  return data?.data || null
}

export async function saveState(peladaId, obj) {
  if (!peladaId) throw new Error('saveState sem peladaId')

  // WHITELIST — todo campo NOVO de topo do estado precisa ser adicionado aqui,
  // senão NÃO persiste (some ao recarregar). Campos aninhados (mvp/scouts em
  // matchHistory, awards em seasonHistory) persistem por estarem dentro.
  const toSave = {
    players:      Array.isArray(obj.players) ? obj.players : [],
    nextId:       obj.nextId || 1,
    teams:        obj.teams || null,
    schedule:     obj.schedule || [],
    activeMatch:  obj.activeMatch !== undefined ? obj.activeMatch : -1,
    matchA:       obj.matchA !== undefined ? obj.matchA : -1,
    matchB:       obj.matchB !== undefined ? obj.matchB : -1,
    scoreA:       obj.scoreA || 0,
    scoreB:       obj.scoreB || 0,
    matchFinished: obj.matchFinished || false,
    matchHistory: obj.matchHistory || [],
    roundHistory: Array.isArray(obj.roundHistory) ? obj.roundHistory : [],
    seasonHistory: Array.isArray(obj.seasonHistory) ? obj.seasonHistory : [],
    roundStartedAt: obj.roundStartedAt || null,
    finance: obj.finance || { mensalidade: 0, diaria: 0, cfg: {}, mensal: {}, diarias: [] },
  }

  const { error } = await supabase
    .from('pelada_state')
    .upsert(
      { pelada_id: peladaId, data: toSave, updated_at: new Date().toISOString() },
      { onConflict: 'pelada_id' }
    )
  if (error) throw new Error('saveState: ' + error.message)
}

// Polling a cada 4s — mantém a marcação "em tempo real" entre os membros
// da MESMA pelada. Cada peladaId tem seu próprio ciclo de polling.
export function subscribeToChanges(peladaId, cb) {
  if (!peladaId) return () => {}
  let lastPolled = ''
  const iv = setInterval(async () => {
    try {
      const data = await loadState(peladaId)
      if (data && data.players !== undefined) {
        const raw = JSON.stringify(data)
        if (raw !== lastPolled) {
          lastPolled = raw
          cb(data)
        }
      }
    } catch (e) {
      console.warn('Polling error:', e.message)
    }
  }, 4000)
  return () => clearInterval(iv)
}
