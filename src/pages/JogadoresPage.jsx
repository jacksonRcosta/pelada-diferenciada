import { useState } from 'react'
import { TEAM_CFG } from '../lib/constants'
import { imageFileToDataURL } from '../lib/utils'
import Avatar from '../components/Avatar'
import Modal from '../components/Modal'
import { showToast } from '../components/Toast'

export default function JogadoresPage({ state, update, viewOnly }) {
  const { players, teams } = state
  const [name, setName] = useState('')
  const [pos, setPos]   = useState('Atacante')
  const [isGuest, setIsGuest] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [editPid, setEditPid] = useState(null)
  const [editPos, setEditPos] = useState('Atacante')
  const [waitName, setWaitName] = useState('')
  const [waitPos, setWaitPos] = useState('Atacante')

  const POSITIONS = ['Atacante', 'Meia', 'Lateral', 'Zagueiro', 'Goleiro']
  const waitlist = state.waitlist || []

  // Lê a foto escolhida, redimensiona (128px, JPEG) e devolve o dataURL via cb.
  async function readPhoto(file, cb) {
    if (!file) return
    try {
      const dataURL = await imageFileToDataURL(file, 160)
      cb(dataURL)
    } catch (e) {
      showToast('Não foi possível ler a imagem')
    }
  }

  // Define/atualiza a foto de um jogador já cadastrado.
  function setPlayerPhoto(pid, dataURL) {
    update({ players: players.map(p => p.id === pid ? { ...p, photo: dataURL } : p) })
    showToast('📷 Foto atualizada!')
  }

  function removePlayerPhoto(pid) {
    update({ players: players.map(p => p.id === pid ? { ...p, photo: null } : p) })
    showToast('Foto removida')
  }

  function teamOf(pid) {
    if (!teams) return -1
    return teams.findIndex(t => t.pids.includes(pid))
  }

  function add() {
    const trimmedName = name.trim()
    if (!trimmedName) { showToast('Digite o nome do peladeiro'); return }
    if (players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
      showToast('Peladeiro já existe!'); return
    }

    // Construir o player completo AQUI antes de qualquer coisa
    const newPlayer = {
      id: state.nextId,
      name: trimmedName,
      pos: pos,
      guest: isGuest,
      photo: photo || null,
      sc: {},
      cards: {},
      scTotal: {},
      cardsTotal: {}
    }

    // Construir a lista nova AQUI também
    const newPlayers = [...players, newPlayer]
    const newNextId = state.nextId + 1

    // Chamar update com os valores já calculados
    update({
      players: newPlayers,
      nextId: newNextId
    })

    setName('')
    setPhoto(null)
    showToast((isGuest ? '🎟 Convidado ' : '✓ ') + trimmedName + ' adicionado!')
  }

  // --- Lista de espera (FIFO) -------------------------------------------
  // Convidados aguardam por ordem de chegada. Ao ficarem "aptos", viram um
  // player com guest=true (segue o fluxo normal de reserva na aba Times).
  function addToWaitlist() {
    const nm = waitName.trim()
    if (!nm) { showToast('Digite o nome do convidado'); return }
    if (players.some(p => p.name.toLowerCase() === nm.toLowerCase())) {
      showToast('Já existe um peladeiro com esse nome'); return
    }
    if (waitlist.some(w => w.name.toLowerCase() === nm.toLowerCase())) {
      showToast('Esse nome já está na lista de espera'); return
    }
    const item = { id: 'w' + Date.now(), name: nm, pos: waitPos, at: new Date().toISOString() }
    update({ waitlist: [...waitlist, item] })   // sempre no fim da fila (FIFO)
    setWaitName('')
    showToast('🕒 ' + nm + ' entrou na lista de espera')
  }

  function promoteFromWaitlist(id) {
    const item = waitlist.find(w => w.id === id)
    if (!item) return
    if (players.some(p => p.name.toLowerCase() === item.name.toLowerCase())) {
      showToast('Já existe um peladeiro com esse nome')
      update({ waitlist: waitlist.filter(w => w.id !== id) })
      return
    }
    const newPlayer = {
      id: state.nextId, name: item.name, pos: item.pos || 'Atacante',
      guest: true, photo: null, sc: {}, cards: {}, scTotal: {}, cardsTotal: {},
    }
    update({
      players: [...players, newPlayer],
      nextId: state.nextId + 1,
      waitlist: waitlist.filter(w => w.id !== id),
    })
    showToast('🎟 ' + item.name + ' está apto! Adicionado como convidado.')
  }

  function removeFromWaitlist(id) {
    const item = waitlist.find(w => w.id === id)
    update({ waitlist: waitlist.filter(w => w.id !== id) })
    showToast((item?.name || 'Nome') + ' saiu da lista de espera')
  }

  function del(pid) {
    const p = players.find(x => x.id === pid)
    if (!window.confirm('Remover ' + (p?.name || '') + '?')) return
    const newPlayers = players.filter(x => x.id !== pid)
    const newTeams = teams
      ? teams.map(t => ({ ...t, pids: t.pids.filter(id => id !== pid) }))
      : teams
    update({ players: newPlayers, teams: newTeams })
    showToast((p?.name || 'Jogador') + ' removido')
  }

  function savePos() {
    const newPlayers = players.map(p =>
      p.id === editPid ? { ...p, pos: editPos } : p
    )
    update({ players: newPlayers })
    setEditPid(null)
    showToast('Posição atualizada!')
  }

  const inputStyle = {
    width: '100%', padding: '12px 13px', fontSize: 16,
    border: '1.5px solid var(--brd)', borderRadius: 10,
    background: 'var(--sur2)', color: 'var(--txt)', marginBottom: 10
  }
  const labelStyle = {
    display: 'block', fontSize: 10, fontWeight: 800,
    letterSpacing: '.8px', textTransform: 'uppercase',
    color: 'var(--t3)', marginBottom: 5
  }

  return (
    <div>
      {!viewOnly && (
        <>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 7 }}>
            Novo Peladeiro
          </div>
          <div style={{ background: 'var(--sur)', borderRadius: 14, border: '1px solid var(--brd)', padding: 14, marginBottom: 10 }}>
            <label style={labelStyle}>Foto (opcional)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <label style={{ cursor: 'pointer', flexShrink: 0 }}>
                {photo
                  ? <img src={photo} alt="prévia" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--navy)' }} />
                  : <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--sur3)', border: '2px dashed var(--brd)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'var(--t3)' }}>📷</div>}
                <input type="file" accept="image/*" onChange={e => readPhoto(e.target.files[0], setPhoto)} style={{ display: 'none' }} />
              </label>
              <div style={{ fontSize: 12, color: 'var(--t3)' }}>
                Toque na foto para escolher da galeria ou câmera.
                {photo && <button onClick={() => setPhoto(null)} style={{ display: 'block', marginTop: 4, background: 'transparent', color: 'var(--red)', fontSize: 12, fontWeight: 700, padding: 0 }}>Remover foto</button>}
              </div>
            </div>
            <label style={labelStyle}>Nome</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && add()}
              placeholder="Ex: Juninho"
              maxLength={24}
              style={inputStyle}
              autoComplete="off"
            />
            <label style={labelStyle}>Posição</label>
            <select
              value={pos}
              onChange={e => setPos(e.target.value)}
              style={{ ...inputStyle, marginBottom: 0 }}
            >
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer', fontSize: 13, color: 'var(--t2)', fontWeight: 600 }}>
              <input type="checkbox" checked={isGuest} onChange={e => setIsGuest(e.target.checked)} style={{ width: 18, height: 18 }} />
              🎟 Convidado (vale só nesta rodada)
            </label>
            {isGuest && (
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6, lineHeight: 1.5 }}>
                O convidado entra como <b>reserva</b> do time (aba Times) — não fica escalado. Para colocá-lo em campo, faça uma <b>substituição</b> por um peladeiro na aba Partida.
              </div>
            )}
            <button
              onClick={add}
              style={{
                width: '100%', padding: 14, borderRadius: 11,
                background: isGuest ? '#B7770D' : 'var(--navy)', color: '#fff',
                fontSize: 15, fontWeight: 700, marginTop: 10
              }}
            >
              {isGuest ? '🎟 Adicionar Convidado' : '+ Adicionar Peladeiro'}
            </button>
          </div>
        </>
      )}

      {/* LISTA DE ESPERA (FIFO) — convidados aguardando vaga, por ordem de chegada */}
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 7 }}>
        🕒 Lista de espera ({waitlist.length})
      </div>
      <div style={{ background: 'var(--sur)', borderRadius: 14, border: '1px solid var(--brd)', padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 10, lineHeight: 1.5 }}>
          Convidados aguardando vaga, por <b>ordem de chegada</b>. Ao ficar apto, entra como <b>🎟 convidado</b>.
        </div>
        {!viewOnly && (
          <div style={{ display: 'flex', gap: 8, marginBottom: waitlist.length ? 12 : 0 }}>
            <input
              value={waitName}
              onChange={e => setWaitName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addToWaitlist()}
              placeholder="Nome do convidado"
              maxLength={24}
              style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
              autoComplete="off"
            />
            <select value={waitPos} onChange={e => setWaitPos(e.target.value)} style={{ ...inputStyle, marginBottom: 0, width: 116 }}>
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={addToWaitlist} style={{ padding: '0 15px', borderRadius: 10, background: '#B7770D', color: '#fff', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
              + Fila
            </button>
          </div>
        )}
        {waitlist.length === 0
          ? <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', padding: '6px 0' }}>Ninguém na lista de espera.</div>
          : waitlist.map((w, i) => (
            <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: i ? '1px solid var(--divider)' : 'none' }}>
              <span style={{ minWidth: 30, height: 26, padding: '0 6px', borderRadius: 13, background: 'var(--sur3)', color: 'var(--t2)', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}º</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{w.name}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>{w.pos}</div>
              </div>
              {!viewOnly && (
                <>
                  <button onClick={() => promoteFromWaitlist(w.id)} title="Tornar apto (vira convidado)"
                    style={{ background: '#E1F5EE', color: '#085041', border: '1px solid #1D9E7533', borderRadius: 8, fontSize: 12, fontWeight: 700, padding: '7px 10px' }}>
                    ✓ Apto
                  </button>
                  <button onClick={() => removeFromWaitlist(w.id)} title="Remover da lista"
                    style={{ background: '#fce8e8', color: 'var(--red)', borderRadius: 8, fontSize: 12, fontWeight: 700, padding: '7px 10px' }}>
                    ✕
                  </button>
                </>
              )}
            </div>
          ))
        }
      </div>

      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 7 }}>
        Cadastrados ({players.length})
      </div>

      {players.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 12px', color: 'var(--t3)', fontSize: 13, lineHeight: 1.9 }}>
          Nenhum peladeiro ainda.<br />Adicione o primeiro peladeiro acima.
        </div>
      )}

      {players.map((p, i) => {
        const ti = teamOf(p.id)
        const tc = ti >= 0 ? TEAM_CFG[ti % TEAM_CFG.length] : null
        return (
          <div key={p.id} style={{ background: 'var(--sur)', borderRadius: 14, border: '1px solid var(--brd)', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 13px' }}>
              {viewOnly
                ? <Avatar name={p.name} index={i} size={40} fontSize={13} photo={p.photo} />
                : (
                  <label style={{ cursor: 'pointer', position: 'relative', flexShrink: 0, lineHeight: 0 }} title="Alterar foto">
                    <Avatar name={p.name} index={i} size={40} fontSize={13} photo={p.photo} />
                    <span style={{ position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, borderRadius: '50%', background: 'var(--navy)', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--sur)' }}>📷</span>
                    <input type="file" accept="image/*" onChange={e => readPhoto(e.target.files[0], d => setPlayerPhoto(p.id, d))} style={{ display: 'none' }} />
                  </label>
                )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                  {p.name}
                  {p.guest && (
                    <span style={{ background: '#FAEEDA', color: '#633806', border: '1px solid #B7770D', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 6 }}>
                      🎟 Convidado
                    </span>
                  )}
                  {tc && (
                    <span style={{ background: tc.color, color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 6 }}>
                      {teams[ti].name}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>{p.pos}</div>
              </div>
              {!viewOnly && (
                <>
                  <button
                    onClick={() => { setEditPid(p.id); setEditPos(p.pos) }}
                    style={{ background: '#e8eef8', color: 'var(--navy)', borderRadius: 9, fontSize: 12, fontWeight: 700, padding: '7px 10px', marginRight: 6 }}
                  >
                    ✏ Pos.
                  </button>
                  <button
                    onClick={() => del(p.id)}
                    style={{ background: '#fce8e8', color: 'var(--red)', borderRadius: 9, fontSize: 12, fontWeight: 700, padding: '7px 10px' }}
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          </div>
        )
      })}

      <Modal open={!!editPid} onClose={() => setEditPid(null)}>
        <div style={{ padding: '13px 16px 12px', borderBottom: '1px solid var(--divider)', position: 'relative' }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>
            {players.find(p => p.id === editPid)?.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 3 }}>Alterar posição</div>
          <button
            onClick={() => setEditPid(null)}
            style={{ position: 'absolute', top: 11, right: 12, width: 30, height: 30, borderRadius: '50%', background: 'var(--sur3)', color: 'var(--t3)', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >✕</button>
        </div>
        <div style={{ padding: 14 }}>
          <label style={labelStyle}>Nova Posição</label>
          <select
            value={editPos}
            onChange={e => setEditPos(e.target.value)}
            style={{ ...inputStyle, width: '100%', marginBottom: 12 }}
          >
            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button
            onClick={savePos}
            style={{ width: '100%', padding: 14, borderRadius: 11, background: 'var(--navy)', color: '#fff', fontSize: 15, fontWeight: 700 }}
          >
            Salvar Posição
          </button>
          {players.find(p => p.id === editPid)?.photo && (
            <button
              onClick={() => { removePlayerPhoto(editPid); setEditPid(null) }}
              style={{ width: '100%', padding: 12, borderRadius: 11, marginTop: 8, background: '#fce8e8', color: 'var(--red)', fontSize: 14, fontWeight: 700 }}
            >
              📷 Remover foto
            </button>
          )}
        </div>
      </Modal>
    </div>
  )
}
