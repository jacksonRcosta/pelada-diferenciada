import { SCOUTS, CARDS, TEAM_CFG } from '../lib/constants'
import { calcPoints, ptStyle, ptsLabel, avatarColor, initials, hasCounts, seasonEnded } from '../lib/utils'
import { showToast } from '../components/Toast'

export default function RankingPage({ state, update, onOpenScout, viewOnly }) {
  const { players, teams } = state

  function teamOf(pid) {
    if (!teams) return -1
    return teams.findIndex(t => t.pids.includes(pid))
  }

  function endSeason() {
    if (!window.confirm('Encerrar a temporada?\n\nIsto zera TODOS os scouts e cartões (total da temporada e partida atual). Esta ação não pode ser desfeita.')) return
    const newPlayers = players.map(p => ({ ...p, sc: {}, cards: {}, scTotal: {}, cardsTotal: {} }))
    update({ players: newPlayers, scoreA: 0, scoreB: 0, matchFinished: false })
    showToast('🔄 Temporada encerrada e scouts zerados!')
  }

  // O ranking reflete o TOTAL DA TEMPORADA (scouts já contabilizados ao
  // finalizar cada partida). A partida em andamento entra após finalizada.
  const teamRanking = teams && teams.length > 0
    ? teams.map((tm, t) => {
        const pls = tm.pids.map(id => players.find(p => p.id === id)).filter(Boolean)
        return { name: tm.name, pts: pls.reduce((s, p) => s + calcPoints(p.scTotal), 0), ti: t }
      }).sort((a, b) => b.pts - a.pts)
    : []

  // Individual ranking
  const sorted = players.slice()
    .map((p, i) => ({ p, oi: i }))
    .sort((a, b) => calcPoints(b.p.scTotal) - calcPoints(a.p.scTotal))

  const dateEnd = teams?.[0]?.dateEnd
  const ended = seasonEnded(dateEnd)
  const pendingMatch = players.some(p => hasCounts(p.sc) || hasCounts(p.cards))

  const medals = ['g', 's', 'b']
  const medalColors = { g: '#BA7517', s: '#888', b: '#993C1D' }

  return (
    <div>
      {ended && (
        <div style={{ background: '#FAEEDA', border: '1.5px solid #BA7517', borderRadius: 12, padding: '11px 14px', marginBottom: 10, fontSize: 12.5, color: '#633806', lineHeight: 1.5 }}>
          🗓 <b>Temporada encerrada</b> — o período definido (até {new Date(dateEnd + 'T12:00:00').toLocaleDateString('pt-BR')}) já terminou.
          {!viewOnly && ' Você pode zerar os scouts para iniciar uma nova temporada no botão abaixo.'}
        </div>
      )}

      {pendingMatch && (
        <div style={{ background: '#E8F1FB', border: '1.5px solid #155FA0', borderRadius: 12, padding: '11px 14px', marginBottom: 10, fontSize: 12.5, color: '#0C447C', lineHeight: 1.5 }}>
          ⚽ Há scouts de uma <b>partida em andamento</b> ainda não contabilizados. Finalize a partida na aba <b>Partida</b> para somá-los ao total da temporada.
        </div>
      )}

      {teamRanking.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 7 }}>Placar por Times</div>
          <div style={{ background: 'var(--sur)', borderRadius: 14, border: '1px solid var(--brd)', marginBottom: 10, overflow: 'hidden' }}>
            {teamRanking.map((d, i) => {
              const tc = TEAM_CFG[d.ti % TEAM_CFG.length]
              return (
                <div key={d.ti} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 13px', borderBottom: i < teamRanking.length - 1 ? '1px solid rgba(0,0,0,.05)' : 'none' }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: medalColors[medals[i]] || '#ccc', width: 22, textAlign: 'center' }}>
                    {i + 1}
                  </span>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: tc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {d.name.replace('Time ', '')}
                  </div>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{d.name}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, padding: '4px 11px', borderRadius: 14, ...ptStyle(d.pts) }}>{ptsLabel(d.pts)}</div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 7 }}>Placar Individual</div>
      <div style={{ background: 'var(--sur)', borderRadius: 14, border: '1px solid var(--brd)', marginBottom: 10, overflow: 'hidden' }}>
        {sorted.length === 0 && <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--t3)', fontSize: 13 }}>Sem dados ainda.</div>}
        {sorted.map(({ p, oi }, i) => {
          const sc = p.scTotal || {}
          const cards = p.cardsTotal || {}
          const pt = calcPoints(sc)
          const [bg, fg] = avatarColor(oi)
          const ti = teamOf(p.id)
          const tc = ti >= 0 ? TEAM_CFG[ti % TEAM_CFG.length] : null
          const pills = [
            ...SCOUTS.filter(s => sc[s.id] > 0).map(s => (
              <span key={s.id} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 7, fontWeight: 700, background: s.c.bg, color: s.c.dk }}>{sc[s.id]}× {s.name}</span>
            )),
            ...CARDS.filter(cd => cards[cd.id] > 0).map(cd => (
              <span key={cd.id} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 7, fontWeight: 700, background: cd.bg, color: cd.color }}>{cd.emoji} {cards[cd.id]}</span>
            ))
          ]
          return (
            <div key={p.id} onClick={() => onOpenScout(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 13px', borderBottom: i < sorted.length - 1 ? '1px solid rgba(0,0,0,.05)' : 'none', cursor: 'pointer' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: medalColors[medals[i]] || '#ccc', width: 22, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{initials(p.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                  {p.name}
                  {tc && <span style={{ background: tc.color, color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6 }}>{teams[ti].name}</span>}
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                  {pills.length > 0 ? pills : <span style={{ fontSize: 11, color: '#ccc' }}>sem scouts</span>}
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, padding: '4px 11px', borderRadius: 14, flexShrink: 0, ...ptStyle(pt) }}>{ptsLabel(pt)}</div>
              <div style={{ color: '#ccc', fontSize: 18, marginLeft: 4 }}>›</div>
            </div>
          )
        })}
      </div>

      {!viewOnly && (
        <button onClick={endSeason} style={{ width: '100%', padding: 13, borderRadius: 10, background: ended ? '#BA7517' : 'transparent', border: ended ? '1.5px solid #BA7517' : '1.5px solid #ddd', color: ended ? '#fff' : '#aaa', fontSize: 14, fontWeight: ended ? 700 : 600 }}>
          🔄 Encerrar temporada (zerar scouts)
        </button>
      )}
    </div>
  )
}
