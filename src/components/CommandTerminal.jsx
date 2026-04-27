// CommandTerminal — REPL for querying and mutating the graph.

import { useEffect, useRef, useState } from 'react'
import {
  NODE_TYPES, NODE_TYPE_META, EDGE_TYPES, PROTOCOLS,
  addNode, addEdge, deleteNode, deleteEdge, tagNode, resolveNode,
  getConnections, getConvergenceNodes, getOpenThreads, getLiveEdge,
  resetStore,
} from '../store'

// ── Tokenizer ────────────────────────────────────────────────────────────────
// Splits a command line into tokens, honoring "double" and 'single' quotes.
function tokenize(line) {
  const tokens = []
  let buf = ''
  let quote = null
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quote) {
      if (ch === quote) { quote = null; tokens.push(buf); buf = '' }
      else buf += ch
    } else if (ch === '"' || ch === "'") {
      if (buf) { tokens.push(buf); buf = '' }
      quote = ch
    } else if (ch === ' ' || ch === '\t') {
      if (buf) { tokens.push(buf); buf = '' }
    } else {
      buf += ch
    }
  }
  if (buf) tokens.push(buf)
  return tokens
}

function shortId(id) { return id.slice(0, 8) }
function timeAgo(ts) {
  const d = Math.floor((Date.now() - ts) / 86_400_000)
  if (d === 0) return 'today'
  if (d === 1) return '1d ago'
  return `${d}d ago`
}

// ── Output line types ────────────────────────────────────────────────────────
// { kind: 'echo' | 'info' | 'error' | 'success' | 'output', text }
function mkLine(kind, text) { return { kind, text } }

// ── Help text ────────────────────────────────────────────────────────────────
const HELP_TEXT = `
COMMANDS

  help                              show this help
  clear                             clear the terminal output
  stats                             graph statistics
  types                             list node and edge types
  protocols                         list available protocols

QUERY

  ls [type]                         list nodes (optionally filter by type)
  edges [type]                      list edges (optionally filter by edge type)
  find <query>                      search nodes by title, content, or tag
  show <id|title>                   show full details of a node
  connections <id|title>            list a node's incoming and outgoing edges
  convergence [n]                   top n convergence nodes (default 8)
  threads                           open threads (frontier nodes)
  live [n]                          most recently active nodes (default 8)

MUTATE

  node <type> "<title>" ["content"] create a new node
  edge <fromId|title> <TYPE> <toId|title>
                                    create an edge between two nodes
  tag <id|title> <tag>              add a tag to a node
  delete node <id|title>            delete a node and its edges
  delete edge <id>                  delete an edge by id
  reset                             reset the store to seed data
  export                            print the full graph as JSON

NAVIGATION

  ↑ / ↓                             cycle through previous commands
  Tab                               autocomplete the first word
  Enter                             submit the command line
`.trim()

// ── Command runner ───────────────────────────────────────────────────────────

function runCommand(rawLine, store, updateStore) {
  const out = []
  const push = (kind, text) => out.push(mkLine(kind, text))

  const trimmed = rawLine.trim()
  if (!trimmed) return { lines: out }
  push('echo', `> ${trimmed}`)

  const tokens = tokenize(trimmed)
  const cmd = tokens[0].toLowerCase()
  const args = tokens.slice(1)
  const { nodes, edges } = store

  // ── help ──
  if (cmd === 'help' || cmd === '?') {
    push('output', HELP_TEXT)
    return { lines: out }
  }

  // ── clear ──
  if (cmd === 'clear' || cmd === 'cls') {
    return { lines: out, clear: true }
  }

  // ── stats ──
  if (cmd === 'stats') {
    const byType = {}
    for (const n of nodes) byType[n.type] = (byType[n.type] || 0) + 1
    const byEdge = {}
    for (const e of edges) byEdge[e.type] = (byEdge[e.type] || 0) + 1
    push('output', `Nodes: ${nodes.length}    Edges: ${edges.length}`)
    push('output', '')
    push('output', 'BY NODE TYPE')
    for (const t of NODE_TYPES) {
      const c = byType[t] || 0
      if (c > 0) push('output', `  ${NODE_TYPE_META[t].icon} ${t.padEnd(14)} ${c}`)
    }
    push('output', '')
    push('output', 'TOP EDGE TYPES')
    const topEdges = Object.entries(byEdge).sort((a, b) => b[1] - a[1]).slice(0, 6)
    for (const [t, c] of topEdges) push('output', `  ${t.padEnd(20)} ${c}`)
    return { lines: out }
  }

  // ── types ──
  if (cmd === 'types') {
    push('output', 'NODE TYPES')
    for (const t of NODE_TYPES) {
      const m = NODE_TYPE_META[t]
      push('output', `  ${m.icon}  ${t}`)
    }
    push('output', '')
    push('output', 'EDGE TYPES')
    push('output', '  ' + EDGE_TYPES.join(', '))
    return { lines: out }
  }

  // ── protocols ──
  if (cmd === 'protocols') {
    for (const p of PROTOCOLS) {
      push('output', `  [${p.class.padEnd(11)}] ${p.name}`)
      push('output', `               ${p.description}`)
    }
    return { lines: out }
  }

  // ── ls ──
  if (cmd === 'ls' || cmd === 'nodes') {
    const filter = args[0]?.toLowerCase()
    let list = [...nodes].sort((a, b) => b.createdAt - a.createdAt)
    if (filter) {
      if (!NODE_TYPES.includes(filter)) {
        push('error', `unknown type: ${filter}. expected one of: ${NODE_TYPES.join(', ')}`)
        return { lines: out }
      }
      list = list.filter(n => n.type === filter)
    }
    if (list.length === 0) { push('info', 'no nodes match'); return { lines: out } }
    for (const n of list) {
      const m = NODE_TYPE_META[n.type]
      push('output', `  ${m.icon} ${shortId(n.id)}  ${n.type.padEnd(11)} ${n.title}`)
    }
    push('info', `${list.length} node${list.length === 1 ? '' : 's'}`)
    return { lines: out }
  }

  // ── edges ──
  if (cmd === 'edges') {
    const filter = args[0]?.toUpperCase()
    let list = [...edges].sort((a, b) => b.createdAt - a.createdAt)
    if (filter) {
      if (!EDGE_TYPES.includes(filter)) {
        push('error', `unknown edge type: ${filter}`)
        return { lines: out }
      }
      list = list.filter(e => e.type === filter)
    }
    const byId = Object.fromEntries(nodes.map(n => [n.id, n]))
    if (list.length === 0) { push('info', 'no edges match'); return { lines: out } }
    for (const e of list) {
      const f = byId[e.from], t = byId[e.to]
      push('output', `  ${shortId(e.id)}  ${(f?.title || e.from).slice(0, 26).padEnd(26)} ─${e.type}→ ${t?.title || e.to}`)
    }
    push('info', `${list.length} edge${list.length === 1 ? '' : 's'}`)
    return { lines: out }
  }

  // ── find ──
  if (cmd === 'find' || cmd === 'search') {
    const q = args.join(' ').toLowerCase()
    if (!q) { push('error', 'usage: find <query>'); return { lines: out } }
    const matches = nodes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.content?.toLowerCase().includes(q) ||
      (n.tags || []).some(t => t.toLowerCase().includes(q))
    )
    if (matches.length === 0) { push('info', `no matches for "${q}"`); return { lines: out } }
    for (const n of matches) {
      const m = NODE_TYPE_META[n.type]
      push('output', `  ${m.icon} ${shortId(n.id)}  ${n.type.padEnd(11)} ${n.title}`)
    }
    push('info', `${matches.length} match${matches.length === 1 ? '' : 'es'}`)
    return { lines: out }
  }

  // ── show ──
  if (cmd === 'show' || cmd === 'cat') {
    const needle = args.join(' ')
    const node = resolveNode(needle, nodes)
    if (!node) { push('error', `no node matches "${needle}"`); return { lines: out } }
    const m = NODE_TYPE_META[node.type]
    push('output', `${m.icon} ${node.title}`)
    push('output', `  id        ${node.id}`)
    push('output', `  type      ${node.type}`)
    if (node.context) push('output', `  context   ${node.context}`)
    push('output', `  created   ${timeAgo(node.createdAt)}`)
    if (node.tags?.length) push('output', `  tags      ${node.tags.map(t => '#' + t).join(' ')}`)
    if (node.content) {
      push('output', '')
      push('output', node.content)
    }
    return { lines: out }
  }

  // ── connections ──
  if (cmd === 'connections' || cmd === 'conn') {
    const needle = args.join(' ')
    const node = resolveNode(needle, nodes)
    if (!node) { push('error', `no node matches "${needle}"`); return { lines: out } }
    const { outgoing, incoming } = getConnections(node.id, nodes, edges)
    push('output', `${node.title}`)
    push('output', '')
    push('output', `OUT (${outgoing.length})`)
    if (outgoing.length === 0) push('output', '  (none — this node is a source)')
    for (const c of outgoing) {
      push('output', `  →${c.edgeType.padEnd(16)} ${c.node.title}`)
    }
    push('output', '')
    push('output', `IN (${incoming.length})`)
    if (incoming.length === 0) push('output', '  (none — this node is a frontier)')
    for (const c of incoming) {
      push('output', `  ←${c.edgeType.padEnd(16)} ${c.node.title}`)
    }
    return { lines: out }
  }

  // ── convergence ──
  if (cmd === 'convergence' || cmd === 'conv') {
    const limit = parseInt(args[0], 10) || 8
    const ranked = getConvergenceNodes(nodes, edges).slice(0, limit)
    if (ranked.length === 0) { push('info', 'no convergence yet — add edges'); return { lines: out } }
    for (const [i, n] of ranked.entries()) {
      const m = NODE_TYPE_META[n.type]
      push('output', `  #${(i + 1).toString().padStart(2)}  ${m.icon} ${String(n.inDegree).padStart(2)}×  ${n.title}`)
    }
    return { lines: out }
  }

  // ── threads ──
  if (cmd === 'threads') {
    const t = getOpenThreads(nodes, edges)
    if (t.length === 0) { push('info', 'no open threads — graph is closed'); return { lines: out } }
    for (const n of t) {
      const m = NODE_TYPE_META[n.type]
      push('output', `  ${m.icon} ${n.type.padEnd(11)} ${n.title}`)
    }
    push('info', `${t.length} open`)
    return { lines: out }
  }

  // ── live ──
  if (cmd === 'live') {
    const limit = parseInt(args[0], 10) || 8
    const live = getLiveEdge(nodes, edges, limit)
    for (const n of live) {
      const m = NODE_TYPE_META[n.type]
      push('output', `  ${m.icon} ${n.type.padEnd(11)} ${n.title}  · ${timeAgo(n.createdAt)}`)
    }
    return { lines: out }
  }

  // ── node (create) ──
  if (cmd === 'node' || cmd === 'mint') {
    const [type, title, content] = args
    if (!type || !title) {
      push('error', 'usage: node <type> "<title>" ["content"]')
      return { lines: out }
    }
    if (!NODE_TYPES.includes(type)) {
      push('error', `unknown type: ${type}. expected one of: ${NODE_TYPES.join(', ')}`)
      return { lines: out }
    }
    const next = addNode({
      type, title,
      content: content || '',
      context: '',
      tags: [],
      newEdges: [],
      store,
    })
    const created = next.nodes[next.nodes.length - 1]
    updateStore(next)
    push('success', `created ${type} ${shortId(created.id)}  "${created.title}"`)
    return { lines: out }
  }

  // ── edge (create) ──
  if (cmd === 'edge' || cmd === 'link') {
    const [from, type, to] = args
    if (!from || !type || !to) {
      push('error', 'usage: edge <fromId|title> <EDGE_TYPE> <toId|title>')
      return { lines: out }
    }
    const upperType = type.toUpperCase()
    if (!EDGE_TYPES.includes(upperType)) {
      push('error', `unknown edge type: ${type}`)
      return { lines: out }
    }
    const fromNode = resolveNode(from, nodes)
    const toNode   = resolveNode(to, nodes)
    if (!fromNode) { push('error', `no node matches "${from}"`); return { lines: out } }
    if (!toNode)   { push('error', `no node matches "${to}"`);   return { lines: out } }
    const next = addEdge({ from: fromNode.id, to: toNode.id, type: upperType, store })
    updateStore(next)
    push('success', `${fromNode.title} ─${upperType}→ ${toNode.title}`)
    return { lines: out }
  }

  // ── tag ──
  if (cmd === 'tag') {
    const [needle, tag] = args
    if (!needle || !tag) { push('error', 'usage: tag <id|title> <tag>'); return { lines: out } }
    const node = resolveNode(needle, nodes)
    if (!node) { push('error', `no node matches "${needle}"`); return { lines: out } }
    updateStore(tagNode(node.id, tag, store))
    push('success', `tagged "${node.title}" with #${tag}`)
    return { lines: out }
  }

  // ── delete ──
  if (cmd === 'delete' || cmd === 'rm') {
    const [target, ...rest] = args
    if (target === 'node') {
      const needle = rest.join(' ')
      const node = resolveNode(needle, nodes)
      if (!node) { push('error', `no node matches "${needle}"`); return { lines: out } }
      const incidentEdges = edges.filter(e => e.from === node.id || e.to === node.id).length
      updateStore(deleteNode(node.id, store))
      push('success', `deleted node "${node.title}" and ${incidentEdges} incident edge${incidentEdges === 1 ? '' : 's'}`)
      return { lines: out }
    }
    if (target === 'edge') {
      const id = rest[0]
      if (!id) { push('error', 'usage: delete edge <id>'); return { lines: out } }
      const edge = edges.find(e => e.id === id || e.id.startsWith(id))
      if (!edge) { push('error', `no edge matches "${id}"`); return { lines: out } }
      updateStore(deleteEdge(edge.id, store))
      push('success', `deleted edge ${shortId(edge.id)} (${edge.type})`)
      return { lines: out }
    }
    push('error', 'usage: delete node <id|title>  |  delete edge <id>')
    return { lines: out }
  }

  // ── reset ──
  if (cmd === 'reset') {
    if (args[0] === '--confirm' || args[0] === '-y') {
      updateStore(resetStore())
      push('success', 'store reset to seed data')
    } else {
      push('info', 'this will erase all your data. confirm with: reset --confirm')
    }
    return { lines: out }
  }

  // ── export ──
  if (cmd === 'export' || cmd === 'dump') {
    push('output', JSON.stringify({ nodes, edges }, null, 2))
    return { lines: out }
  }

  push('error', `unknown command: ${cmd}.  type "help" for the command list.`)
  return { lines: out }
}

// ── Component ────────────────────────────────────────────────────────────────

const ALL_COMMANDS = [
  'help', 'clear', 'stats', 'types', 'protocols',
  'ls', 'edges', 'find', 'show', 'connections', 'convergence', 'threads', 'live',
  'node', 'edge', 'tag', 'delete', 'reset', 'export',
]

const BANNER = `Workbench Terminal · type "help" for the command list`

export default function CommandTerminal({ store, onUpdate }) {
  const [lines, setLines]     = useState([mkLine('info', BANNER)])
  const [input, setInput]     = useState('')
  const [history, setHistory] = useState([])
  const [histIdx, setHistIdx] = useState(-1)
  const inputRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  function submit() {
    const line = input
    if (!line.trim()) return
    const result = runCommand(line, store, onUpdate)
    setHistory(h => [line, ...h].slice(0, 50))
    setHistIdx(-1)
    if (result.clear) {
      setLines([mkLine('info', BANNER)])
    } else {
      setLines(prev => [...prev, ...result.lines])
    }
    setInput('')
  }

  function onKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(histIdx + 1, history.length - 1)
      if (next >= 0 && history[next] !== undefined) {
        setHistIdx(next)
        setInput(history[next])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = histIdx - 1
      if (next < 0) { setHistIdx(-1); setInput('') }
      else { setHistIdx(next); setInput(history[next]) }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const parts = input.split(/\s+/)
      if (parts.length === 1) {
        const matches = ALL_COMMANDS.filter(c => c.startsWith(parts[0]))
        if (matches.length === 1) setInput(matches[0] + ' ')
        else if (matches.length > 1) {
          setLines(prev => [...prev, mkLine('echo', `> ${input}`), mkLine('info', matches.join('  '))])
        }
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setLines([mkLine('info', BANNER)])
    }
  }

  return (
    <div className="terminal-page" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-header">
        <div>
          <h2 className="page-title">⌨ Terminal</h2>
          <p className="page-sub">Query and mutate the graph via commands. Type <code>help</code> to begin.</p>
        </div>
        <div className="terminal-stats">
          <span>{store.nodes.length} nodes</span>
          <span>·</span>
          <span>{store.edges.length} edges</span>
        </div>
      </div>

      <div className="terminal-shell">
        <div className="terminal-output" ref={scrollRef}>
          {lines.map((l, i) => (
            <pre key={i} className={`term-line term-${l.kind}`}>{l.text}</pre>
          ))}
        </div>
        <div className="terminal-input-row">
          <span className="terminal-prompt">›</span>
          <input
            ref={inputRef}
            className="terminal-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            spellCheck={false}
            autoComplete="off"
            placeholder="help"
          />
        </div>
      </div>
    </div>
  )
}
