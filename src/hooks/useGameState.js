import { useState, useEffect, useCallback, useRef } from 'react'
import { loadState, saveState, subscribeToChanges } from '../lib/supabase'
import { INITIAL_STATE } from '../lib/constants'
import { ensureFinance } from '../lib/utils'

// Garante que todo jogador tenha os campos da partida atual (sc/cards) e os
// acumulados da temporada (scTotal/cardsTotal). Migração retrocompatível:
// dados antigos só possuíam `sc`/`cards` acumulados — esse acervo é tratado
// como total da temporada e a partida atual passa a iniciar zerada.
function normalizePlayers(players) {
  return (players || []).map(p => {
    if (p.scTotal === undefined && p.cardsTotal === undefined) {
      return { ...p, scTotal: p.sc || {}, cardsTotal: p.cards || {}, gamesTotal: p.gamesTotal || 0, sc: {}, cards: {} }
    }
    return {
      ...p,
      sc: p.sc || {},
      cards: p.cards || {},
      scTotal: p.scTotal || {},
      cardsTotal: p.cardsTotal || {},
      gamesTotal: p.gamesTotal || 0,
    }
  })
}

function normalizeState(data) {
  return {
    ...INITIAL_STATE,
    ...data,
    players: normalizePlayers(data.players),
    finance: ensureFinance(data.finance),
  }
}

export function useGameState(peladaId, viewOnly = false) {
  const [state, setState] = useState(INITIAL_STATE)
  const [syncStatus, setSyncStatus] = useState('idle')
  const lastSaved = useRef('')
  const saveTimer = useRef(null)

  // Carrega dados da pelada selecionada (recarrega ao trocar de pelada)
  useEffect(() => {
    if (!peladaId) return
    setState(INITIAL_STATE)
    lastSaved.current = ''
    setSyncStatus('syncing')
    loadState(peladaId)
      .then(d => {
        if (d && d.players !== undefined) {
          setState(normalizeState(d))
          lastSaved.current = JSON.stringify(d)
        }
        setSyncStatus('ok')
        setTimeout(() => setSyncStatus('idle'), 2000)
      })
      .catch(err => {
        console.error('Erro ao carregar:', err)
        setSyncStatus('error')
      })
  }, [peladaId])

  // Polling — só atualiza se tiver dados válidos com players
  useEffect(() => {
    if (!peladaId) return
    const unsub = subscribeToChanges(peladaId, data => {
      if (!data || data.players === undefined) return
      const raw = JSON.stringify(data)
      if (raw !== lastSaved.current) {
        lastSaved.current = raw
        setState(normalizeState(data))
      }
    })
    return unsub
  }, [peladaId])

  const update = useCallback((patch) => {
    if (viewOnly || !peladaId) return

    setState(prev => {
      const next = typeof patch === 'function'
        ? patch(prev)
        : { ...prev, ...patch }

      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        const serialized = JSON.stringify(next)
        if (serialized === lastSaved.current) return

        setSyncStatus('syncing')
        try {
          await saveState(peladaId, next)
          lastSaved.current = serialized
          setSyncStatus('ok')
          setTimeout(() => setSyncStatus('idle'), 2000)
        } catch (err) {
          console.error('Erro ao salvar:', err)
          setSyncStatus('error')
          setTimeout(() => setSyncStatus('idle'), 4000)
        }
      }, 400)

      return next
    })
  }, [viewOnly, peladaId])

  return { state, update, syncStatus }
}
