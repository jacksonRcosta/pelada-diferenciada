export default function SyncBar({ status }) {
  const c = { syncing:'var(--gold)', ok:'var(--green)', error:'var(--red)', idle:'transparent' }
  return <div style={{ height:3, background:c[status]||'transparent', position:'fixed', top:0, left:0, right:0, zIndex:99, transition:'background .3s' }} />
}
