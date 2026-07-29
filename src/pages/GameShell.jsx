import { useState } from 'react'
import { useGameState } from '../hooks/useGameState'
import SyncBar from '../components/SyncBar'
import Toast from '../components/Toast'
import ScoutModal from '../components/ScoutModal'
import MembrosModal from '../components/MembrosModal'
import FinanceiroModal from '../components/FinanceiroModal'
import ThemeToggle from '../components/ThemeToggle'
import { scoutsLocked } from '../lib/utils'
import PartidaPage from './PartidaPage'
import ScoutsPage from './ScoutsPage'
import TimesPage from './TimesPage'
import JogadoresPage from './JogadoresPage'
import RankingPage from './RankingPage'
import DestaquesPage from './DestaquesPage'
import HistoricoPage from './HistoricoPage'
import LOGO from '../lib/logo'

const TABS = [
  { id: 'partida',   label: 'Partida'    },
  { id: 'scouts',    label: 'Scouts'     },
  { id: 'times',     label: 'Times'      },
  { id: 'jogadores', label: 'Peladeiros' },
  { id: 'ranking',   label: 'Ranking'    },
  { id: 'destaques', label: 'Destaques'  },
  { id: 'historico', label: 'Histórico'  },
]

// UI principal do jogo, agora escopada a uma pelada (peladaId).
export default function GameShell({ peladaId, peladaNome, role = 'owner', meuId, onTrocarPelada, onLogout }) {
  const isViewer = role === 'viewer'
  const isOwner = role === 'owner'
  const canFinance = isOwner || role === 'editor'
  const { state, update, syncStatus } = useGameState(peladaId, isViewer)
  const [tab, setTab] = useState('partida')
  const [scoutPid, setScoutPid] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [membrosOpen, setMembrosOpen] = useState(false)
  const [financeiroOpen, setFinanceiroOpen] = useState(false)

  // Prazo de ajuste de scouts: expira às 12:00 do dia seguinte ao início da
  // rodada. O proprietário mantém a permissão de editar (override).
  const scoutLock = !isOwner && scoutsLocked(state.roundStartedAt)

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
            {isViewer ? '👁 Modo visualização' : 'Toque no jogador para marcar'}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, position: 'relative' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>
            {syncLabel[syncStatus] || ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ThemeToggle variant="light" size={32} />
            <button onClick={() => setMenuOpen(o => !o)} style={{ background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>
              ☰ Menu
            </button>
          </div>
          {menuOpen && (
            <div style={{ position: 'absolute', top: 44, right: 0, background: 'var(--sur)', borderRadius: 10, boxShadow: '0 8px 24px var(--shadow)', overflow: 'hidden', zIndex: 100, minWidth: 190 }}>
              {isOwner && (
                <button onClick={() => { setMenuOpen(false); setMembrosOpen(true) }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, color: 'var(--txt)', cursor: 'pointer', borderBottom: '1px solid var(--brd)' }}>
                  👥 Membros / convidar
                </button>
              )}
              {canFinance && (
                <button onClick={() => { setMenuOpen(false); setFinanceiroOpen(true) }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, color: 'var(--txt)', cursor: 'pointer', borderBottom: '1px solid var(--brd)' }}>
                  💰 Financeiro
                </button>
              )}
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

      <div style={{ display: 'flex', background: 'var(--sur)', borderBottom: '2px solid var(--brd)', position: 'sticky', top: 0, zIndex: 50 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: '1 1 0', minWidth: 0, padding: '11px 4px 10px', border: 'none', background: 'transparent',
            fontSize: 10.5, fontWeight: 700, letterSpacing: '.2px', textTransform: 'uppercase',
            textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            color: tab === t.id ? 'var(--navy)' : 'var(--t3)',
            borderBottom: tab === t.id ? '3px solid var(--navy)' : '3px solid transparent',
            marginBottom: -2, cursor: 'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: '12px 12px 100px' }}>
        {tab === 'partida'   && <PartidaPage   state={state} update={update} viewOnly={isViewer} onOpenScout={openScout} />}
        {tab === 'scouts'    && <ScoutsPage    state={state} onOpenScout={openScout} />}
        {tab === 'times'     && <TimesPage     state={state} update={update} viewOnly={isViewer} />}
        {tab === 'jogadores' && <JogadoresPage state={state} update={update} viewOnly={isViewer} />}
        {tab === 'ranking'   && <RankingPage   state={state} update={update} viewOnly={isViewer} onOpenScout={openScoutFromRanking} />}
        {tab === 'destaques' && <DestaquesPage state={state} />}
        {tab === 'historico' && <HistoricoPage state={state} />}
      </div>

      <ScoutModal
        pid={scoutPid}
        players={state.players}
        teams={state.teams}
        open={!!scoutPid}
        onClose={() => setScoutPid(null)}
        onScoutChange={handleScoutChange}
        onCardChange={handleCardChange}
        viewOnly={isViewer}
        locked={scoutLock}
      />

      <MembrosModal
        open={membrosOpen}
        onClose={() => setMembrosOpen(false)}
        peladaId={peladaId}
        peladaNome={peladaNome}
        meuId={meuId}
      />

      <FinanceiroModal
        open={financeiroOpen}
        onClose={() => setFinanceiroOpen(false)}
        state={state}
        update={update}
      />

      <Toast />
    </div>
  )
}
