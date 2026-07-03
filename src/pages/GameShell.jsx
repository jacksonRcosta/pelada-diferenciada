import { useState } from 'react'
import { useGameState } from '../hooks/useGameState'
import SyncBar from '../components/SyncBar'
import Toast from '../components/Toast'
import ScoutModal from '../components/ScoutModal'
import PartidaPage from './PartidaPage'
import ScoutsPage from './ScoutsPage'
import TimesPage from './TimesPage'
import JogadoresPage from './JogadoresPage'
import RankingPage from './RankingPage'
import DestaquesPage from './DestaquesPage'
import LOGO from '../lib/logo'

const TABS = [
  { id: 'partida',   label: 'Partida'    },
  { id: 'scouts',    label: 'Scouts'     },
  { id: 'times',     label: 'Times'      },
  { id: 'jogadores', label: 'Peladeiros' },
  { id: 'ranking',   label: 'Ranking'    },
  { id: 'destaques', label: 'Destaques'  },
]

// UI principal do jogo, agora escopada a uma pelada (peladaId).
export default function GameShell({ peladaId, peladaNome, onTrocarPelada, onLogout }) {
  const { state, update, syncStatus } = useGameState(peladaId, false)
  const [tab, setTab] = useState('partida')
  const [scoutPid, setScoutPid] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const syncLabel = {
    syncing: '⟳ sincronizando...',
    ok: '✓ sincronizado',
    error: '⚠ erro',
    idle: '● ao vivo'
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {peladaNome || 'Pelada'}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>
            Toque no jogador para marcar
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, position: 'relative' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>
            {syncLabel[syncStatus] || ''}
          </div>
          <button onClick={() => setMenuOpen(o => !o)} style={{ background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>
            ☰ Menu
          </button>
          {menuOpen && (
            <div style={{ position: 'absolute', top: 44, right: 0, background: '#fff', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.25)', overflow: 'hidden', zIndex: 100, minWidth: 190 }}>
              <button onClick={() => { setMenuOpen(false); onTrocarPelada && onTrocarPelada() }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, color: 'var(--txt)', cursor: 'pointer', borderBottom: '1px solid var(--brd)' }}>
                🔄 Trocar de pelada
              </button>
              <button onClick={() => { setMenuOpen(false); onLogout && onLogout() }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, color: '#A32D2D', cursor: 'pointer' }}>
                🚪 Sair
              </button>
            </div>
          )}
        </div>
      </div>

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
        {tab === 'partida'   && <PartidaPage   state={state} update={update} viewOnly={false} onOpenScout={openScout} />}
        {tab === 'scouts'    && <ScoutsPage    state={state} onOpenScout={openScout} />}
        {tab === 'times'     && <TimesPage     state={state} update={update} viewOnly={false} />}
        {tab === 'jogadores' && <JogadoresPage state={state} update={update} viewOnly={false} />}
        {tab === 'ranking'   && <RankingPage   state={state} update={update} viewOnly={false} onOpenScout={openScoutFromRanking} />}
        {tab === 'destaques' && <DestaquesPage state={state} />}
      </div>

      <ScoutModal
        pid={scoutPid}
        players={state.players}
        teams={state.teams}
        open={!!scoutPid}
        onClose={() => setScoutPid(null)}
        onScoutChange={handleScoutChange}
        onCardChange={handleCardChange}
        viewOnly={false}
      />

      <Toast />
    </div>
  )
}
