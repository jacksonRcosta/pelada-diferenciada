import { initials, avatarColor } from '../lib/utils'
export default function Avatar({ name, index, size=42, fontSize=14 }) {
  const [bg, fg] = avatarColor(index)
  return (
    <div style={{ width:size,height:size,borderRadius:'50%',background:bg,color:fg,
      display:'flex',alignItems:'center',justifyContent:'center',
      fontWeight:800,fontSize,flexShrink:0,letterSpacing:'.5px' }}>
      {initials(name)}
    </div>
  )
}
