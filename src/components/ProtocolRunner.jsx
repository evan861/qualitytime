// ProtocolRunner — guided execution of the 5 Workbench protocols.
// Each protocol has named phases. Running one produces an artifact node.

import { useState } from 'react'
import { PROTOCOLS, addNode } from '../store'

const CLASS_META = {
  orientation: { color: '#fbbf24', label: 'Orientation' },
  integrity:   { color: '#4ade80', label: 'Integrity'   },
  execution:   { color: '#6c8fff', label: 'Execution'   },
  maintenance: { color: '#f472b6', label: 'Maintenance'  },
}

// ── Protocol card (collapsed) ─────────────────────────────────────────────────

function ProtocolCard({ protocol, onRun }) {
  const cm = CLASS_META[protocol.class] || { color: '#8896a5', label: protocol.class }
  return (
    <div className="protocol-card">
      <div className="protocol-card-header">
        <div>
          <div className="protocol-name">{protocol.name}</div>
          <div className="protocol-trigger">Trigger: {protocol.trigger}</div>
        </div>
        <span className="protocol-class-badge" style={{ color: cm.color, background: cm.color + '18' }}>
          {cm.label}
        </span>
      </div>
      <p className="protocol-desc">{protocol.description}</p>
      <div className="protocol-phases-preview">
        {protocol.phases.map((p, i) => (
          <span key={i} className="phase-chip">
            {i + 1}. {p.name}
          </span>
        ))}
      </div>
      <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => onRun(protocol)}>
        ⚡ Run protocol
      </button>
    </div>
  )
}

// ── Protocol runner (expanded) ────────────────────────────────────────────────

function ProtocolSession({ protocol, store, onComplete, onCancel }) {
  const [phaseIdx,   setPhaseIdx]   = useState(0)
  const [responses,  setResponses]  = useState(protocol.phases.map(() => ''))
  const [finalTitle, setFinalTitle] = useState('')
  const [done,       setDone]       = useState(false)
  const [saved,      setSaved]      = useState(null)

  const cm = CLASS_META[protocol.class] || { color: '#8896a5' }
  const currentPhase = protocol.phases[phaseIdx]
  const isLastPhase  = phaseIdx === protocol.phases.length - 1
  const allFilled    = responses.every(r => r.trim().length > 0)

  function updateResponse(val) {
    setResponses(prev => prev.map((r, i) => i === phaseIdx ? val : r))
  }

  function nextPhase() {
    if (isLastPhase) {
      setDone(true)
    } else {
      setPhaseIdx(i => i + 1)
    }
  }

  function prevPhase() {
    setPhaseIdx(i => Math.max(0, i - 1))
  }

  function saveAsArtifact() {
    const title = finalTitle.trim() ||
      `${protocol.name} — ${new Date().toLocaleDateString()}`

    // Build content from phase responses
    const content = protocol.phases
      .map((p, i) => `**${p.name}**\n${responses[i]}`)
      .join('\n\n')

    const next = addNode({
      type:     'artifact',
      title,
      content,
      context:  `protocol:${protocol.id}`,
      tags:     ['protocol', protocol.class, protocol.id],
      newEdges: [],
      store,
    })
    setSaved(title)
    onComplete(next)
  }

  if (saved) {
    return (
      <div className="protocol-session">
        <div className="alert-success">
          ✓ &ldquo;{saved}&rdquo; saved to the graph as an artifact.
        </div>
        <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={onCancel}>
          ← Back to protocols
        </button>
      </div>
    )
  }

  return (
    <div className="protocol-session">
      {/* Session header */}
      <div className="session-header">
        <div>
          <div className="session-name">{protocol.name}</div>
          <div className="session-sub" style={{ color: cm.color }}>{protocol.class}</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
      </div>

      {/* Phase progress bar */}
      <div className="phase-progress">
        {protocol.phases.map((p, i) => (
          <button
            key={i}
            className={`phase-step ${i === phaseIdx ? 'active' : i < phaseIdx ? 'done' : ''}`}
            style={i === phaseIdx ? { '--step-color': cm.color } : {}}
            onClick={() => setPhaseIdx(i)}
          >
            <span className="phase-step-num">{i < phaseIdx ? '✓' : i + 1}</span>
            <span className="phase-step-name">{p.name}</span>
          </button>
        ))}
      </div>

      {!done ? (
        <>
          {/* Current phase */}
          <div className="phase-body">
            <div className="phase-label" style={{ color: cm.color }}>
              Phase {phaseIdx + 1} of {protocol.phases.length} — {currentPhase.name}
            </div>
            <p className="phase-prompt">{currentPhase.prompt}</p>
            <textarea
              className="phase-input"
              value={responses[phaseIdx]}
              onChange={e => updateResponse(e.target.value)}
              placeholder="Write here — this becomes part of the output artifact."
              autoFocus
            />
          </div>

          <div className="phase-nav">
            <button
              className="btn btn-ghost"
              disabled={phaseIdx === 0}
              onClick={prevPhase}
            >
              ← Prev
            </button>
            <button
              className="btn btn-primary"
              disabled={responses[phaseIdx].trim().length === 0}
              onClick={nextPhase}
            >
              {isLastPhase ? 'Complete protocol' : 'Next →'}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Completion — review and save */}
          <div className="session-review">
            <div className="section-title">Protocol complete — review output</div>
            <div className="review-phases">
              {protocol.phases.map((p, i) => (
                <div key={i} className="review-phase">
                  <div className="review-phase-name">{p.name}</div>
                  <p className="review-phase-body">{responses[i]}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="field" style={{ marginTop: 20 }}>
            <label className="field-label">Artifact title (optional)</label>
            <input
              type="text"
              value={finalTitle}
              onChange={e => setFinalTitle(e.target.value)}
              placeholder={`${protocol.name} — ${new Date().toLocaleDateString()}`}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-primary" onClick={saveAsArtifact}>
              Save as artifact →
            </button>
            <button className="btn btn-ghost" onClick={() => setDone(false)}>
              ← Revise
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── ProtocolRunner shell ──────────────────────────────────────────────────────

const CLASS_ORDER = ['orientation', 'integrity', 'execution', 'maintenance']

export default function ProtocolRunner({ store, onProtocolComplete }) {
  const [activeProtocol, setActiveProtocol] = useState(null)

  function handleComplete(nextStore) {
    onProtocolComplete(nextStore)
    // Stay on the runner; the "saved" state inside ProtocolSession handles the success message
  }

  if (activeProtocol) {
    return (
      <div className="page">
        <div className="page-header">
          <h2 className="page-title">⚡ Protocols</h2>
          <p className="page-sub">Running: {activeProtocol.name}</p>
        </div>
        <ProtocolSession
          protocol={activeProtocol}
          store={store}
          onComplete={handleComplete}
          onCancel={() => setActiveProtocol(null)}
        />
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">⚡ Protocols</h2>
        <p className="page-sub">
          Runnable cognitive programs. Each has a trigger, phase sequence, and produces an artifact.
          Not templates — programs that do thinking.
        </p>
      </div>

      {CLASS_ORDER.map(cls => {
        const protocols = PROTOCOLS.filter(p => p.class === cls)
        const cm = CLASS_META[cls]
        return (
          <div key={cls} className="protocol-class-section">
            <div className="section-title" style={{ color: cm.color }}>
              {cm.label} class
            </div>
            <div className="protocol-grid">
              {protocols.map(p => (
                <ProtocolCard key={p.id} protocol={p} onRun={setActiveProtocol} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
