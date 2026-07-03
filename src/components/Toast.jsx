import { useEffect, useState, useRef } from 'react'

let _show = null
export function showToast(msg) { _show && _show(msg) }

export default function Toast() {
  const [msg, setMsg] = useState('')
  const [vis, setVis] = useState(false)
  const t = useRef(null)
  useEffect(() => {
    _show = m => { setMsg(m); setVis(true); clearTimeout(t.current); t.current = setTimeout(() => setVis(false), 2200) }
    return () => { _show = null }
  }, [])
  return (
    <div style={{
      position:'fixed',bottom:22,left:'50%',
      transform:`translateX(-50%) translateY(${vis?0:16}px)`,
      background:'var(--toast-bg)',color:'var(--toast-txt)',padding:'9px 18px',borderRadius:10,
      fontSize:13,fontWeight:600,opacity:vis?1:0,transition:'opacity .2s,transform .2s',
      pointerEvents:'none',zIndex:999,maxWidth:'88vw',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'
    }}>{msg}</div>
  )
}
