import { v4 as uuidv4 } from 'uuid'

const STORAGE_KEY = 'workbench-v1'
const now = Date.now()
const D = 86_400_000 // one day in ms

// ── Node + edge type registries ───────────────────────────────────────────────

export const NODE_TYPES = ['artifact', 'idea', 'moment', 'person', 'context', 'environment', 'relation']

export const NODE_TYPE_META = {
  artifact:    { icon: '◈', label: 'Artifact',    color: '#6c8fff' },
  idea:        { icon: '✦', label: 'Idea',         color: '#a78bfa' },
  moment:      { icon: '◆', label: 'Moment',       color: '#fbbf24' },
  person:      { icon: '○', label: 'Person',        color: '#4ade80' },
  context:     { icon: '◐', label: 'Context',      color: '#2dd4bf' },
  environment: { icon: '□', label: 'Environment',  color: '#fb923c' },
  relation:    { icon: '↔', label: 'Relation',     color: '#f472b6' },
}

export const EDGE_TYPES = [
  'EMERGED_FROM', 'EXPRESSES', 'REFINES', 'CREATED_BY', 'INSPIRED_BY',
  'EVOLVES_INTO', 'DESCENDED_FROM', 'RECOGNIZED_IN', 'CAPTURED_AS',
  'DISCUSSED_IN', 'CONTRADICTS', 'TRANSLATES_INTO', 'OCCURRED_IN', 'PARTICIPATED_IN',
  'TAKES_PLACE_AT', 'EMBODIED_AS', 'DERIVES_FROM', 'INFLUENCED_BY', 'REMIXES', 'BELONGS_TO',
]

// Edge type label abbreviations for graph rendering
export const EDGE_ABBREV = {
  EMERGED_FROM:    '←born',
  EXPRESSES:       'expr→',
  REFINES:         'rfns→',
  CREATED_BY:      'by→',
  INSPIRED_BY:     'insp→',
  EVOLVES_INTO:    '→evol',
  DESCENDED_FROM:  '←desc',
  RECOGNIZED_IN:   'recog',
  CAPTURED_AS:     'capt→',
  DISCUSSED_IN:    'disc→',
  CONTRADICTS:     '≠',
  TRANSLATES_INTO: '→trans',
  OCCURRED_IN:     'in→',
  PARTICIPATED_IN: 'part→',
  TAKES_PLACE_AT:  'at→',
  EMBODIED_AS:     'emb→',
  DERIVES_FROM:    '←deriv',
  INFLUENCED_BY:   '←infl',
  REMIXES:         'remix',
  BELONGS_TO:      'part-of',
}

// ── Protocol definitions ──────────────────────────────────────────────────────

export const PROTOCOLS = [
  {
    id: 'field-note',
    class: 'execution',
    name: 'Field Note System',
    trigger: 'New content captured — conversation, walk, voice memo',
    description: 'File raw input with full lineage: source moment, expressed idea, context tag, and at least one edge to an existing node.',
    phases: [
      { name: 'Source Identification', prompt: 'What was the originating moment? (conversation, walk, reading, observation)' },
      { name: 'Core Recognition', prompt: 'What was the key recognition or observation? State it in one sentence.' },
      { name: 'Idea Connection', prompt: 'Which existing idea does this express, refine, or contradict?' },
      { name: 'Context Tag', prompt: 'What was the context? (emotional state, project phase, location)' },
      { name: 'Filing', prompt: 'Final field note — title and body. Compress the above into a transmissible artifact.' },
    ],
    outputType: 'artifact',
  },
  {
    id: 'six-seven',
    class: 'execution',
    name: 'Six-Seven',
    trigger: 'Long artifact needs to be transmitted or compressed',
    description: 'Compress to six key points, then distill each to exactly seven words. Produces a transmission-ready artifact.',
    phases: [
      { name: 'Input', prompt: 'Describe or paste the artifact to be compressed.' },
      { name: 'Six Points', prompt: 'Identify the six essential points. One per line.' },
      { name: 'Seven Words', prompt: 'Distill each point to exactly seven words. Six lines, seven words each.' },
      { name: 'Transmission', prompt: 'The final artifact — six seven-word sentences that carry the whole.' },
    ],
    outputType: 'artifact',
  },
  {
    id: 'human-filter',
    class: 'integrity',
    name: 'Human Filter',
    trigger: 'Artifact feels bloodless, abstract, or too clean',
    description: 'Restore embodiment. Bring lived reality back into the artifact. Ensure the output carries felt experience, not just concept.',
    phases: [
      { name: 'Diagnosis', prompt: 'Which artifact? Where does it feel abstract or disconnected from experience?' },
      { name: 'Source Return', prompt: 'What was the original lived experience this came from? Return to it specifically.' },
      { name: 'Restoration', prompt: 'Rewrite with specific, felt, embodied detail restored. Name the room. Name the feeling.' },
    ],
    outputType: 'artifact',
  },
  {
    id: 'attribution-arc',
    class: 'integrity',
    name: 'Attribution Arc',
    trigger: 'Tracing where an idea came from',
    description: 'Walk the lineage graph. Identify all moments, people, and artifacts that contributed to the formation of an idea.',
    phases: [
      { name: 'Idea Selection', prompt: 'Which idea are you tracing? State it clearly.' },
      { name: 'Immediate Sources', prompt: 'What conversation, artifact, or moment first surfaced this idea?' },
      { name: 'Deep Lineage', prompt: 'What were the conditions — people, prior ideas, contexts — that made this possible?' },
      { name: 'Attribution Map', prompt: 'Write the attribution arc: a lineage statement crediting all sources in sequence.' },
    ],
    outputType: 'artifact',
  },
  {
    id: 'preflight',
    class: 'orientation',
    name: 'Preflight',
    trigger: 'Before beginning any significant work session',
    description: 'Diagnose the frame before acting. Orient before executing. The system should know where you are before it moves.',
    phases: [
      { name: 'Current State', prompt: 'What is the live edge right now? What are you working on?' },
      { name: 'Frame Check', prompt: 'What mode are you in? (building, exploring, synthesizing, resting, integrating)' },
      { name: 'Open Threads', prompt: 'What threads are unresolved from the last session?' },
      { name: 'Intention', prompt: 'What do you want to accomplish this session? One clear statement.' },
    ],
    outputType: 'artifact',
  },
  {
    id: 'health-check',
    class: 'maintenance',
    name: 'Maintenance Run',
    trigger: 'Monthly cadence, or when the graph feels stale or overgrown',
    description: 'Deliberate maintenance pass: find stale nodes, missing lineage, underconnected ideas. Produces a filed report and a set of suggested new edges.',
    phases: [
      { name: 'Stale Scan', prompt: 'Which nodes have had no new connections in 30+ days? Which feel orphaned or incomplete? List them.' },
      { name: 'Missing Lineage', prompt: 'Which nodes lack outgoing edges — no source moment, no expressed idea, no continuation? What are they missing?' },
      { name: 'Underconnected Ideas', prompt: 'Which ideas appear only once or twice but feel central to the whole? What should they connect to that they don\'t yet?' },
      { name: 'Suggested Edges', prompt: 'Based on the scan: name 3–5 specific new edges that would most improve the graph\'s coherence. Format: [Node A] → [EDGE_TYPE] → [Node B].' },
      { name: 'Filing', prompt: 'Which findings need to be captured as new nodes? Which suggested edges should be added now? Document the maintenance report here.' },
    ],
    outputType: 'artifact',
  },
]

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED_NODES = [
  { id: 'n-evan',    type: 'person',   title: 'Evan',                              content: 'Primary user. Not just using the system — discovering what it should be by using it. The PRD writes itself from the inside out.',                                                         context: 'self',          tags: ['user'],                         createdAt: now - D * 30 },
  { id: 'n-claudio', type: 'person',   title: 'Claudio',                           content: 'Collaborator. Brings systems thinking and philosophical rigor. Key node in the Inspiration Network.',                                                                                       context: 'collaborator',  tags: ['collaborator', 'philosophy'],    createdAt: now - D * 20 },
  { id: 'n1',        type: 'idea',     title: 'Relational Ontology',               content: 'Everything that exists does so in relation. Identity is not intrinsic but emergent from the web of connections a thing participates in.',                                                  context: 'foundation',    tags: ['philosophy', 'emergence'],       createdAt: now - D * 14 },
  { id: 'n2',        type: 'moment',   title: 'Morning walk — April 2',            content: 'Long walk, no phone. The city felt alive. Thought about how ecosystems and cities mirror each other at every scale.',                                                                       context: 'physical',      tags: ['walk', 'observation'],           createdAt: now - D * 12 },
  { id: 'n3',        type: 'artifact', title: 'Field Note: Emergence vs Structure', content: 'The tension between emergent order and designed structure. Neither wins — the interesting territory is the boundary between them. Filed from morning walk.',                               context: 'draft',         tags: ['emergence', 'design'],           createdAt: now - D * 11 },
  { id: 'n4',        type: 'idea',     title: 'The Residual',                      content: 'What remains when the explicit content of a conversation is removed. The felt sense, the unspoken trajectory, the thing that keeps returning. Not extractable by summarization.',          context: 'recurring',     tags: ['cognition', 'conversation'],     createdAt: now - D * 10 },
  { id: 'n5',        type: 'artifact', title: 'Essay Draft: The Residual',         content: 'Working through what the Residual is, why it resists capture, and what it implies for how we design knowledge systems. Current draft: 1,200 words.',                                       context: 'in-progress',   tags: ['essay', 'knowledge'],            createdAt: now - D * 8  },
  { id: 'n6',        type: 'moment',   title: 'Conversation with Claudio',         content: 'Two hours. Covered systems thinking, the Residual, and how attribution works in collaborative intellectual work.',                                                                          context: 'collaborative', tags: ['conversation', 'collaboration'],  createdAt: now - D * 7  },
  { id: 'n7',        type: 'artifact', title: 'Voice Memo: Systems Thinking',      content: 'Post-conversation recording. The Residual is what makes conversation irreducible — you cannot replay the tape and get the same understanding.',                                            context: 'capture',       tags: ['systems', 'voice'],              createdAt: now - D * 6  },
  { id: 'n8',        type: 'idea',     title: 'Coherence as Navigation',           content: 'Coherence is not a state to achieve but a direction to move toward. The Workbench navigates toward coherence the way a ship navigates by a star — orienting, not arriving.',              context: 'design',        tags: ['coherence', 'navigation'],       createdAt: now - D * 5  },
  { id: 'n9',        type: 'artifact', title: 'Protocol: Field Note System',       content: 'Filing protocol for any artifact entering the graph. Requires: source moment, expressed idea, context tag, at least one edge to an existing node. Output: filed node with full lineage.', context: 'protocol',      tags: ['protocol', 'filing'],            createdAt: now - D * 4  },
  { id: 'n10',       type: 'moment',   title: 'Session: Workbench architecture',   content: 'Three-hour design session. Settled on the five-layer architecture, seven node types, and fourteen edge types. The system became coherent.',                                               context: 'design',        tags: ['architecture', 'session'],       createdAt: now - D * 2  },
  { id: 'n11',       type: 'idea',     title: 'Placement as Generative Act',       content: 'The moment of deciding where something goes should feel meaningful, not administrative. When the user places something, the system should respond: suggest connections, surface related nodes.', context: 'design',   tags: ['design', 'pedagogy'],            createdAt: now - D * 1  },
]

const SEED_EDGES = [
  // Artifacts link to their source moments
  { id: 'e1',  from: 'n3',        to: 'n2',        type: 'EMERGED_FROM',    createdAt: now - D * 11 },
  { id: 'e2',  from: 'n7',        to: 'n6',        type: 'EMERGED_FROM',    createdAt: now - D * 6  },
  // Artifacts express ideas
  { id: 'e3',  from: 'n3',        to: 'n1',        type: 'EXPRESSES',       createdAt: now - D * 11 },
  { id: 'e4',  from: 'n5',        to: 'n4',        type: 'EXPRESSES',       createdAt: now - D * 8  },
  { id: 'e5',  from: 'n7',        to: 'n4',        type: 'EXPRESSES',       createdAt: now - D * 6  },
  // Artifact evolution chains
  { id: 'e6',  from: 'n3',        to: 'n5',        type: 'EVOLVES_INTO',    createdAt: now - D * 8  },
  // Ideas refine / descend from other ideas
  { id: 'e7',  from: 'n4',        to: 'n1',        type: 'REFINES',         createdAt: now - D * 5  },
  { id: 'e8',  from: 'n8',        to: 'n1',        type: 'DESCENDED_FROM',  createdAt: now - D * 5  },
  { id: 'e9',  from: 'n11',       to: 'n8',        type: 'REFINES',         createdAt: now - D * 1  },
  // Ideas recognized in moments
  { id: 'e10', from: 'n4',        to: 'n6',        type: 'RECOGNIZED_IN',   createdAt: now - D * 7  },
  { id: 'e11', from: 'n8',        to: 'n10',       type: 'RECOGNIZED_IN',   createdAt: now - D * 2  },
  // Creation attribution
  { id: 'e12', from: 'n3',        to: 'n-evan',    type: 'CREATED_BY',      createdAt: now - D * 11 },
  { id: 'e13', from: 'n5',        to: 'n-evan',    type: 'CREATED_BY',      createdAt: now - D * 8  },
  { id: 'e14', from: 'n7',        to: 'n-evan',    type: 'CREATED_BY',      createdAt: now - D * 6  },
  // Participation
  { id: 'e15', from: 'n-claudio', to: 'n6',        type: 'PARTICIPATED_IN', createdAt: now - D * 7  },
  { id: 'e16', from: 'n-evan',    to: 'n6',        type: 'PARTICIPATED_IN', createdAt: now - D * 7  },
  { id: 'e17', from: 'n-evan',    to: 'n2',        type: 'PARTICIPATED_IN', createdAt: now - D * 12 },
  // Inspiration
  { id: 'e18', from: 'n8',        to: 'n6',        type: 'INSPIRED_BY',     createdAt: now - D * 7  },
  // Protocol attribution
  { id: 'e19', from: 'n9',        to: 'n-evan',    type: 'CREATED_BY',      createdAt: now - D * 4  },
  // Architecture session → idea
  { id: 'e20', from: 'n10',       to: 'n-evan',    type: 'PARTICIPATED_IN', createdAt: now - D * 2  },
]

function seedData() {
  return {
    nodes: SEED_NODES,
    edges: SEED_EDGES,
    activeSession: {
      startedAt: now,
      liveThreads: ['The Residual', 'Coherence as Navigation', 'Placement as Generative Act'],
    },
  }
}

// ── Persistence ───────────────────────────────────────────────────────────────

export function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : seedData()
  } catch {
    return seedData()
  }
}

export function saveStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function resetStore() {
  localStorage.removeItem(STORAGE_KEY)
  return seedData()
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function addNode({ type, title, content, context, tags, newEdges = [], store }) {
  const id = uuidv4()
  const node = {
    id, type,
    title: title.trim(),
    content: content.trim(),
    context: context.trim(),
    tags: tags.map(t => t.trim()).filter(Boolean),
    createdAt: Date.now(),
  }
  const edgeObjs = newEdges.map(e => ({
    id: uuidv4(),
    from: e.dir === 'from' ? e.nodeId : id,
    to:   e.dir === 'to'   ? e.nodeId : id,
    type: e.type,
    createdAt: Date.now(),
  }))
  return { ...store, nodes: [...store.nodes, node], edges: [...store.edges, ...edgeObjs] }
}

// ── Graph computation ─────────────────────────────────────────────────────────

/** Map from node id → count of incoming edges */
export function computeInDegree(nodes, edges) {
  const deg = {}
  for (const n of nodes) deg[n.id] = 0
  for (const e of edges) {
    if (deg[e.to] !== undefined) deg[e.to]++
  }
  return deg
}

/** Map from node id → count of outgoing edges */
export function computeOutDegree(nodes, edges) {
  const deg = {}
  for (const n of nodes) deg[n.id] = 0
  for (const e of edges) {
    if (deg[e.from] !== undefined) deg[e.from]++
  }
  return deg
}

/** All edges touching a node (in or out), with the connected node resolved */
export function getConnections(nodeId, nodes, edges) {
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]))
  const outgoing = edges
    .filter(e => e.from === nodeId)
    .map(e => ({ direction: 'out', edgeType: e.type, node: byId[e.to], edgeId: e.id }))
    .filter(c => c.node)
  const incoming = edges
    .filter(e => e.to === nodeId)
    .map(e => ({ direction: 'in', edgeType: e.type, node: byId[e.from], edgeId: e.id }))
    .filter(c => c.node)
  return { outgoing, incoming }
}

/** Nodes ranked by inDegree (convergence hotspots) */
export function getConvergenceNodes(nodes, edges) {
  const inDeg = computeInDegree(nodes, edges)
  return [...nodes]
    .map(n => ({ ...n, inDegree: inDeg[n.id] || 0 }))
    .filter(n => n.inDegree > 0)
    .sort((a, b) => b.inDegree - a.inDegree)
}

/**
 * Open threads: non-person nodes with no outgoing EVOLVES_INTO or TRANSLATES_INTO edge.
 * These are artifacts/ideas at the frontier — started but not yet continued.
 */
export function getOpenThreads(nodes, edges) {
  const CONTINUATION = new Set(['EVOLVES_INTO', 'TRANSLATES_INTO', 'CAPTURED_AS'])
  const withContinuation = new Set(
    edges.filter(e => CONTINUATION.has(e.type)).map(e => e.from)
  )
  return nodes
    .filter(n => n.type !== 'person' && n.type !== 'environment' && !withContinuation.has(n.id))
    .sort((a, b) => b.createdAt - a.createdAt)
}

/** Most recently active nodes (by edge touch time) */
export function getLiveEdge(nodes, edges, count = 8) {
  const recentEdges = [...edges].sort((a, b) => b.createdAt - a.createdAt).slice(0, 14)
  const seen = new Set()
  const activeIds = []
  for (const e of recentEdges) {
    for (const id of [e.from, e.to]) {
      if (!seen.has(id)) { seen.add(id); activeIds.push(id) }
    }
  }
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]))
  return activeIds.map(id => byId[id]).filter(Boolean).slice(0, count)
}

/** Build node + edge data for canvas rendering */
export function buildGraphData(nodes, edges) {
  return { nodes, edges }
}

/**
 * Suggest related existing nodes for a node being created.
 * Scores by: tag overlap, title word overlap, type affinity, recency.
 * Returns top N candidates with a suggested edge type.
 */
export function getSuggestedConnections(type, title, tags, nodes, count = 5) {
  const tagSet  = new Set(tags.map(t => t.toLowerCase().trim()).filter(Boolean))
  const words   = new Set(
    title.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  )

  // Which types commonly connect to each source type, and what edge to suggest
  const AFFINITIES = {
    artifact:    [{ type: 'moment',   edge: 'EMERGED_FROM'   },
                  { type: 'idea',     edge: 'EXPRESSES'      },
                  { type: 'person',   edge: 'CREATED_BY'     },
                  { type: 'artifact', edge: 'EVOLVES_INTO'   }],
    idea:        [{ type: 'idea',     edge: 'REFINES'        },
                  { type: 'moment',   edge: 'RECOGNIZED_IN'  },
                  { type: 'idea',     edge: 'DESCENDED_FROM' }],
    moment:      [{ type: 'person',   edge: 'PARTICIPATED_IN'},
                  { type: 'context',  edge: 'OCCURRED_IN'    }],
    person:      [{ type: 'moment',   edge: 'PARTICIPATED_IN'}],
    relation:    [{ type: 'idea',     edge: 'EXPRESSES'      },
                  { type: 'person',   edge: 'PARTICIPATED_IN'}],
    context:     [{ type: 'artifact', edge: 'OCCURRED_IN'    }],
    environment: [{ type: 'moment',   edge: 'OCCURRED_IN'    }],
  }
  const affinityTypes = new Set((AFFINITIES[type] || []).map(a => a.type))

  const scored = nodes.map(n => {
    let score = 0

    // Tag overlap (strongest signal)
    const nodeTags = (n.tags || []).map(t => t.toLowerCase())
    for (const t of tagSet) {
      if (nodeTags.includes(t)) score += 3
    }

    // Title word overlap
    const nodeWords = new Set(n.title.toLowerCase().split(/\s+/))
    for (const w of words) {
      if (nodeWords.has(w)) score += 2
    }

    // Content word overlap (lighter)
    if (n.content) {
      const contentWords = new Set(n.content.toLowerCase().split(/\s+/))
      for (const w of words) {
        if (contentWords.has(w)) score += 1
      }
    }

    // Type affinity
    if (affinityTypes.has(n.type)) score += 2

    // Recency bonus
    const days = (Date.now() - n.createdAt) / 86_400_000
    if (days < 7)  score += 2
    else if (days < 30) score += 1

    // Suggest the best edge type based on the connected node's type
    const affinity = (AFFINITIES[type] || []).find(a => a.type === n.type)
    const suggestedEdge = affinity?.edge || 'INSPIRED_BY'

    return { ...n, score, suggestedEdge }
  })

  return scored
    .filter(n => n.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
}
