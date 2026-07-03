import { useEffect, useState, useCallback } from 'react'
import Modal from './Modal'
import { showToast } from './Toast'
import { getInviteLinks, listMembers, addMemberByEmail, changeMemberRole, removeMember } from '../data/peladasApi'

const ROLE_LABEL = { owner: 'Proprietário', editor: 'Editor', viewer: 'Visualizador' }

export default function MembrosModal({ open, onClose, peladaId, peladaNome, meuId }) {
  const [membros, setMembros] = useState([])
  const [links, setLinks] = useState(null)
  const [email, setEmail] = useState('')
  const [novoPapel, setNovoPapel] = useState('editor')
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    if (!peladaId) return
    setErro('')
    try {
      const [m, l] = await Promise.all([listMembers(peladaId), getInviteLinks(peladaId)])
      setMembros(m); setLinks(l)
    } catch (e) { setErro('Erro ao carregar: ' + e.message) }
  }, [peladaId])

  useEffect(() => { if (open) carregar() }, [open, carregar])

  async function copiar(url, tipo) {
    try {
      if (navigator.share) { await navigator.share({ title: `Pelada ${peladaNome}`, url }); return }
      await navigator.clipboard.writeText(url)
      showToast(`🔗 Link de ${tipo} copiado!`)
    } catch { window.prompt('Copie o link:', url) }
  }

  async function adicionar() {
    if (!email.trim()) return
    setBusy(true); setErro('')
    try {
      const r = await addMemberByEmail(peladaId, email, novoPapel)
      if (r === 'NAO_ENCONTRADO') {
        setErro('E-mail não encontrado. A pessoa precisa se cadastrar no app primeiro (ou use o link de convite).')
      } else {
        setEmail(''); showToast('✓ Membro adicionado'); await carregar()
      }
    } catch (e) { setErro('Erro: ' + e.message) }
    finally { setBusy(false) }
  }

  async function alterarPapel(uid, role) {
    try { await changeMemberRole(peladaId, uid, role); await carregar() }
    catch (e) { setErro('Erro: ' + e.message) }
  }

  async function remover(uid, nome) {
    if (!window.confirm(`Remover ${nome || 'este membro'} da pelada?`)) return
    try { await removeMember(peladaId, uid); await carregar() }
    catch (e) { setErro('Erro: ' + e.message) }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ padding: '14px 44px 10px 16px', fontSize: 16, fontWeight: 800, borderBottom: '1px solid var(--brd)', position: 'relative' }}>
        Membros da pelada
        <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 12, width: 30, height: 30, borderRadius: '50%', background: '#f0ede8', color: '#888', fontSize: 16, fontWeight: 700 }}>✕</button>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Links de convite */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>🔗 Links de convite</div>
          <p style={{ fontSize: 11, color: 'var(--t3)', margin: '0 0 10px' }}>Quem abrir o link e entrar com Google recebe o acesso automaticamente.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => links && copiar(links.editor, 'editor')} disabled={!links}
              style={linkBtn('var(--navy)', '#fff')}>
              ✏️ Convidar como <b>Editor</b> (marca scouts)
            </button>
            <button onClick={() => links && copiar(links.viewer, 'visualizador')} disabled={!links}
              style={linkBtn('#f0ede8', 'var(--txt)', '1px solid var(--brd)')}>
              👁 Convidar como <b>Visualizador</b> (só acompanha)
            </button>
          </div>
        </div>

        {/* Adicionar por e-mail */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>✉️ Adicionar por e-mail</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com"
              onKeyDown={e => e.key === 'Enter' && adicionar()}
              style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--brd)', fontSize: 13 }} />
            <select value={novoPapel} onChange={e => setNovoPapel(e.target.value)}
              style={{ padding: '10px 8px', borderRadius: 10, border: '1px solid var(--brd)', fontSize: 13 }}>
              <option value="editor">Editor</option>
              <option value="viewer">Visualiz.</option>
            </select>
            <button onClick={adicionar} disabled={busy}
              style={{ background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 10, padding: '0 14px', fontSize: 13, fontWeight: 800, opacity: busy ? .6 : 1 }}>+</button>
          </div>
        </div>

        {erro && <div style={{ color: '#A32D2D', fontSize: 12, fontWeight: 600 }}>{erro}</div>}

        {/* Lista de membros */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>👥 Membros ({membros.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {membros.map(m => {
              const isOwner = m.role === 'owner'
              const isMe = m.user_id === meuId
              return (
                <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--sur)', border: '1px solid var(--brd)', borderRadius: 10, padding: '9px 11px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.nome || m.email}{isMe ? ' (você)' : ''}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>{m.email}</div>
                  </div>
                  {isOwner ? (
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)', background: '#EBF0FA', borderRadius: 8, padding: '4px 8px' }}>{ROLE_LABEL.owner}</span>
                  ) : (
                    <>
                      <select value={m.role} onChange={e => alterarPapel(m.user_id, e.target.value)}
                        style={{ padding: '6px', borderRadius: 8, border: '1px solid var(--brd)', fontSize: 12 }}>
                        <option value="editor">Editor</option>
                        <option value="viewer">Visualiz.</option>
                      </select>
                      <button onClick={() => remover(m.user_id, m.nome)} title="Remover"
                        style={{ background: '#FCEBEB', border: '1px solid #f0c9c9', borderRadius: 8, width: 32, height: 32, fontSize: 14 }}>🗑️</button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}

const linkBtn = (bg, color, border = 'none') => ({
  textAlign: 'left', padding: '11px 13px', borderRadius: 10, background: bg, color, border,
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
})
