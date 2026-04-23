// Dashboard — "You Are Here"
// Renamed file kept for import compatibility; exports Dashboard.

import {
  getLiveEdge,
  getOpenThreads,
  getConvergenceNodes,
  NODE_TYPE_META,
} from '../store'

function timeAgo(ts) {
  const d = Math.floor((Date.now() - ts) / 86_400_000)
  if (d === 0) return 'today'
  if (d === 1) return '1d ago'
  return `${d}d ago`
}

function NodePill({ node, onClick }) {
  const meta = NODE_TYPE_META[node.type] || { icon: '·', color: '#8896a5' }
  return (
    <button
      className="node-pill"
      style={{ '--pill-color': meta.color }}
      onClick={() => onClick && onClick(node)}
      title={node.content}
    >
      <span className="pill-icon" style={{ color: meta.color }}>{meta.icon}</span>
      <span className="pill-title">{node.title}</span>
      <span className="pill-type">{node.type}</span>
    </button>
  )
}

export default function Dashboard({ store, onNav }) {
  const { nodes, edges, activeSession } = store

  const liveEdge     = getLiveEdge(nodes, edges, 6)
  const openThreads  = getOpenThreads(nodes, edges).slice(0, 6)
  const convergence  = getConvergenceNodes(nodes, edges).slice(0, 5)

  const sessionAge = Math.floor((Date.now() - (activeSession?.startedAt || Date.now())) / 60_000)
  const sessionLabel = sessionAge < 2 ? 'just started'
    : sessionAge < 60 ? `${sessionAge}m`
    : `${Math.floor(sessionAge / 60)}h`

  // Simple graph stats
  const artifactCount = nodes.filter(n => n.type === 'artifact').length
  const ideaCount     = nodes.filter(n => n.type === 'idea').length
  const momentCount   = nodes.filter(n => n.type === 'moment').length

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">◈ You Are Here</h2>
        <p className="page-sub">
          Session {sessionLabel} · {nodes.length} nodes · {edges.length} edges ·{' '}
          {artifactCount} artifacts · {ideaCount} ideas · {momentCount} moments
        </p>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Nodes</div>
          <div className="stat-value">{nodes.length}</div>
          <div className="stat-detail">in the graph</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Connections</div>
          <div className="stat-value">{edges.length}</div>
          <div className="stat-detail">edges traversable</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Open Threads</div>
          <div className="stat-value">{getOpenThreads(nodes, edges).length}</div>
          <div className="stat-detail">frontier nodes</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Live Threads</div>
          <div className="stat-value">{activeSession?.liveThreads?.length || 0}</div>
          <div className="stat-detail">active this session</div>
        </div>
      </div>

      {/* Live threads (from session) */}
      {activeSession?.liveThreads?.length > 0 && (
        <div className="dash-section">
          <div className="section-title">Live Threads This Session</div>
          <div className="live-thread-list">
            {activeSession.liveThreads.map(t => (
              <div key={t} className="live-thread-pill">
                <span className="live-dot" />
                {t}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dash-two-col">
        {/* Live edge */}
        <div className="dash-section">
          <div className="section-title">Live Edge</div>
          <p className="section-hint">Most recently touched nodes — the active terrain.</p>
          <div className="pill-stack">
            {liveEdge.length === 0
              ? <p className="empty-state">No activity yet.</p>
              : liveEdge.map(n => (
                  <NodePill key={n.id} node={n} onClick={() => onNav('query', n.id)} />
                ))
            }
          </div>
        </div>

        {/* Open threads */}
        <div className="dash-section">
          <div className="section-title">Open Threads</div>
          <p className="section-hint">Nodes at the frontier — nothing built on them yet.</p>
          <div className="pill-stack">
            {openThreads.length === 0
              ? <p className="empty-state">No open threads — the graph is complete.</p>
              : openThreads.map(n => (
                  <NodePill key={n.id} node={n} onClick={() => onNav('query', n.id)} />
                ))
            }
          </div>
        </div>
      </div>

      {/* Convergence hotspots */}
      <div className="dash-section">
        <div className="section-title">Convergence Hotspots</div>
        <p className="section-hint">Where the graph is accumulating — nodes with the most incoming connections.</p>
        <div className="convergence-list">
          {convergence.length === 0
            ? <p className="empty-state">Add edges between nodes to see convergence.</p>
            : convergence.map(n => {
                const meta = NODE_TYPE_META[n.type] || { icon: '·', color: '#8896a5' }
                const barW = Math.min(100, (n.inDegree / (convergence[0]?.inDegree || 1)) * 100)
                return (
                  <button
                    key={n.id}
                    className="convergence-row"
                    onClick={() => onNav('query', n.id)}
                  >
                    <div className="convergence-left">
                      <span className="conv-icon" style={{ color: meta.color }}>{meta.icon}</span>
                      <div>
                        <div className="conv-title">{n.title}</div>
                        <div className="conv-sub">{n.type} · {timeAgo(n.createdAt)}</div>
                      </div>
                    </div>
                    <div className="convergence-right">
                      <div className="conv-bar-wrap">
                        <div className="conv-bar" style={{ width: `${barW}%`, background: meta.color }} />
                      </div>
                      <span className="conv-count">{n.inDegree}</span>
                    </div>
                  </button>
                )
              })
          }
        </div>
      </div>

      {/* Recent nodes */}
      <div className="dash-section">
        <div className="section-title">Recently Added</div>
        <div className="recent-list">
          {[...nodes]
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 5)
            .map(n => {
              const meta = NODE_TYPE_META[n.type] || { icon: '·', color: '#8896a5' }
              return (
                <button
                  key={n.id}
                  className="recent-row"
                  onClick={() => onNav('query', n.id)}
                >
                  <span className="recent-icon" style={{ color: meta.color }}>{meta.icon}</span>
                  <div className="recent-body">
                    <div className="recent-title">{n.title}</div>
                    <div className="recent-sub">{n.type}{n.context ? ` · ${n.context}` : ''}</div>
                  </div>
                  <span className="recent-time">{timeAgo(n.createdAt)}</span>
                </button>
              )
            })
          }
        </div>
      </div>
    </div>
  )
}
