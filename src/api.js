const BASE = '/api'

export async function fetchStore() {
  const res = await fetch(`${BASE}/store`)
  if (!res.ok) throw new Error(`fetchStore: ${res.status}`)
  return res.json()
}

export async function persistStore(data) {
  const res = await fetch(`${BASE}/store`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`persistStore: ${res.status}`)
}

// Streams Claude response.
// onChunk(text) is called for each text delta.
// onDone() is called when the stream ends.
// Returns a cancel function.
export function streamClaude({ prompt, nodes, edges, onChunk, onDone, onError }) {
  const ctrl = new AbortController()

  fetch(`${BASE}/claude/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, nodes, edges }),
    signal: ctrl.signal,
  }).then(async res => {
    if (!res.ok) {
      const txt = await res.text()
      onError?.(new Error(`HTTP ${res.status}: ${txt}`))
      return
    }

    const reader  = res.body.getReader()
    const decoder = new TextDecoder()
    let   buffer  = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() // keep incomplete line

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') { onDone?.(); return }
        try {
          const msg = JSON.parse(raw)
          if (msg.error) { onError?.(new Error(msg.error)); return }
          if (msg.text)  onChunk?.(msg.text)
        } catch {
          // ignore malformed lines
        }
      }
    }
    onDone?.()
  }).catch(err => {
    if (err.name !== 'AbortError') onError?.(err)
  })

  return () => ctrl.abort()
}
