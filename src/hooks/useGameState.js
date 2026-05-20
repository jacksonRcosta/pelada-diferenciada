import { useState, useEffect, useCallback, useRef } from 'react'
import { loadState, saveState, subscribeToChanges } from '../lib/supabase'
import { INITIAL_STATE } from '../lib/constants'

export function useGameState(viewOnly = false) {
  const [state, setState] = useState(INITIAL_STATE)
  const [syncStatus, setSyncStatus] = useState('idle')
  const lastSaved = useRef('')
  const saveTimer = useRef(null)
  const loaded = useRef(false)

  // Carrega dados iniciais do banco
  useEffect(() => {
    setSyncStatus('syncing')
    loadState()
      .then(d => {
        if (d && Object.keys(d).length > 0) {
          setState({ ...INITIAL_STATE, ...d })
          lastSaved.current = JSON.stringify(d)
          console.log('Estado carregado:', d)
        }
        setSyncStatus('ok')
        setTimeout(() => setSyncStatus('idle'), 2000)
        loaded.current = true
      })
      .catch(err => {
        console.error('Erro ao carregar:', err)
        setSyncStatus('error')
        loaded.current = true
      })
  }, [])

  // Polling para sincronização em tempo real
  useEffect(() => {
    const unsub = subscribeToChanges(data => {
      if (!data) return
      const raw = JSON.stringify(data)
      if (raw !== lastSaved.current) {
        lastSaved.current = raw
        setState({ ...INITIAL_STATE, ...data })
        console.log('Estado atualizado via polling:', data)
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

      // Salva com debounce de 400ms
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        const serialized = JSON.stringify(next)
        if (serialized === lastSaved.current) return

        console.log('Salvando no banco:', next)
        setSyncStatus('syncing')
        try {
          await saveState(next)
          lastSaved.current = serialized
          setSyncStatus('ok')
          console.log('Salvo com sucesso!')
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
