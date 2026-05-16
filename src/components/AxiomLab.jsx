import { useEffect, useRef, useState } from 'react'

const AXIOMS = {
  euclidean: {
    label: 'Euclidean',
    statement: 'Through a point not on a line, there is exactly one parallel.',
    parallels: 'One',
    triangleSum: '= 180°',
    space: 'Flat plane',
    curvature: 0,
    color: 'var(--accent)',
  },
  hyperbolic: {
    label: 'Hyperbolic',
    statement: 'Through that same point, there are infinitely many parallels.',
    parallels: 'Many',
    triangleSum: '< 180°',
    space: 'Saddle / negative curvature',
    curvature: -1,
    color: 'var(--teal)',
  },
  elliptic: {
    label: 'Elliptic',
    statement: 'There are no parallels — any two lines eventually meet.',
    parallels: 'None',
    triangleSum: '> 180°',
    space: 'Sphere / positive curvature',
    curvature: 1,
    color: 'var(--orange)',
  },
}

// Smoothly interpolate the curvature so the wheel visibly turns when the axle changes.
function useEased(target, speed = 0.12) {
  const [value, setValue] = useState(target)
  const raf = useRef(null)
  useEffect(() => {
    const step = () => {
      setValue(v => {
        const diff = target - v
        if (Math.abs(diff) < 0.001) return target
        raf.current = requestAnimationFrame(step)
        return v + diff * speed
      })
    }
    raf.current = requestAnimationFrame(step)
    return () => raf.current && cancelAnimationFrame(raf.current)
  }, [target, speed])
  return value
}

// Quadratic Bezier between two points, bowed perpendicular to the chord by `bow`.
function bowedPath(x1, y1, x2, y2, bow) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  // perpendicular unit vector (rotate 90° CCW)
  const px = -dy / len
  const py = dx / len
  const cx = mx + px * bow
  const cy = my + py * bow
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
}

export default function AxiomLab() {
  const [axiom, setAxiom] = useState('euclidean')
  const [revealAxle, setRevealAxle] = useState(true)
  const targetK = AXIOMS[axiom].curvature
  const k = useEased(targetK)
  const color = AXIOMS[axiom].color

  // Canvas
  const W = 640
  const H = 360

  // Two initially-parallel lines:
  // start vertical-stacked on the left, head right. Bow them apart/together based on k.
  const yTop = 110
  const yBot = 230
  const xStart = 70
  const xEnd = W - 70
  // Hyperbolic (k<0): lines diverge (top bows up, bottom bows down) → bow outward
  // Elliptic   (k>0): lines converge (top bows down, bottom bows up) → bow inward
  // Magnitude scales with |k|.
  const lineBow = 38 * k
  // Top line bowed upward when k<0 (negative perpendicular direction in our coord system)
  // Our bowedPath puts +bow perpendicular to direction-of-travel. Direction L→R has +perp = down.
  // So for top line: positive bow pushes it down (toward center) when k>0 (elliptic) ✓
  //                   negative bow pushes it up (away from center) when k<0 (hyperbolic) ✓
  // For bottom line: positive bow pushes it down (away from center) when k>0 — WRONG.
  // We want bottom to bow up toward center when k>0. So invert sign for bottom.
  const topPath = bowedPath(xStart, yTop, xEnd, yTop, lineBow)
  const botPath = bowedPath(xStart, yBot, xEnd, yBot, -lineBow)

  // Triangle: three vertices on the canvas. Each edge bowed by f(k).
  // Hyperbolic: edges bow inward (toward centroid) → smaller interior angles.
  // Elliptic:  edges bow outward (away from centroid) → larger interior angles.
  const A = { x: 200, y: 300 }
  const B = { x: 440, y: 300 }
  const C = { x: 320, y: 130 }
  const centroid = { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 }

  function triEdge(P, Q) {
    // Sign the perpendicular so that positive `triBow` always pushes the curve toward the centroid.
    const mx = (P.x + Q.x) / 2
    const my = (P.y + Q.y) / 2
    const dx = Q.x - P.x
    const dy = Q.y - P.y
    const len = Math.hypot(dx, dy) || 1
    let px = -dy / len
    let py = dx / len
    // Make (px,py) point toward centroid
    const toCx = centroid.x - mx
    const toCy = centroid.y - my
    if (px * toCx + py * toCy < 0) {
      px = -px
      py = -py
    }
    // k<0 hyperbolic: bow toward centroid → magnitude positive when k<0
    // k>0 elliptic:   bow away from centroid → magnitude negative when k>0
    const bow = -k * 32
    const cx = mx + px * bow
    const cy = my + py * bow
    return `M ${P.x} ${P.y} Q ${cx} ${cy} ${Q.x} ${Q.y}`
  }

  // Approximate triangle angle sum: 180° in flat, ±~40° at full curvature.
  const angleSum = (180 - k * 40).toFixed(0)

  const a = AXIOMS[axiom]

  return (
    <div className="page axiom-lab">
      <div className="page-header">
        <div className="page-title">Axiom Lab</div>
        <div className="page-sub">
          Change the axle. Watch the shape of everything turn.
        </div>
      </div>

      <div className="section-title">The axiom — choose a starting point</div>
      <div className="axiom-picker">
        {Object.entries(AXIOMS).map(([key, v]) => (
          <button
            key={key}
            className={`axiom-btn ${axiom === key ? 'active' : ''}`}
            onClick={() => setAxiom(key)}
            style={axiom === key ? { borderColor: v.color, color: v.color } : undefined}
          >
            <div className="axiom-btn-label">{v.label}</div>
            <div className="axiom-btn-parallels">{v.parallels} parallels</div>
          </button>
        ))}
      </div>

      <div className={`axiom-statement ${revealAxle ? '' : 'hidden'}`}>
        <span className="axiom-statement-tag">axle</span>
        <span style={{ color }}>{a.statement}</span>
      </div>

      <div className="axiom-canvas-wrap">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          className="axiom-canvas"
        >
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="var(--border)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#grid)" />

          {/* Two initially-parallel lines */}
          <path d={topPath} fill="none" stroke={color} strokeWidth="2" opacity="0.85" />
          <path d={botPath} fill="none" stroke={color} strokeWidth="2" opacity="0.85" />
          <circle cx={xStart} cy={yTop} r="3" fill={color} />
          <circle cx={xStart} cy={yBot} r="3" fill={color} />

          {/* Triangle */}
          <path
            d={`${triEdge(A, B)} ${triEdge(B, C)} ${triEdge(C, A)}`}
            fill="var(--purple)"
            fillOpacity="0.08"
            stroke="var(--purple)"
            strokeWidth="2"
          />
          <circle cx={A.x} cy={A.y} r="3" fill="var(--purple)" />
          <circle cx={B.x} cy={B.y} r="3" fill="var(--purple)" />
          <circle cx={C.x} cy={C.y} r="3" fill="var(--purple)" />

          {/* Angle-sum readout, anchored at the centroid */}
          <text
            x={centroid.x}
            y={centroid.y + 4}
            textAnchor="middle"
            fontSize="13"
            fill="var(--text-muted)"
            fontFamily="ui-monospace, SFMono-Regular, monospace"
          >
            ∑θ ≈ {angleSum}°
          </text>
        </svg>
      </div>

      <div className="section-title" style={{ marginTop: 28 }}>Consequences — the wheel</div>
      <div className="axiom-grid">
        <div className="axiom-cell">
          <div className="axiom-cell-label">Parallel lines</div>
          <div className="axiom-cell-value" style={{ color }}>
            {axiom === 'euclidean' && 'stay equidistant'}
            {axiom === 'hyperbolic' && 'diverge forever'}
            {axiom === 'elliptic' && 'converge and meet'}
          </div>
        </div>
        <div className="axiom-cell">
          <div className="axiom-cell-label">Triangle angle sum</div>
          <div className="axiom-cell-value" style={{ color }}>{a.triangleSum}</div>
        </div>
        <div className="axiom-cell">
          <div className="axiom-cell-label">Shape of space</div>
          <div className="axiom-cell-value" style={{ color }}>{a.space}</div>
        </div>
      </div>

      <div className="axiom-toggle">
        <label>
          <input
            type="checkbox"
            checked={!revealAxle}
            onChange={e => setRevealAxle(!e.target.checked)}
          />
          Hide the axle (see only the motion)
        </label>
        <p className="axiom-hint">
          The wheel is dramatic. The axle is quiet. You don't notice the axle when the wheels are turning fine —
          until you swap it, and the shape of everything turns with it.
        </p>
      </div>
    </div>
  )
}
