import { TEAM_CFG } from '../lib/constants'
import { calcPoints, ptsLabel } from '../lib/utils'
import PlayerButton from '../components/PlayerButton'

export default function ScoutsPage({ state, onOpenScout }) {
  const { players, teams } = state
  if (!players.length)
    return <div style={{ textAlign: 'center', padding: '40px 12px', color: 'var(--t3)', fontSize: 13, lineHeight: 1.9 }}>Cadastre peladeiros na aba <b>Peladeiros</b>.</div>

  const rendered = new Set()
  const groups = []
  if (teams?.length) {
    teams.forEach((tm, t) => {
      const tc = TEAM_CFG[t % TEAM_CFG.length]
      const pls = tm.pids.map(id => players.find(p => p.id === id)).filter(Boolean)
      pls.forEach(p => rendered.add(p.id))
      groups.push({ label: tm.name, pls, tc, tp: pls.reduce((s, p) => s + calcPoints(p.sc), 0) })
    })
    const un = players.filter(p => !rendered.has(p.id))
    if (un.length) groups.push({ label: 'Sem Time', pls: un, tc: null, tp: 0 })
  } else {
    groups.push({ label: null, pls: players, tc: null, tp: 0 })
  }

  return (
    <div>
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.label && (
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 13px', borderRadius: 12, marginBottom: 7, background: g.tc ? g.tc.color : '#bbb' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', flex: 1 }}>{g.label} <span style={{ fontSize: 11, opacity: .7 }}>({g.pls.length})</span></span>
              {g.tc && <span style={{ fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 13, background: 'rgba(255,255,255,.25)', color: '#fff' }}>{ptsLabel(g.tp)} pts</span>}
            </div>
          )}
          {g.pls.map(p => <PlayerButton key={p.id} player={p} index={players.indexOf(p)} onClick={() => onOpenScout(p.id)} />)}
        </div>
      ))}
    </div>
  )
}
