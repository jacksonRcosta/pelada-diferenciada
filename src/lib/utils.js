import { SCOUTS, AV_COLS } from './constants'

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
