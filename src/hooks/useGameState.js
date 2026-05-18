import { useState, useEffect, useCallback, useRef } from 'react'
import { loadState, saveState, subscribeToChanges } from '../lib/supabase'
import { INITIAL_STATE } from '../lib/constants'

export function useGameState(viewOnly = false) {
  const [state, setState] = useState(INITIAL_STATE)
  const [syncStatus, setSyncStatus] = useState('idle')
  const saveTimer = useRef(null)
  const lastSaved = useRef('')

  useEffect(() => {
    loadState().then(d => {
      if (d) { setState(s => ({ ...s, ...d })); lastSaved.current = JSON.stringify(d) }
    }).catch(console.error)
  }, [])

  useEffect(() => {
    const unsub = subscribeToChanges(data => {
      if (!data) return
      const raw = JSON.stringify(data)
      if (raw !== lastSaved.current) { lastSaved.current = raw; setState(s => ({ ...s, ...data })) }
    })
    return unsub
  }, [])

  const update = useCallback((patch) => {
    if (viewOnly) return
    setState(prev => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        const serialized = JSON.stringify(next)
        if (serialized === lastSaved.current) return
        setSyncStatus('syncing')
        try {
          await saveState(next)
          lastSaved.current = serialized
          setSyncStatus('ok')
          setTimeout(() => setSyncStatus('idle'), 2000)
        } catch (e) { console.error(e); setSyncStatus('error') }
      }, 600)
      return next
    })
  }, [viewOnly])

  return { state, update, syncStatus }
}
