export default function SyncBar({ status }) {
  const colors = {
    syncing: '#c9a84c',
    ok:      '#15805e',
    error:   '#c0392b',
    idle:    'transparent'
  }
  const labels = {
    syncing: '⟳ Salvando...',
    ok:      '✓ Salvo',
    error:   '⚠ Erro ao salvar — verifique a conexão',
    idle:    ''
  }
  return (
    <>
      <div style={{
        height: 3,
        background: colors[status] || 'transparent',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99,
        transition: 'background .3s'
      }} />
      {status === 'error' && (
        <div style={{
          position: 'fixed', top: 3, left: 0, right: 0, zIndex: 99,
          background: '#c0392b', color: '#fff',
          fontSize: 12, fontWeight: 700, textAlign: 'center',
          padding: '6px 12px'
        }}>
          {labels[status]}
        </div>
      )}
      {status === 'syncing' && (
        <div style={{
          position: 'fixed', bottom: 70, right: 14, zIndex: 98,
          background: '#1a1a18', color: '#f4f2ed',
          fontSize: 12, fontWeight: 600, padding: '6px 12px',
          borderRadius: 8, opacity: .85
        }}>
          ⟳ Salvando...
        </div>
      )}
    </>
  )
}
