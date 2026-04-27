// Primary view — migrated from workbench_session_starter_v2.html.
// State, edge hints, clock, and Cmd/Ctrl+Enter shortcut all preserved.
// Streaming and the Anthropic system prompt now live server-side.

import { useEffect, useState } from 'react'
import { useChatStream } from './useChatStream.js'

const PURSUITS = [
  { id: 'finance', label: 'Finance',                name: 'The Market', sub: 'MYST · Hurricane · Brett'    },
  { id: 'qt',      label: 'Quality Time',           name: 'The Work',   sub: 'Build · Corpus · NAC'         },
  { id: 'fh',      label: 'Future HOW',             name: 'The Field',  sub: 'wAIser · AAWP · George'      },
  { id: 'cp',      label: 'Contemplative',          name: 'The Ground', sub: 'Jhana · Altar · Practice'    },
]

const PURSUIT_ORDER = ['finance', 'qt', 'fh', 'cp']

const EDGE_HINTS = {
  'finance+qt':       'Edge: Finance as the first proof domain for V_rel = Quality Time',
  'finance+fh':       'Edge: Information Sharpe / prediction networks as bridge',
  'finance+cp':       'Edge: 26-year before — the closed system the practice opened',
  'qt+fh':            'Edge: Workbench as first live node in Future HOW / wAIser field',
  'qt+cp':            'Edge: Contemplative practice as the architectural root of the thesis',
  'fh+cp':            'Edge: Anurūpa — inner development as the missing layer in the magazine',
  'finance+qt+fh':    'Three pursuits: the market proving the thesis in the field',
  'finance+qt+cp':    'Three pursuits: the before/after arc as the biographical spine',
  'finance+fh+cp':    'Three pursuits: where the resource base meets the frontier',
  'qt+fh+cp':         'Three pursuits: the work, the field, and the ground it stands on',
  'finance+qt+fh+cp': 'All four: the full architecture — ground, work, field, market',
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

export default function SessionStarter() {
  const [active, setActive] = useState(() => new Set())
  const [intent, setIntent] = useState('')
  const now = useClock()
  const { stream, reset, response, isStreaming, error } = useChatStream()

  const activeOrdered = PURSUIT_ORDER.filter(p => active.has(p))
  const edgeKey       = activeOrdered.join('+')
  const edgeHint      = active.size > 1 ? (EDGE_HINTS[edgeKey] || '') : ''

  function toggle(id) {
    setActive(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function begin() {
    const trimmed = intent.trim()
    if (!trimmed || isStreaming) return
    await stream({
      intent: trimmed,
      activePursuits: activeOrdered,
      edgeHint,
    })
  }

  function clearAll() {
    setIntent('')
    setActive(new Set())
    reset()
  }

  function onIntentKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      begin()
    }
  }

  const dateLine = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeLine = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  const showRespArea = isStreaming || response || error
  const showClear    = !isStreaming && (response || error)

  return (
    <div className="container">
      <div className="clock-section">
        <p className="date-line">{dateLine}</p>
        <p className="time-line">{timeLine}</p>
      </div>

      <div className="pursuit-grid">
        {PURSUITS.map(p => {
          const isActive = active.has(p.id)
          return (
            <div
              key={p.id}
              className={`pursuit ${isActive ? `sel-${p.id}` : ''}`}
              onClick={() => toggle(p.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(p.id) } }}
            >
              <div className="pursuit-label">
                <span className="dot" />
                {p.label}
              </div>
              <div className="pursuit-name">{p.name}</div>
              <div className="pursuit-sub">{p.sub}</div>
            </div>
          )
        })}
      </div>

      <p className="edge-hint">{edgeHint}</p>

      <textarea
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        onKeyDown={onIntentKeyDown}
        placeholder="What are we working on today?"
      />

      <div className="btn-row">
        <button onClick={begin} disabled={isStreaming || !intent.trim()}>
          {isStreaming ? 'Orienting…' : 'Begin session ↗'}
        </button>
        {showClear && <button onClick={clearAll}>Clear</button>}
      </div>

      {showRespArea && (
        <div className="resp-area">
          <div className="resp-label">Session orientation</div>
          {error
            ? <div className="resp-error">{error.message || 'Could not reach the API. Check connection and try again.'}</div>
            : <div className="resp-text">{response}</div>
          }
        </div>
      )}
    </div>
  )
}
