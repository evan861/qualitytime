import { useState, useRef, useEffect } from 'react'
import { streamClaude } from '../api'
import { NODE_TYPE_META } from '../store'

const STARTERS = [
  'What patterns do you see in my graph that I might be missing?',
  'Which open threads should I prioritize picking up?',
  'Where is my thinking converging and what does that suggest?',
  'What nodes are underconnected and why might that matter?',
  'Trace the lineage of my most connected idea.',
]

function GraphContext({ nodes, edges }) {
  const typeCounts = nodes.reduce((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1
    return acc
  }, {})

  return (
    <div className="claude-context">
      <span className="claude-context-label">Graph in context:</span>
      {Object.entries(typeCounts).map(([type, count]) => {
        const meta = NODE_TYPE_META[type] || { icon: '·', color: '#8896a5' }
        return (
          <span key={type} className="context-pill" style={{ color: meta.color }}>
            {meta.icon} {count} {type}
          </span>
        )
      })}
      <span className="context-pill">↔ {edges.length} edges</span>
    </div>
  )
}

export default function ClaudeAdvisor({ store }) {
  const { nodes, edges } = store
  const [prompt,    setPrompt]    = useState('')
  const [response,  setResponse]  = useState('')
  const [streaming, setStreaming]  = useState(false)
  const [error,     setError]     = useState(null)
  const cancelRef  = useRef(null)
  const responseEl = useRef(null)

  useEffect(() => {
    if (responseEl.current) {
      responseEl.current.scrollTop = responseEl.current.scrollHeight
    }
  }, [response])

  function submit(text) {
    const p = (text ?? prompt).trim()
    if (!p || streaming) return

    setResponse('')
    setError(null)
    setStreaming(true)
    setPrompt('')

    cancelRef.current = streamClaude({
      prompt: p,
      nodes,
      edges,
      onChunk: chunk => setResponse(prev => prev + chunk),
      onDone:  ()    => setStreaming(false),
      onError: err   => { setError(err.message); setStreaming(false) },
    })
  }

  function cancel() {
    cancelRef.current?.()
    setStreaming(false)
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">◉ Advisor</h2>
        <p className="page-sub">
          Ask Claude anything about your graph — patterns, gaps, next moves.
        </p>
      </div>

      <GraphContext nodes={nodes} edges={edges} />

      {!response && !streaming && (
        <div className="starter-prompts">
          {STARTERS.map(s => (
            <button key={s} className="starter-btn" onClick={() => submit(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {(response || streaming) && (
        <div className="claude-response" ref={responseEl}>
          <pre className="claude-text">
            {response}
            {streaming && <span className="cursor-blink">▌</span>}
          </pre>
          {streaming && (
            <button className="cancel-btn" onClick={cancel}>Stop</button>
          )}
        </div>
      )}

      {error && (
        <div className="claude-error">{error}</div>
      )}

      <div className="claude-input-row">
        <textarea
          className="claude-input"
          rows={3}
          placeholder="Ask about your graph…"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
          }}
          disabled={streaming}
        />
        <button
          className="claude-send"
          onClick={() => submit()}
          disabled={!prompt.trim() || streaming}
        >
          {streaming ? '…' : '→'}
        </button>
      </div>
    </div>
  )
}
