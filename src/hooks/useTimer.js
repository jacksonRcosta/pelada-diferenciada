import { useState, useEffect, useRef, useCallback } from 'react'

export function useTimer(defaultMin = 45) {
  const [secs, setSecs] = useState(0)
  const [running, setRunning] = useState(false)
  const [target, setTarget] = useState(defaultMin * 60)
  const iv = useRef(null)

  useEffect(() => {
    if (running) { iv.current = setInterval(() => setSecs(s => s + 1), 1000) }
    else clearInterval(iv.current)
    return () => clearInterval(iv.current)
  }, [running])

  const start = useCallback(() => setRunning(true), [])
  const pause = useCallback(() => setRunning(false), [])
  const reset = useCallback(() => { setRunning(false); setSecs(0) }, [])
  const setMin = useCallback(m => setTarget(m * 60), [])

  return {
    secs, running, target,
    status: running ? 'running' : secs >= target ? 'overtime' : 'idle',
    start, pause, reset, setMin
  }
}
