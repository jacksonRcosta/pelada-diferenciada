import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { listMinhasPeladas, criarPelada, renomearPelada, excluirPelada } from '../data/peladasApi'
import LOGO from '../lib/logo'

export default function PeladasPage({ onSelect, onLogout }) {
  const { profile, user } = useAuth()
  const [peladas, setPeladas] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [novaOpen, setNovaOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [busy, setBusy] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true); setErro('')
    try { setPeladas(await listMinhasPeladas()) }
    catch (e) { setErro('Erro ao carregar peladas: ' + e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function handleCriar() {
    if (!nome.trim()) return
    setBusy(true); setErro('')
    try {
      const p = await criarPelada(nome)
      setNome(''); setNovaOpen(false)
      await carregar()
      onSelect({ id: p.id, nome: p.nome })
    } catch (e) { setErro('Erro ao criar: ' + e.message) }
    finally { setBusy(false) }
  }

  async function handleRenomear(p) {
    const novo = window.prompt('Novo nome da pelada:', p.nome)
    if (!novo || !novo.trim() || novo.trim() === p.nome) return
    try { await renomearPelada(p.id, novo); await carregar() }
    catch (e) { setErro('Erro ao renomear: ' + e.message) }
  }

  async function handleExcluir(p) {
    if (!window.confirm(`Excluir a pelada "${p.nome}"? Esta ação remove todos os dados dela e não pode ser desfeita.`)) return
    try { await excluirPelada(p.id); await carregar() }
    catch (e) { setErro('Erro ao excluir: ' + e.message) }
  }

  const primeiroNome = (profile?.nome_completo || user?.email || '').split(' ')[0]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ background: 'linear-gradient(135deg,var(--navy),var(--navy2))', padding: '16px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src={LOGO} alt="Peladeiros" style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,.3)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 19, fontWeight: 900, color: '#fff' }}>Peladeiros</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)' }}>Olá, {primeiroNome} 👋</div>
        </div>
        <button onClick={onLogout} style={{ background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', borderRadius: 8, padding: '7px 11px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Sair</button>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 14px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy)', margin: 0 }}>Minhas peladas</h2>
          <button onClick={() => setNovaOpen(o => !o)} style={{ background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>+ Nova pelada</button>
        </div>

        {novaOpen && (
          <div style={{ background: 'var(--sur)', border: '1px solid var(--brd)', borderRadius: 12, padding: 12, marginBottom: 14, display: 'flex', gap: 8 }}>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome da pelada"
              onKeyDown={e => e.key === 'Enter' && handleCriar()}
              style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--brd)', fontSize: 14 }} autoFocus />
            <button onClick={handleCriar} disabled={busy} style={{ background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 10, padding: '0 16px', fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: busy ? .6 : 1 }}>{busy ? '...' : 'Criar'}</button>
          </div>
        )}

        {erro && <div style={{ color: '#A32D2D', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{erro}</div>}

        {loading ? (
          <div style={{ color: 'var(--t3)', fontSize: 14, padding: 20, textAlign: 'center' }}>Carregando...</div>
        ) : peladas.length === 0 ? (
          <div style={{ color: 'var(--t3)', fontSize: 14, padding: '32px 16px', textAlign: 'center', background: 'var(--sur)', borderRadius: 12, border: '1px dashed var(--brd)' }}>
            Você ainda não tem peladas.<br />Crie a primeira em <b>+ Nova pelada</b>.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {peladas.map(p => (
              <div key={p.id} style={{ background: 'var(--sur)', border: '1px solid var(--brd)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => onSelect({ id: p.id, nome: p.nome, role: p.role })} style={{ flex: 1, textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--txt)' }}>⚽ {p.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                    {p.role === 'owner' ? 'Proprietário' : p.role === 'editor' ? 'Editor' : 'Visualizador'}
                  </div>
                </button>
                {p.owner_id === user?.id && (
                  <>
                    <button onClick={() => handleRenomear(p)} title="Renomear" style={iconBtn}>✏️</button>
                    <button onClick={() => handleExcluir(p)} title="Excluir" style={iconBtn}>🗑️</button>
                  </>
                )}
                <button onClick={() => onSelect({ id: p.id, nome: p.nome, role: p.role })} style={{ background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Abrir</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const iconBtn = { background: '#f0ede8', border: '1px solid var(--brd)', borderRadius: 8, width: 34, height: 34, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
