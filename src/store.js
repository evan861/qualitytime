import { v4 as uuidv4 } from 'uuid'

const STORAGE_KEY = 'qt-data-v1'

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED_USERS = {
  'user-1': { id: 'user-1', name: 'You',        avatar: '🌱' },
  'user-2': { id: 'user-2', name: 'Aria Chen',  avatar: '🔭' },
  'user-3': { id: 'user-3', name: 'Marcus Obi', avatar: '📐' },
  'user-4': { id: 'user-4', name: 'Lena Park',  avatar: '🎨' },
}

const now = Date.now()
const DAY = 86_400_000

const SEED_TOKENS = [
  {
    id: 'token-1',
    title: 'The city is a forest of dreams',
    content:
      'Urban environments mirror forest ecosystems—layered, interdependent, alive with hidden flows of energy and meaning. The metaphor unlocks new design languages for civic branding.',
    type: 'metaphor',
    tags: ['branding', 'creativity', 'urban'],
    creatorId: 'user-1',
    createdAt: now - DAY * 7,
    openness: 'open',
    inspirations: [],
    remixCount: 3,
  },
  {
    id: 'token-2',
    title: 'Urban biodiversity gap',
    content:
      'Cities systematically underinvest in green corridors, fragmenting wildlife habitats and reducing ecosystem resilience. A concrete problem with measurable impact.',
    type: 'problem',
    tags: ['sustainability', 'urban', 'ecology'],
    creatorId: 'user-1',
    createdAt: now - DAY * 5,
    openness: 'open',
    inspirations: [],
    remixCount: 2,
  },
  {
    id: 'token-3',
    title: 'AI-assisted green roof mapping',
    content:
      'Computer vision + satellite data identifies optimal surfaces for green roofs at city scale, prioritising heat islands and biodiversity corridors.',
    type: 'solution',
    tags: ['ai', 'sustainability', 'urban'],
    creatorId: 'user-2',
    createdAt: now - DAY * 3,
    openness: 'open',
    inspirations: ['token-2'],
    remixCount: 1,
  },
  {
    id: 'token-4',
    title: 'Loss-aversion nudge for green commutes',
    content:
      'Applying loss-aversion framing to carbon footprint dashboards increases sustainable transport adoption by 34% in pilot studies.',
    type: 'insight',
    tags: ['behavioral-economics', 'sustainability', 'transport'],
    creatorId: 'user-3',
    createdAt: now - DAY * 2,
    openness: 'open',
    inspirations: ['token-2'],
    remixCount: 0,
  },
  {
    id: 'token-5',
    title: 'Forest-city branding framework',
    content:
      'A brand identity system for urban sustainability campaigns using the forest metaphor: canopy (vision), understory (programs), roots (community).',
    type: 'solution',
    tags: ['branding', 'creativity', 'sustainability'],
    creatorId: 'user-4',
    createdAt: now - DAY * 1,
    openness: 'open',
    inspirations: ['token-1', 'token-2'],
    remixCount: 0,
  },
]

function seedData() {
  return {
    currentUserId: 'user-1',
    users: SEED_USERS,
    tokens: SEED_TOKENS,
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

export function mintToken({ title, content, type, tags, openness, inspirations, store }) {
  const token = {
    id: uuidv4(),
    title: title.trim(),
    content: content.trim(),
    type,
    tags: tags.map(t => t.trim()).filter(Boolean),
    creatorId: store.currentUserId,
    createdAt: Date.now(),
    openness,
    inspirations,
    remixCount: 0,
  }
  return { ...store, tokens: [...store.tokens, token] }
}

// ── Derived data ──────────────────────────────────────────────────────────────

export function buildGraphData(tokens, users) {
  const nodes = tokens.map(t => ({
    id: t.id,
    label: t.title,
    type: t.type,
    creatorName: users[t.creatorId]?.name || 'Unknown',
    creatorAvatar: users[t.creatorId]?.avatar || '❓',
    remixCount: t.remixCount,
    tags: t.tags,
    openness: t.openness,
  }))

  const edges = []
  tokens.forEach(t =>
    t.inspirations.forEach(src => edges.push({ from: src, to: t.id }))
  )

  return { nodes, edges }
}
