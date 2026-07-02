import { SCOUTS, CARDS, TEAM_CFG } from '../lib/constants'
import { calcPoints, ptStyle, ptsLabel, avatarColor, initials, hasCounts, seasonEnded, bestByPosition, scoutSummary, shareText, seasonAwards } from '../lib/utils'
import { showToast } from '../components/Toast'

export default function RankingPage({ state, update, onOpenScout, viewOnly }) {
  const { players, teams, matchHistory, roundHistory, seasonHistory } = state

  function teamOf(pid) {
    if (!teams) return -1
    return teams.findIndex(t => t.pids.includes(pid))
  }

  function endSeason() {
    if (!window.confirm('Encerrar a temporada?\n\nO ranking atual será GUARDADO no histórico e os scouts/cartões serão zerados para iniciar uma nova temporada. Esta ação não pode ser desfeita.')) return

    // Snapshot da temporada que está sendo encerrada — guardado para consulta
    // futura na seção "Temporadas anteriores".
    const snapshot = {
      endedAt: new Date().toISOString(),
      dateStart: teams?.[0]?.dateStart || null,
      dateEnd: teams?.[0]?.dateEnd || null,
      teams: (teams || []).map((tm, t) => {
        const pls = tm.pids.map(id => players.find(p => p.id === id)).filter(Boolean)
        return { name: tm.name, pts: pls.reduce((s, p) => s + calcPoints(p.scTotal), 0) }
      }).sort((a, b) => b.pts - a.pts),
      players: players
        .map(p => ({
          name: p.name,
          pos: p.pos,
          team: (teams || []).find(t => t.pids.includes(p.id))?.name || null,
          pts: calcPoints(p.scTotal),
          sc: p.scTotal || {},
          cards: p.cardsTotal || {},
          games: p.gamesTotal || 0,
        }))
        .sort((a, b) => b.pts - a.pts),
      matchHistory: matchHistory || [],
      // Melhores por posição da temporada e destaques de cada rodada disputada.
      bestByPosition: bestByPosition(players).map(({ pos, player }) => ({
        pos, name: player.name, pts: player.pts, sc: player.sc,
      })),
      // Prêmios individuais da temporada (craque, artilheiro, xerifão, garçom).
      awards: seasonAwards(players),
      roundHistory: roundHistory || [],
    }

    const newPlayers = players.map(p => ({ ...p, sc: {}, cards: {}, scTotal: {}, cardsTotal: {}, gamesTotal: 0 }))
    update({
      players: newPlayers,
      scoreA: 0, scoreB: 0, matchFinished: false,
      matchHistory: [],
      roundHistory: [],
      seasonHistory: [snapshot, ...(seasonHistory || [])],
    })
    showToast('🏆 Temporada arquivada no histórico e scouts zerados!')
  }

  const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('pt-BR') : '—'
  const fmtPeriod = s => {
    const a = s.dateStart ? new Date(s.dateStart + 'T12:00:00').toLocaleDateString('pt-BR') : null
    const b = s.dateEnd ? new Date(s.dateEnd + 'T12:00:00').toLocaleDateString('pt-BR') : null
    if (a && b) return `${a} → ${b}`
    if (a) return `a partir de ${a}`
    return `encerrada em ${fmtDate(s.endedAt)}`
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

  // Melhores por posição da temporada atual (ao vivo, com base nos acumulados).
  const posBest = bestByPosition(players)
  const rounds = roundHistory || []

  // Prêmios da temporada (ao vivo). Cada card mostra o valor da métrica.
  const awards = seasonAwards(players)
  const AWARD_CFG = [
    { key: 'craque',     emoji: '🏆', title: 'Craque da temporada',    metric: p => `${ptsLabel(p.pts)} pts`,                       bg: '#FAEEDA', bd: '#BA7517', fg: '#633806' },
    { key: 'artilheiro', emoji: '⚽', title: 'Artilheiro da temporada', metric: p => `${(p.sc.gol || 0) + (p.sc.golplaca || 0)} gol${((p.sc.gol||0)+(p.sc.golplaca||0)) > 1 ? 's' : ''}`, bg: '#FAECE7', bd: '#993C1D', fg: '#712B13' },
    { key: 'xerifao',    emoji: '🛡️', title: 'Xerifão da temporada',    metric: p => `${(p.sc.defesa || 0) + (p.sc.desarme || 0)} defesas/desarmes`, bg: '#E1F5EE', bd: '#1D9E75', fg: '#085041' },
    { key: 'garcom',     emoji: '🎯', title: 'Garçom da temporada',     metric: p => `${p.sc.assistencia || 0} assist.`,             bg: '#EEEDFE', bd: '#534AB7', fg: '#3C3489' },
  ]
  const awardCards = AWARD_CFG.filter(c => awards[c.key])

  function shareAwards() {
    if (!awardCards.length) { showToast('Sem scouts suficientes ainda.'); return }
    const lines = ['🏆 *Pelada Diferenciada — Prêmios da temporada*', '']
    awardCards.forEach(c => {
      const p = awards[c.key]
      lines.push(`${c.emoji} ${c.title}: ${p.name} (${p.pos}) — ${c.metric(p)}`)
    })
    shareText('Prêmios da temporada', lines.join('\n'), () => showToast('🔗 Prêmios copiados!'))
  }

  function shareByPosition() {
    if (!posBest.length) { showToast('Sem scouts suficientes ainda.'); return }
    const lines = ['🏆 *Pelada Diferenciada — Melhores por posição*', '']
    posBest.forEach(({ pos, player }) => {
      lines.push(`${pos}: ${player.name} — ${ptsLabel(player.pts)} pts${scoutSummary(player.sc) ? ` (${scoutSummary(player.sc)})` : ''}`)
    })
    shareText('Melhores por posição', lines.join('\n'), () => showToast('🔗 Resumo copiado!'))
  }

  function shareRound(r) {
    const lines = ['🌟 *Pelada Diferenciada — Destaque da rodada*', '']
    if (r.mvp) lines.push(`Destaque: ${r.mvp.name} · ${r.mvp.pos} — ${ptsLabel(r.mvp.pts)} pts${scoutSummary(r.mvp.sc) ? ` (${scoutSummary(r.mvp.sc)})` : ''}`, '')
    ;(r.top || []).slice(0, 5).forEach((p, i) => lines.push(`${i + 1}. ${p.name} (${p.pos}) — ${ptsLabel(p.pts)}`))
    shareText('Destaque da rodada', lines.join('\n'), () => showToast('🔗 Resumo copiado!'))
  }

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
              <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, padding: '3px 8px', borderRadius: 8, fontWeight: 700, background: s.c.bg, color: s.c.dk, border: `1px solid ${s.c.fg}33` }}>
                <b style={{ color: s.c.fg, fontSize: 12.5 }}>{sc[s.id]}×</b> {s.name}
              </span>
            )),
            ...CARDS.filter(cd => cards[cd.id] > 0).map(cd => (
              <span key={cd.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11.5, padding: '3px 8px', borderRadius: 8, fontWeight: 700, background: cd.bg, color: cd.color, border: `1px solid ${cd.color}33` }}>{cd.emoji} <b>{cards[cd.id]}</b></span>
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
                  {(p.gamesTotal || 0) > 0 && <span style={{ background: '#eef0f3', color: 'var(--t3)', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6 }}>⚽ {p.gamesTotal} jogo{p.gamesTotal > 1 ? 's' : ''}</span>}
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

      {awardCards.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0 7px' }}>
            <div style={{ flex: 1, fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--t3)' }}>Prêmios da temporada</div>
            <button onClick={shareAwards} style={{ background: '#FAEEDA', border: '1px solid #e0c79a', color: '#633806', borderRadius: 8, fontSize: 11, fontWeight: 700, padding: '5px 9px' }}>🔗 Compartilhar</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            {awardCards.map(c => {
              const p = awards[c.key]
              return (
                <div key={c.key} style={{ background: c.bg, border: `1.5px solid ${c.bd}`, borderRadius: 14, padding: '11px 12px' }}>
                  <div style={{ fontSize: 22, lineHeight: 1 }}>{c.emoji}</div>
                  <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: .5, textTransform: 'uppercase', color: c.fg, opacity: .8, marginTop: 5 }}>{c.title}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: c.fg, marginTop: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c.fg, opacity: .85, marginTop: 1 }}>{p.pos} · {c.metric(p)}</div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {posBest.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0 7px' }}>
            <div style={{ flex: 1, fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--t3)' }}>Melhores por posição (temporada)</div>
            <button onClick={shareByPosition} style={{ background: '#FAEEDA', border: '1px solid #e0c79a', color: '#633806', borderRadius: 8, fontSize: 11, fontWeight: 700, padding: '5px 9px' }}>🔗 Compartilhar</button>
          </div>
          <div style={{ background: 'var(--sur)', borderRadius: 14, border: '1px solid var(--brd)', marginBottom: 10, overflow: 'hidden' }}>
            {posBest.map(({ pos, player }, i) => (
              <div key={pos} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 13px', borderBottom: i < posBest.length - 1 ? '1px solid rgba(0,0,0,.05)' : 'none' }}>
                <span style={{ fontSize: 18 }}>🏅</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: .5, textTransform: 'uppercase', color: 'var(--t3)' }}>{pos}</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{player.name}</div>
                  {scoutSummary(player.sc) && <div style={{ fontSize: 11, color: 'var(--t3)' }}>{scoutSummary(player.sc)}</div>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, padding: '4px 11px', borderRadius: 14, ...ptStyle(player.pts) }}>{ptsLabel(player.pts)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {rounds.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--t3)', margin: '16px 0 7px' }}>
            Destaques das rodadas ({rounds.length})
          </div>
          {rounds.map((r, ri) => (
            <details key={ri} style={{ background: 'var(--sur)', borderRadius: 14, border: '1px solid var(--brd)', marginBottom: 10, overflow: 'hidden' }}>
              <summary style={{ listStyle: 'none', cursor: 'pointer', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>🌟</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{r.mvp ? `⭐ ${r.mvp.name}` : 'Rodada'}{r.mvp ? ` · ${r.mvp.pos}` : ''}{r.mvp ? ` · ${ptsLabel(r.mvp.pts)} pts` : ''}{r.mvp && r.mvp.games ? ` · ${r.mvp.games} jogo${r.mvp.games > 1 ? 's' : ''}` : ''}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>Rodada de {fmtDate(r.endedAt)} · {r.games || (r.matches || []).length} jogo(s) na rodada</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--t3)' }}>ver ▾</span>
              </summary>
              <div style={{ borderTop: '1px solid var(--brd)', padding: '10px 14px' }}>
                {(r.top || []).length > 0 && (
                  <>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: .8, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 6 }}>Top da rodada</div>
                    {r.top.map((p, pi) => (
                      <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13 }}>
                        <span style={{ width: 18, fontWeight: 800, color: medalColors[medals[pi]] || '#ccc' }}>{pi + 1}</span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontWeight: 700 }}>{p.name}</span>
                          <span style={{ color: 'var(--t3)', fontSize: 11 }}> · {p.pos}{p.games ? ` · ${p.games} jogo${p.games > 1 ? 's' : ''}` : ''}</span>
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 10, ...ptStyle(p.pts) }}>{ptsLabel(p.pts)}</span>
                      </div>
                    ))}
                  </>
                )}
                {(r.matches || []).length > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 10 }}>
                    {r.matches.map((m, mi) => <div key={mi}>⚽ {m.nmA} {m.sA} × {m.sB} {m.nmB}</div>)}
                  </div>
                )}
                <button onClick={() => shareRound(r)} style={{ width: '100%', marginTop: 10, padding: 10, borderRadius: 9, background: '#e8eef8', border: '1px solid #c7d4ec', color: 'var(--navy)', fontSize: 12, fontWeight: 700 }}>🔗 Compartilhar destaque</button>
              </div>
            </details>
          ))}
        </>
      )}

      {(seasonHistory || []).length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--t3)', margin: '16px 0 7px' }}>
            Temporadas anteriores ({seasonHistory.length})
          </div>
          {seasonHistory.map((s, si) => {
            const champ = s.teams?.[0]
            const top = s.players?.[0]
            return (
              <details key={si} style={{ background: 'var(--sur)', borderRadius: 14, border: '1px solid var(--brd)', marginBottom: 10, overflow: 'hidden' }}>
                <summary style={{ listStyle: 'none', cursor: 'pointer', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>🏆</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{champ ? champ.name : 'Temporada'}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{fmtPeriod(s)}</div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--t3)' }}>ver ▾</span>
                </summary>
                <div style={{ borderTop: '1px solid var(--brd)', padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: .8, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 6 }}>Classificação de times</div>
                  {(s.teams || []).map((t, ti) => (
                    <div key={ti} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13 }}>
                      <span style={{ width: 18, fontWeight: 800, color: medalColors[medals[ti]] || '#ccc' }}>{ti + 1}</span>
                      <span style={{ flex: 1, fontWeight: 700 }}>{t.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 10, ...ptStyle(t.pts) }}>{ptsLabel(t.pts)}</span>
                    </div>
                  ))}
                  {top && (
                    <>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: .8, textTransform: 'uppercase', color: 'var(--t3)', margin: '10px 0 6px' }}>Artilharia / pontuação</div>
                      {s.players.slice(0, 5).map((p, pi) => (
                        <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13 }}>
                          <span style={{ width: 18, fontWeight: 800, color: medalColors[medals[pi]] || '#ccc' }}>{pi + 1}</span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontWeight: 700 }}>{p.name}</span>
                            <span style={{ color: 'var(--t3)', fontSize: 11 }}> · {p.pos}{p.team ? ' · ' + p.team : ''}{p.games ? ` · ${p.games} jogo${p.games > 1 ? 's' : ''}` : ''}</span>
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 10, ...ptStyle(p.pts) }}>{ptsLabel(p.pts)}</span>
                        </div>
                      ))}
                    </>
                  )}
                  {(s.bestByPosition || []).length > 0 && (
                    <>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: .8, textTransform: 'uppercase', color: 'var(--t3)', margin: '10px 0 6px' }}>Melhores por posição</div>
                      {s.bestByPosition.map((b, bi) => (
                        <div key={bi} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13 }}>
                          <span style={{ fontSize: 14 }}>🏅</span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ color: 'var(--t3)', fontSize: 11, textTransform: 'uppercase', fontWeight: 800 }}>{b.pos}: </span>
                            <span style={{ fontWeight: 700 }}>{b.name}</span>
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 10, ...ptStyle(b.pts) }}>{ptsLabel(b.pts)}</span>
                        </div>
                      ))}
                    </>
                  )}
                  {s.awards && (s.awards.craque || s.awards.artilheiro || s.awards.xerifao || s.awards.garcom) && (
                    <>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: .8, textTransform: 'uppercase', color: 'var(--t3)', margin: '10px 0 6px' }}>Prêmios da temporada</div>
                      {[
                        { key: 'craque',     emoji: '🏆', label: 'Craque' },
                        { key: 'artilheiro', emoji: '⚽', label: 'Artilheiro' },
                        { key: 'xerifao',    emoji: '🛡️', label: 'Xerifão' },
                        { key: 'garcom',     emoji: '🎯', label: 'Garçom' },
                      ].filter(a => s.awards[a.key]).map(a => (
                        <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13 }}>
                          <span style={{ fontSize: 14 }}>{a.emoji}</span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ color: 'var(--t3)', fontSize: 11, textTransform: 'uppercase', fontWeight: 800 }}>{a.label}: </span>
                            <span style={{ fontWeight: 700 }}>{s.awards[a.key].name}</span>
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                  {(s.roundHistory || []).length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 10 }}>🌟 {s.roundHistory.length} rodada(s) com destaque registrado.</div>
                  )}
                  {(s.matchHistory || []).length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>⚽ {s.matchHistory.length} jogo(s) disputado(s) na temporada.</div>
                  )}
                </div>
              </details>
            )
          })}
        </>
      )}

      {!viewOnly && (
        <button onClick={endSeason} style={{ width: '100%', padding: 13, borderRadius: 10, marginTop: 6, background: ended ? '#BA7517' : 'transparent', border: ended ? '1.5px solid #BA7517' : '1.5px solid #ddd', color: ended ? '#fff' : '#aaa', fontSize: 14, fontWeight: ended ? 700 : 600 }}>
          🏆 Encerrar temporada (arquivar e zerar scouts)
        </button>
      )}
    </div>
  )
}
