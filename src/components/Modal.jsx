import { useEffect } from 'react'
export default function Modal({ open, onClose, children }) {
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [open])
  if (!open) return null
  return (
    <div onClick={e => e.target===e.currentTarget && onClose()} style={{
      position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:100,
      display:'flex',alignItems:'flex-end',justifyContent:'center'
    }}>
      <div style={{ background:'var(--sur)',borderRadius:'20px 20px 0 0',width:'100%',maxWidth:520,
        maxHeight:'93vh',overflowY:'auto',WebkitOverflowScrolling:'touch',paddingBottom:30,
        animation:'slideUp .28s cubic-bezier(.32,.72,0,1)' }}>
        <div style={{width:36,height:4,background:'#ddd',borderRadius:2,margin:'11px auto 0'}}/>
        {children}
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  )
}
