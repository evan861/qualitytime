// Consumes the SSE stream from POST /api/chat and accumulates the
// content_block_delta text into `response`.

import { useCallback, useRef, useState } from 'react'

export function useChatStream() {
  const [response, setResponse]       = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError]             = useState(null)
  const abortRef = useRef(null)

  const stream = useCallback(async (body) => {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    setResponse('')
    setError(null)
    setIsStreaming(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ac.signal,
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`Server returned ${res.status}: ${text || 'no body'}`)
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const events = buffer.split('\n\n')
        buffer = events.pop() || ''

        for (const evt of events) {
          let eventName = 'message'
          const dataLines = []
          for (const line of evt.split('\n')) {
            if (line.startsWith('event: ')) eventName = line.slice(7).trim()
            else if (line.startsWith('data: ')) dataLines.push(line.slice(6))
          }
          const dataStr = dataLines.join('\n').trim()
          if (!dataStr) continue
          if (eventName === 'error') {
            try { throw new Error(JSON.parse(dataStr).message || dataStr) }
            catch (e) { throw e instanceof Error ? e : new Error(dataStr) }
          }
          try {
            const j = JSON.parse(dataStr)
            if (j.type === 'content_block_delta' && j.delta?.text) {
              setResponse(prev => prev + j.delta.text)
            }
          } catch { /* keepalives or partial frames */ }
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') setError(e)
    } finally {
      setIsStreaming(false)
    }
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setResponse('')
    setError(null)
    setIsStreaming(false)
  }, [])

  return { stream, reset, response, isStreaming, error }
}
