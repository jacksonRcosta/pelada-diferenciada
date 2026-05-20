import { createClient } from '@supabase/supabase-js'

// Credenciais diretas — funciona sem variáveis de ambiente
const SUPABASE_URL = 'https://ptvtnifhnzyayqmbpxtg.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dnRuaWZobnp5YXlxbWJweHRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTc4MzUsImV4cCI6MjA5NDYzMzgzNX0.umrGxWPIq87t5w3vr8N53QF46ijklRncac2HNStuJS8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
})

const TABLE = 'pd_state'
const ROW   = 'main'

export async function loadState() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('data')
    .eq('id', ROW)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('loadState error:', error)
    throw error
  }
  return data?.data || null
}

export async function saveState(obj) {
  const { error } = await supabase
    .from(TABLE)
    .upsert(
      { id: ROW, data: obj, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    )
  if (error) {
    console.error('saveState error:', error)
    throw error
  }
}

export function subscribeToChanges(cb) {
  const ch = supabase
    .channel('pd_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLE, filter: `id=eq.${ROW}` },
      payload => {
        if (payload.new?.data) cb(payload.new.data)
      }
    )
    .subscribe(status => {
      console.log('Realtime status:', status)
    })
  return () => supabase.removeChannel(ch)
}
