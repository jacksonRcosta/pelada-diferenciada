import { SCOUTS, AV_COLS } from './constants'

// Ordem tática para exibir jogadores dentro de um time:
// Goleiro → Zagueiro → Lateral → Meia → Atacante.
export const POSITION_ORDER = ['Goleiro', 'Zagueiro', 'Lateral', 'Meia', 'Atacante']
export function posRank(pos) {
  const i = POSITION_ORDER.indexOf(pos)
  return i < 0 ? POSITION_ORDER.length : i
}
// Ordena jogadores por posição (estável: mantém a ordem original para mesma
// posição). Não muta o array recebido.
export function sortByPosition(players) {
  return players
    .map((p, i) => [p, i])
    .sort((a, b) => posRank(a[0].pos) - posRank(b[0].pos) || a[1] - b[1])
    .map(([p]) => p)
}

export function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}
export function avatarColor(i) { return AV_COLS[i % AV_COLS.length] }
export function calcPoints(sc) {
  return SCOUTS.reduce((s, x) => s + (sc[x.id] || 0) * x.pts, 0)
}
export function formatTime(sec) {
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
}
export function ptStyle(pt) {
  return { color: pt >= 0 ? '#085041' : '#791F1F', background: pt >= 0 ? '#E1F5EE' : '#FCEBEB' }
}
export function ptsLabel(pt) { return `${pt > 0 ? '+' : ''}${pt}` }
export function buildSchedule(n) {
  const s = []
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) s.push({ a, b, done: false, scoreA: 0, scoreB: 0 })
  return s
}
export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Soma um ou mais mapas de contagem ({scoutId: qtd}) em um único mapa.
// Usado para acumular os scouts da partida no total da temporada.
export function mergeScouts(...maps) {
  const out = {}
  for (const m of maps) {
    if (!m) continue
    for (const k in m) {
      const v = (out[k] || 0) + (m[k] || 0)
      if (v !== 0) out[k] = v
    }
  }
  return out
}

// Indica se um mapa de contagem possui alguma marcação > 0.
export function hasCounts(m) {
  return !!m && Object.values(m).some(v => v > 0)
}

// Comparador de "melhor jogador" pelo critério acordado:
// 1) maior pontuação de scout; 2) mais gols (gol + gol de placa);
// 3) mais assistências; 4) menos falhas. Recebe dois mapas de scout.
export function compareScout(a = {}, b = {}) {
  const pb = calcPoints(b), pa = calcPoints(a)
  if (pb !== pa) return pb - pa
  const gb = (b.gol || 0) + (b.golplaca || 0), ga = (a.gol || 0) + (a.golplaca || 0)
  if (gb !== ga) return gb - ga
  const asb = b.assistencia || 0, asa = a.assistencia || 0
  if (asb !== asa) return asb - asa
  return (a.falha || 0) - (b.falha || 0) // menos falhas primeiro
}

// Ordena uma lista de jogadores [{ sc, ... }] do melhor para o pior pelo
// critério de MVP. Não muta o array. Considera apenas quem possui marcações.
export function rankByScout(entries) {
  return (entries || [])
    .filter(e => hasCounts(e.sc))
    .slice()
    .sort((x, y) => compareScout(x.sc, y.sc))
}

// Retorna o melhor jogador de uma lista (ou null se ninguém pontuou).
export function bestPlayer(entries) {
  return rankByScout(entries)[0] || null
}

// Calcula o melhor jogador de cada posição a partir de uma lista de jogadores
// com scouts acumulados. `getSc` extrai o mapa de scout de cada jogador.
// Retorna um array ordenado pela ordem tática: [{ pos, player }].
export function bestByPosition(players, getSc = p => p.scTotal) {
  const groups = {}
  for (const p of players || []) {
    const sc = getSc(p) || {}
    if (!hasCounts(sc)) continue
    const pos = p.pos || '—'
    if (!groups[pos]) groups[pos] = []
    groups[pos].push({ name: p.name, pos, sc, pts: calcPoints(sc) })
  }
  return Object.keys(groups)
    .sort((a, b) => posRank(a) - posRank(b))
    .map(pos => ({ pos, player: groups[pos].sort((x, y) => compareScout(x.sc, y.sc))[0] }))
}

// Prêmios da temporada — computados sobre os scouts ACUMULADOS de todos os jogos
// (scTotal). Cada prêmio elege 1 jogador por um critério objetivo; empate é
// desempatado pela pontuação geral (compareScout). Retorna null em cada prêmio
// quando ninguém tem a métrica > 0. `getSc` extrai o mapa de scout do jogador.
export function seasonAwards(players, getSc = p => p.scTotal) {
  const entries = (players || [])
    .map(p => {
      const sc = getSc(p) || {}
      return {
        name: p.name,
        pos: p.pos,
        sc,
        pts: calcPoints(sc),
        gols: (sc.gol || 0) + (sc.golplaca || 0),
        defesas: (sc.defesa || 0) + (sc.desarme || 0),
        assist: sc.assistencia || 0,
      }
    })

  // Elege o melhor por uma métrica numérica; desempate por compareScout.
  const pick = (metric) => {
    const cand = entries.filter(e => e[metric] > 0)
    if (!cand.length) return null
    return cand.sort((a, b) => (b[metric] - a[metric]) || compareScout(a.sc, b.sc))[0]
  }

  const craque = bestPlayer(entries.map(e => ({ name: e.name, pos: e.pos, sc: e.sc })))
  return {
    craque: craque ? { name: craque.name, pos: craque.pos, sc: craque.sc, pts: calcPoints(craque.sc) } : null,
    artilheiro: pick('gols'),
    xerifao: pick('defesas'),
    garcom: pick('assist'),
  }
}

// Total de cartões de um jogador (soma de todos os tipos do mapa de cartões).
export function totalCards(cards = {}) {
  return Object.values(cards || {}).reduce((s, v) => s + (v || 0), 0)
}

// Monta um resumo curto de scouts de um jogador para mensagens (ex.: "2 gols, 1 assist.").
export function scoutSummary(sc = {}) {
  const parts = []
  const g = (sc.gol || 0) + (sc.golplaca || 0)
  if (g) parts.push(`${g} gol${g > 1 ? 's' : ''}`)
  if (sc.assistencia) parts.push(`${sc.assistencia} assist.`)
  if (sc.defesa) parts.push(`${sc.defesa} defesa${sc.defesa > 1 ? 's' : ''}`)
  if (sc.desarme) parts.push(`${sc.desarme} desarme${sc.desarme > 1 ? 's' : ''}`)
  return parts.join(', ')
}

// Compartilha um texto via Web Share API (mobile) ou copia para a área de
// transferência. `onCopied` é chamado quando o texto foi copiado (para toast).
export function shareText(title, text, onCopied) {
  if (navigator.share) {
    navigator.share({ title, text }).catch(() => {})
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => onCopied && onCopied())
  } else {
    // eslint-disable-next-line no-alert
    window.prompt('Copie o texto:', text)
  }
}

// Lê um arquivo de imagem e devolve um dataURL JPEG redimensionado (quadrado,
// lado máx. `size`px). Mantém o blob salvo no Supabase pequeno o suficiente para
// caber no estado único. Rejeita em caso de erro de leitura/decodificação.
export function imageFileToDataURL(file, size = 128) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Imagem inválida'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        const min = Math.min(img.width, img.height)
        const sx = (img.width - min) / 2
        const sy = (img.height - min) / 2
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

// Verifica se a data fim da temporada (formato 'YYYY-MM-DD') já passou.
export function seasonEnded(dateEnd) {
  if (!dateEnd) return false
  const end = new Date(dateEnd + 'T23:59:59')
  return new Date() > end
}
