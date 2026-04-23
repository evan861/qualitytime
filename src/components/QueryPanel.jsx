// QueryPanel — graph query interface.
// Three modes: Lineage | Convergence | Open Threads.

import { useState } from 'react'
import { getConnections, getConvergenceNodes, getOpenThreads, NODE_TYPE_META } from '../store'
import NodeCard from './NodeCard'

function timeAgo(ts) {
  const d = Math.floor((Date.now() - ts) / 86_400_000)
  if (d === 0) return 'today'
  if (d === 1) return '1d ago'
  return `${d}d ago`
}

// ── Lineage view ──────────────────────────────────────────────────────────────

function LineageView({ nodes, edges, initialNodeId }) {
  const [nodeId, setNodeId] = useState(initialNodeId || '')

  const selectedNode = nodes.find(n => n.id === nodeId)
  const { outgoing, incoming } = nodeId
    ? getConnections(nodeId, nodes, edges)
    : { outgoing: [], incoming: [] }

  const sortedNodes = [...nodes].sort((a, b) => b.createdAt - a.createdAt)

  function ConnectionRow({ conn }) {
    const meta = NODE_TYPE_META[conn.node.type] || { icon: '·', color: '#8896a5' }
    return (
      <div className="lineage-row">
        <div className="lineage-direction">
          {conn.direction === 'out' ? '→' : '←'}
        </div>
        <div className="lineage-edge-type">{conn.edgeType}</div>
        <button
          className="lineage-node-btn"
          style={{ '--node-color': meta.color }}
          onClick={() => setNodeId(conn.node.id)}
        >
          <span style={{ color: meta.color }}>{meta.icon}</span>
          {conn.node.title}
          <span className="lineage-node-type">{conn.node.type}</span>
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="field" style={{ marginBottom: 20 }}>
        <label className="field-label">Select a node to trace its lineage</label>
        <select value={nodeId} onChange={e => setNodeId(e.target.value)}>
          <option value="">— choose node —</option>
          {sortedNodes.map(n => {
            const meta = NODE_TYPE_META[n.type] || { icon: '·' }
            return (
              <option key={n.id} value={n.id}>
                {meta.icon} {n.title} ({n.type})
              </option>
            )
          })}
        </select>
      </div>

      {selectedNode && (
        <div className="lineage-panel">
          {/* Selected node header */}
          <div className="lineage-focus">
            {(() => {
              const meta = NODE_TYPE_META[selectedNode.type] || { icon: '·', color: '#8896a5' }
              return (
                <div className="lineage-focus-card" style={{ '--node-color': meta.color }}>
                  <div className="lineage-focus-top">
                    <span className="lineage-focus-icon" style={{ color: meta.color }}>{meta.icon}</span>
                    <div>
                      <div className="lineage-focus-title">{selectedNode.title}</div>
                      <div className="lineage-focus-sub">
                        {selectedNode.type}
                        {selectedNode.context ? ` · ${selectedNode.context}` : ''}
                        {' · '}{timeAgo(selectedNode.createdAt)}
                      </div>
                    </div>
                  </div>
                  {selectedNode.content && (
                    <p className="lineage-focus-content">{selectedNode.content}</p>
                  )}
                  {selectedNode.tags?.length > 0 && (
                    <div className="lineage-focus-tags">
                      {selectedNode.tags.map(t => <span key={t} className="tag">#{t}</span>)}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>

          <div className="lineage-connections">
            {/* Outgoing */}
            <div className="lineage-direction-group">
              <div className="lineage-dir-header">
                <span className="lineage-dir-label">This node points to</span>
                <span className="lineage-dir-count">{outgoing.length}</span>
              </div>
              {outgoing.length === 0
                ? <p className="lineage-empty">No outgoing edges. This node is a source.</p>
                : outgoing.map((c, i) => <ConnectionRow key={i} conn={c} />)
              }
            </div>

            {/* Incoming */}
            <div className="lineage-direction-group" style={{ marginTop: 20 }}>
              <div className="lineage-dir-header">
                <span className="lineage-dir-label">Points to this node</span>
                <span className="lineage-dir-count">{incoming.length}</span>
              </div>
              {incoming.length === 0
                ? <p className="lineage-empty">No incoming edges. This node is a frontier.</p>
                : incoming.map((c, i) => <ConnectionRow key={i} conn={c} />)
              }
            </div>
          </div>
        </div>
      )}

      {!selectedNode && (
        <div className="query-empty-state">
          <p>Select a node above to trace where it came from, what it expresses, and what it became.</p>
        </div>
      )}
    </div>
  )
}

// ── Convergence view ──────────────────────────────────────────────────────────

function ConvergenceView({ nodes, edges }) {
  const ranked = getConvergenceNodes(nodes, edges)
  const max    = ranked[0]?.inDegree || 1

  if (ranked.length === 0) {
    return <div className="query-empty-state"><p>Add edges between nodes to see convergence patterns.</p></div>
  }

  return (
    <div>
      <p className="query-desc">
        Nodes ranked by incoming connections — where the graph is accumulating and thinking is converging.
      </p>
      <div className="convergence-list" style={{ marginTop: 16 }}>
        {ranked.map((n, rank) => {
          const meta = NODE_TYPE_META[n.type] || { icon: '·', color: '#8896a5' }
          const barW = Math.min(100, (n.inDegree / max) * 100)
          return (
            <div key={n.id} className="convergence-row">
              <div className="convergence-left">
                <span className="conv-rank">#{rank + 1}</span>
                <span className="conv-icon" style={{ color: meta.color }}>{meta.icon}</span>
                <div>
                  <div className="conv-title">{n.title}</div>
                  <div className="conv-sub">{n.type}{n.context ? ` · ${n.context}` : ''}</div>
                </div>
              </div>
              <div className="convergence-right">
                <div className="conv-bar-wrap">
                  <div className="conv-bar" style={{ width: `${barW}%`, background: meta.color }} />
                </div>
                <span className="conv-count">{n.inDegree}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 28 }}>
        <div className="section-title">As node cards</div>
        <div className="token-grid" style={{ marginTop: 12 }}>
          {ranked.slice(0, 6).map(n => (
            <NodeCard key={n.id} node={n} edges={edges} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Open threads view ─────────────────────────────────────────────────────────

function OpenThreadsView({ nodes, edges }) {
  const threads = getOpenThreads(nodes, edges)

  if (threads.length === 0) {
    return (
      <div className="query-empty-state">
        <p>No open threads — every node has been continued. The graph is closed.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="query-desc">
        Nodes at the frontier — no continuation edges (EVOLVES_INTO, TRANSLATES_INTO, CAPTURED_AS) leaving them. These are threads that haven&apos;t been picked up yet.
      </p>
      <div className="token-grid" style={{ marginTop: 16 }}>
        {threads.map(n => <NodeCard key={n.id} node={n} edges={edges} />)}
      </div>
    </div>
  )
}

// ── QueryPanel shell ──────────────────────────────────────────────────────────

const MODES = [
  { id: 'lineage',     label: 'Lineage',      icon: '↕' },
  { id: 'convergence', label: 'Convergence',   icon: '⬡' },
  { id: 'threads',     label: 'Open Threads',  icon: '◌' },
]

export default function QueryPanel({ store, initialNodeId, initialMode }) {
  const [mode, setMode] = useState(initialMode || 'lineage')
  const { nodes, edges } = store

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">◐ Query</h2>
        <p className="page-sub">
          Ask lineage, convergence, and open-thread questions across the full graph.
        </p>
      </div>

      <div className="query-mode-tabs">
        {MODES.map(m => (
          <button
            key={m.id}
            className={`query-tab ${mode === m.id ? 'active' : ''}`}
            onClick={() => setMode(m.id)}
          >
            <span>{m.icon}</span> {m.label}
          </button>
        ))}
      </div>

      <div className="query-body">
        {mode === 'lineage'     && <LineageView nodes={nodes} edges={edges} initialNodeId={initialNodeId} />}
        {mode === 'convergence' && <ConvergenceView nodes={nodes} edges={edges} />}
        {mode === 'threads'     && <OpenThreadsView nodes={nodes} edges={edges} />}
      </div>
    </div>
  )
}
