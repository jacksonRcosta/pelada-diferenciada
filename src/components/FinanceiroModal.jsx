import { useState } from 'react'
import Modal from './Modal'
import Avatar from './Avatar'
import { ensureFinance, formatBRL, ymNow, ymdOf } from '../lib/utils'
import { showToast } from './Toast'

// Módulo financeiro da pelada (mensalistas × diaristas).
// - Valores GLOBAIS de mensalidade e diária.
// - Cada peladeiro é marcado como Mensalista ou Diarista (herda o valor global).
// - Mensalistas: controle mês a mês (pago/pendente) + dia de vencimento.
// - Diaristas: as diárias são lançadas automaticamente ao iniciar a rodada
//   (ver PartidaPage.startRound) e marcadas como pagas aqui, conforme recebido.
export default function FinanceiroModal({ open, onClose, state, update }) {
  const [aba, setAba] = useState('peladeiros')
  const f = ensureFinance(state.finance)
  const players = state.players || []
  const ym = ymNow()

  // Aplica uma mutação sobre uma cópia rasa do financeiro e persiste.
  function patchFinance(mut) {
    const base = ensureFinance(state.finance)
    const copy = { ...base, cfg: { ...base.cfg }, mensal: { ...base.mensal }, diarias: [...base.diarias] }
    mut(copy)
    update({ finance: copy })
  }

  function setValor(campo, v) {
    patchFinance(fin => { fin[campo] = Math.max(0, Number(v) || 0) })
  }

  function setTipo(pid, tipo) {
    patchFinance(fin => {
      if (!tipo) delete fin.cfg[pid]
      else fin.cfg[pid] = { tipo, diaVenc: fin.cfg[pid]?.diaVenc || 5 }
    })
  }

  function setVenc(pid, dia) {
    patchFinance(fin => {
      if (fin.cfg[pid]) fin.cfg[pid] = { ...fin.cfg[pid], diaVenc: Math.min(31, Math.max(1, Number(dia) || 1)) }
    })
  }

  // Alterna o status de pagamento da MENSALIDADE do mês corrente.
  function toggleMensal(pid) {
    patchFinance(fin => {
      const mes = { ...(fin.mensal[ym] || {}) }
      const pago = !mes[pid]?.pago
      mes[pid] = { pago, pagoEm: pago ? new Date().toISOString() : null }
      fin.mensal[ym] = mes
    })
  }

  // Alterna o status de pagamento de uma DIÁRIA lançada.
  function toggleDiaria(id) {
    patchFinance(fin => {
      fin.diarias = fin.diarias.map(d => d.id === id
        ? { ...d, pago: !d.pago, pagoEm: !d.pago ? new Date().toISOString() : null }
        : d)
    })
  }

  // Lança manualmente uma diária avulsa para um peladeiro na data de hoje.
  function lancarDiaria(pid) {
    const p = players.find(x => x.id === pid)
    if (!p) return
    const dia = ymdOf(new Date())
    patchFinance(fin => {
      if (fin.diarias.some(d => d.pid === pid && d.data === dia)) return
      fin.diarias.push({ id: `${pid}-${dia}`, pid, nome: p.name, data: dia, valor: fin.diaria, pago: false, pagoEm: null })
    })
    showToast(`Diária lançada para ${p.name}`)
  }

  const mensalistas = players.filter(p => f.cfg[p.id]?.tipo === 'mensalista')
  const pagosMes = mensalistas.filter(p => f.mensal[ym]?.[p.id]?.pago)
  const totalMensalPrevisto = mensalistas.length * f.mensalidade
  const totalMensalRecebido = pagosMes.length * f.mensalidade

  // Diárias ordenadas por data (mais recentes primeiro).
  const diarias = [...f.diarias].sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))
  const diariasRecebido = diarias.filter(d => d.pago).reduce((s, d) => s + (d.valor || 0), 0)
  const diariasPendente = diarias.filter(d => !d.pago).reduce((s, d) => s + (d.valor || 0), 0)

  // Agrupa diárias por data para exibição.
  const gruposDiaria = []
  diarias.forEach(d => {
    let g = gruposDiaria.find(x => x.data === d.data)
    if (!g) { g = { data: d.data, itens: [] }; gruposDiaria.push(g) }
    g.itens.push(d)
  })

  const fmtData = d => {
    const [y, m, dd] = d.split('-')
    return `${dd}/${m}/${y}`
  }

  return (
    <Modal open={open} onClose={onClose}>
      {/* HEAD */}
      <div style={{ padding: '13px 44px 12px 16px', borderBottom: '1px solid var(--divider)', position: 'relative' }}>
        <div style={{ fontSize: 17, fontWeight: 800 }}>💰 Financeiro</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Mensalistas e diaristas da pelada</div>
        <button onClick={onClose} style={{ position: 'absolute', top: 11, right: 12, width: 30, height: 30, borderRadius: '50%', background: 'var(--sur3)', color: 'var(--t3)', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      {/* VALORES GLOBAIS */}
      <div style={{ padding: '12px 16px', background: 'var(--sur2)', borderBottom: '1px solid var(--divider)' }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>Valores da pelada</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Mensalidade (R$)</label>
            <input type="number" min={0} step="0.01" value={f.mensalidade || ''} onChange={e => setValor('mensalidade', e.target.value)} placeholder="0,00" style={inp} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Diária (R$)</label>
            <input type="number" min={0} step="0.01" value={f.diaria || ''} onChange={e => setValor('diaria', e.target.value)} placeholder="0,00" style={inp} />
          </div>
        </div>
      </div>

      {/* SUB-ABAS */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--divider)' }}>
        {[['peladeiros', '👤 Mensalistas'], ['diarias', '📅 Diárias']].map(([id, label]) => (
          <button key={id} onClick={() => setAba(id)} style={{
            flex: 1, padding: '11px 4px', border: 'none', background: 'transparent',
            fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
            color: aba === id ? 'var(--navy)' : 'var(--t3)',
            borderBottom: aba === id ? '3px solid var(--navy)' : '3px solid transparent',
          }}>{label}</button>
        ))}
      </div>

      {/* ABA PELADEIROS / MENSALISTAS */}
      {aba === 'peladeiros' && (
        <div style={{ padding: '10px 14px' }}>
          <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 6 }}>
            Defina o tipo de cada peladeiro. Mensalistas têm o status do mês atual ({fmtMes(ym)}) abaixo.
          </div>
          {players.length === 0 && <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>Nenhum peladeiro cadastrado.</div>}
          {players.map((p, i) => {
            const cfg = f.cfg[p.id]
            const tipo = cfg?.tipo || ''
            const pago = f.mensal[ym]?.[p.id]?.pago
            return (
              <div key={p.id} style={{ background: 'var(--sur)', border: '1px solid var(--brd)', borderRadius: 12, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={p.name} index={i} size={34} fontSize={12} photo={p.photo} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>{p.pos}{p.guest ? ' · 🎟 convidado' : ''}</div>
                  </div>
                  <select value={tipo} onChange={e => setTipo(p.id, e.target.value)} style={{ ...inp, width: 'auto', padding: '7px 8px', marginBottom: 0 }}>
                    <option value="">— sem cobrança</option>
                    <option value="mensalista">Mensalista</option>
                    <option value="diarista">Diarista</option>
                  </select>
                </div>
                {tipo === 'mensalista' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--t2)' }}>Vence dia</span>
                    <input type="number" min={1} max={31} value={cfg?.diaVenc || 5} onChange={e => setVenc(p.id, e.target.value)} style={{ ...inp, width: 60, padding: '6px 8px', marginBottom: 0, textAlign: 'center' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{formatBRL(f.mensalidade)}</span>
                    <button onClick={() => toggleMensal(p.id)} style={statusBtn(pago)}>
                      {pago ? '✓ Pago' : '⏳ Pendente'}
                    </button>
                  </div>
                )}
                {tipo === 'diarista' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11.5, color: 'var(--t3)', flex: 1 }}>Diária {formatBRL(f.diaria)} — lançada ao iniciar a rodada.</span>
                    <button onClick={() => lancarDiaria(p.id)} style={{ background: 'var(--sur3)', border: '1px solid var(--brd)', color: 'var(--t2)', borderRadius: 8, fontSize: 11.5, fontWeight: 700, padding: '6px 10px', cursor: 'pointer' }}>+ Lançar hoje</button>
                  </div>
                )}
              </div>
            )
          })}

          {mensalistas.length > 0 && (
            <div style={resumo}>
              <div>Mensalistas: <b>{mensalistas.length}</b> · Pagos: <b style={{ color: 'var(--green)' }}>{pagosMes.length}</b></div>
              <div style={{ marginTop: 3 }}>Recebido no mês: <b style={{ color: 'var(--green)' }}>{formatBRL(totalMensalRecebido)}</b> de {formatBRL(totalMensalPrevisto)}</div>
            </div>
          )}
        </div>
      )}

      {/* ABA DIÁRIAS */}
      {aba === 'diarias' && (
        <div style={{ padding: '10px 14px' }}>
          {gruposDiaria.length === 0 && (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--t3)', fontSize: 13, lineHeight: 1.7 }}>
              Nenhuma diária lançada ainda.<br />As diárias dos diaristas são lançadas ao <b>iniciar a rodada</b>.
            </div>
          )}
          {gruposDiaria.map(g => (
            <div key={g.data} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: .5, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 6 }}>📅 {fmtData(g.data)}</div>
              <div style={{ background: 'var(--sur)', border: '1px solid var(--brd)', borderRadius: 12, overflow: 'hidden' }}>
                {g.itens.map((d, i) => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: i < g.itens.length - 1 ? '1px solid var(--divider)' : 'none' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.nome}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>{formatBRL(d.valor)}</div>
                    </div>
                    <button onClick={() => toggleDiaria(d.id)} style={statusBtn(d.pago)}>
                      {d.pago ? '✓ Pago' : '⏳ Pendente'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {diarias.length > 0 && (
            <div style={resumo}>
              <div>Recebido: <b style={{ color: 'var(--green)' }}>{formatBRL(diariasRecebido)}</b> · Pendente: <b style={{ color: 'var(--red)' }}>{formatBRL(diariasPendente)}</b></div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

function fmtMes(ym) {
  const [y, m] = ym.split('-')
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${meses[Number(m) - 1]}/${y}`
}

const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--t2)', margin: '0 0 4px' }
const inp = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: 9, border: '1px solid var(--brd)', fontSize: 14, background: 'var(--sur)', color: 'var(--txt)', marginBottom: 0 }
const resumo = { marginTop: 6, padding: '10px 12px', borderRadius: 10, background: 'var(--sur2)', border: '1px solid var(--brd)', fontSize: 12.5, color: 'var(--t2)' }
const statusBtn = pago => ({
  background: pago ? '#E1F5EE' : '#FCEBEB',
  color: pago ? '#085041' : '#791F1F',
  border: `1px solid ${pago ? '#9BD9C4' : '#E7B4B4'}`,
  borderRadius: 8, fontSize: 12, fontWeight: 700, padding: '7px 12px', cursor: 'pointer', whiteSpace: 'nowrap',
})
