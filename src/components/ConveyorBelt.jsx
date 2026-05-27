// ConveyorBelt — three-stage pipeline: Intake → Development → Execution.

import { NODE_TYPE_META } from '../store'

const STAGES = [
  { id: 'intake',      label: 'Intake',      icon: '◎', color: '#fbbf24', desc: 'Gems arriving — raw material' },
  { id: 'development', label: 'Development',  icon: '◐', color: '#6c8fff', desc: 'In progress — iterate and connect' },
  { id: 'execution',   label: 'Execution',    icon: '◈', color: '#4ade80', desc: 'Ready — essays, specs, decisions' },
]

const BELT_TYPES = new Set(['artifact', 'idea'])

function daysOnBelt(node) {
  const ts = node.stageEnteredAt || node.createdAt
  const d = Math.floor((Date.now() - ts) / 86_400_000)
  if (d === 0) return 'today'
  if (d === 1) return '1d'
  return `${d}d`
}

function BeltCard({ node, stageIndex, onAdvance, onRetreat, onSelect }) {
  const meta = NODE_TYPE_META[node.type] || { icon: '·', color: '#8896a5' }
  const canAdvance = stageIndex < STAGES.length - 1
  const canRetreat = stageIndex > 0
  const age = daysOnBelt(node)
  const isStale = stageIndex === 0 && (node.stageEnteredAt || node.createdAt) < Date.now() - 7 * 86_400_000

  return (
    <div className={`belt-card ${isStale ? 'stale' : ''}`} style={{ '--node-color': meta.color }}>
      <div className="belt-card-top">
        <span className="belt-card-icon" style={{ color: meta.color }}>{meta.icon}</span>
        <button className="belt-card-title" onClick={() => onSelect(node)}>{node.title}</button>
        <span className={`belt-card-age ${isStale ? 'stale' : ''}`}>{age}</span>
      </div>
      {node.context && <div className="belt-card-context">{node.context}</div>}
      {node.content && (
        <p className="belt-card-body">
          {node.content.length > 130 ? node.content.slice(0, 130) + '…' : node.content}
        </p>
      )}
      {node.tags?.length > 0 && (
        <div className="belt-card-tags">
          {node.tags.slice(0, 4).map(t => <span key={t} className="tag">#{t}</span>)}
        </div>
      )}
      <div className="belt-card-actions">
        {canRetreat && (
          <button className="btn-belt-retreat" onClick={() => onRetreat(node)}>← Back</button>
        )}
        <div style={{ flex: 1 }} />
        {canAdvance ? (
          <button className="btn-belt-advance" onClick={() => onAdvance(node)}>
            {stageIndex === 0 ? 'Develop →' : 'Execute →'}
          </button>
        ) : (
          <span className="belt-card-done">✓ Ready</span>
        )}
      </div>
    </div>
  )
}

export default function ConveyorBelt({ store, onUpdate, onNav }) {
  const beltNodes = store.nodes.filter(n => BELT_TYPES.has(n.type) && n.stage)
  const unstaged  = store.nodes.filter(n => BELT_TYPES.has(n.type) && !n.stage)
    .sort((a, b) => b.createdAt - a.createdAt)

  const byStage = Object.fromEntries(
    STAGES.map(s => [
      s.id,
      beltNodes.filter(n => n.stage === s.id)
               .sort((a, b) => (b.stageEnteredAt || b.createdAt) - (a.stageEnteredAt || a.createdAt))
    ])
  )

  function moveNode(node, newStage) {
    const updatedNodes = store.nodes.map(n =>
      n.id === node.id ? { ...n, stage: newStage, stageEnteredAt: Date.now() } : n
    )
    onUpdate({ ...store, nodes: updatedNodes })
  }

  function advance(node) {
    const i = STAGES.findIndex(s => s.id === node.stage)
    if (i < STAGES.length - 1) moveNode(node, STAGES[i + 1].id)
  }

  function retreat(node) {
    const i = STAGES.findIndex(s => s.id === node.stage)
    if (i > 0) moveNode(node, STAGES[i - 1].id)
  }

  function addToIntake(node) {
    moveNode(node, 'intake')
  }

  function selectNode(node) {
    onNav('query', node.id)
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">⟳ Conveyor Belt</h2>
        <p className="page-sub">
          Intake → Development → Execution. Nothing dies at intake. Nothing stays there forever.
        </p>
      </div>

      {/* Belt counts summary */}
      <div className="belt-summary">
        {STAGES.map(s => (
          <div key={s.id} className="belt-summary-pill" style={{ '--stage-color': s.color }}>
            <span className="belt-summary-icon">{s.icon}</span>
            <span className="belt-summary-label">{s.label}</span>
            <span className="belt-summary-count">{byStage[s.id].length}</span>
          </div>
        ))}
        {unstaged.length > 0 && (
          <div className="belt-summary-pill" style={{ '--stage-color': '#8896a5' }}>
            <span className="belt-summary-label">Not on belt</span>
            <span className="belt-summary-count">{unstaged.length}</span>
          </div>
        )}
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => onNav('capture')}>
          + Capture →
        </button>
      </div>

      {/* Three columns */}
      <div className="belt-columns">
        {STAGES.map((stage, stageIndex) => {
          const nodes = byStage[stage.id]
          return (
            <div key={stage.id} className="belt-column">
              <div className="belt-col-header" style={{ '--stage-color': stage.color }}>
                <div className="belt-col-title">
                  <span style={{ color: stage.color }}>{stage.icon}</span>
                  {stage.label}
                  <span className="belt-col-count">{nodes.length}</span>
                </div>
                <div className="belt-col-desc">{stage.desc}</div>
              </div>

              <div className="belt-col-body">
                {nodes.length === 0 ? (
                  <div className="belt-empty">
                    {stageIndex === 0 ? (
                      <>
                        <p>Nothing in intake yet.</p>
                        <button className="btn btn-ghost btn-sm" onClick={() => onNav('capture')}>
                          Capture something →
                        </button>
                      </>
                    ) : (
                      <p>Advance items from {STAGES[stageIndex - 1].label} when they're ready.</p>
                    )}
                  </div>
                ) : (
                  nodes.map(n => (
                    <BeltCard
                      key={n.id}
                      node={n}
                      stageIndex={stageIndex}
                      onAdvance={advance}
                      onRetreat={retreat}
                      onSelect={selectNode}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Unstaged pool */}
      {unstaged.length > 0 && (
        <div className="belt-unstaged">
          <div className="section-title">Not yet on the belt — {unstaged.length} items</div>
          <p className="field-hint" style={{ marginBottom: 12 }}>
            Artifacts and ideas in the graph that haven't been placed on the belt. Add the ones that need to move.
          </p>
          <div className="belt-unstaged-list">
            {unstaged.slice(0, 24).map(n => {
              const meta = NODE_TYPE_META[n.type] || { icon: '·', color: '#8896a5' }
              return (
                <div key={n.id} className="unstaged-row">
                  <span style={{ color: meta.color }}>{meta.icon}</span>
                  <button className="unstaged-title" onClick={() => selectNode(n)}>{n.title}</button>
                  <span className="unstaged-type">{n.type}</span>
                  <button className="btn-add-intake" onClick={() => addToIntake(n)}>+ Intake</button>
                </div>
              )
            })}
            {unstaged.length > 24 && (
              <p className="field-hint" style={{ marginTop: 8 }}>…and {unstaged.length - 24} more</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
