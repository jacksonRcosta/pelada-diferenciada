import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { joinByToken } from './data/peladasApi'
import LoginPage from './pages/LoginPage'
import CompletarPerfilPage from './pages/CompletarPerfilPage'
import PeladasPage from './pages/PeladasPage'
import GameShell from './pages/GameShell'

function Splash({ texto }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(160deg,var(--navy),var(--navy2))',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
      fontSize: 15, fontWeight: 600,
    }}>{texto || 'Carregando...'}</div>
  )
}

// Captura ?join=<token> (convite) o quanto antes e guarda para consumir
// após o login — sobrevive ao redirect do OAuth, que não preserva a query.
const initialJoin = new URLSearchParams(window.location.search).get('join')
if (initialJoin) {
  try { localStorage.setItem('pendingJoin', initialJoin) } catch {}
  window.history.replaceState({}, '', window.location.pathname)
}

export default function App() {
  const { loading, session, profileComplete, user, signOut } = useAuth()
  const [pelada, setPelada] = useState(null) // { id, nome, role }
  const [joining, setJoining] = useState(false)

  // Consome um convite pendente assim que há sessão + perfil completo.
  useEffect(() => {
    if (!session || !profileComplete || pelada) return
    let pending
    try { pending = localStorage.getItem('pendingJoin') } catch {}
    if (!pending) return
    setJoining(true)
    joinByToken(pending)
      .then(res => {
        if (res && res.pelada_id) setPelada({ id: res.pelada_id, nome: res.nome, role: res.role })
      })
      .catch(err => console.warn('joinByToken:', err.message))
      .finally(() => {
        try { localStorage.removeItem('pendingJoin') } catch {}
        setJoining(false)
      })
  }, [session, profileComplete, pelada])

  if (loading) return <Splash texto="Carregando..." />
  if (!session) return <LoginPage />
  if (!profileComplete) return <CompletarPerfilPage />
  if (joining) return <Splash texto="Entrando na pelada..." />
  if (!pelada) return <PeladasPage onSelect={setPelada} onLogout={signOut} />

  return (
    <GameShell
      peladaId={pelada.id}
      peladaNome={pelada.nome}
      role={pelada.role || 'owner'}
      meuId={user?.id}
      onTrocarPelada={() => setPelada(null)}
      onLogout={signOut}
    />
  )
}
