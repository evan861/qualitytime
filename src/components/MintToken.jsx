// Capture — add any node type to the graph with lineage edges.

import { useState, useMemo } from 'react'
import { addNode, NODE_TYPES, NODE_TYPE_META, EDGE_TYPES, getSuggestedConnections } from '../store'

function EdgeBuilder({ nodes, edgeList, onChange }) {
  function addEdge() {
    onChange([...edgeList, { nodeId: '', type: 'EMERGED_FROM', dir: 'from' }])
  }
  function updateEdge(i, field, val) {
    const next = edgeList.map((e, idx) => idx === i ? { ...e, [field]: val } : e)
    onChange(next)
  }
  function removeEdge(i) {
    onChange(edgeList.filter((_, idx) => idx !== i))
  }

  const sortedNodes = [...nodes].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="edge-builder">
      {edgeList.map((e, i) => (
        <div key={i} className="edge-row">
          {/* Direction: does the new node point FROM an existing one, or TO one? */}
          <select
            value={e.dir}
            onChange={ev => updateEdge(i, 'dir', ev.target.value)}
            className="edge-dir-select"
          >
            <option value="from">this node ←</option>
            <option value="to">this node →</option>
          </select>

          <select
            value={e.type}
            onChange={ev => updateEdge(i, 'type', ev.target.value)}
            className="edge-type-select"
          >
            {EDGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            value={e.nodeId}
            onChange={ev => updateEdge(i, 'nodeId', ev.target.value)}
            className="edge-node-select"
          >
            <option value="">— select node —</option>
            {sortedNodes.map(n => {
              const meta = NODE_TYPE_META[n.type] || { icon: '·' }
              return (
                <option key={n.id} value={n.id}>
                  {meta.icon} {n.title} ({n.type})
                </option>
              )
            })}
          </select>

          <button
            className="edge-remove-btn"
            onClick={() => removeEdge(i)}
            title="Remove edge"
          >×</button>
        </div>
      ))}

      <button className="btn btn-ghost" onClick={addEdge}>
        + Add edge
      </button>
    </div>
  )
}

export default function Capture({ store, onCapture, onNav }) {
  const [type,    setType]    = useState('artifact')
  const [title,   setTitle]   = useState('')
  const [content, setContent] = useState('')
  const [context, setContext] = useState('')
  const [tags,    setTags]    = useState('')
  const [edges,   setEdges]   = useState([])
  const [saved,   setSaved]   = useState(null)

  const meta  = NODE_TYPE_META[type] || { icon: '·', color: '#8896a5' }
  const ready = title.trim().length > 0 && content.trim().length > 0
  const validEdges = edges.filter(e => e.nodeId && e.type)

  function handleCapture() {
    const next = addNode({
      type, title, content, context,
      tags: tags.split(','),
      newEdges: validEdges,
      store,
    })
    onCapture(next)
    setSaved(title.trim())
    setTitle(''); setContent(''); setContext(''); setTags(''); setEdges([])
  }

  // Compute placement suggestions reactively from title + tags
  const suggestions = useMemo(() => {
    if (!title.trim() && !tags.trim()) return []
    return getSuggestedConnections(
      type, title,
      tags.split(',').map(t => t.trim()).filter(Boolean),
      store.nodes
    )
  }, [type, title, tags, store.nodes])

  function quickConnect(suggestion) {
    // Add edge if not already present
    const already = edges.some(e => e.nodeId === suggestion.id)
    if (!already) {
      setEdges([...edges, {
        nodeId: suggestion.id,
        type:   suggestion.suggestedEdge,
        dir:    'from',
      }])
    }
  }

  function addSuggestedEdge() {
    setEdges([...edges, { nodeId: '', type: 'EMERGED_FROM', dir: 'from' }])
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">◎ Capture</h2>
        <p className="page-sub">Add any node type to the graph. Lineage is placed here — not after.</p>
      </div>

      <div className="capture-layout">
        <div className="capture-form">
          {saved && (
            <div className="alert-success">
              ✓ &ldquo;{saved}&rdquo; added to the graph.{' '}
              <button
                onClick={() => onNav('terrain')}
                style={{ background:'none', border:'none', color:'inherit', cursor:'pointer', textDecoration:'underline', font:'inherit' }}
              >
                View in Terrain →
              </button>
            </div>
          )}

          {/* Type selector */}
          <div className="field">
            <label className="field-label">Node Type</label>
            <div className="type-selector">
              {NODE_TYPES.map(t => {
                const m = NODE_TYPE_META[t]
                return (
                  <button
                    key={t}
                    className={`type-btn ${type === t ? 'active' : ''}`}
                    style={{ '--type-color': m.color }}
                    onClick={() => setType(t)}
                  >
                    <span className="type-icon">{m.icon}</span>
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="field">
            <label className="field-label">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={
                type === 'artifact' ? 'Field Note: ..., Essay Draft: ..., Voice Memo: ...' :
                type === 'idea'     ? 'The idea name — short, memorable, reusable' :
                type === 'moment'   ? 'Morning walk — April 6, Conversation with ...' :
                type === 'person'   ? 'Name' :
                'Context or environment name'
              }
            />
          </div>

          <div className="field">
            <label className="field-label">Content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={
                type === 'artifact' ? 'The artifact body. Write as if filing it permanently.' :
                type === 'idea'     ? 'What is this idea? State it directly — no hedging.' :
                type === 'moment'   ? 'What happened? What was the quality of it?' :
                'Description'
              }
              style={{ minHeight: type === 'artifact' ? 160 : 96 }}
            />
          </div>

          <div className="field-row">
            <div>
              <label className="field-label">Context</label>
              <input
                type="text"
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder="draft, in-progress, physical, collaborative…"
              />
            </div>
            <div>
              <label className="field-label">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="emergence, design, voice  (comma-separated)"
              />
            </div>
          </div>

          {/* Placement suggestions */}
          {suggestions.length > 0 && (
            <div className="field">
              <label className="field-label">Suggested connections</label>
              <p className="field-hint">
                Based on your title and tags — click to connect.
              </p>
              <div className="suggestion-list">
                {suggestions.map(s => {
                  const m = NODE_TYPE_META[s.type] || { icon: '·', color: '#8896a5' }
                  const alreadyAdded = edges.some(e => e.nodeId === s.id)
                  return (
                    <button
                      key={s.id}
                      className={`suggestion-pill ${alreadyAdded ? 'added' : ''}`}
                      style={{ '--sug-color': m.color }}
                      onClick={() => quickConnect(s)}
                      disabled={alreadyAdded}
                      title={s.content}
                    >
                      <span style={{ color: m.color }}>{m.icon}</span>
                      <span className="sug-title">{s.title}</span>
                      <span className="sug-edge">{s.suggestedEdge}</span>
                      {alreadyAdded && <span className="sug-check">✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Edge builder */}
          <div className="field">
            <label className="field-label">Edges</label>
            <p className="field-hint">
              Placement is a first-class act. Connect this node to what it came from, what it expresses, or what it became.
            </p>
            <div style={{ marginTop: 8 }}>
              <EdgeBuilder
                nodes={store.nodes}
                edgeList={edges}
                onChange={setEdges}
              />
            </div>
            {edges.length === 0 && store.nodes.length > 0 && (
              <button
                className="btn btn-ghost"
                style={{ marginTop: 8 }}
                onClick={addSuggestedEdge}
              >
                + Add edge manually
              </button>
            )}
          </div>

          <button
            className="btn btn-primary"
            disabled={!ready}
            onClick={handleCapture}
          >
            {meta.icon} Add to graph
          </button>
        </div>

        {/* Preview panel */}
        <div className="capture-preview">
          <div className="section-title">Preview</div>
          <div className="preview-card" style={{ '--preview-color': meta.color }}>
            <div className="preview-header">
              <span className="preview-icon" style={{ color: meta.color }}>{meta.icon}</span>
              <span className="preview-type">{type}</span>
              {context && <span className="preview-context">{context}</span>}
            </div>
            <div className="preview-title">{title || <span style={{ color: 'var(--text-muted)' }}>Untitled</span>}</div>
            {content && <p className="preview-body">{content}</p>}
            {validEdges.length > 0 && (
              <div className="preview-edges">
                {validEdges.map((e, i) => {
                  const connNode = store.nodes.find(n => n.id === e.nodeId)
                  return connNode ? (
                    <div key={i} className="preview-edge">
                      <span className="edge-arrow">
                        {e.dir === 'from' ? '← ' : '→ '}
                      </span>
                      <span className="edge-type-label">{e.type}</span>
                      <span className="edge-node-name">{connNode.title}</span>
                    </div>
                  ) : null
                })}
              </div>
            )}
          </div>

          <div className="section-title" style={{ marginTop: 20 }}>Placement check</div>
          <p className="placement-hint">
            {edges.length === 0
              ? '⚠ No edges yet. What did this come from? What does it express?'
              : validEdges.length < edges.length
              ? `⚠ ${edges.length - validEdges.length} edge(s) missing a target node.`
              : `✓ ${validEdges.length} edge(s) set. This node is tethered.`
            }
          </p>
        </div>
      </div>
    </div>
  )
}
