import { ptsLabel } from '../lib/utils'

// Histórico de Peladas — cada rodada finalizada (um dia de pelada) vira um
// registro com: placares de todos os jogos e gols/assistências por jogador.
// Os dados vêm de state.roundHistory (mais recente primeiro), preenchido no
// "Finalizar rodada" da aba Partida.
export default function HistoricoPage({ state }) {
  const { roundHistory } = state
  const rounds = roundHistory || []

  const fmtDate = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return isNaN(d) ? '—' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  if (rounds.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 12px', color: 'var(--t3)', fontSize: 13, lineHeight: 1.9 }}>
        Nenhuma pelada registrada ainda.<br />
        Ao tocar em <b>🔚 Finalizar rodada</b> na aba <b>Partida</b>,<br />
        a pelada do dia entra aqui com placares e scouts.
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 7 }}>
        Histórico de Peladas ({rounds.length})
      </div>

      {rounds.map((r, ri) => {
        const dataPelada = fmtDate(r.startedAt || r.endedAt)
        const artilheiros = (r.players || []).filter(p => p.gols > 0 || p.assist > 0)
        return (
          <details key={ri} open={ri === 0} style={{ background: 'var(--sur)', borderRadius: 14, border: '1px solid var(--brd)', marginBottom: 10, overflow: 'hidden' }}>
            <summary style={{ listStyle: 'none', cursor: 'pointer', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>📅</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{dataPelada}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                  {r.games || 0} jogo{(r.games || 0) !== 1 ? 's' : ''}
                  {r.mvp ? ` · 🌟 ${r.mvp.name} (${ptsLabel(r.mvp.pts)})` : ''}
                </div>
              </div>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>ver ▾</span>
            </summary>

            <div style={{ borderTop: '1px solid var(--brd)', padding: '10px 14px' }}>
              {/* PLACARES */}
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: .8, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 6 }}>
                Placares
              </div>
              {(r.matches || []).length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>Sem jogos registrados.</div>
              )}
              {(r.matches || []).map((m, mi) => (
                <div key={mi} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 13 }}>
                  <span style={{ fontSize: 11, color: 'var(--t3)', width: 46 }}>Jogo {mi + 1}</span>
                  <span style={{ flex: 1, fontWeight: 700, textAlign: 'right' }}>{m.nmA}</span>
                  <span style={{ fontWeight: 800, color: 'var(--navy)', minWidth: 46, textAlign: 'center' }}>{m.sA} × {m.sB}</span>
                  <span style={{ flex: 1, fontWeight: 700 }}>{m.nmB}</span>
                </div>
              ))}

              {/* GOLS E ASSISTÊNCIAS POR JOGADOR */}
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: .8, textTransform: 'uppercase', color: 'var(--t3)', margin: '12px 0 6px' }}>
                Gols e assistências
              </div>
              {artilheiros.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>Nenhum gol ou assistência registrado nesta pelada.</div>
              ) : (
                artilheiros.map((p, pi) => (
                  <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 13, borderTop: pi ? '1px solid var(--divider)' : 'none' }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 700 }}>{p.name}</span>
                      <span style={{ color: 'var(--t3)', fontSize: 11 }}> · {p.pos}</span>
                    </span>
                    {p.gols > 0 && (
                      <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: '#FAEEDA', color: '#633806', border: '1px solid #BA751733' }}>
                        ⚽ {p.gols} gol{p.gols > 1 ? 's' : ''}
                      </span>
                    )}
                    {p.assist > 0 && (
                      <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: '#EEEDFE', color: '#3C3489', border: '1px solid #534AB733' }}>
                        🅰 {p.assist} assist.
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </details>
        )
      })}
    </div>
  )
}
