import { useState } from 'react'
import { useAuth } from './context/AuthContext'
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

export default function App() {
  const { loading, session, profileComplete, signOut } = useAuth()
  const [pelada, setPelada] = useState(null) // { id, nome }

  if (loading) return <Splash texto="Carregando..." />

  // 1) Sem sessão -> tela de login "Peladeiros"
  if (!session) return <LoginPage />

  // 2) Sessão sem perfil completo -> completar nome/telefone
  if (!profileComplete) return <CompletarPerfilPage />

  // 3) Sem pelada selecionada -> "Minhas Peladas"
  if (!pelada) return <PeladasPage onSelect={setPelada} onLogout={signOut} />

  // 4) Pelada selecionada -> app do jogo
  return (
    <GameShell
      peladaId={pelada.id}
      peladaNome={pelada.nome}
      onTrocarPelada={() => setPelada(null)}
      onLogout={signOut}
    />
  )
}
