import { createClient } from '@supabase/supabase-js'

const URL  = process.env.REACT_APP_SUPABASE_URL
const KEY  = process.env.REACT_APP_SUPABASE_ANON_KEY
export const supabase = createClient(URL, KEY)

const TABLE = 'pd_state'
const ROW   = 'main'

export async function loadState() {
  const { data, error } = await supabase.from(TABLE).select('data').eq('id', ROW).single()
  if (error) throw error
  return data?.data || null
}

export async function saveState(obj) {
  const { error } = await supabase.from(TABLE)
    .upsert({ id: ROW, data: obj, updated_at: new Date().toISOString() })
  if (error) throw error
}

export function subscribeToChanges(cb) {
  const ch = supabase.channel('pd_rt')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: TABLE, filter: `id=eq.${ROW}` },
        p => cb(p.new?.data))
    .subscribe()
  return () => supabase.removeChannel(ch)
}
