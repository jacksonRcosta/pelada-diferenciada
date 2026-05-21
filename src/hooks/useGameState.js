import { useState, useEffect, useCallback, useRef } from 'react'
import { loadState, saveState, subscribeToChanges } from '../lib/supabase'
import { INITIAL_STATE } from '../lib/constants'

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
          setState({ ...INITIAL_STATE, ...d })
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
        setState({ ...INITIAL_STATE, ...data })
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
