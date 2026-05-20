// Conexão direta via fetch REST API do Supabase
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
  console.log('loadState result:', rows)
  return rows && rows.length > 0 ? rows[0].data : null
}

export async function saveState(obj) {
  console.log('saveState chamado com:', JSON.stringify(obj).slice(0, 100))
  
  const res = await fetch(
    `${BASE_URL}/pd_state?id=eq.main`,
    {
      method: 'PATCH',
      headers: {
        ...HEADERS,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        data: obj,
        updated_at: new Date().toISOString()
      })
    }
  )

  console.log('saveState response status:', res.status)

  if (!res.ok) {
    const txt = await res.text()
    console.error('saveState error body:', txt)
    throw new Error(`saveState ${res.status}: ${txt}`)
  }
}

// Polling a cada 5 segundos para sincronização
let lastPolled = ''
export function subscribeToChanges(cb) {
  const iv = setInterval(async () => {
    try {
      const data = await loadState()
      if (data) {
        const raw = JSON.stringify(data)
        if (raw !== lastPolled) {
          lastPolled = raw
          cb(data)
        }
      }
    } catch(e) {
      console.warn('Polling error:', e.message)
    }
  }, 5000)
  return () => clearInterval(iv)
}
