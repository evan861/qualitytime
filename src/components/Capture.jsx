// Capture — guided intake journeys for 5 content types.

import { useState } from 'react'
import { addNode, NODE_TYPE_META, EDGE_TYPES } from '../store'

// ── Constants ─────────────────────────────────────────────────────────────────

const IN_EDGE_TYPES = [
  'ACTIVATING_RESONANCE', 'CONCEPTUAL_DEBT', 'STRUCTURAL_INFLUENCE',
  'BRIDGE_SYNTHESIS', 'INTERNAL_LINEAGE', 'EXTERNAL_THINKER', 'LIFE_EXPERIENCE',
]

const JOURNEYS = [
  { id: 'person',     icon: '○', label: 'Person',     color: '#4ade80', tagline: 'Someone entering your network' },
  { id: 'idea',       icon: '✦', label: 'Idea',        color: '#a78bfa', tagline: 'A concept or insight to name and file' },
  { id: 'reflection', icon: '◆', label: 'Reflection',  color: '#fbbf24', tagline: 'A lived moment or observation' },
  { id: 'note',       icon: '◐', label: 'Note',        color: '#2dd4bf', tagline: 'Quick capture — any type' },
  { id: 'article',    icon: '◈', label: 'Article',     color: '#6c8fff', tagline: 'Substack, essay, or written piece' },
]

const STEPS = {
  person: [
    { title: 'Who are they?',         hint: 'Name and what they do in the world.' },
    { title: 'How do you know them?', hint: 'The context of the connection — how you met, what you\'ve built together.' },
    { title: 'What do they bring?',   hint: 'What has their presence activated, shaped, or indebted in your thinking?' },
    { title: 'Connect to the graph',  hint: 'Link to concepts or nodes they relate to, using the Inspiration Network edge vocabulary.' },
  ],
  idea: [
    { title: 'State the idea',         hint: 'Name it. Then state it in one sentence — no hedging.' },
    { title: 'Where did it come from?',hint: 'The moment, conversation, or source it emerged from. Leave blank if it\'s a root.' },
    { title: 'What does it extend?',   hint: 'Connect to an existing concept — or mark as a new root.' },
    { title: 'File it',                hint: 'Context, tags, and any additional edges.' },
  ],
  reflection: [
    { title: 'What was the context?',      hint: 'When, where, what you were doing. This becomes the moment node title.' },
    { title: 'What happened?',             hint: 'Describe the experience or observation. Specific over abstract.' },
    { title: 'Did anything crystallize?',  hint: 'If something resolved or became clear, it may be worth filing as a Field Note too.' },
    { title: 'Connect to a thread',        hint: 'Does this touch an open inquiry or existing concept?' },
  ],
  note: [
    { title: 'What are you capturing?', hint: 'Title and body. Compress first; expand later.' },
    { title: 'What type is it?',        hint: 'Pick the node type that fits best.' },
    { title: 'Place it',               hint: 'Tag it and draw one connection to the graph.' },
  ],
  article: [
    { title: "What's the piece?",        hint: 'Title and author. Author will be added as a person node if new.' },
    { title: 'What were the key ideas?', hint: 'Extract 2–3 concepts or insights from the piece.' },
    { title: 'What does it activate?',   hint: 'Connect to existing nodes using the Inspiration Network edge types.' },
    { title: 'File it',                  hint: 'Context and tags.' },
  ],
}

// ── EdgeBuilder ───────────────────────────────────────────────────────────────

function EdgeBuilder({ nodes, edgeList, onChange, edgeTypeOptions = EDGE_TYPES }) {
  const sorted = [...nodes].sort((a, b) => b.createdAt - a.createdAt)

  function add() {
    onChange([...edgeList, { nodeId: '', type: edgeTypeOptions[0], dir: 'to' }])
  }
  function update(i, field, val) {
    onChange(edgeList.map((e, idx) => idx === i ? { ...e, [field]: val } : e))
  }
  function remove(i) {
    onChange(edgeList.filter((_, idx) => idx !== i))
  }

  return (
    <div className="edge-builder">
      {edgeList.map((e, i) => (
        <div key={i} className="edge-row">
          <select value={e.dir} onChange={ev => update(i, 'dir', ev.target.value)} className="edge-dir-select">
            <option value="to">this node →</option>
            <option value="from">← to this node</option>
          </select>
          <select value={e.type} onChange={ev => update(i, 'type', ev.target.value)} className="edge-type-select">
            {edgeTypeOptions.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
          <select value={e.nodeId} onChange={ev => update(i, 'nodeId', ev.target.value)} className="edge-node-select">
            <option value="">— select node —</option>
            {sorted.map(n => {
              const meta = NODE_TYPE_META[n.type] || { icon: '·' }
              return <option key={n.id} value={n.id}>{meta.icon} {n.title} ({n.type})</option>
            })}
          </select>
          <button className="edge-remove-btn" onClick={() => remove(i)} title="Remove">×</button>
        </div>
      ))}
      <button className="btn btn-ghost" onClick={add}>+ Add edge</button>
    </div>
  )
}

// ── NodePicker ────────────────────────────────────────────────────────────────

function NodePicker({ nodes, value, onChange, placeholder, filterTypes }) {
  const list = filterTypes
    ? nodes.filter(n => filterTypes.includes(n.type))
    : nodes
  const sorted = [...list].sort((a, b) => b.createdAt - a.createdAt)
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)}>
      <option value="">{placeholder || '— select —'}</option>
      {sorted.map(n => {
        const meta = NODE_TYPE_META[n.type] || { icon: '·' }
        return <option key={n.id} value={n.id}>{meta.icon} {n.title}</option>
      })}
    </select>
  )
}

// ── Step content ──────────────────────────────────────────────────────────────

function StepContent({ journeyId, stepIndex, data, setData, nodes }) {
  const set = (key, val) => setData(d => ({ ...d, [key]: val }))

  // Person
  if (journeyId === 'person') {
    if (stepIndex === 0) return (
      <div className="step-fields">
        <div className="field">
          <label className="field-label">Name</label>
          <input value={data.name || ''} onChange={e => set('name', e.target.value)} placeholder="Full name or how you refer to them" autoFocus />
        </div>
        <div className="field">
          <label className="field-label">Role / What they do</label>
          <input value={data.role || ''} onChange={e => set('role', e.target.value)} placeholder="Philosopher, systems thinker, poet, builder…" />
        </div>
      </div>
    )
    if (stepIndex === 1) return (
      <div className="step-fields">
        <div className="field">
          <label className="field-label">How you know them</label>
          <textarea value={data.howWeKnow || ''} onChange={e => set('howWeKnow', e.target.value)} placeholder="The context — how you met, what you've explored or built together." style={{ minHeight: 110 }} autoFocus />
        </div>
      </div>
    )
    if (stepIndex === 2) return (
      <div className="step-fields">
        <div className="field">
          <label className="field-label">What they bring to the work</label>
          <textarea value={data.whatTheyBring || ''} onChange={e => set('whatTheyBring', e.target.value)} placeholder="What has their presence activated, shaped, or indebted in your thinking?" style={{ minHeight: 110 }} autoFocus />
        </div>
        <div className="field">
          <label className="field-label">Inspiration Network edge type</label>
          <select value={data.inEdgeType || 'ACTIVATING_RESONANCE'} onChange={e => set('inEdgeType', e.target.value)}>
            {IN_EDGE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
          <p className="field-hint">How would you classify the nature of their influence on your work?</p>
        </div>
      </div>
    )
    if (stepIndex === 3) return (
      <div className="step-fields">
        <div className="field">
          <label className="field-label">Tags</label>
          <input value={data.tags || ''} onChange={e => set('tags', e.target.value)} placeholder="philosophy, systems, design (comma-separated)" autoFocus />
        </div>
        <div className="field">
          <label className="field-label">Connect to existing concepts or nodes</label>
          <EdgeBuilder nodes={nodes} edgeList={data.edges || []} onChange={v => set('edges', v)} edgeTypeOptions={IN_EDGE_TYPES} />
        </div>
      </div>
    )
  }

  // Idea
  if (journeyId === 'idea') {
    if (stepIndex === 0) return (
      <div className="step-fields">
        <div className="field">
          <label className="field-label">Name</label>
          <input value={data.name || ''} onChange={e => set('name', e.target.value)} placeholder="Short, memorable, reusable" autoFocus />
        </div>
        <div className="field">
          <label className="field-label">One-sentence statement</label>
          <textarea value={data.statement || ''} onChange={e => set('statement', e.target.value)} placeholder="What is this idea? State it directly — no hedging." style={{ minHeight: 80 }} />
        </div>
      </div>
    )
    if (stepIndex === 1) return (
      <div className="step-fields">
        <div className="field">
          <label className="field-label">Emerged from</label>
          <NodePicker nodes={nodes} value={data.originNodeId} onChange={v => set('originNodeId', v)} placeholder="— moment, conversation, or artifact —" filterTypes={['moment', 'artifact', 'person']} />
          <p className="field-hint">Leave blank if this is a root concept with no traceable origin.</p>
        </div>
      </div>
    )
    if (stepIndex === 2) return (
      <div className="step-fields">
        <div className="field">
          <label className="field-label">Refines or extends</label>
          <NodePicker nodes={nodes} value={data.refinesNodeId} onChange={v => set('refinesNodeId', v)} placeholder="— existing idea or MCA concept —" filterTypes={['idea']} />
          <p className="field-hint">Leave blank if this is a new root.</p>
        </div>
      </div>
    )
    if (stepIndex === 3) return (
      <div className="step-fields">
        <div className="field">
          <label className="field-label">Context</label>
          <input value={data.context || ''} onChange={e => set('context', e.target.value)} placeholder="foundation, recurring, design, in-progress…" autoFocus />
        </div>
        <div className="field">
          <label className="field-label">Tags</label>
          <input value={data.tags || ''} onChange={e => set('tags', e.target.value)} placeholder="philosophy, emergence, cognition…" />
        </div>
        <div className="field">
          <label className="field-label">Additional edges</label>
          <EdgeBuilder nodes={nodes} edgeList={data.edges || []} onChange={v => set('edges', v)} />
        </div>
      </div>
    )
  }

  // Reflection
  if (journeyId === 'reflection') {
    if (stepIndex === 0) return (
      <div className="step-fields">
        <div className="field">
          <label className="field-label">Moment title</label>
          <input value={data.momentTitle || ''} onChange={e => set('momentTitle', e.target.value)} placeholder={`Morning walk — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, Conversation with…`} autoFocus />
        </div>
        <div className="field">
          <label className="field-label">Context / setting</label>
          <input value={data.context || ''} onChange={e => set('context', e.target.value)} placeholder="physical, collaborative, solo, digital…" />
        </div>
      </div>
    )
    if (stepIndex === 1) return (
      <div className="step-fields">
        <div className="field">
          <label className="field-label">What happened?</label>
          <textarea value={data.momentContent || ''} onChange={e => set('momentContent', e.target.value)} placeholder="Describe the experience or observation. Specific over abstract — name the room, the feeling, the quality of attention." style={{ minHeight: 150 }} autoFocus />
        </div>
      </div>
    )
    if (stepIndex === 2) return (
      <div className="step-fields">
        <div className="field">
          <label className="field-label">Did anything crystallize?</label>
          <textarea value={data.crystallized || ''} onChange={e => set('crystallized', e.target.value)} placeholder="If something resolved or became clear, state it here. Leave blank if not." style={{ minHeight: 100 }} autoFocus />
        </div>
        {(data.crystallized || '').trim().length > 10 && (
          <div className="field">
            <label className="field-label">File as a Field Note too?</label>
            <div className="radio-group">
              <label className="radio-label">
                <input type="radio" value="yes" checked={data.fieldNote === 'yes'} onChange={() => set('fieldNote', 'yes')} />
                Yes — add as a separate artifact node
              </label>
              <label className="radio-label">
                <input type="radio" value="no" checked={data.fieldNote !== 'yes'} onChange={() => set('fieldNote', 'no')} />
                No — keep it in the moment description
              </label>
            </div>
          </div>
        )}
      </div>
    )
    if (stepIndex === 3) return (
      <div className="step-fields">
        <div className="field">
          <label className="field-label">Connect to an inquiry thread or concept</label>
          <NodePicker nodes={nodes} value={data.threadNodeId} onChange={v => set('threadNodeId', v)} placeholder="— idea or inquiry thread —" filterTypes={['idea']} />
        </div>
        <div className="field">
          <label className="field-label">Tags</label>
          <input value={data.tags || ''} onChange={e => set('tags', e.target.value)} placeholder="walk, conversation, observation…" autoFocus />
        </div>
      </div>
    )
  }

  // Note
  if (journeyId === 'note') {
    if (stepIndex === 0) return (
      <div className="step-fields">
        <div className="field">
          <label className="field-label">Title</label>
          <input value={data.name || ''} onChange={e => set('name', e.target.value)} placeholder="Short, descriptive title" autoFocus />
        </div>
        <div className="field">
          <label className="field-label">Body</label>
          <textarea value={data.content || ''} onChange={e => set('content', e.target.value)} placeholder="Capture it. Compress first; expand later." style={{ minHeight: 120 }} />
        </div>
      </div>
    )
    if (stepIndex === 1) return (
      <div className="step-fields">
        <div className="type-selector">
          {['artifact', 'idea', 'moment', 'person', 'context', 'environment', 'relation'].map(t => {
            const m = NODE_TYPE_META[t]
            return (
              <button key={t} className={`type-btn ${data.nodeType === t ? 'active' : ''}`} style={{ '--type-color': m.color }} onClick={() => set('nodeType', t)}>
                <span className="type-icon">{m.icon}</span>
                {m.label}
              </button>
            )
          })}
        </div>
      </div>
    )
    if (stepIndex === 2) return (
      <div className="step-fields">
        <div className="field-row">
          <div>
            <label className="field-label">Context</label>
            <input value={data.context || ''} onChange={e => set('context', e.target.value)} placeholder="draft, in-progress…" autoFocus />
          </div>
          <div>
            <label className="field-label">Tags</label>
            <input value={data.tags || ''} onChange={e => set('tags', e.target.value)} placeholder="comma-separated" />
          </div>
        </div>
        <div className="field">
          <label className="field-label">Connect to the graph</label>
          <EdgeBuilder nodes={nodes} edgeList={data.edges || []} onChange={v => set('edges', v)} />
        </div>
      </div>
    )
  }

  // Article
  if (journeyId === 'article') {
    if (stepIndex === 0) return (
      <div className="step-fields">
        <div className="field">
          <label className="field-label">Title</label>
          <input value={data.name || ''} onChange={e => set('name', e.target.value)} placeholder="Article or essay title" autoFocus />
        </div>
        <div className="field-row">
          <div>
            <label className="field-label">Author</label>
            <input value={data.author || ''} onChange={e => set('author', e.target.value)} placeholder="Author name" />
          </div>
          <div>
            <label className="field-label">Source</label>
            <input value={data.source || ''} onChange={e => set('source', e.target.value)} placeholder="Substack, URL, publication…" />
          </div>
        </div>
      </div>
    )
    if (stepIndex === 1) return (
      <div className="step-fields">
        <div className="field">
          <label className="field-label">Key ideas</label>
          <textarea value={data.keyIdeas || ''} onChange={e => set('keyIdeas', e.target.value)} placeholder="2–3 concepts or insights extracted from the piece. These form the node's content." style={{ minHeight: 140 }} autoFocus />
        </div>
      </div>
    )
    if (stepIndex === 2) return (
      <div className="step-fields">
        <p className="field-hint" style={{ marginBottom: 12 }}>Connect this piece to existing nodes — concepts it activates, lineages it represents, structures it mirrors.</p>
        <EdgeBuilder nodes={nodes} edgeList={data.resonanceEdges || []} onChange={v => set('resonanceEdges', v)} edgeTypeOptions={IN_EDGE_TYPES} />
      </div>
    )
    if (stepIndex === 3) return (
      <div className="step-fields">
        <div className="field-row">
          <div>
            <label className="field-label">Context</label>
            <input value={data.context || ''} onChange={e => set('context', e.target.value)} placeholder="reading, reference…" autoFocus />
          </div>
          <div>
            <label className="field-label">Tags</label>
            <input value={data.tags || ''} onChange={e => set('tags', e.target.value)} placeholder="philosophy, systems…" />
          </div>
        </div>
      </div>
    )
  }

  return null
}

// ── Step validation ───────────────────────────────────────────────────────────

function stepValid(journeyId, stepIndex, data) {
  if (journeyId === 'person') {
    if (stepIndex === 0) return (data.name || '').trim().length > 0
    return true
  }
  if (journeyId === 'idea') {
    if (stepIndex === 0) return (data.name || '').trim().length > 0 && (data.statement || '').trim().length > 0
    return true
  }
  if (journeyId === 'reflection') {
    if (stepIndex === 0) return (data.momentTitle || '').trim().length > 0
    if (stepIndex === 1) return (data.momentContent || '').trim().length > 0
    return true
  }
  if (journeyId === 'note') {
    if (stepIndex === 0) return (data.name || '').trim().length > 0 && (data.content || '').trim().length > 0
    if (stepIndex === 1) return !!data.nodeType
    return true
  }
  if (journeyId === 'article') {
    if (stepIndex === 0) return (data.name || '').trim().length > 0
    return true
  }
  return true
}

// ── Save logic ────────────────────────────────────────────────────────────────

function buildAndSave(journeyId, data, store) {
  const tags = (data.tags || '').split(',').map(t => t.trim()).filter(Boolean)
  let next = store

  if (journeyId === 'person') {
    const content = [data.whatTheyBring, data.howWeKnow].filter(Boolean).join('\n\n')
    const evanNode = store.nodes.find(n => n.type === 'person' && /evan/i.test(n.title))
    const newEdges = [...(data.edges || [])]
    if (evanNode && data.inEdgeType) {
      newEdges.push({ nodeId: evanNode.id, type: data.inEdgeType, dir: 'to' })
    }
    next = addNode({ type: 'person', title: data.name || 'New person', content, context: data.role || '', tags, newEdges, store: next })
  }

  if (journeyId === 'idea') {
    const newEdges = [...(data.edges || [])]
    if (data.originNodeId) newEdges.push({ nodeId: data.originNodeId, type: 'EMERGED_FROM', dir: 'to' })
    if (data.refinesNodeId) newEdges.push({ nodeId: data.refinesNodeId, type: 'REFINES', dir: 'to' })
    next = addNode({ type: 'idea', title: data.name || 'New idea', content: data.statement || '', context: data.context || '', tags, newEdges, store: next })
  }

  if (journeyId === 'reflection') {
    const newEdges = []
    if (data.threadNodeId) newEdges.push({ nodeId: data.threadNodeId, type: 'DISCUSSED_IN', dir: 'to' })
    next = addNode({ type: 'moment', title: data.momentTitle || 'Reflection', content: data.momentContent || '', context: data.context || '', tags, newEdges, store: next })
    if ((data.crystallized || '').trim() && data.fieldNote === 'yes') {
      const momentId = next.nodes[next.nodes.length - 1].id
      next = addNode({ type: 'artifact', title: `Field Note: ${data.momentTitle || 'Reflection'}`, content: data.crystallized, context: 'field-note', tags, newEdges: [{ nodeId: momentId, type: 'EMERGED_FROM', dir: 'to' }], store: next })
    }
  }

  if (journeyId === 'note') {
    next = addNode({ type: data.nodeType || 'artifact', title: data.name || 'Note', content: data.content || '', context: data.context || '', tags, newEdges: data.edges || [], store: next })
  }

  if (journeyId === 'article') {
    const extraEdges = [...(data.resonanceEdges || [])]
    if (data.author?.trim()) {
      const existing = store.nodes.find(n => n.type === 'person' && n.title.toLowerCase() === data.author.trim().toLowerCase())
      if (existing) {
        extraEdges.push({ nodeId: existing.id, type: 'CREATED_BY', dir: 'to' })
      } else {
        next = addNode({ type: 'person', title: data.author.trim(), content: `Author of "${data.name}"`, context: 'external', tags: [], newEdges: [], store: next })
        const authorId = next.nodes[next.nodes.length - 1].id
        extraEdges.push({ nodeId: authorId, type: 'CREATED_BY', dir: 'to' })
      }
    }
    const content = [data.keyIdeas, data.source ? `Source: ${data.source}` : null].filter(Boolean).join('\n\n')
    next = addNode({ type: 'artifact', title: data.name || 'Article', content, context: data.context || 'reference', tags, newEdges: extraEdges, store: next })
  }

  return next
}

// ── Capture (main) ────────────────────────────────────────────────────────────

export default function Capture({ store, onCapture, onNav }) {
  const [phase,       setPhase]       = useState('select') // 'select' | 'flow' | 'done'
  const [journeyId,   setJourneyId]   = useState(null)
  const [stepIndex,   setStepIndex]   = useState(0)
  const [data,        setData]        = useState({})
  const [savedTitles, setSavedTitles] = useState([])

  const journey = JOURNEYS.find(j => j.id === journeyId)
  const steps   = journeyId ? STEPS[journeyId] : []
  const step    = steps[stepIndex]
  const isLast  = stepIndex === steps.length - 1
  const canNext = stepValid(journeyId, stepIndex, data)

  function startJourney(id) {
    setJourneyId(id)
    setStepIndex(0)
    setData({})
    setPhase('flow')
  }

  function goNext() {
    if (isLast) {
      const next = buildAndSave(journeyId, data, store)
      onCapture(next)
      const title = data.name || data.momentTitle || 'node'
      setSavedTitles(prev => [...prev, title])
      setPhase('done')
    } else {
      setStepIndex(i => i + 1)
    }
  }

  function goBack() {
    if (stepIndex === 0) {
      setPhase('select')
    } else {
      setStepIndex(i => i - 1)
    }
  }

  function reset() {
    setPhase('select')
    setJourneyId(null)
    setStepIndex(0)
    setData({})
  }

  // ── Render: select ──────────────────────────────────────────────────────────

  if (phase === 'select') return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">◎ Capture</h2>
        <p className="page-sub">What are you bringing in?</p>
      </div>

      {savedTitles.length > 0 && (
        <div className="alert-success" style={{ marginBottom: 24 }}>
          ✓ Added: {savedTitles.map((t, i) => <span key={i} style={{ fontWeight: 600 }}>{i > 0 ? ', ' : ''}{t}</span>)}
          {' — '}
          <button onClick={() => onNav('terrain')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline', font: 'inherit' }}>
            View in Terrain →
          </button>
        </div>
      )}

      <div className="intake-cards">
        {JOURNEYS.map(j => (
          <button
            key={j.id}
            className="intake-card"
            style={{ '--journey-color': j.color }}
            onClick={() => startJourney(j.id)}
          >
            <div className="intake-card-icon" style={{ color: j.color }}>{j.icon}</div>
            <div className="intake-card-label">{j.label}</div>
            <div className="intake-card-tagline">{j.tagline}</div>
            <div className="intake-card-arrow">→</div>
          </button>
        ))}
      </div>
    </div>
  )

  // ── Render: done ────────────────────────────────────────────────────────────

  if (phase === 'done') return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">◎ Capture</h2>
        <p className="page-sub">What are you bringing in?</p>
      </div>
      <div className="journey-done">
        <div className="journey-done-icon" style={{ color: journey?.color }}>
          {journey?.icon}
        </div>
        <div className="journey-done-title">Added to the graph.</div>
        <p className="journey-done-sub">
          &ldquo;{data.name || data.momentTitle || 'Your node'}&rdquo; is now in the Workbench.
        </p>
        <div className="journey-done-actions">
          <button className="btn btn-primary" onClick={reset}>
            + Capture another
          </button>
          <button className="btn btn-ghost" onClick={() => onNav('terrain')}>
            View in Terrain →
          </button>
          <button className="btn btn-ghost" onClick={() => onNav('query')}>
            Query the graph →
          </button>
        </div>
      </div>
    </div>
  )

  // ── Render: flow ────────────────────────────────────────────────────────────

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">◎ Capture</h2>
        <p className="page-sub">What are you bringing in?</p>
      </div>

      <div className="journey-flow">
        {/* Journey badge + progress */}
        <div className="journey-header">
          <div className="journey-badge" style={{ '--journey-color': journey.color, color: journey.color }}>
            <span>{journey.icon}</span> {journey.label}
          </div>
          <div className="step-progress">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`step-dot ${i < stepIndex ? 'done' : i === stepIndex ? 'active' : ''}`}
                style={i <= stepIndex ? { '--journey-color': journey.color } : {}}
              />
            ))}
          </div>
          <div className="step-counter">{stepIndex + 1} / {steps.length}</div>
        </div>

        {/* Step */}
        <div className="step-meta">
          <div className="step-title">{step.title}</div>
          <div className="step-hint">{step.hint}</div>
        </div>

        <div className="step-body">
          <StepContent
            journeyId={journeyId}
            stepIndex={stepIndex}
            data={data}
            setData={setData}
            nodes={store.nodes}
          />
        </div>

        {/* Navigation */}
        <div className="journey-nav">
          <button className="btn btn-ghost" onClick={goBack}>
            {stepIndex === 0 ? '← Change type' : '← Back'}
          </button>
          <button
            className="btn btn-primary"
            disabled={!canNext}
            onClick={goNext}
            style={{ '--btn-color': journey.color }}
          >
            {isLast ? `${journey.icon} Add to graph` : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}
