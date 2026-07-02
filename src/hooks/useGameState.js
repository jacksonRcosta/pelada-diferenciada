import { useState, useEffect, useCallback, useRef } from 'react'
import { loadState, saveState, subscribeToChanges } from '../lib/supabase'
import { INITIAL_STATE } from '../lib/constants'

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
  return { ...INITIAL_STATE, ...data, players: normalizePlayers(data.players) }
}

export function useGameState(viewOnly = false) {
  const [state, setState] = useState(INITIAL_STATE)
  const [syncStatus, setSyncStatus] = useState('idle')
  const lastSaved = useRef('')
  const saveTimer = useRef(null)

  // Carrega dados iniciais
  useEffect(() => {
    setSyncStatus('syncing')
    loadState()
      .then(d => {
        if (d && d.players !== undefined) {
          console.log('Dados carregados do banco:', JSON.stringify(d).slice(0, 200))
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
  }, [])

  // Polling — só atualiza se tiver dados válidos com players
  useEffect(() => {
    const unsub = subscribeToChanges(data => {
      if (!data || data.players === undefined) return
      const raw = JSON.stringify(data)
      if (raw !== lastSaved.current) {
        console.log('Dados atualizados via polling')
        lastSaved.current = raw
        setState(normalizeState(data))
      }
    })
    return unsub
  }, [])

  const update = useCallback((patch) => {
    if (viewOnly) return

    setState(prev => {
      const next = typeof patch === 'function'
        ? patch(prev)
        : { ...prev, ...patch }

      // Log para debug
      console.log('update chamado, players:', JSON.stringify(next.players))

      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        const serialized = JSON.stringify(next)
        if (serialized === lastSaved.current) return

        setSyncStatus('syncing')
        try {
          await saveState(next)
          lastSaved.current = serialized
          setSyncStatus('ok')
          console.log('Salvo! Players:', JSON.stringify(next.players))
          setTimeout(() => setSyncStatus('idle'), 2000)
        } catch (err) {
          console.error('Erro ao salvar:', err)
          setSyncStatus('error')
          setTimeout(() => setSyncStatus('idle'), 4000)
        }
      }, 400)

      return next
    })
  }, [viewOnly])

  return { state, update, syncStatus }
}
