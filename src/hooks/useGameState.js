import { useState, useEffect, useCallback, useRef } from 'react'
import { loadState, saveState, subscribeToChanges } from '../lib/supabase'
import { INITIAL_STATE } from '../lib/constants'

export function useGameState(viewOnly = false) {
  const [state, setState] = useState(INITIAL_STATE)
  const [syncStatus, setSyncStatus] = useState('idle')
  const lastSaved = useRef('')
  const saveTimer = useRef(null)
  const saving = useRef(false)

  // Carrega dados iniciais
  useEffect(() => {
    setSyncStatus('syncing')
    loadState()
      .then(d => {
        if (d && Object.keys(d).length > 0) {
          setState(s => ({ ...INITIAL_STATE, ...s, ...d }))
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

  // Realtime subscription
  useEffect(() => {
    const unsub = subscribeToChanges(data => {
      if (!data) return
      const raw = JSON.stringify(data)
      if (raw !== lastSaved.current) {
        lastSaved.current = raw
        setState(s => ({ ...INITIAL_STATE, ...s, ...data }))
      }
    })
    return unsub
  }, [])

  // Salva imediatamente (sem debounce excessivo)
  const persist = useCallback(async (nextState) => {
    if (viewOnly || saving.current) return
    const serialized = JSON.stringify(nextState)
    if (serialized === lastSaved.current) return

    saving.current = true
    setSyncStatus('syncing')
    try {
      await saveState(nextState)
      lastSaved.current = serialized
      setSyncStatus('ok')
      setTimeout(() => setSyncStatus('idle'), 2000)
    } catch (err) {
      console.error('Erro ao salvar:', err)
      setSyncStatus('error')
      setTimeout(() => setSyncStatus('idle'), 4000)
    } finally {
      saving.current = false
    }
  }, [viewOnly])

  const update = useCallback((patch) => {
    if (viewOnly) return
    setState(prev => {
      const next = typeof patch === 'function'
        ? patch(prev)
        : { ...prev, ...patch }
      // Cancela timer anterior e agenda novo salvamento
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => persist(next), 300)
      return next
    })
  }, [viewOnly, persist])

  return { state, update, syncStatus }
}
