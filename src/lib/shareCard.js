// Gera uma imagem "story" (1080×1920) no estilo de postagem de rede social a
// partir dos dados de um ranking/destaque, e compartilha o arquivo via Web Share
// API. Quando o dispositivo não suporta compartilhar arquivos, faz o download da
// imagem como fallback. Toda a arte é desenhada em <canvas> — sem dependências.
import LOGO from './logo'

const W = 1080, H = 1920
const NAVY = '#1a3a6b', NAVY2 = '#0d2347', GOLD = '#c9a84c'

// Cache do logo decodificado (evita recarregar a cada compartilhamento).
let logoImg = null
function loadLogo() {
  if (logoImg) return Promise.resolve(logoImg)
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => { logoImg = img; resolve(img) }
    img.onerror = () => resolve(null)
    img.src = LOGO
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

// Trunca um texto com reticências para caber em `maxW`.
function fitText(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text
  let t = text
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1)
  return t + '…'
}

// Desenha o card e devolve um Blob PNG.
// data = { eyebrow, title, subtitle, rows: [{ rank?, medalColor?, name, meta?, value?, emoji? }], footer }
async function drawCard(data) {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Fundo: gradiente navy diagonal.
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, NAVY)
  g.addColorStop(1, NAVY2)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // Textura sutil de brilho superior.
  const glow = ctx.createRadialGradient(W / 2, 260, 60, W / 2, 260, 620)
  glow.addColorStop(0, 'rgba(201,168,76,0.22)')
  glow.addColorStop(1, 'rgba(201,168,76,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, 760)

  // Logo (topo, centralizado e circular).
  const logo = await loadLogo()
  const D = 190, lx = W / 2 - D / 2, ly = 120
  if (logo) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(W / 2, ly + D / 2, D / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(logo, lx, ly, D, D)
    ctx.restore()
    ctx.lineWidth = 5
    ctx.strokeStyle = GOLD
    ctx.beginPath()
    ctx.arc(W / 2, ly + D / 2, D / 2, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.textAlign = 'center'

  // Eyebrow (categoria).
  ctx.fillStyle = GOLD
  ctx.font = '700 34px -apple-system, "Helvetica Neue", Arial, sans-serif'
  ctx.letterSpacing = '4px'
  ctx.fillText((data.eyebrow || 'PELADA DIFERENCIADA').toUpperCase(), W / 2, ly + D + 78)
  ctx.letterSpacing = '0px'

  // Título.
  ctx.fillStyle = '#fff'
  ctx.font = '800 68px -apple-system, "Helvetica Neue", Arial, sans-serif'
  ctx.fillText(fitText(ctx, data.title || '', W - 120), W / 2, ly + D + 168)

  // Subtítulo opcional.
  let top = ly + D + 240
  if (data.subtitle) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '500 34px -apple-system, "Helvetica Neue", Arial, sans-serif'
    ctx.fillText(fitText(ctx, data.subtitle, W - 140), W / 2, top)
    top += 60
  }
  top += 40

  // Linhas (cards claros empilhados).
  const rows = data.rows || []
  const pad = 70, rowW = W - pad * 2
  const rowH = rows.length > 6 ? 118 : 138
  const gap = 22
  ctx.textAlign = 'left'
  rows.forEach((r, i) => {
    const y = top + i * (rowH + gap)
    ctx.fillStyle = 'rgba(255,255,255,0.96)'
    roundRect(ctx, pad, y, rowW, rowH, 28)
    ctx.fill()

    let x = pad + 40
    // Medalha/posição ou emoji à esquerda.
    if (r.emoji) {
      ctx.textAlign = 'center'
      ctx.font = '700 58px -apple-system, "Helvetica Neue", Arial, sans-serif'
      ctx.fillStyle = '#000'
      ctx.fillText(r.emoji, x + 20, y + rowH / 2 + 20)
      ctx.textAlign = 'left'
      x += 80
    } else if (r.rank != null) {
      ctx.fillStyle = r.medalColor || '#c9c9c9'
      ctx.font = '800 56px -apple-system, "Helvetica Neue", Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(String(r.rank), x + 24, y + rowH / 2 + 20)
      ctx.textAlign = 'left'
      x += 78
    }

    // Valor à direita (pontos/gols...), em pill navy.
    let rightEdge = pad + rowW - 40
    if (r.value != null) {
      ctx.font = '800 40px -apple-system, "Helvetica Neue", Arial, sans-serif'
      const vw = ctx.measureText(r.value).width
      const pillW = vw + 56, pillH = 64
      const px = pad + rowW - 40 - pillW, py = y + rowH / 2 - pillH / 2
      ctx.fillStyle = NAVY
      roundRect(ctx, px, py, pillW, pillH, 32)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'center'
      ctx.fillText(r.value, px + pillW / 2, py + pillH / 2 + 14)
      ctx.textAlign = 'left'
      rightEdge = px - 24
    }

    // Nome + meta.
    const textW = rightEdge - x
    ctx.fillStyle = '#1a1a18'
    ctx.font = '700 44px -apple-system, "Helvetica Neue", Arial, sans-serif'
    const nameY = r.meta ? y + rowH / 2 - 8 : y + rowH / 2 + 16
    ctx.fillText(fitText(ctx, r.name || '', textW), x, nameY)
    if (r.meta) {
      ctx.fillStyle = '#6b6b66'
      ctx.font = '500 30px -apple-system, "Helvetica Neue", Arial, sans-serif'
      ctx.fillText(fitText(ctx, r.meta, textW), x, y + rowH / 2 + 34)
    }
  })

  // Rodapé.
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '600 30px -apple-system, "Helvetica Neue", Arial, sans-serif'
  ctx.fillText(data.footer || 'peladadiferenciada.netlify.app', W / 2, H - 90)

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.92))
}

// Gera e compartilha o card. `onFallback(msg)` é chamado quando não foi possível
// compartilhar o arquivo (usa download) — útil para exibir um toast.
export async function shareCard(data, onFallback) {
  let blob
  try {
    blob = await drawCard(data)
  } catch (e) {
    onFallback && onFallback('Não foi possível gerar a imagem.')
    return
  }
  if (!blob) { onFallback && onFallback('Não foi possível gerar a imagem.'); return }

  const fileName = `pelada-${(data.eyebrow || 'card').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`
  const file = new File([blob], fileName, { type: 'image/png' })

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: data.title })
      return
    } catch (e) {
      if (e && e.name === 'AbortError') return // usuário cancelou
    }
  }

  // Fallback: download da imagem.
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
