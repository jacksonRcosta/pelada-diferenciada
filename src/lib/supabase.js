const BASE_URL = 'https://ptvtnifhnzyayqmbpxtg.supabase.co/rest/v1'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dnRuaWZobnp5YXlxbWJweHRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTc4MzUsImV4cCI6MjA5NDYzMzgzNX0.umrGxWPIq87t5w3vr8N53QF46ijklRncac2HNStuJS8'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dnRuaWZobnp5YXlxbWJweHRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTA1NzgzNSwiZXhwIjoyMDk0NjMzODM1fQ.jgENfFrRp_lj4QyckNYygKwmIO8swJBjmjCosQXxjKg'

// Leitura usa anon key (público)
const READ_HEADERS = {
  'apikey': ANON_KEY,
  'Authorization': 'Bearer ' + ANON_KEY,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}

// Escrita usa service_role key (bypassa RLS)
const WRITE_HEADERS = {
  'apikey': SERVICE_KEY,
  'Authorization': 'Bearer ' + SERVICE_KEY,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}

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

  const res = await fetch(
    BASE_URL + '/pd_state?id=eq.main',
    {
      method: 'PATCH',
      headers: { ...WRITE_HEADERS, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
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
