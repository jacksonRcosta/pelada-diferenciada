import { useState, useEffect, useRef } from 'react'
import { useAuth } from './context/AuthContext'
import { joinByToken } from './data/peladasApi'
import { showToast } from './components/Toast'
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

function readPendingJoin() {
  try { return localStorage.getItem('pendingJoin') } catch { return null }
}
function clearPendingJoin() {
  try { localStorage.removeItem('pendingJoin') } catch {}
}

export default function App() {
  const { loading, session, profileComplete, user, signOut } = useAuth()
  const [pelada, setPelada] = useState(null) // { id, nome, role }
  const [joining, setJoining] = useState(false)
  const [pendingJoin, setPendingJoin] = useState(readPendingJoin)
  const triedRef = useRef(false) // evita reprocessar o mesmo convite em loop

  // Consome um convite pendente assim que há sessão + perfil completo.
  // Só remove o token em caso de SUCESSO — assim uma falha transitória não
  // perde o convite; o usuário consegue tentar de novo pela tela de Peladas.
  useEffect(() => {
    if (!session || !profileComplete || pelada || !pendingJoin || triedRef.current) return
    triedRef.current = true
    setJoining(true)
    joinByToken(pendingJoin)
      .then(res => {
        if (!res || !res.pelada_id) throw new Error('convite não retornou a pelada')
        clearPendingJoin()
        setPendingJoin(null)
        setPelada({ id: res.pelada_id, nome: res.nome, role: res.role })
      })
      .catch(err => {
        console.warn('joinByToken:', err.message)
        showToast('Não foi possível entrar pelo convite: ' + err.message)
        // Mantém o token: a PeladasPage oferece "Entrar na pelada convidada".
      })
      .finally(() => setJoining(false))
  }, [session, profileComplete, pelada, pendingJoin])

  // Nova tentativa manual (banner da PeladasPage). Ao dar certo, abre a pelada.
  async function retryJoin() {
    const token = pendingJoin || readPendingJoin()
    if (!token) return
    setJoining(true)
    try {
      const res = await joinByToken(token)
      if (!res || !res.pelada_id) throw new Error('convite não retornou a pelada')
      clearPendingJoin()
      setPendingJoin(null)
      setPelada({ id: res.pelada_id, nome: res.nome, role: res.role })
    } catch (err) {
      showToast('Não foi possível entrar pelo convite: ' + err.message)
    } finally {
      setJoining(false)
    }
  }

  function dismissJoin() {
    clearPendingJoin()
    setPendingJoin(null)
  }

  if (loading) return <Splash texto="Carregando..." />
  if (!session) return <LoginPage />
  if (!profileComplete) return <CompletarPerfilPage />
  if (joining) return <Splash texto="Entrando na pelada..." />
  if (!pelada) return (
    <PeladasPage
      onSelect={setPelada}
      onLogout={signOut}
      pendingJoin={pendingJoin}
      onRetryJoin={retryJoin}
      onDismissJoin={dismissJoin}
    />
  )

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
