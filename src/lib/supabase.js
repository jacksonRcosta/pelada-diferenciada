import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || ''

export const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 10 } }
    })
  : null

const TABLE = 'pd_state'
const ROW   = 'main'

export async function loadState() {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLE)
    .select('data')
    .eq('id', ROW)
    .single()
  if (error) {
    // Se não existe o registro, retorna null (será criado no primeiro save)
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data?.data || null
}

export async function saveState(obj) {
  if (!supabase) return
  const { error } = await supabase
    .from(TABLE)
    .upsert(
      { id: ROW, data: obj, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    )
  if (error) {
    console.error('Supabase save error:', error)
    throw error
  }
}

export function subscribeToChanges(cb) {
  if (!supabase) return () => {}
  const ch = supabase
    .channel('pd_realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLE,
        filter: `id=eq.${ROW}`
      },
      payload => {
        if (payload.new?.data) cb(payload.new.data)
      }
    )
    .subscribe((status) => {
      console.log('Realtime status:', status)
    })
  return () => supabase.removeChannel(ch)
}
