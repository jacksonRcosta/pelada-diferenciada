import { useState } from 'react'
import { TEAM_CFG, CARDS } from '../lib/constants'
import { calcPoints, ptStyle, ptsLabel, formatTime, initials, avatarColor, mergeScouts, hasCounts } from '../lib/utils'
import { useTimer } from '../hooks/useTimer'
import Modal from '../components/Modal'
import { showToast } from '../components/Toast'

export default function PartidaPage({ state, update, viewOnly, onOpenScout }) {
  const { players, teams, schedule, activeMatch, matchA, matchB, scoreA, scoreB, matchFinished, matchHistory } = state
  const timer = useTimer(25)
  const [subPid, setSubPid] = useState(null)
  const [subTidx, setSubTidx] = useState(-1)

  if (!teams || !teams.length) {
    return (
      <div style={{ textAlign:'center', padding:'40px 12px', color:'var(--t3)', fontSize:13, lineHeight:1.9 }}>
        Sorteie os times na aba <b>Times</b><br />para configurar as partidas.
      </div>
    )
  }

  const tmA = matchA >= 0 && matchA < teams.length ? teams[matchA] : null
  const tmB = matchB >= 0 && matchB < teams.length ? teams[matchB] : null
  const tcA = tmA ? TEAM_CFG[matchA % TEAM_CFG.length] : null
  const tcB = tmB ? TEAM_CFG[matchB % TEAM_CFG.length] : null
  const plsA = tmA ? tmA.pids.map(id => players.find(p => p.id === id)).filter(Boolean) : []
  const plsB = tmB ? tmB.pids.map(id => players.find(p => p.id === id)).filter(Boolean) : []

  function setMatch(mi) {
    const g = schedule[mi]
    if (!g) return
    update({
      activeMatch: mi,
      matchA: g.a, matchB: g.b,
      scoreA: g.done ? g.scoreA : 0,
      scoreB: g.done ? g.scoreB : 0,
      matchFinished: !!g.done
    })
    if (!g.done) timer.reset()
    showToast(`Jogo ${mi + 1} ativo!`)
  }

  function adjustScore(side, delta) {
    if (viewOnly || matchFinished) return
    if (side === 'A') update({ scoreA: Math.max(0, scoreA + delta) })
    else update({ scoreB: Math.max(0, scoreB + delta) })
  }

  function finishMatch() {
    if (!window.confirm(`Finalizar?\n${tmA?.name} ${scoreA} × ${scoreB} ${tmB?.name}`)) return
    timer.pause()
    const ns = schedule.map((g, i) => i === activeMatch ? { ...g, done: true, scoreA, scoreB } : g)
    const nh = [...(matchHistory || []), { nmA: tmA?.name, nmB: tmB?.name, sA: scoreA, sB: scoreB }]
    // Contabiliza os scouts/cartões da partida no total da temporada e zera a
    // partida atual para o próximo jogo.
    const np = players.map(p => {
      if (!hasCounts(p.sc) && !hasCounts(p.cards)) return p
      return {
        ...p,
        scTotal: mergeScouts(p.scTotal, p.sc),
        cardsTotal: mergeScouts(p.cardsTotal, p.cards),
        sc: {},
        cards: {},
      }
    })
    update({ matchFinished: true, schedule: ns, matchHistory: nh, players: np })
    showToast('🏁 Partida encerrada! Scouts contabilizados na temporada.')
  }

  function doSub(newPid) {
    const nt = teams.map((t, i) => i === subTidx ? { ...t, pids: t.pids.map(id => id === subPid ? newPid : id) } : t)
    const op = players.find(p => p.id === subPid)
    const np = players.find(p => p.id === newPid)
    update({ teams: nt })
    setSubPid(null)
    setSubTidx(-1)
    showToast(`${op?.name} ⇄ ${np?.name}`)
  }

  const cands = subTidx >= 0 && teams[subTidx]
    ? players.filter(p => !teams[subTidx].pids.includes(p.id))
    : []

  const timerColor = timer.status === 'running' ? 'var(--green)' : timer.status === 'overtime' ? 'var(--red)' : 'var(--navy)'

  const cardStyle = (extra = {}) => ({
    background: 'var(--sur)', borderRadius: 14, border: '1px solid var(--brd)', marginBottom: 10, overflow: 'hidden', ...extra
  })

  return (
    <div>
      {/* PLACAR */}
      {tmA && tmB && (
        <div style={{ background:'linear-gradient(135deg,var(--navy),var(--navy2))', borderRadius:16, marginBottom:12, overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'stretch' }}>
            {[{ tm: tmA, score: scoreA, side: 'A' }, { tm: tmB, score: scoreB, side: 'B' }].map((s, i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'16px 10px 12px', gap:4 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,.85)', textAlign:'center' }}>{s.tm.name}</div>
                <div style={{ fontSize:56, fontWeight:900, color:'#fff', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{s.score}</div>
                {!viewOnly && !matchFinished && (
                  <div style={{ display:'flex', gap:8, marginTop:4 }}>
                    <button onClick={() => adjustScore(s.side, -1)} aria-label={`Diminuir gol ${s.tm.name}`}
                      style={{ width:34, height:34, borderRadius:9, background:'rgba(255,255,255,.18)', border:'1px solid rgba(255,255,255,.3)', color:'#fff', fontSize:20, fontWeight:800, lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                    <button onClick={() => adjustScore(s.side, 1)} aria-label={`Aumentar gol ${s.tm.name}`}
                      style={{ width:34, height:34, borderRadius:9, background:'rgba(255,255,255,.18)', border:'1px solid rgba(255,255,255,.3)', color:'#fff', fontSize:20, fontWeight:800, lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                  </div>
                )}
              </div>
            ))}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'0 8px', fontSize:18, fontWeight:800, color:'rgba(255,255,255,.4)' }}>X</div>
          </div>
          <div style={{ textAlign:'center', padding:8, fontSize:12, fontWeight:700, color: matchFinished ? 'var(--gold)' : 'rgba(255,255,255,.7)', borderTop:'1px solid rgba(255,255,255,.1)' }}>
            {matchFinished
              ? `🏆 Encerrada — ${tmA.name} ${scoreA} × ${scoreB} ${tmB.name}`
              : `Jogo ${(activeMatch ?? -1) + 1} em andamento`}
          </div>
          {!viewOnly && !matchFinished && (
            <div style={{ textAlign:'center', padding:'0 8px 8px', fontSize:10, color:'rgba(255,255,255,.5)' }}>
              O placar sobe ao marcar Gol no scout; use +/− para ajustes manuais.
            </div>
          )}
        </div>
      )}

      {/* FINALIZAR (logo abaixo do placar) */}
      {!viewOnly && tmA && tmB && !matchFinished && (
        <button onClick={finishMatch} style={{ width:'100%', padding:14, borderRadius:11, background:'var(--red)', color:'#fff', fontSize:15, fontWeight:700, marginBottom:12 }}>
          🏁 Finalizar Partida
        </button>
      )}

      {/* CRONÔMETRO */}
      {tmA && tmB && !matchFinished && (
        <div style={cardStyle()}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 13px', background:'#f0ede8', borderBottom:'1px solid var(--brd)', flexWrap:'wrap' }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--t3)' }}>Duração (min):</label>
            <input type="number" defaultValue={25} min={1} max={120}
              onChange={e => timer.setMin(+e.target.value || 25)}
              style={{ width:62, padding:'7px 10px', fontSize:15, border:'1.5px solid #ddd', borderRadius:8, background:'var(--sur)', color:'var(--txt)', textAlign:'center', marginLeft:6 }} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 13px', background:'#f9f8f5' }}>
            <button onClick={timer.reset} style={{ width:44, height:44, borderRadius:10, background:'#f0f0ec', color:'#555', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center' }}>↺</button>
            <div style={{ flex:1, textAlign:'center', fontSize:28, fontWeight:800, fontFamily:'monospace', fontVariantNumeric:'tabular-nums', color:timerColor }}>
              {formatTime(timer.secs)}
            </div>
            {timer.running
              ? <button onClick={timer.pause} style={{ width:44, height:44, borderRadius:10, background:'#fce8e8', color:'var(--red)', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center' }}>⏸</button>
              : <button onClick={timer.start} style={{ width:44, height:44, borderRadius:10, background:'#e8eef8', color:'var(--navy)', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center' }}>▶</button>
            }
          </div>
        </div>
      )}

      {/* COLUNAS */}
      {tmA && tmB && (
        <div style={cardStyle()}>
          <div style={{ display:'flex' }}>
            {[[plsA, tcA, tmA, matchA], [plsB, tcB, tmB, matchB]].map(([pls, tcc, tm, tidx], side) => (
              <div key={side} style={{ flex:1, borderTop:'1px solid var(--brd)', ...(side === 1 ? { borderLeft:'1px solid var(--brd)' } : {}) }}>
                <div style={{ padding:'8px 10px', fontSize:11, fontWeight:800, letterSpacing:'.5px', color:'#fff', textAlign:'center', background:tcc.color }}>{tm.name}</div>
                {pls.map(pp => {
                  const [bg, fg] = avatarColor(players.indexOf(pp))
                  const pt = calcPoints(pp.sc)
                  const ctags = CARDS.filter(cd => (pp.cards || {})[cd.id] > 0).map(cd => `${cd.emoji}×${(pp.cards || {})[cd.id]}`).join(' ')
                  return (
                    <button key={pp.id} onClick={() => onOpenScout(pp.id)}
                      style={{ width:'100%', padding:'9px 10px', background:'transparent', borderTop:'1px solid rgba(0,0,0,.06)', display:'flex', alignItems:'center', gap:7, textAlign:'left' }}>
                      <div style={{ width:30, height:30, borderRadius:'50%', background:bg, color:fg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0 }}>
                        {initials(pp.name)}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pp.name}</div>
                        <div style={{ fontSize:10, color:'var(--t3)' }}>{pp.pos}{ctags ? ' ' + ctags : ''}</div>
                      </div>
                      <div style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:9, flexShrink:0, ...ptStyle(pt) }}>{ptsLabel(pt)}</div>
                    </button>
                  )
                })}
                {pls.length === 0 && <div style={{ padding:10, fontSize:12, color:'var(--t3)' }}>Sem jogadores</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBSTITUIÇÕES */}
      {!viewOnly && tmA && tmB && !matchFinished && (
        <div style={cardStyle()}>
          <div style={{ padding:'8px 13px', background:'#fffbf0', display:'flex', flexWrap:'wrap', gap:5 }}>
            <div style={{ width:'100%', fontSize:10, fontWeight:800, color:'var(--t3)', letterSpacing:'.5px', textTransform:'uppercase', marginBottom:5 }}>Substituições</div>
            {[...plsA.map(p => ({ p, tidx: matchA })), ...plsB.map(p => ({ p, tidx: matchB }))].map(({ p, tidx }) => (
              <button key={p.id} onClick={() => { setSubPid(p.id); setSubTidx(tidx) }}
                style={{ background:'#fff7e6', border:'1.5px solid #c9a84c', color:'#7a5800', borderRadius:8, fontSize:11, fontWeight:700, padding:'5px 9px' }}>
                ⇅ {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AGENDA */}
      <div style={{ fontSize:10, fontWeight:800, letterSpacing:1, textTransform:'uppercase', color:'var(--t3)', margin:'14px 0 7px' }}>Agenda de Jogos</div>
      {schedule.length > 0 ? (
        <div style={cardStyle()}>
          {schedule.map((g, i) => {
            const nmA = teams[g.a]?.name || '?'
            const nmB = teams[g.b]?.name || '?'
            const cA = TEAM_CFG[g.a % TEAM_CFG.length]
            const cB = TEAM_CFG[g.b % TEAM_CFG.length]
            const isAct = activeMatch === i
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 13px', borderBottom: i < schedule.length - 1 ? '1px solid rgba(0,0,0,.05)' : 'none' }}>
                <div style={{ flex:1, fontSize:12 }}>
                  {g.done && <span style={{ fontSize:10, background:'#e8eef8', color:'var(--navy)', borderRadius:6, padding:'1px 6px', fontWeight:700, marginRight:4 }}>Enc.</span>}
                  <b style={{ color:'var(--t2)' }}>Jogo {i + 1}: </b>
                  <span style={{ fontWeight:700, color:cA.color }}>{nmA}</span>
                  <span style={{ color:'var(--t3)', margin:'0 4px' }}>×</span>
                  <span style={{ fontWeight:700, color:cB.color }}>{nmB}</span>
                  {g.done && <span style={{ color:'var(--t3)', marginLeft:4 }}>({g.scoreA}×{g.scoreB})</span>}
                </div>
                <div style={{ display:'flex', gap:5 }}>
                  {!viewOnly && (
                    <button onClick={() => {
                      const ns = schedule.map((s, si) => si === i ? { ...s, a: s.b, b: s.a } : s)
                      update({ schedule: ns })
                    }} style={{ background:'#f0ede8', border:'1px solid #ddd', color:'#444', borderRadius:7, fontSize:11, fontWeight:700, padding:'5px 9px' }}>⇄</button>
                  )}
                  <button onClick={() => setMatch(i)}
                    style={{ background: isAct ? 'var(--green)' : g.done ? '#888' : 'var(--navy)', color:'#fff', borderRadius:8, fontSize:12, fontWeight:700, padding:'6px 12px' }}>
                    {isAct ? '✓' : g.done ? 'Ver' : 'Jogar'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ ...cardStyle(), padding:16, textAlign:'center', color:'var(--t3)', fontSize:13 }}>
          Sorteie os times para gerar a agenda.
        </div>
      )}

      {/* HISTÓRICO */}
      {(matchHistory || []).length > 0 && (
        <>
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:1, textTransform:'uppercase', color:'var(--t3)', margin:'14px 0 7px' }}>Histórico</div>
          <div style={cardStyle()}>
            {matchHistory.map((m, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 13px', borderBottom: i < matchHistory.length - 1 ? '1px solid rgba(0,0,0,.05)' : 'none' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--t2)' }}>Jogo {i + 1}</div>
                <div style={{ flex:1, fontSize:13 }}><b>{m.nmA}</b> <span style={{ color:'var(--t3)' }}>vs</span> <b>{m.nmB}</b></div>
                <div style={{ fontSize:18, fontWeight:800, color:'var(--navy)', minWidth:60, textAlign:'center' }}>{m.sA} × {m.sB}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* MODAL SUBSTITUIÇÃO */}
      <Modal open={!!subPid} onClose={() => { setSubPid(null); setSubTidx(-1) }}>
        <div style={{ padding:'14px 44px 10px 16px', fontSize:15, fontWeight:800, borderBottom:'1px solid var(--brd)', position:'relative' }}>
          Substituir: {players.find(p => p.id === subPid)?.name}
          <button onClick={() => { setSubPid(null); setSubTidx(-1) }}
            style={{ position:'absolute', top:10, right:12, width:30, height:30, borderRadius:'50%', background:'#f0ede8', color:'#888', fontSize:16, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
        {cands.length === 0
          ? <div style={{ padding:16, textAlign:'center', color:'var(--t3)', fontSize:13 }}>Nenhum disponível</div>
          : cands.map(c => {
              const [bg, fg] = avatarColor(players.indexOf(c))
              return (
                <button key={c.id} onClick={() => doSub(c.id)}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderBottom:'1px solid rgba(0,0,0,.05)', background:'transparent', textAlign:'left' }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:bg, color:fg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800 }}>
                    {initials(c.name)}
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700 }}>{c.name}</div>
                    <div style={{ fontSize:12, color:'var(--t3)' }}>{c.pos}</div>
                  </div>
                </button>
              )
            })
        }
      </Modal>
    </div>
  )
}
