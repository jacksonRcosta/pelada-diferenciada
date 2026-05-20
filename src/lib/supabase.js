// Conexão direta via fetch — sem biblioteca Supabase
const URL  = 'https://ptvtnifhnzyayqmbpxtg.supabase.co'
const KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dnRuaWZobnp5YXlxbWJweHRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTc4MzUsImV4cCI6MjA5NDYzMzgzNX0.umrGxWPIq87t5w3vr8N53QF46ijklRncac2HNStuJS8'

const HEADERS = {
  'apikey': KEY,
  'Authorization': 'Bearer ' + KEY,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Prefer': 'return=minimal'
}

export const supabase = null // não usado diretamente

export async function loadState() {
  const res = await fetch(
    `${URL}/rest/v1/pd_state?id=eq.main&select=data`,
    { headers: { ...HEADERS, 'Prefer': 'return=representation' } }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`loadState ${res.status}: ${err}`)
  }
  const rows = await res.json()
  return rows && rows.length > 0 ? rows[0].data : null
}

export async function saveState(obj) {
  // Primeiro tenta UPDATE
  const res = await fetch(
    `${URL}/rest/v1/pd_state?id=eq.main`,
    {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({ data: obj, updated_at: new Date().toISOString() })
    }
  )
  if (!res.ok) {
    const err = await res.text()
    // Se não existe, tenta INSERT
    if (res.status === 404 || res.status === 406) {
      const res2 = await fetch(
        `${URL}/rest/v1/pd_state`,
        {
          method: 'POST',
          headers: HEADERS,
          body: JSON.stringify({ id: 'main', data: obj, updated_at: new Date().toISOString() })
        }
      )
      if (!res2.ok) {
        const err2 = await res2.text()
        throw new Error(`saveState INSERT ${res2.status}: ${err2}`)
      }
    } else {
      throw new Error(`saveState PATCH ${res.status}: ${err}`)
    }
  }
}

export function subscribeToChanges(cb) {
  // Polling a cada 5 segundos como fallback
  const iv = setInterval(async () => {
    try {
      const state = await loadState()
      if (state) cb(state)
    } catch(e) {
      // silencioso
    }
  }, 5000)
  return () => clearInterval(iv)
}
