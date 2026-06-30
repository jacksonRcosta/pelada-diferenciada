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
