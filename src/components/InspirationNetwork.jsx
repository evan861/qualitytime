import { useEffect, useRef, useState } from 'react'
import { buildGraphData } from '../store'

const TYPE_COLORS = {
  metaphor: '#a78bfa',
  problem:  '#f87171',
  insight:  '#fbbf24',
  solution: '#4ade80',
}

export default function InspirationNetwork({ store }) {
  const wrapRef   = useRef(null)
  const canvasRef = useRef(null)
  const simRef    = useRef([])
  const rafRef    = useRef(null)
  const [size, setSize]    = useState({ w: 0, h: 0 })
  const [tooltip, setTooltip] = useState(null)

  const { nodes, edges } = buildGraphData(store.tokens, store.users)

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

  // Run force simulation whenever tokens or canvas size changes
  useEffect(() => {
    if (!size.w || !size.h || !nodes.length) return

    const cx = size.w / 2
    const cy = size.h / 2
    const spread = Math.min(cx, cy) * 0.55

    // Place nodes in a circle initially, preserving positions if possible
    const prev = Object.fromEntries(simRef.current.map(n => [n.id, n]))
    simRef.current = nodes.map((n, i) => {
      if (prev[n.id]) return { ...prev[n.id], ...n }
      const angle = (i / nodes.length) * Math.PI * 2
      return { ...n, x: cx + Math.cos(angle) * spread, y: cy + Math.sin(angle) * spread, vx: 0, vy: 0 }
    })

    let alpha = 1
    const REPULSE = 6000
    const SPRING_LEN = 110
    const SPRING_K = 0.035
    const CENTER_K = 0.008
    const DAMP = 0.72

    function tick() {
      const s = simRef.current
      alpha = Math.max(0.01, alpha * 0.992)

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
      for (const e of edges) {
        const a = s.find(n => n.id === e.from)
        const b = s.find(n => n.id === e.to)
        if (!a || !b) continue
        const dx = b.x - a.x, dy = b.y - a.y
        const d  = Math.sqrt(dx * dx + dy * dy) || 1
        const f  = (d - SPRING_LEN) * SPRING_K * alpha
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

        // Boundary padding
        const PAD = 30
        n.x = Math.max(PAD, Math.min(size.w - PAD, n.x))
        n.y = Math.max(PAD, Math.min(size.h - PAD, n.y))
      }

      draw()
      rafRef.current = requestAnimationFrame(tick)
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [store.tokens.length, size.w, size.h]) // eslint-disable-line react-hooks/exhaustive-deps

  function draw() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s   = simRef.current
    ctx.clearRect(0, 0, size.w, size.h)

    // Draw edges with arrowheads
    for (const e of edges) {
      const a = s.find(n => n.id === e.from)
      const b = s.find(n => n.id === e.to)
      if (!a || !b) continue

      const ang  = Math.atan2(b.y - a.y, b.x - a.x)
      const NODE_R = 16
      // Endpoint just outside target node
      const tx = b.x - Math.cos(ang) * NODE_R
      const ty = b.y - Math.sin(ang) * NODE_R

      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(tx, ty)
      ctx.strokeStyle = 'rgba(108,143,255,0.22)'
      ctx.lineWidth   = 1.5
      ctx.stroke()

      // Arrowhead
      ctx.beginPath()
      ctx.moveTo(tx, ty)
      ctx.lineTo(tx - Math.cos(ang - 0.42) * 9, ty - Math.sin(ang - 0.42) * 9)
      ctx.lineTo(tx - Math.cos(ang + 0.42) * 9, ty - Math.sin(ang + 0.42) * 9)
      ctx.closePath()
      ctx.fillStyle = 'rgba(108,143,255,0.5)'
      ctx.fill()
    }

    // Draw nodes
    for (const n of s) {
      const col = TYPE_COLORS[n.type] || '#8896a5'
      const r   = 14 + Math.min(n.remixCount * 2, 12)

      // Glow
      ctx.beginPath(); ctx.arc(n.x, n.y, r + 5, 0, Math.PI * 2)
      ctx.fillStyle = col + '14'; ctx.fill()

      // Circle
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
      ctx.fillStyle   = col + '28'; ctx.fill()
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke()

      // Avatar emoji
      ctx.font          = `${Math.max(11, r - 2)}px serif`
      ctx.textAlign     = 'center'
      ctx.textBaseline  = 'middle'
      ctx.fillStyle     = '#fff'
      ctx.fillText(n.creatorAvatar, n.x, n.y)

      // Label below
      ctx.font         = '11px system-ui, sans-serif'
      ctx.fillStyle    = 'rgba(136,150,165,0.85)'
      ctx.textBaseline = 'top'
      const lbl = n.label.length > 26 ? n.label.slice(0, 24) + '…' : n.label
      ctx.fillText(lbl, n.x, n.y + r + 5)
    }
  }

  function onMouseMove(e) {
    if (!canvasRef.current || !simRef.current.length) { setTooltip(null); return }
    const rect = canvasRef.current.getBoundingClientRect()
    const mx   = e.clientX - rect.left
    const my   = e.clientY - rect.top
    const hit  = simRef.current.find(n => Math.hypot(n.x - mx, n.y - my) < 20)
    setTooltip(hit ? { node: hit, x: e.clientX, y: e.clientY } : null)
  }

  const isEmpty = nodes.length === 0

  return (
    <div className="network-wrap">
      <div className="page-header">
        <h2 className="page-title">⬡ Inspiration Network</h2>
        <p className="page-sub">Attribution graph — who builds on what. Hover nodes for details.</p>
      </div>

      <div className="network-canvas-box" ref={wrapRef}>
        {isEmpty ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--text-muted)', fontSize:14 }}>
            Mint tokens to populate the network
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={size.w}
            height={size.h}
            style={{ display: 'block' }}
            onMouseMove={onMouseMove}
            onMouseLeave={() => setTooltip(null)}
          />
        )}

        <div className="network-legend">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="legend-row">
              <div className="legend-dot" style={{ background: color }} />
              {type}
            </div>
          ))}
        </div>
      </div>

      {tooltip && (
        <div
          className="tooltip"
          style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
        >
          <div className="tooltip-title">{tooltip.node.label}</div>
          <div className="tooltip-sub">
            {tooltip.node.type} · {tooltip.node.creatorName}
            {tooltip.node.remixCount > 0 && ` · ↺ ${tooltip.node.remixCount}`}
          </div>
          {tooltip.node.tags?.length > 0 && (
            <div style={{ marginTop: 6, display:'flex', gap:4, flexWrap:'wrap' }}>
              {tooltip.node.tags.map(t => (
                <span key={t} className="tag">#{t}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
