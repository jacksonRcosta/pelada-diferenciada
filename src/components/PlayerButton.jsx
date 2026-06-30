import Avatar from './Avatar'
import { SCOUTS, CARDS } from '../lib/constants'
import { calcPoints, ptStyle, ptsLabel } from '../lib/utils'

export default function PlayerButton({ player, index, onClick }) {
  // Aba Scouts mostra o total da temporada (scouts já contabilizados).
  const sc = player.scTotal || {}
  const cards = player.cardsTotal || {}
  const pt = calcPoints(sc)
  const pills = [
    ...SCOUTS.filter(s => sc[s.id] > 0).map(s => (
      <span key={s.id} style={{fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:6,background:s.c.bg,color:s.c.dk}}>
        {sc[s.id]}× {s.name}
      </span>
    )),
    ...CARDS.filter(cd => cards[cd.id]>0).map(cd => (
      <span key={cd.id} style={{fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:6,background:cd.bg,color:cd.color}}>
        {cd.emoji} {cards[cd.id]}
      </span>
    ))
  ]
  return (
    <button onClick={onClick} style={{
      width:'100%',background:'var(--sur)',border:'1px solid var(--brd)',
      borderRadius:12,padding:'12px 13px',display:'flex',alignItems:'center',gap:10,
      marginBottom:7,textAlign:'left'
    }}>
      <Avatar name={player.name} index={index}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:15,fontWeight:700}}>{player.name}</div>
        <div style={{fontSize:12,color:'var(--t3)'}}>{player.pos}</div>
        {pills.length>0 && <div style={{display:'flex',flexWrap:'wrap',gap:3,marginTop:5}}>{pills}</div>}
      </div>
      <div style={{fontSize:13,fontWeight:700,padding:'3px 10px',borderRadius:12,...ptStyle(pt)}}>{ptsLabel(pt)}</div>
      <div style={{color:'#ccc',fontSize:20,marginLeft:2}}>›</div>
    </button>
  )
}
