import Modal from './Modal'
import Avatar from './Avatar'
import { SCOUTS, CARDS, TEAM_CFG } from '../lib/constants'
import { calcPoints, ptStyle, ptsLabel, mergeScouts, totalCards } from '../lib/utils'
import { showToast } from './Toast'

export default function ScoutModal({ pid, players, teams, open, onClose, onScoutChange, onCardChange, viewOnly }) {
  const p = players.find(x => x.id === pid)
  if (!p) return null
  const idx = players.indexOf(p)
  const pt  = calcPoints(p.sc)                                   // pontos da partida atual
  const ptTotal = calcPoints(mergeScouts(p.scTotal, p.sc))       // total temporada + partida
  const ti  = teams ? teams.findIndex(t => t.pids.includes(pid)) : -1
  const tc  = ti >= 0 ? TEAM_CFG[ti % TEAM_CFG.length] : null

  function chgScout(sid, delta) {
    if (viewOnly) return
    const cur = p.sc[sid] || 0
    const nxt = Math.max(0, cur + delta)
    const sc = { ...p.sc }
    if (nxt === 0) delete sc[sid]; else sc[sid] = nxt
    if (delta > 0) showToast(`✓ ${SCOUTS.find(s => s.id === sid)?.name} → ${p.name}`)
    onScoutChange(pid, sid, delta, sc)
  }

  function chgCard(cid, delta) {
    if (viewOnly) return
    const cur = (p.cards || {})[cid] || 0
    const nxt = Math.max(0, cur + delta)
    const cards = { ...(p.cards || {}) }
    if (nxt === 0) delete cards[cid]; else cards[cid] = nxt
    const cd = CARDS.find(c => c.id === cid)
    if (delta > 0 && cd) showToast(`${cd.emoji} ${cd.name} → ${p.name}`)
    onCardChange(pid, cards)
  }

  return (
    <Modal open={open} onClose={onClose}>
      {/* HEAD */}
      <div style={{ display:'flex', alignItems:'center', gap:11, padding:'13px 16px 12px', borderBottom:'1px solid rgba(0,0,0,.07)', position:'relative' }}>
        <Avatar name={p.name} index={idx} size={48} fontSize={16} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:17, fontWeight:800 }}>{p.name}</div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3, flexWrap:'wrap' }}>
            <span style={{ fontSize:12, color:'var(--t3)' }}>{p.pos}</span>
            {tc && <span style={{ background:tc.color, color:'#fff', fontSize:10, fontWeight:700, padding:'1px 8px', borderRadius:8 }}>{teams[ti].name}</span>}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3 }}>
          <div style={{ fontSize:15, fontWeight:700, padding:'4px 12px', borderRadius:16, ...ptStyle(pt) }}>{ptsLabel(pt)} pts</div>
          <span style={{ fontSize:10, color:'var(--t3)' }}>partida · temp. {ptsLabel(ptTotal)}</span>
        </div>
        <button onClick={onClose} style={{ position:'absolute', top:11, right:12, width:30, height:30, borderRadius:'50%', background:'#f0ede8', color:'#888', fontSize:16, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
      </div>

      {/* SCOUTS */}
      <div style={{ fontSize:10, fontWeight:800, letterSpacing:1, textTransform:'uppercase', color:'var(--t3)', padding:'10px 14px 4px', background:'#f9f8f5', borderTop:'1px solid rgba(0,0,0,.06)', borderBottom:'1px solid rgba(0,0,0,.06)' }}>
        Scouts da partida (contabilizam ao finalizar)
      </div>
      <div style={{ padding:'6px 14px' }}>
        {SCOUTS.map(s => {
          const cnt = p.sc[s.id] || 0
          const tot = (p.scTotal || {})[s.id] || 0   // acumulado da temporada (partidas já finalizadas)
          return (
            <div key={s.id} style={{ display:'flex', alignItems:'center', gap:9, padding:'11px 0', borderBottom:'1px solid rgba(0,0,0,.06)' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:15, fontWeight:700 }}>{s.name}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3, flexWrap:'wrap' }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:8, background:s.c.bg, color:s.c.dk, display:'inline-block' }}>
                    {s.pts > 0 ? '+' : ''}{s.pts} pts
                  </span>
                  {tot > 0 && (
                    <span style={{ fontSize:10.5, fontWeight:700, color:'var(--t3)' }}>
                      temporada: {tot}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                {cnt > 0 && <button onClick={() => chgScout(s.id, -cnt)} style={{ width:40, height:40, borderRadius:10, background:'#fce8e8', color:'var(--red)', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>}
                {cnt > 0 && <button onClick={() => chgScout(s.id, -1)}  style={{ width:40, height:40, borderRadius:10, background:'#f0f0ec', color:'#555', fontSize:22, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>−</button>}
                <span style={{ fontSize:20, fontWeight:800, minWidth:26, textAlign:'center', color:cnt > 0 ? s.c.fg : '#ccc' }}>{cnt}</span>
                <button onClick={() => chgScout(s.id, 1)} style={{ width:40, height:40, borderRadius:10, background:s.c.bg, color:s.c.fg, fontSize:22, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>+</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* CARTÕES */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px 4px', background:'#f9f8f5', borderTop:'1px solid rgba(0,0,0,.06)', borderBottom:'1px solid rgba(0,0,0,.06)' }}>
        <span style={{ flex:1, fontSize:10, fontWeight:800, letterSpacing:1, textTransform:'uppercase', color:'var(--t3)' }}>Cartões (só marcação)</span>
        {totalCards(p.cardsTotal) > 0 && (
          <span style={{ fontSize:10.5, fontWeight:700, color:'var(--t3)' }}>total temporada: {totalCards(p.cardsTotal)}</span>
        )}
      </div>
      <div style={{ display:'flex', gap:8, padding:'10px 14px' }}>
        {CARDS.map(cd => {
          const cnt = (p.cards || {})[cd.id] || 0
          const tot = (p.cardsTotal || {})[cd.id] || 0   // acumulado da temporada
          return (
            <div key={cd.id} style={{ flex:1, borderRadius:12, padding:'12px 6px', display:'flex', flexDirection:'column', alignItems:'center', gap:5, border:`2px solid ${cd.color}`, background:cd.bg }}>
              <div style={{ fontSize:26 }}>{cd.emoji}</div>
              <div style={{ fontSize:11, fontWeight:700, color:cd.color }}>{cd.name}</div>
              <div style={{ fontSize:22, fontWeight:800, color:cd.color }}>{cnt}</div>
              {tot > 0 && <div style={{ fontSize:10, fontWeight:700, color:cd.color, opacity:.75 }}>temp.: {tot}</div>}
              <div style={{ display:'flex', gap:4 }}>
                {cnt > 0 && <button onClick={() => chgCard(cd.id, -cnt)} style={{ width:30, height:30, borderRadius:8, background:'#fce8e8', color:'#a32d2d', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>}
                {cnt > 0 && <button onClick={() => chgCard(cd.id, -1)}  style={{ width:30, height:30, borderRadius:8, background:'#f0f0ec', color:'#555', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>}
                <button onClick={() => chgCard(cd.id, 1)} style={{ width:30, height:30, borderRadius:8, background:cd.bg, color:cd.color, border:`1.5px solid ${cd.color}`, fontSize:15, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
