import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, SITE_URL } from '../lib/supabaseClient'

const AuthContext = createContext(null)

// Considera o perfil "completo" quando já temos nome e telefone gravados
// na tabela profiles. Nome/e-mail costumam vir do Google; telefone é pedido.
function isProfileComplete(profile) {
  return !!(profile && profile.nome_completo && profile.telefone)
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Carrega (ou cria) a linha de profiles do usuário logado.
  const loadProfile = useCallback(async (user) => {
    if (!user) { setProfile(null); return }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (error) { console.warn('loadProfile:', error.message) }

    if (data) {
      setProfile(data)
      return
    }

    // Primeiro login: cria o perfil com o que o Google fornece.
    const meta = user.user_metadata || {}
    const novo = {
      id: user.id,
      email: user.email || '',
      nome_completo: meta.full_name || meta.name || '',
      telefone: '',
    }
    const { data: inserted, error: insErr } = await supabase
      .from('profiles')
      .insert(novo)
      .select()
      .maybeSingle()
    if (insErr) console.warn('createProfile:', insErr.message)
    setProfile(inserted || novo)
  }, [])

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      await loadProfile(data.session?.user)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess)
      await loadProfile(sess?.user)
      setLoading(false)
    })

    return () => { active = false; sub?.subscription?.unsubscribe() }
  }, [loadProfile])

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: SITE_URL },
    })
    if (error) console.error('signInWithGoogle:', error.message)
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    await loadProfile(session?.user)
  }, [loadProfile, session])

  const value = {
    session,
    user: session?.user || null,
    profile,
    profileComplete: isProfileComplete(profile),
    loading,
    signInWithGoogle,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
