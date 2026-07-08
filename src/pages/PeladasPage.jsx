import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  listMinhasPeladas, criarPelada, atualizarPelada, excluirPelada,
  buscarPeladas, solicitarEntrada, listarSolicitacoesRecebidas, responderSolicitacao,
} from '../data/peladasApi'
import Modal from '../components/Modal'
import LOGO from '../lib/logo'

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const localLabel = p => [p.cidade, p.estado].filter(Boolean).join(' / ')

export default function PeladasPage({ onSelect, onLogout, pendingJoin, onRetryJoin, onDismissJoin }) {
  const { profile, user } = useAuth()
  const [peladas, setPeladas] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  // Criação
  const [novaOpen, setNovaOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [horario, setHorario] = useState('')
  const [local, setLocal] = useState('')
  const [busy, setBusy] = useState(false)

  // Edição
  const [editP, setEditP] = useState(null)
  const [eNome, setENome] = useState('')
  const [eCidade, setECidade] = useState('')
  const [eEstado, setEEstado] = useState('')
  const [eHorario, setEHorario] = useState('')
  const [eLocal, setELocal] = useState('')
  const [eBusy, setEBusy] = useState(false)

  // Busca de peladas
  const [buscaOpen, setBuscaOpen] = useState(false)
  const [termo, setTermo] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [buscou, setBuscou] = useState(false)

  // Solicitações recebidas (dono)
  const [solic, setSolic] = useState([])

  const carregar = useCallback(async () => {
    setLoading(true); setErro('')
    try {
      const [ps, ss] = await Promise.all([
        listMinhasPeladas(),
        listarSolicitacoesRecebidas().catch(() => []),
      ])
      setPeladas(ps)
      setSolic(ss)
    } catch (e) { setErro('Erro ao carregar peladas: ' + e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function handleCriar() {
    if (!nome.trim()) return
    setBusy(true); setErro('')
    try {
      const p = await criarPelada(nome, cidade, estado, horario, local)
      setNome(''); setCidade(''); setEstado(''); setHorario(''); setLocal(''); setNovaOpen(false)
      await carregar()
      onSelect({ id: p.id, nome: p.nome })
    } catch (e) { setErro('Erro ao criar: ' + e.message) }
    finally { setBusy(false) }
  }

  function openEdit(p) {
    setEditP(p); setENome(p.nome || ''); setECidade(p.cidade || ''); setEEstado(p.estado || '')
    setEHorario(p.horario || ''); setELocal(p.local || '')
  }

  async function handleSalvarEdit() {
    if (!eNome.trim()) return
    setEBusy(true); setErro('')
    try {
      await atualizarPelada(editP.id, { nome: eNome, cidade: eCidade, estado: eEstado, horario: eHorario, local: eLocal })
      setEditP(null)
      await carregar()
    } catch (e) { setErro('Erro ao salvar: ' + e.message) }
    finally { setEBusy(false) }
  }

  async function handleExcluir(p) {
    if (!window.confirm(`Excluir a pelada "${p.nome}"? Esta ação remove todos os dados dela e não pode ser desfeita.`)) return
    try { await excluirPelada(p.id); await carregar() }
    catch (e) { setErro('Erro ao excluir: ' + e.message) }
  }

  async function doBuscar(e) {
    if (e) e.preventDefault()
    setBuscando(true); setErro('')
    try {
      setResultados(await buscarPeladas(termo))
      setBuscou(true)
    } catch (err) { setErro('Erro na busca: ' + err.message) }
    finally { setBuscando(false) }
  }

  async function handleSolicitar(r) {
    try {
      const res = await solicitarEntrada(r.id)
      setResultados(rs => rs.map(x => x.id === r.id
        ? {
            ...x,
            ja_membro: res === 'JA_MEMBRO' ? true : x.ja_membro,
            solicitacao: res === 'JA_MEMBRO' ? x.solicitacao : 'pending',
          }
        : x))
    } catch (e) { setErro('Erro ao solicitar: ' + e.message) }
  }

  async function handleResponder(reqId, aprovar, role = 'editor') {
    try {
      await responderSolicitacao(reqId, aprovar, role)
      await carregar()
    } catch (e) { setErro('Erro ao responder: ' + e.message) }
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
        {erro && <div style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{erro}</div>}

        {/* CONVITE PENDENTE (link de convite ainda não consumido) */}
        {pendingJoin && (
          <div style={{ background: '#FFF8E6', border: '1.5px solid var(--gold)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#7a5800' }}>🎟 Você tem um convite pendente</div>
            <div style={{ fontSize: 12.5, color: 'var(--t2)', margin: '4px 0 10px', lineHeight: 1.5 }}>
              Você abriu um link de convite para uma pelada. Toque abaixo para entrar com o acesso concedido pelo dono.
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={onRetryJoin} style={{ background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 14px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Entrar na pelada convidada</button>
              <button onClick={onDismissJoin} style={{ background: 'transparent', color: 'var(--t3)', border: '1px solid var(--brd)', borderRadius: 9, padding: '9px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Descartar</button>
            </div>
          </div>
        )}

        {/* SOLICITAÇÕES RECEBIDAS (dono) */}
        {solic.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 900, color: 'var(--navy)', margin: '0 0 8px' }}>
              📩 Solicitações de entrada ({solic.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {solic.map(s => (
                <div key={s.request_id} style={{ background: 'var(--sur)', border: '1px solid var(--brd)', borderRadius: 12, padding: '11px 13px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--txt)' }}>{s.nome || s.email}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2 }}>
                    {s.email}{s.telefone ? ` · ${s.telefone}` : ''}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 4 }}>
                    quer entrar em <b>⚽ {s.pelada_nome}</b>
                  </div>
                  {s.mensagem && <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 4, fontStyle: 'italic' }}>“{s.mensagem}”</div>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <button onClick={() => handleResponder(s.request_id, true, 'editor')} style={btnMini('var(--green)', '#fff')}>✓ Aprovar (editor)</button>
                    <button onClick={() => handleResponder(s.request_id, true, 'viewer')} style={btnMini('var(--sur3)', 'var(--txt)', '1px solid var(--brd)')}>👁 Como visualizador</button>
                    <button onClick={() => handleResponder(s.request_id, false)} style={btnMini('transparent', 'var(--red)', '1px solid var(--brd)')}>✕ Recusar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MINHAS PELADAS */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy)', margin: 0 }}>Minhas peladas</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setBuscaOpen(o => !o); setErro('') }} style={{ background: 'var(--sur3)', color: 'var(--txt)', border: '1px solid var(--brd)', borderRadius: 10, padding: '9px 12px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>🔎 Procurar</button>
            <button onClick={() => { setNovaOpen(o => !o); setErro('') }} style={{ background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>+ Nova pelada</button>
          </div>
        </div>

        {/* BUSCAR PELADA */}
        {buscaOpen && (
          <div style={{ background: 'var(--sur)', border: '1px solid var(--brd)', borderRadius: 12, padding: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 8 }}>
              Procure por peladas já cadastradas (nome, cidade ou UF) e solicite sua entrada.
            </div>
            <form onSubmit={doBuscar} style={{ display: 'flex', gap: 8 }}>
              <input value={termo} onChange={e => setTermo(e.target.value)} placeholder="Ex: Peladeiros, Maceió, AL"
                style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--brd)', fontSize: 14 }} autoFocus />
              <button type="submit" disabled={buscando} style={{ background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 10, padding: '0 16px', fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: buscando ? .6 : 1 }}>{buscando ? '...' : 'Buscar'}</button>
            </form>

            {buscou && resultados.length === 0 && (
              <div style={{ color: 'var(--t3)', fontSize: 13, padding: '16px 4px 4px', textAlign: 'center' }}>Nenhuma pelada encontrada.</div>
            )}

            {resultados.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {resultados.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px', borderTop: '1px solid var(--divider)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--txt)' }}>⚽ {r.nome}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2 }}>
                        {localLabel(r) || 'Local não informado'}
                        {r.owner_nome ? ` · ${r.owner_nome}` : ''}
                        {` · ${r.membros} membro${r.membros === 1 ? '' : 's'}`}
                      </div>
                    </div>
                    {r.ja_membro ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>✓ Você é membro</span>
                    ) : r.solicitacao === 'pending' ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)' }}>⏳ Solicitado</span>
                    ) : (
                      <button onClick={() => handleSolicitar(r)} style={{ background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>Solicitar entrada</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NOVA PELADA */}
        {novaOpen && (
          <div style={{ background: 'var(--sur)', border: '1px solid var(--brd)', borderRadius: 12, padding: 12, marginBottom: 14 }}>
            <label style={lbl}>Nome da pelada</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Peladeiros Diferenciados"
              onKeyDown={e => e.key === 'Enter' && handleCriar()} style={inp} autoFocus />
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Cidade</label>
                <input value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Ex: Maceió" style={inp} />
              </div>
              <div style={{ width: 96 }}>
                <label style={lbl}>Estado</label>
                <select value={estado} onChange={e => setEstado(e.target.value)} style={inp}>
                  <option value="">UF</option>
                  {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Horário</label>
                <input value={horario} onChange={e => setHorario(e.target.value)} placeholder="Ex: Sáb 08:00" style={inp} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Local</label>
                <input value={local} onChange={e => setLocal(e.target.value)} placeholder="Ex: Quadra do clube" style={inp} />
              </div>
            </div>
            <button onClick={handleCriar} disabled={busy} style={{ width: '100%', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontSize: 14, fontWeight: 800, cursor: 'pointer', opacity: busy ? .6 : 1, marginTop: 4 }}>{busy ? 'Criando...' : 'Criar pelada'}</button>
          </div>
        )}

        {loading ? (
          <div style={{ color: 'var(--t3)', fontSize: 14, padding: 20, textAlign: 'center' }}>Carregando...</div>
        ) : peladas.length === 0 ? (
          <div style={{ color: 'var(--t3)', fontSize: 14, padding: '32px 16px', textAlign: 'center', background: 'var(--sur)', borderRadius: 12, border: '1px dashed var(--brd)' }}>
            Você ainda não participa de nenhuma pelada.<br />Crie uma em <b>+ Nova pelada</b> ou <b>🔎 Procure</b> uma existente.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {peladas.map(p => (
              <div key={p.id} style={{ background: 'var(--sur)', border: '1px solid var(--brd)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => onSelect({ id: p.id, nome: p.nome, role: p.role })} style={{ flex: 1, textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--txt)' }}>⚽ {p.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                    {p.role === 'owner' ? 'Proprietário' : p.role === 'editor' ? 'Editor' : 'Visualizador'}
                    {localLabel(p) ? ` · 📍 ${localLabel(p)}` : ''}
                  </div>
                  {(p.horario || p.local) && (
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                      {p.horario ? `🕐 ${p.horario}` : ''}{p.horario && p.local ? ' · ' : ''}{p.local ? `🏟 ${p.local}` : ''}
                    </div>
                  )}
                </button>
                {p.owner_id === user?.id && (
                  <>
                    <button onClick={() => openEdit(p)} title="Editar" style={iconBtn}>✏️</button>
                    <button onClick={() => handleExcluir(p)} title="Excluir" style={iconBtn}>🗑️</button>
                  </>
                )}
                <button onClick={() => onSelect({ id: p.id, nome: p.nome, role: p.role })} style={{ background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Abrir</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL EDIÇÃO */}
      <Modal open={!!editP} onClose={() => setEditP(null)}>
        <div style={{ padding: '14px 16px 6px', fontSize: 17, fontWeight: 800, color: 'var(--txt)' }}>Editar pelada</div>
        <div style={{ padding: '4px 16px 16px' }}>
          <label style={lbl}>Nome da pelada</label>
          <input value={eNome} onChange={e => setENome(e.target.value)} style={inp} />
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Cidade</label>
              <input value={eCidade} onChange={e => setECidade(e.target.value)} placeholder="Ex: Maceió" style={inp} />
            </div>
            <div style={{ width: 96 }}>
              <label style={lbl}>Estado</label>
              <select value={eEstado} onChange={e => setEEstado(e.target.value)} style={inp}>
                <option value="">UF</option>
                {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Horário</label>
              <input value={eHorario} onChange={e => setEHorario(e.target.value)} placeholder="Ex: Sáb 08:00" style={inp} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Local</label>
              <input value={eLocal} onChange={e => setELocal(e.target.value)} placeholder="Ex: Quadra do clube" style={inp} />
            </div>
          </div>
          <button onClick={handleSalvarEdit} disabled={eBusy} style={{ width: '100%', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 11, padding: '13px', fontSize: 15, fontWeight: 800, cursor: 'pointer', opacity: eBusy ? .6 : 1, marginTop: 6 }}>{eBusy ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </Modal>
    </div>
  )
}

const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--t2)', margin: '8px 0 4px' }
const inp = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--brd)', fontSize: 14 }
const iconBtn = { background: 'var(--sur3)', border: '1px solid var(--brd)', borderRadius: 8, width: 34, height: 34, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const btnMini = (bg, color, border = 'none') => ({ background: bg, color, border, borderRadius: 8, padding: '7px 11px', fontSize: 12, fontWeight: 800, cursor: 'pointer' })
