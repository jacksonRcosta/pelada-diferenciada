// Configuração via variáveis de ambiente (CRA). Fallback mantém compatibilidade
// caso o .env não esteja definido no ambiente de build.
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://ptvtnifhnzyayqmbpxtg.supabase.co'
const ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dnRuaWZobnp5YXlxbWJweHRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTc4MzUsImV4cCI6MjA5NDYzMzgzNX0.umrGxWPIq87t5w3vr8N53QF46ijklRncac2HNStuJS8'

const BASE_URL = SUPABASE_URL.replace(/\/$/, '') + '/rest/v1'

// Leitura e escrita usam a anon key. A persistência é garantida pelas policies
// RLS (leitura_publica / escrita_publica) — a service_role key NÃO deve viver
// no frontend.
const HEADERS = {
  'apikey': ANON_KEY,
  'Authorization': 'Bearer ' + ANON_KEY,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}
const READ_HEADERS = HEADERS

export const supabase = null

export async function loadState() {
  const res = await fetch(
    BASE_URL + '/pd_state?id=eq.main&select=data',
    { headers: READ_HEADERS }
  )
  if (!res.ok) {
    const txt = await res.text()
    throw new Error('loadState ' + res.status + ': ' + txt)
  }
  const rows = await res.json()
  console.log('loadState rows:', rows.length, rows.length > 0 ? JSON.stringify(rows[0].data).slice(0,100) : 'vazio')
  if (!rows || !rows.length) return null
  return rows[0].data || null
}

export async function saveState(obj) {
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
  }

  console.log('saveState players:', JSON.stringify(toSave.players).slice(0, 200))

  // Upsert: insere a linha 'main' se não existir, ou atualiza se já existir.
  // Evita o caso em que um PATCH em linha inexistente "salva" 0 registros.
  const res = await fetch(
    BASE_URL + '/pd_state',
    {
      method: 'POST',
      headers: { ...HEADERS, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        id: 'main',
        data: toSave,
        updated_at: new Date().toISOString()
      })
    }
  )

  console.log('saveState status:', res.status)

  if (!res.ok) {
    const txt = await res.text()
    throw new Error('saveState ' + res.status + ': ' + txt)
  }
}

// Polling a cada 8 segundos
let lastPolled = ''
export function subscribeToChanges(cb) {
  const iv = setInterval(async () => {
    try {
      const data = await loadState()
      if (data && data.players !== undefined) {
        const raw = JSON.stringify(data)
        if (raw !== lastPolled) {
          lastPolled = raw
          cb(data)
        }
      }
    } catch(e) {
      console.warn('Polling error:', e.message)
    }
  }, 8000)
  return () => clearInterval(iv)
}
