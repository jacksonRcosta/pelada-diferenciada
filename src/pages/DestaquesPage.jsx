import { ptStyle, ptsLabel, mergeScouts, bestByPosition, seasonAwards, scoutSummary } from '../lib/utils'
import { shareCard } from '../lib/shareCard'
import { shareFifaLineup } from '../lib/fifaLineup'
import Avatar from '../components/Avatar'
import { showToast } from '../components/Toast'

// Aba dedicada a compartilhamento. Divide-se em:
//  • Destaque da Rodada  — melhores por posição da rodada atual (agrega os
//    scouts das partidas já finalizadas em matchHistory).
//  • Destaque da Temporada — melhores por posição somando todos os jogos
//    (scTotal) + prêmios individuais da temporada.
// A escalação (por posição) é compartilhada como imagem estilo FIFA; prêmios e
// resultados usam o card "story" padrão.
export default function DestaquesPage({ state }) {
  const { players, matchHistory } = state

  // Agrega os scouts da rodada atual por jogador.
  const roundAgg = {}
  for (const m of matchHistory || []) {
    for (const s of m.scouts || []) {
      if (!roundAgg[s.id]) roundAgg[s.id] = {
        id: s.id, name: s.name, pos: s.pos, scTotal: {},
        photo: players.find(p => p.id === s.id)?.photo || null,
      }
      roundAgg[s.id].scTotal = mergeScouts(roundAgg[s.id].scTotal, s.sc)
    }
  }
  const roundBest = bestByPosition(Object.values(roundAgg))
  const seasonBest = bestByPosition(players)
  const awards = seasonAwards(players)

  const AWARD_CFG = [
    { key: 'craque',     emoji: '🏆', title: 'Craque',     metric: p => `${ptsLabel(p.pts)} pts` },
    { key: 'artilheiro', emoji: '⚽', title: 'Artilheiro', metric: p => `${(p.sc.gol || 0) + (p.sc.golplaca || 0)} gol${((p.sc.gol||0)+(p.sc.golplaca||0)) > 1 ? 's' : ''}` },
    { key: 'xerifao',    emoji: '🛡️', title: 'Xerifão',    metric: p => `${(p.sc.defesa || 0) + (p.sc.desarme || 0)} def/des` },
    { key: 'garcom',     emoji: '🎯', title: 'Garçom',     metric: p => `${p.sc.assistencia || 0} assist.` },
  ]
  const awardCards = AWARD_CFG.filter(c => awards[c.key])

  function toLineup(best) {
    return best.map(({ player }) => ({
      pos: player.pos, name: player.name, photo: player.photo,
      meta: scoutSummary(player.sc) || `${ptsLabel(player.pts)} pts`,
    }))
  }

  function shareLineup(best, subtitle) {
    if (!best.length) { showToast('Sem scouts suficientes ainda.'); return }
    shareFifaLineup({ subtitle, players: toLineup(best) }, msg => showToast(msg))
  }

  function shareAwardsCard() {
    if (!awardCards.length) { showToast('Sem scouts suficientes ainda.'); return }
    shareCard({
      eyebrow: 'Prêmios da Temporada',
      title: 'Os Craques da Pelada',
      rows: awardCards.map(c => {
        const p = awards[c.key]
        return { emoji: c.emoji, name: p.name, meta: `${c.title} · ${p.pos}`, value: c.metric(p) }
      }),
    }, msg => showToast(msg))
  }

  const sectionTitle = (t) => (
    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--t3)', margin: '4px 0 8px' }}>{t}</div>
  )

  const shareBtn = (label, onClick, primary) => (
    <button onClick={onClick} style={{
      width: '100%', padding: 13, borderRadius: 11, marginTop: 4,
      background: primary ? 'linear-gradient(135deg,#0f4a27,#0b3d1f)' : '#f0ede8',
      color: primary ? '#fff' : 'var(--txt)',
      border: primary ? '1.5px solid #d9b451' : '1px solid var(--brd)',
      fontSize: 14, fontWeight: 700,
    }}>{label}</button>
  )

  function PositionList({ best }) {
    return (
      <div style={{ background: 'var(--sur)', borderRadius: 14, border: '1px solid var(--brd)', overflow: 'hidden', marginBottom: 10 }}>
        {best.map(({ pos, player }, i) => (
          <div key={pos} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', borderBottom: i < best.length - 1 ? '1px solid rgba(0,0,0,.05)' : 'none' }}>
            <span style={{ fontSize: 10, fontWeight: 800, width: 34, color: 'var(--t3)' }}>{pos.slice(0, 3).toUpperCase()}</span>
            <Avatar name={player.name} index={i} size={34} fontSize={11} photo={player.photo} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{player.name}</div>
              {scoutSummary(player.sc) && <div style={{ fontSize: 11, color: 'var(--t3)' }}>{scoutSummary(player.sc)}</div>}
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 10, ...ptStyle(player.pts) }}>{ptsLabel(player.pts)}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg,var(--navy),var(--navy2))', borderRadius: 14, padding: '13px 15px', marginBottom: 14, color: '#fff' }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>🔗 Compartilhar Destaques</div>
        <div style={{ fontSize: 12, opacity: .75, marginTop: 3, lineHeight: 1.5 }}>
          Gere a escalação dos melhores no estilo FIFA. Com foto dos peladeiros, a arte fica ainda melhor!
        </div>
      </div>

      {/* DESTAQUE DA RODADA */}
      {sectionTitle('⭐ Destaque da Rodada (atual)')}
      {roundBest.length > 0 ? (
        <>
          <PositionList best={roundBest} />
          {shareBtn('🏟 Compartilhar Seleção da Rodada (FIFA)', () => shareLineup(roundBest, 'Seleção da Rodada'), true)}
        </>
      ) : (
        <div style={{ background: 'var(--sur)', borderRadius: 14, border: '1px solid var(--brd)', padding: '22px 14px', textAlign: 'center', color: 'var(--t3)', fontSize: 13, marginBottom: 10 }}>
          Nenhuma partida finalizada nesta rodada ainda.
        </div>
      )}

      {/* DESTAQUE DA TEMPORADA */}
      <div style={{ height: 8 }} />
      {sectionTitle('🏆 Destaque da Temporada (todas as rodadas)')}
      {seasonBest.length > 0 ? (
        <>
          <PositionList best={seasonBest} />
          {shareBtn('🏟 Compartilhar Seleção da Temporada (FIFA)', () => shareLineup(seasonBest, 'Seleção da Temporada'), true)}
        </>
      ) : (
        <div style={{ background: 'var(--sur)', borderRadius: 14, border: '1px solid var(--brd)', padding: '22px 14px', textAlign: 'center', color: 'var(--t3)', fontSize: 13, marginBottom: 10 }}>
          Sem scouts acumulados na temporada ainda.
        </div>
      )}

      {/* PRÊMIOS */}
      {awardCards.length > 0 && (
        <>
          <div style={{ height: 8 }} />
          {sectionTitle('Prêmios individuais da temporada')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            {awardCards.map(c => {
              const p = awards[c.key]
              return (
                <div key={c.key} style={{ background: 'var(--sur)', border: '1px solid var(--brd)', borderRadius: 12, padding: '10px 12px' }}>
                  <div style={{ fontSize: 20 }}>{c.emoji}</div>
                  <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: .5, textTransform: 'uppercase', color: 'var(--t3)', marginTop: 4 }}>{c.title}</div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{p.name}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t2)' }}>{p.pos} · {c.metric(p)}</div>
                </div>
              )
            })}
          </div>
          {shareBtn('🔗 Compartilhar Prêmios (card)', shareAwardsCard, false)}
        </>
      )}
    </div>
  )
}
