// NodeCard — generic card for any node type with connection count.

import { NODE_TYPE_META } from '../store'

function timeAgo(ts) {
  const d = Math.floor((Date.now() - ts) / 86_400_000)
  if (d === 0) return 'today'
  if (d === 1) return '1d ago'
  return `${d}d ago`
}

export default function NodeCard({ node, edges = [], onClick }) {
  const meta = NODE_TYPE_META[node.type] || { icon: '·', label: node.type, color: '#8896a5' }
  const outgoing = edges.filter(e => e.from === node.id).length
  const incoming = edges.filter(e => e.to   === node.id).length

  return (
    <div
      className="token-card node-card"
      style={{ '--node-color': meta.color, cursor: onClick ? 'pointer' : 'default' }}
      onClick={() => onClick && onClick(node)}
    >
      <div className="token-header">
        <div className="token-title">{node.title}</div>
        <span
          className="badge"
          style={{ background: meta.color + '22', color: meta.color }}
        >
          {meta.icon} {meta.label}
        </span>
      </div>

      <p className="token-body">{node.content}</p>

      <div className="token-footer">
        <div className="token-tags">
          {node.tags?.slice(0, 3).map(tag => (
            <span key={tag} className="tag">#{tag}</span>
          ))}
        </div>
        <div className="token-meta">
          {node.context && <span className="node-context">{node.context}</span>}
          {(incoming > 0 || outgoing > 0) && (
            <span className="edge-count" title={`${incoming} in · ${outgoing} out`}>
              {incoming > 0 && <span>↓{incoming}</span>}
              {outgoing > 0 && <span>↑{outgoing}</span>}
            </span>
          )}
          <span>{timeAgo(node.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}
