const BASE_URL = 'https://ptvtnifhnzyayqmbpxtg.supabase.co/rest/v1'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dnRuaWZobnp5YXlxbWJweHRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTc4MzUsImV4cCI6MjA5NDYzMzgzNX0.umrGxWPIq87t5w3vr8N53QF46ijklRncac2HNStuJS8'

const HEADERS = {
  'apikey': KEY,
  'Authorization': 'Bearer ' + KEY,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}

export const supabase = null

export async function loadState() {
  const res = await fetch(
    `${BASE_URL}/pd_state?id=eq.main&select=data`,
    { headers: HEADERS }
  )
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`loadState ${res.status}: ${txt}`)
  }
  const rows = await res.json()
  console.log('loadState raw rows:', JSON.stringify(rows).slice(0, 200))
  if (!rows || !rows.length) return null
  const data = rows[0].data
  // Validar que tem estrutura correta
  if (!data || typeof data !== 'object') return null
  return data
}

export async function saveState(obj) {
  // Garantir que o objeto está completo antes de salvar
  const toSave = {
    players: obj.players || [],
    nextId: obj.nextId || 1,
    teams: obj.teams || null,
    schedule: obj.schedule || [],
    activeMatch: obj.activeMatch !== undefined ? obj.activeMatch : -1,
    matchA: obj.matchA !== undefined ? obj.matchA : -1,
    matchB: obj.matchB !== undefined ? obj.matchB : -1,
    scoreA: obj.scoreA || 0,
    scoreB: obj.scoreB || 0,
    matchFinished: obj.matchFinished || false,
    matchHistory: obj.matchHistory || [],
  }

  console.log('Salvando players:', JSON.stringify(toSave.players).slice(0, 200))

  const res = await fetch(
    `${BASE_URL}/pd_state?id=eq.main`,
    {
      method: 'PATCH',
      headers: { ...HEADERS, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        data: toSave,
        updated_at: new Date().toISOString()
      })
    }
  )

  console.log('saveState status:', res.status)

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`saveState ${res.status}: ${txt}`)
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
