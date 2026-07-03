// Cliente único do Supabase (SDK oficial). Substitui o acesso REST anônimo
// anterior — agora com sessão autenticada (Google OAuth) e RLS.
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://ptvtnifhnzyayqmbpxtg.supabase.co'
const ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dnRuaWZobnp5YXlxbWJweHRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTc4MzUsImV4cCI6MjA5NDYzMzgzNX0.umrGxWPIq87t5w3vr8N53QF46ijklRncac2HNStuJS8'

export const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// E-mail da conta "raiz" que herda a pelada existente (migração do pd_state=main).
export const ROOT_EMAIL = 'jackson.computacao@gmail.com'
