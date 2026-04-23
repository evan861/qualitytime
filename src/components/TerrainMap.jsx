// TerrainMap — visual knowledge graph
// Force-directed canvas. Node size = inDegree. Color = node type.
// Click a node to inspect its connections.

import { useEffect, useRef, useState } from 'react'
import { NODE_TYPE_META, computeInDegree } from '../store'

export default function TerrainMap({ store, onNodeSelect }) {
  const wrapRef   = useRef(null)
  const canvasRef = useRef(null)
  const simRef    = useRef([])
  const rafRef    = useRef(null)
  const [size, setSize]       = useState({ w: 0, h: 0 })
  const [tooltip, setTooltip] = useState(null)
  const [selected, setSelected] = useState(null)
  const [filterType, setFilterType] = useState(null) // null = show all

  const { nodes, edges } = store
  const inDeg = computeInDegree(nodes, edges)

  const visibleNodes = filterType ? nodes.filter(n => n.type === filterType) : nodes
  const visibleEdges = filterType
    ? edges.filter(e => {
        const fn = visibleNodes.find(n => n.id === e.from)
        const tn = visibleNodes.find(n => n.id === e.to)
        return fn && tn
      })
    : edges

  // Track container dimensions
  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ w: Math.floor(width), h: Math.floor(height) })
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  // Force simulation
  useEffect(() => {
    if (!size.w || !size.h || !visibleNodes.length) return

    const cx = size.w / 2
    const cy = size.h / 2
    const spread = Math.min(cx, cy) * 0.52

    const prev = Object.fromEntries(simRef.current.map(n => [n.id, n]))
    simRef.current = visibleNodes.map((n, i) => {
      if (prev[n.id]) return { ...prev[n.id], ...n }
      const angle = (i / visibleNodes.length) * Math.PI * 2
      return { ...n, x: cx + Math.cos(angle) * spread, y: cy + Math.sin(angle) * spread, vx: 0, vy: 0 }
    })

    let alpha = 1
    const REPULSE  = 7000
    const SPRING_L = 115
    const SPRING_K = 0.03
    const CENTER_K = 0.007
    const DAMP     = 0.74

    function tick() {
      const s = simRef.current
      alpha = Math.max(0.005, alpha * 0.994)

      // Repulsion between all pairs
      for (let i = 0; i < s.length; i++) {
        for (let j = i + 1; j < s.length; j++) {
          const dx = s[i].x - s[j].x
          const dy = s[i].y - s[j].y
          const d2 = dx * dx + dy * dy || 0.01
          const f  = (REPULSE / d2) * alpha
          s[i].vx += dx * f;  s[i].vy += dy * f
          s[j].vx -= dx * f;  s[j].vy -= dy * f
        }
      }

      // Spring attraction along edges
      for (const e of visibleEdges) {
        const a = s.find(n => n.id === e.from)
        const b = s.find(n => n.id === e.to)
        if (!a || !b) continue
        const dx = b.x - a.x, dy = b.y - a.y
        const d  = Math.sqrt(dx * dx + dy * dy) || 1
        const f  = (d - SPRING_L) * SPRING_K * alpha
        const fx = (dx / d) * f, fy = (dy / d) * f
        a.vx += fx;  a.vy += fy
        b.vx -= fx;  b.vy -= fy
      }

      // Gravity toward center
      for (const n of s) {
        n.vx += (cx - n.x) * CENTER_K * alpha
        n.vy += (cy - n.y) * CENTER_K * alpha
        n.vx *= DAMP;  n.vy *= DAMP
        n.x  += n.vx;  n.y  += n.vy
        const PAD = 36
        n.x = Math.max(PAD, Math.min(size.w - PAD, n.x))
        n.y = Math.max(PAD, Math.min(size.h - PAD, n.y))
      }

      draw()
      rafRef.current = requestAnimationFrame(tick)
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [visibleNodes.length, visibleEdges.length, size.w, size.h]) // eslint-disable-line

  function nodeRadius(node) {
    return 13 + Math.min((inDeg[node.id] || 0) * 3, 18)
  }

  function draw() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s   = simRef.current
    ctx.clearRect(0, 0, size.w, size.h)

    // Draw edges
    for (const e of visibleEdges) {
      const a = s.find(n => n.id === e.from)
      const b = s.find(n => n.id === e.to)
      if (!a || !b) continue

      const isSelected = selected && (e.from === selected || e.to === selected)
      const ang = Math.atan2(b.y - a.y, b.x - a.x)
      const rb  = nodeRadius(visibleNodes.find(n => n.id === e.to) || { id: e.to })
      const tx  = b.x - Math.cos(ang) * rb
      const ty  = b.y - Math.sin(ang) * rb

      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(tx, ty)
      ctx.strokeStyle = isSelected ? 'rgba(108,143,255,0.65)' : 'rgba(108,143,255,0.15)'
      ctx.lineWidth   = isSelected ? 1.8 : 1.2
      ctx.stroke()

      // Arrowhead
      ctx.beginPath()
      ctx.moveTo(tx, ty)
      ctx.lineTo(tx - Math.cos(ang - 0.4) * 8, ty - Math.sin(ang - 0.4) * 8)
      ctx.lineTo(tx - Math.cos(ang + 0.4) * 8, ty - Math.sin(ang + 0.4) * 8)
      ctx.closePath()
      ctx.fillStyle = isSelected ? 'rgba(108,143,255,0.75)' : 'rgba(108,143,255,0.3)'
      ctx.fill()
    }

    // Draw nodes
    for (const n of s) {
      const meta    = NODE_TYPE_META[n.type] || { icon: '·', color: '#8896a5' }
      const col     = meta.color
      const r       = nodeRadius(n)
      const isSel   = selected === n.id

      // Selection ring
      if (isSel) {
        ctx.beginPath(); ctx.arc(n.x, n.y, r + 6, 0, Math.PI * 2)
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.stroke()
        ctx.setLineDash([])
      }

      // Glow for high-convergence nodes
      const deg = inDeg[n.id] || 0
      if (deg > 1) {
        ctx.beginPath(); ctx.arc(n.x, n.y, r + 8, 0, Math.PI * 2)
        ctx.fillStyle = col + '10'; ctx.fill()
      }

      // Circle fill + stroke
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
      ctx.fillStyle   = isSel ? col + '40' : col + '22'; ctx.fill()
      ctx.strokeStyle = col; ctx.lineWidth = isSel ? 2.5 : 1.8; ctx.stroke()

      // Icon
      const fontSize = Math.max(10, r - 3)
      ctx.font         = `${fontSize}px serif`
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle    = col
      ctx.fillText(meta.icon, n.x, n.y)

      // Label below
      ctx.font         = '10px system-ui, sans-serif'
      ctx.fillStyle    = 'rgba(226,232,240,0.7)'
      ctx.textBaseline = 'top'
      const lbl = n.title.length > 22 ? n.title.slice(0, 20) + '…' : n.title
      ctx.fillText(lbl, n.x, n.y + r + 4)

      // InDegree badge
      if (deg > 0) {
        ctx.font      = 'bold 9px system-ui, sans-serif'
        ctx.fillStyle = col
        ctx.textBaseline = 'middle'
        ctx.fillText(deg, n.x + r - 1, n.y - r + 1)
      }
    }
  }

  function onMouseMove(e) {
    if (!canvasRef.current || !simRef.current.length) { setTooltip(null); return }
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const hit = simRef.current.find(n => Math.hypot(n.x - mx, n.y - my) < nodeRadius(n) + 4)
    setTooltip(hit ? { node: hit, x: e.clientX, y: e.clientY } : null)
  }

  function onClick(e) {
    if (!canvasRef.current || !simRef.current.length) return
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const hit = simRef.current.find(n => Math.hypot(n.x - mx, n.y - my) < nodeRadius(n) + 4)
    if (hit) {
      setSelected(hit.id === selected ? null : hit.id)
      if (onNodeSelect) onNodeSelect(hit.id === selected ? null : hit)
    } else {
      setSelected(null)
      if (onNodeSelect) onNodeSelect(null)
    }
  }

  const isEmpty = visibleNodes.length === 0

  return (
    <div className="network-wrap">
      <div className="page-header">
        <h2 className="page-title">⬡ Terrain</h2>
        <p className="page-sub">
          Knowledge graph — node size = convergence. Click to inspect. Filter by type.
        </p>
        <div className="terrain-filter-row">
          <button
            className={`filter-pill ${!filterType ? 'active' : ''}`}
            onClick={() => setFilterType(null)}
          >All</button>
          {Object.entries(NODE_TYPE_META).map(([type, meta]) => (
            <button
              key={type}
              className={`filter-pill ${filterType === type ? 'active' : ''}`}
              style={{ '--pill-accent': meta.color }}
              onClick={() => setFilterType(filterType === type ? null : type)}
            >
              {meta.icon} {meta.label}
            </button>
          ))}
        </div>
      </div>

      <div className="network-canvas-box" ref={wrapRef}>
        {isEmpty ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--text-muted)', fontSize:14 }}>
            No nodes to show
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={size.w}
            height={size.h}
            style={{ display: 'block', cursor: 'crosshair' }}
            onMouseMove={onMouseMove}
            onMouseLeave={() => setTooltip(null)}
            onClick={onClick}
          />
        )}

        {/* Legend */}
        <div className="network-legend">
          {Object.entries(NODE_TYPE_META).map(([type, meta]) => (
            <div key={type} className="legend-row">
              <div className="legend-dot" style={{ background: meta.color }} />
              {meta.label}
            </div>
          ))}
          <div className="legend-row" style={{ marginTop: 6, borderTop: '1px solid var(--border)', paddingTop: 6 }}>
            <div className="legend-dot" style={{ background: 'transparent', border: '1px dashed #6c8fff' }} />
            Selected
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="tooltip" style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}>
          <div className="tooltip-title">{tooltip.node.title}</div>
          <div className="tooltip-sub">
            {tooltip.node.type}
            {tooltip.node.context ? ` · ${tooltip.node.context}` : ''}
            {(inDeg[tooltip.node.id] || 0) > 0 && ` · ${inDeg[tooltip.node.id]} incoming`}
          </div>
          {tooltip.node.tags?.length > 0 && (
            <div style={{ marginTop: 6, display:'flex', gap:4, flexWrap:'wrap' }}>
              {tooltip.node.tags.map(t => <span key={t} className="tag">#{t}</span>)}
            </div>
          )}
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            Click to inspect
          </div>
        </div>
      )}
    </div>
  )
}
