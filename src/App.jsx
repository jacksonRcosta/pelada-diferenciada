import { useState } from 'react'
import { useGameState } from './hooks/useGameState'
import SyncBar from './components/SyncBar'
import Modal from './components/Modal'
import { showToast } from './components/Toast'
import Toast from './components/Toast'
import ScoutModal from './components/ScoutModal'
import PartidaPage from './pages/PartidaPage'
import ScoutsPage from './pages/ScoutsPage'
import TimesPage from './pages/TimesPage'
import JogadoresPage from './pages/JogadoresPage'
import RankingPage from './pages/RankingPage'
import LOGO from './lib/logo'

const TABS = [
  { id: 'partida',   label: 'Partida'    },
  { id: 'scouts',    label: 'Scouts'     },
  { id: 'times',     label: 'Times'      },
  { id: 'jogadores', label: 'Peladeiros' },
  { id: 'ranking',   label: 'Ranking'    },
]

const urlParams = new URLSearchParams(window.location.search)
const VIEW_ONLY = urlParams.get('view') === '1'

export default function App() {
  const { state, update, syncStatus } = useGameState(VIEW_ONLY)
  const [tab, setTab] = useState('partida')
  const [scoutPid, setScoutPid] = useState(null)
  const [shareOpen, setShareOpen] = useState(false)

  const syncLabel = {
    syncing: '⟳ sincronizando...',
    ok: '✓ sincronizado',
    error: '⚠ erro',
    idle: '● ao vivo'
  }

  // mode: 'edit' (todos podem marcar em tempo real) ou 'view' (somente leitura)
  function doShare(mode) {
    const base = window.location.origin + window.location.pathname
    const url = mode === 'view' ? base + '?view=1' : base
    const title = mode === 'view'
      ? 'Pelada Diferenciada — Visualização'
      : 'Pelada Diferenciada — Marcar pelada'
    setShareOpen(false)
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {})
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => showToast('🔗 Link copiado! Cole no WhatsApp'))
    } else {
      prompt('Copie o link:', url)
    }
  }

  function handleScoutChange(pid, sid, delta, newSc) {
    const newPlayers = state.players.map(p => p.id === pid ? { ...p, sc: newSc } : p)
    let scoreA = state.scoreA
    let scoreB = state.scoreB
    if ((sid === 'gol' || sid === 'golplaca') && !state.matchFinished) {
      const ti = state.teams ? state.teams.findIndex(t => t.pids.includes(pid)) : -1
      if (delta > 0) {
        if (ti === state.matchA) scoreA++
        else if (ti === state.matchB) scoreB++
      } else if (delta < 0) {
        if (ti === state.matchA && scoreA > 0) scoreA--
        else if (ti === state.matchB && scoreB > 0) scoreB--
      } else {
        const removed = state.players.find(p => p.id === pid)?.sc[sid] || 0
        const ti2 = state.teams ? state.teams.findIndex(t => t.pids.includes(pid)) : -1
        if (ti2 === state.matchA) scoreA = Math.max(0, scoreA - removed)
        else if (ti2 === state.matchB) scoreB = Math.max(0, scoreB - removed)
      }
    }
    update({ players: newPlayers, scoreA, scoreB })
  }

  function handleCardChange(pid, newCards) {
    const newPlayers = state.players.map(p => p.id === pid ? { ...p, cards: newCards } : p)
    update({ players: newPlayers })
  }

  function openScout(pid) { setScoutPid(pid) }
  function openScoutFromRanking(pid) { setTab('scouts'); setScoutPid(pid) }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', minHeight: '100vh', background: 'var(--bg)' }}>
      <SyncBar status={syncStatus} />

      <div style={{ background: 'linear-gradient(135deg,var(--navy),var(--navy2))', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 11 }}>
        <img src={LOGO} alt="Logo" style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,.3)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.15 }}>Pelada Diferenciada</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>
            {VIEW_ONLY ? '👁 Modo Visualização' : 'Toque no jogador para marcar'}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>
            {syncLabel[syncStatus] || ''}
          </div>
          {!VIEW_ONLY && (
            <button onClick={() => setShareOpen(true)} style={{ background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
              🔗 Compartilhar
            </button>
          )}
        </div>
      </div>

      {VIEW_ONLY && (
        <div style={{ background: '#B7770D', color: '#fff', padding: '8px 14px', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
          👁 Modo Visualização — somente leitura
        </div>
      )}

      <div style={{ display: 'flex', background: 'var(--sur)', borderBottom: '2px solid #e5e2db', position: 'sticky', top: 0, zIndex: 50 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '11px 2px 10px', border: 'none', background: 'transparent',
            fontSize: 10, fontWeight: 700, letterSpacing: '.3px', textTransform: 'uppercase',
            color: tab === t.id ? 'var(--navy)' : 'var(--t3)',
            borderBottom: tab === t.id ? '3px solid var(--navy)' : '3px solid transparent',
            marginBottom: -2, cursor: 'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: '12px 12px 100px' }}>
        {tab === 'partida'   && <PartidaPage   state={state} update={update} viewOnly={VIEW_ONLY} onOpenScout={openScout} />}
        {tab === 'scouts'    && <ScoutsPage    state={state} onOpenScout={openScout} />}
        {tab === 'times'     && <TimesPage     state={state} update={update} viewOnly={VIEW_ONLY} />}
        {tab === 'jogadores' && <JogadoresPage state={state} update={update} viewOnly={VIEW_ONLY} />}
        {tab === 'ranking'   && <RankingPage   state={state} update={update} viewOnly={VIEW_ONLY} onOpenScout={openScoutFromRanking} />}
      </div>

      <ScoutModal
        pid={scoutPid}
        players={state.players}
        teams={state.teams}
        open={!!scoutPid}
        onClose={() => setScoutPid(null)}
        onScoutChange={handleScoutChange}
        onCardChange={handleCardChange}
        viewOnly={VIEW_ONLY}
      />

      <Modal open={shareOpen} onClose={() => setShareOpen(false)}>
        <div style={{ padding: '14px 44px 10px 16px', fontSize: 16, fontWeight: 800, borderBottom: '1px solid var(--brd)', position: 'relative' }}>
          Compartilhar pelada
          <button onClick={() => setShareOpen(false)}
            style={{ position: 'absolute', top: 10, right: 12, width: 30, height: 30, borderRadius: '50%', background: '#f0ede8', color: '#888', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => doShare('edit')}
            style={{ textAlign: 'left', padding: '13px 14px', borderRadius: 12, background: 'var(--navy)', color: '#fff', border: 'none' }}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>✏ Marcar a pelada</div>
            <div style={{ fontSize: 11, opacity: .8, marginTop: 2 }}>Quem abrir pode marcar scouts em tempo real junto com você.</div>
          </button>
          <button onClick={() => doShare('view')}
            style={{ textAlign: 'left', padding: '13px 14px', borderRadius: 12, background: '#f0ede8', color: 'var(--txt)', border: '1px solid var(--brd)' }}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>👁 Somente visualização</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>Acompanha o placar e os scouts ao vivo, sem poder alterar.</div>
          </button>
        </div>
      </Modal>

      <Toast />
    </div>
  )
}
