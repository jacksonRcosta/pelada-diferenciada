// Gera uma imagem "Seleção" no estilo FIFA/Team of the Week (1080×1920): campo
// de futebol escuro com tema dourado, título e um card por posição (1 melhor de
// cada) posicionado no gramado. Quando o jogador tem foto, ela é usada; senão,
// desenha-se uma silhueta padrão. Compartilha via Web Share API (fallback:
// download). Sem dependências — tudo em <canvas>.
import LOGO from './logo'

const W = 1080, H = 1920
const GOLD = '#d9b451'
const CARD_BG = '#0c1712', CARD_BG2 = '#16281d'

// Abreviações de posição no padrão dos cards.
const POS_ABBR = {
  Goleiro: 'GOL', Zagueiro: 'ZAG', Lateral: 'LAT', Meia: 'MEI', Atacante: 'ATA',
}
// Coordenadas no campo (fração da largura/altura da área útil) para dispor os
// cards como uma formação — ataque em cima, goleiro embaixo, e laterais/zaga
// espalhados horizontalmente (evita a lista "um embaixo do outro").
const POS_COORD = {
  Atacante: { x: 0.50, y: 0.05 },
  Meia:     { x: 0.50, y: 0.36 },
  Lateral:  { x: 0.76, y: 0.64 },
  Zagueiro: { x: 0.26, y: 0.64 },
  Goleiro:  { x: 0.50, y: 0.95 },
}

let logoImg = null
function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function fitText(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text
  let t = text
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1)
  return t + '…'
}

// Desenha o gramado com faixas, linhas e brilho de refletores no topo.
function drawPitch(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#0b3d1f')
  g.addColorStop(0.5, '#0f4a27')
  g.addColorStop(1, '#082d17')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // Faixas horizontais alternadas (efeito de gramado cortado).
  ctx.fillStyle = 'rgba(255,255,255,0.03)'
  for (let i = 0; i < 12; i += 2) ctx.fillRect(0, (H / 12) * i, W, H / 12)

  // Brilho superior (refletores).
  const glow = ctx.createRadialGradient(W / 2, 0, 40, W / 2, 0, 900)
  glow.addColorStop(0, 'rgba(255,255,255,0.16)')
  glow.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, 700)

  // Linhas do campo.
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'
  ctx.lineWidth = 4
  ctx.strokeRect(40, 300, W - 80, H - 420)
  ctx.beginPath()
  ctx.moveTo(40, H / 2 + 40)
  ctx.lineTo(W - 40, H / 2 + 40)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(W / 2, H / 2 + 40, 120, 0, Math.PI * 2)
  ctx.stroke()
  // Áreas.
  ctx.strokeRect(W / 2 - 200, 300, 400, 150)
  ctx.strokeRect(W / 2 - 200, H - 270, 400, 150)
}

// Desenha uma silhueta de jogador dentro de um círculo (fallback sem foto).
function drawSilhouette(ctx, cx, cy, r) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r)
  g.addColorStop(0, '#3a4a41')
  g.addColorStop(1, '#243029')
  ctx.fillStyle = g
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  // Cabeça.
  ctx.beginPath()
  ctx.arc(cx, cy - r * 0.25, r * 0.34, 0, Math.PI * 2)
  ctx.fill()
  // Ombros/tronco.
  ctx.beginPath()
  ctx.arc(cx, cy + r * 0.9, r * 0.7, Math.PI, 0)
  ctx.fill()
  ctx.restore()
}

// Desenha um card de jogador centrado em (cx) começando em topo y.
function drawPlayerCard(ctx, x, y, w, h, entry, photoImg) {
  // Corpo do card.
  const bg = ctx.createLinearGradient(x, y, x, y + h)
  bg.addColorStop(0, CARD_BG2)
  bg.addColorStop(1, CARD_BG)
  ctx.fillStyle = bg
  roundRect(ctx, x, y, w, h, 26)
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = GOLD
  roundRect(ctx, x, y, w, h, 26)
  ctx.stroke()

  // Foto/silhueta (círculo com borda dourada).
  const r = 60, cx = x + w / 2, cy = y + 80
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  if (photoImg) {
    // Cobre o círculo mantendo proporção.
    const s = Math.max((r * 2) / photoImg.width, (r * 2) / photoImg.height)
    const dw = photoImg.width * s, dh = photoImg.height * s
    ctx.drawImage(photoImg, cx - dw / 2, cy - dh / 2, dw, dh)
  } else {
    ctx.restore()
    drawSilhouette(ctx, cx, cy, r)
    ctx.save()
  }
  ctx.restore()
  ctx.lineWidth = 4
  ctx.strokeStyle = GOLD
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()

  // Chip de posição (canto superior esquerdo).
  const abbr = POS_ABBR[entry.pos] || (entry.pos || '').slice(0, 3).toUpperCase()
  ctx.font = '800 26px -apple-system, "Helvetica Neue", Arial, sans-serif'
  const cw = ctx.measureText(abbr).width + 26
  ctx.fillStyle = GOLD
  roundRect(ctx, x + 14, y + 14, cw, 40, 12)
  ctx.fill()
  ctx.fillStyle = '#12130a'
  ctx.textAlign = 'center'
  ctx.fillText(abbr, x + 14 + cw / 2, y + 42)

  // Nome.
  ctx.fillStyle = '#fff'
  ctx.font = '800 30px -apple-system, "Helvetica Neue", Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(fitText(ctx, (entry.name || '').toUpperCase(), w - 28), cx, cy + r + 42)

  // Divisória dourada.
  ctx.strokeStyle = 'rgba(217,180,81,0.5)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(x + 40, cy + r + 58)
  ctx.lineTo(x + w - 40, cy + r + 58)
  ctx.stroke()

  // Descrição (scouts).
  if (entry.meta) {
    ctx.fillStyle = GOLD
    ctx.font = '600 23px -apple-system, "Helvetica Neue", Arial, sans-serif'
    const lines = wrapLines(ctx, entry.meta, w - 34, 2)
    lines.forEach((ln, i) => ctx.fillText(ln, cx, cy + r + 88 + i * 28))
  }
}

// Quebra o texto em até `max` linhas cabendo em `maxW`.
function wrapLines(ctx, text, maxW, max) {
  const words = text.split(' ')
  const lines = []
  let cur = ''
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur)
      cur = w
      if (lines.length === max - 1) break
    } else cur = test
  }
  if (cur && lines.length < max) lines.push(cur)
  return lines
}

async function drawLineup(data) {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  drawPitch(ctx)

  // Cabeçalho.
  if (!logoImg) logoImg = await loadImage(LOGO)
  ctx.textAlign = 'center'
  // Coroa.
  ctx.fillStyle = GOLD
  ctx.font = '400 46px -apple-system, "Helvetica Neue", Arial, sans-serif'
  ctx.fillText('♛', W / 2, 90)
  // Título.
  ctx.fillStyle = '#fff'
  ctx.font = '800 82px -apple-system, "Helvetica Neue", Arial, sans-serif'
  ctx.fillText('MELHORES DA PELADA', W / 2, 170)
  // Subtítulo dourado.
  ctx.fillStyle = GOLD
  ctx.font = '700 40px -apple-system, "Helvetica Neue", Arial, sans-serif'
  ctx.letterSpacing = '3px'
  ctx.fillText((data.subtitle || 'SELEÇÃO').toUpperCase(), W / 2, 236)
  ctx.letterSpacing = '0px'

  const entries = data.players || []
  // Pré-carrega as fotos.
  const photos = await Promise.all(entries.map(e => loadImage(e.photo)))

  // Cards retrato dispostos em formação no gramado.
  const cardW = 272, cardH = 300
  const bandTop = 300, bandH = H - 520
  // Posições ainda sem coordenada definida entram numa coluna de reserva.
  let extra = 0
  entries.forEach((e, i) => {
    const c = POS_COORD[e.pos] || { x: 0.5, y: 0.20 + (extra++) * 0.2 }
    const cx = c.x * W
    const cy = bandTop + c.y * bandH
    const x = Math.max(24, Math.min(W - cardW - 24, cx - cardW / 2))
    const y = Math.max(bandTop, Math.min(H - 210 - cardH, cy - cardH / 2))
    drawPlayerCard(ctx, x, y, cardW, cardH, e, photos[i])
  })

  // Rodapé: selos.
  if (logoImg) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(96, H - 90, 40, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(logoImg, 56, H - 130, 80, 80)
    ctx.restore()
  }
  ctx.textAlign = 'left'
  ctx.fillStyle = GOLD
  ctx.font = '800 30px -apple-system, "Helvetica Neue", Arial, sans-serif'
  ctx.fillText('PELADEIROS', 150, H - 96)
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = '600 22px -apple-system, "Helvetica Neue", Arial, sans-serif'
  ctx.fillText('peladadiferenciada.netlify.app', 150, H - 66)

  ctx.textAlign = 'right'
  ctx.fillStyle = GOLD
  ctx.font = '800 28px -apple-system, "Helvetica Neue", Arial, sans-serif'
  ctx.fillText('FAIR PLAY 🤝', W - 50, H - 96)
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = '600 22px -apple-system, "Helvetica Neue", Arial, sans-serif'
  ctx.fillText('RESPEITO SEMPRE!', W - 50, H - 66)

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.92))
}

// Gera e compartilha a escalação. `onFallback(msg)` para toast.
export async function shareFifaLineup(data, onFallback) {
  let blob
  try {
    blob = await drawLineup(data)
  } catch (e) {
    onFallback && onFallback('Não foi possível gerar a imagem.')
    return
  }
  if (!blob) { onFallback && onFallback('Não foi possível gerar a imagem.'); return }

  const fileName = `pelada-selecao-${(data.subtitle || 'time').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`
  const file = new File([blob], fileName, { type: 'image/png' })

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Melhores da Pelada' })
      return
    } catch (e) {
      if (e && e.name === 'AbortError') return
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  onFallback && onFallback('📷 Imagem baixada para compartilhar!')
}
