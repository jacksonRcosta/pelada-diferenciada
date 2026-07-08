import { useState } from 'react'
import { TEAM_CFG, TEAM_NAMES } from '../lib/constants'
import { calcPoints, ptStyle, ptsLabel, shuffle, buildSchedule, initials, imageFileToDataURL, sortByPosition } from '../lib/utils'
import Avatar from '../components/Avatar'
import { showToast } from '../components/Toast'

export default function TimesPage({ state, update, viewOnly }) {
  const { players, teams, schedule } = state
  const [nTeams, setNTeams] = useState(2)
  const [ppt, setPpt] = useState(0)
  const [ds, setDs] = useState(new Date().toISOString().slice(0, 10))
  const [de, setDe] = useState('')

  function sortear() {
    if (!players.length) { showToast('Cadastre peladeiros primeiro!'); return }
    const n = Math.max(2, Math.min(6, nTeams))
    const ids = shuffle(players.map(p => p.id))
    const newTeams = Array.from({ length: n }, (_, t) => ({ name: TEAM_NAMES[t], pids: [], dateStart: ds, dateEnd: de }))
    if (ppt > 0) {
      let idx = 0
      for (let t = 0; t < n && idx < ids.length; t++)
        for (let k = 0; k < ppt && idx < ids.length; k++, idx++)
          newTeams[t].pids.push(ids[idx])
    } else {
      ids.forEach((id, i) => newTeams[i % n].pids.push(id))
    }
    const sched = buildSchedule(n)
    update({ teams: newTeams, schedule: sched, activeMatch: 0, scoreA: 0, scoreB: 0,
      matchFinished: false, matchHistory: [],
      matchA: sched[0]?.a ?? -1, matchB: sched[0]?.b ?? -1 })
    showToast('Times sorteados!')
  }

  function limpar() {
    if (!window.confirm('Limpar times?')) return
    update({ teams: null, schedule: [], activeMatch: -1, matchA: -1, matchB: -1,
      scoreA: 0, scoreB: 0, matchFinished: false, matchHistory: [] })
    showToast('Times removidos')
  }

  function rename(idx, name) {
    update({ teams: teams.map((t, i) => i === idx ? { ...t, name: name || TEAM_NAMES[i] } : t) })
  }

  function move(pid, toIdx) {
    const p = players.find(x => x.id === pid)
    const guest = !!p?.guest
    // Convidado NÃO entra escalado: fica no banco (reserva) do time. Para jogar,
    // o dono o substitui por um peladeiro na aba Partida. Peladeiro entra titular.
    const nt = teams.map(t => ({
      ...t,
      pids: t.pids.filter(id => id !== pid),
      bench: (t.bench || []).filter(id => id !== pid),
    }))
    if (guest) nt[toIdx].bench = [...(nt[toIdx].bench || []), pid]
    else nt[toIdx].pids.push(pid)
    update({ teams: nt })
    showToast(`${p?.name} → ${nt[toIdx].name}${guest ? ' (reserva)' : ''}`)
  }

  // Remove o jogador de qualquer time (volta para "Sem time").
  function removeFromTeam(pid) {
    const nt = teams.map(t => ({
      ...t,
      pids: t.pids.filter(id => id !== pid),
      bench: (t.bench || []).filter(id => id !== pid),
    }))
    const p = players.find(x => x.id === pid)
    update({ teams: nt })
    showToast(`${p?.name} saiu do time`)
  }

  async function setTeamImg(idx, file) {
    if (!file) return
    try {
      const img = await imageFileToDataURL(file)
      update({ teams: teams.map((t, i) => i === idx ? { ...t, img } : t) })
      showToast('Imagem do time atualizada!')
    } catch (e) {
      showToast('Não foi possível carregar a imagem')
    }
  }

  function removeTeamImg(idx) {
    update({ teams: teams.map((t, i) => i === idx ? { ...t, img: null } : t) })
  }

  // Jogadores cadastrados que ainda não pertencem a nenhum time (titular ou reserva).
  const inTeam = pid => teams.some(t => t.pids.includes(pid) || (t.bench || []).includes(pid))
  const unassigned = teams ? players.filter(p => !inTeam(p.id)) : []

  const inp = { padding: '11px 12px', fontSize: 16, border: '1.5px solid var(--brd)', borderRadius: 10, background: 'var(--sur2)', color: 'var(--txt)', textAlign: 'center' }
  const lbl = { display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 5 }

  return (
    <div>
      {!viewOnly && (
        <>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 7 }}>Configurar Sorteio</div>
          <div style={{ background: 'var(--sur)', borderRadius: 14, border: '1px solid var(--brd)', padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
              <div><label style={lbl}>Nº Times</label><input type="number" value={nTeams} min={2} max={6} onChange={e => setNTeams(+e.target.value)} style={{ ...inp, width: 75 }} /></div>
              <div><label style={lbl}>Jog./Time</label><input type="number" value={ppt} min={0} max={30} onChange={e => setPpt(+e.target.value)} style={{ ...inp, width: 75 }} /></div>
              <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={sortear} style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--green)', color: '#fff', fontSize: 13, fontWeight: 700 }}>⚡ Sortear</button>
                <button onClick={limpar} style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--brd)', background: 'transparent', color: 'var(--t3)', fontSize: 12, fontWeight: 700 }}>✕ Limpar</button>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={lbl}>Período de Validade</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="date" value={ds} onChange={e => setDs(e.target.value)} style={{ ...inp, flex: 1, minWidth: 110, textAlign: 'left' }} />
                <span style={{ color: 'var(--t3)', fontSize: 13, fontWeight: 700 }}>até</span>
                <input type="date" value={de} onChange={e => setDe(e.target.value)} style={{ ...inp, flex: 1, minWidth: 110, textAlign: 'left' }} />
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>Jog./Time = 0 distribui todos automaticamente</div>
          </div>
        </>
      )}

      {teams?.[0]?.dateStart && (
        <div style={{ background: 'var(--sur)', borderRadius: 14, border: '1px solid var(--brd)', padding: '10px 14px', marginBottom: 10, fontSize: 12, color: 'var(--t2)' }}>
          🗓 Período: <b>{new Date(teams[0].dateStart + 'T12:00:00').toLocaleDateString('pt-BR')}</b>
          {teams[0].dateEnd ? <> até <b>{new Date(teams[0].dateEnd + 'T12:00:00').toLocaleDateString('pt-BR')}</b></> : ''}
        </div>
      )}

      {teams && teams.length > 0 ? (
        <>
          {teams.map((tm, t) => {
            const tc = TEAM_CFG[t % TEAM_CFG.length]
            const pls = sortByPosition(tm.pids.map(id => players.find(p => p.id === id)).filter(Boolean))
            const bench = sortByPosition((tm.bench || []).map(id => players.find(p => p.id === id)).filter(Boolean))
            const tp = pls.reduce((s, p) => s + calcPoints(p.scTotal), 0)
            return (
              <div key={t} style={{ borderRadius: 14, border: `2px solid ${tc.color}`, marginBottom: 12, overflow: 'hidden', background: tc.bg }}>
                <div style={{ padding: '10px 13px', display: 'flex', alignItems: 'center', gap: 9, background: tc.color }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 800 }}>
                      {tm.img
                        ? <img src={tm.img} alt={tm.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : initials(tm.name)}
                    </div>
                    {!viewOnly && (
                      <label style={{ position: 'absolute', bottom: -3, right: -3, width: 18, height: 18, borderRadius: '50%', background: '#fff', color: tc.color, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} title="Adicionar imagem do time">
                        📷
                        <input type="file" accept="image/*" onChange={e => { setTeamImg(t, e.target.files?.[0]); e.target.value = '' }} style={{ display: 'none' }} />
                      </label>
                    )}
                  </div>
                  {viewOnly
                    ? <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', flex: 1 }}>{tm.name}</span>
                    : <input defaultValue={tm.name} onBlur={e => rename(t, e.target.value)} onClick={e => e.stopPropagation()}
                        style={{ background: 'transparent', border: 'none', borderBottom: '2px solid rgba(255,255,255,.4)', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', flex: 1, padding: '2px 0', outline: 'none' }} />
                  }
                  {!viewOnly && tm.img && (
                    <button onClick={() => removeTeamImg(t)} title="Remover imagem"
                      style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff', borderRadius: 6, fontSize: 11, fontWeight: 700, padding: '3px 6px' }}>✕</button>
                  )}
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>{pls.length} jog.</span>
                  <span style={{ fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 13, background: 'rgba(255,255,255,.25)', color: '#fff' }}>{ptsLabel(tp)} pts</span>
                </div>
                {pls.length === 0 && <div style={{ padding: '11px 13px', color: 'var(--t3)', fontSize: 13 }}>Nenhum jogador</div>}
                {pls.map(p => {
                  const pt = calcPoints(p.scTotal)
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', borderTop: '1px solid var(--divider)', background: 'var(--sur)' }}>
                      <Avatar name={p.name} index={players.indexOf(p)} size={34} fontSize={11} photo={p.photo} />
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div><div style={{ fontSize: 11, color: 'var(--t3)' }}>{p.guest ? '🎟 ' : ''}{p.pos}</div></div>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 10, marginRight: 7, flexShrink: 0, ...ptStyle(pt) }}>{ptsLabel(pt)}</span>
                      {!viewOnly && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {teams.map((_, k) => k !== t && (
                            <button key={k} onClick={() => move(p.id, k)} style={{ background: 'var(--sur3)', border: '1px solid var(--brd)', color: 'var(--t2)', borderRadius: 7, fontSize: 11, fontWeight: 700, padding: '5px 9px' }}>
                              → {teams[k].name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
                {bench.length > 0 && (
                  <>
                    <div style={{ padding: '6px 13px', fontSize: 10, fontWeight: 800, letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--t3)', background: 'var(--sur2)', borderTop: '1px dashed var(--brd)' }}>
                      🔄 Reservas ({bench.length}) · entram por substituição
                    </div>
                    {bench.map(p => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', borderTop: '1px solid var(--divider)', background: 'var(--sur2)' }}>
                        <Avatar name={p.name} index={players.indexOf(p)} size={34} fontSize={11} photo={p.photo} />
                        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div><div style={{ fontSize: 11, color: 'var(--t3)' }}>{p.guest ? '🎟 ' : ''}{p.pos} · reserva</div></div>
                        {!viewOnly && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {teams.map((_, k) => k !== t && (
                              <button key={k} onClick={() => move(p.id, k)} style={{ background: 'var(--sur3)', border: '1px solid var(--brd)', color: 'var(--t2)', borderRadius: 7, fontSize: 11, fontWeight: 700, padding: '5px 9px' }}>
                                → {teams[k].name}
                              </button>
                            ))}
                            <button onClick={() => removeFromTeam(p.id)} style={{ background: '#fce8e8', color: 'var(--red)', border: '1px solid #f0c9c9', borderRadius: 7, fontSize: 11, fontWeight: 700, padding: '5px 9px' }}>
                              ✕ Tirar
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )
          })}
          {unassigned.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--t3)', margin: '14px 0 7px' }}>Sem time ({unassigned.length})</div>
              <div style={{ borderRadius: 14, border: '2px dashed var(--brd)', marginBottom: 12, overflow: 'hidden', background: 'var(--sur)' }}>
                {unassigned.map(p => {
                  const pt = calcPoints(p.scTotal)
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', borderTop: '1px solid var(--divider)' }}>
                      <Avatar name={p.name} index={players.indexOf(p)} size={34} fontSize={11} photo={p.photo} />
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div><div style={{ fontSize: 11, color: 'var(--t3)' }}>{p.guest ? '🎟 ' : ''}{p.pos}</div></div>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 10, marginRight: 7, flexShrink: 0, ...ptStyle(pt) }}>{ptsLabel(pt)}</span>
                      {!viewOnly && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {teams.map((tm, k) => (
                            <button key={k} onClick={() => move(p.id, k)} style={{ background: 'var(--sur3)', border: '1px solid var(--brd)', color: 'var(--t2)', borderRadius: 7, fontSize: 11, fontWeight: 700, padding: '5px 9px' }}>
                              → {tm.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--t3)', margin: '14px 0 7px' }}>Agenda</div>
          <div style={{ background: 'var(--sur)', borderRadius: 14, border: '1px solid var(--brd)', overflow: 'hidden' }}>
            {schedule.map((g, i) => {
              const nmA = teams[g.a]?.name || '?', nmB = teams[g.b]?.name || '?'
              const cA = TEAM_CFG[g.a % TEAM_CFG.length], cB = TEAM_CFG[g.b % TEAM_CFG.length]
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 13px', borderBottom: i < schedule.length - 1 ? '1px solid var(--divider)' : 'none' }}>
                  <div style={{ flex: 1, fontSize: 12 }}>
                    {g.done && <span style={{ fontSize: 10, background: '#e8eef8', color: 'var(--navy)', borderRadius: 6, padding: '1px 6px', fontWeight: 700, marginRight: 4 }}>Enc.</span>}
                    <b style={{ color: 'var(--t2)' }}>Jogo {i + 1}: </b>
                    <span style={{ fontWeight: 700, color: cA.color }}>{nmA}</span>
                    <span style={{ color: 'var(--t3)', margin: '0 4px' }}>×</span>
                    <span style={{ fontWeight: 700, color: cB.color }}>{nmB}</span>
                    {g.done && <span style={{ color: 'var(--t3)', marginLeft: 4 }}>({g.scoreA}×{g.scoreB})</span>}
                  </div>
                  {!viewOnly && (
                    <button onClick={() => update({ schedule: schedule.map((s, si) => si === i ? { ...s, a: s.b, b: s.a } : s) })}
                      style={{ background: 'var(--sur3)', border: '1px solid var(--brd)', color: 'var(--t2)', borderRadius: 7, fontSize: 11, fontWeight: 700, padding: '5px 9px' }}>⇄</button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 12px', color: 'var(--t3)', fontSize: 13, lineHeight: 1.9 }}>
          Nenhum time sorteado ainda.<br />Configure acima e toque em <b>⚡ Sortear</b>.
        </div>
      )}
    </div>
  )
}
