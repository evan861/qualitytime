import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()
const client = new Anthropic()

const WORKBENCH_VISION = `
AUTHORITATIVE VISION — Workbench OS (stated by Evan Silverman, May 25, 2026)

ONE-SENTENCE VERSION: A living system that processes Evan's transformations through time, makes connections he doesn't see himself, generates synthesis across all his domains, and connects to others through crossings that remember where they came from.

EIGHT FUNCTIONAL ZONES:
1. Universal Input — Anything in, anywhere. One gesture. Routes itself.
2. Domain Navigator — All pursuits in one place: Expert Networks, Knowledge Refinery, Semantic Cap Table, Future HOW, MYST, Hurricane, w-AI-ser. Navigable terrain, not a folder structure.
3. The Knowledge Graph — Paradigms, axioms, concepts as a living, interactive spatial map. The Master Concept Atlas made traversable.
4. The Conveyor Belt — Raw abstraction → execution. Intake (gems, arrivals) → Development (iterate, connect) → Execution (essays, specs, decisions). Nothing dies at intake. Nothing stays there forever.
5. Synthesis Engine — System generates cross-domain synthesis as an output, not just a user activity. "These three things are pointing at the same thing."
6. The Dream Layer — Background processing. Consolidates, finds connections, surfaces gems when Evan isn't working. Automatic version of the mining protocol.
7. Personal Rhythm Layer — Moon cycles, reminders, weekly recaps. Rhythm management, not task management.
8. The Crossing Layer — Crossings between Workbenches are capsules: two source attributions, a creation moment, its own lineage. Neither strand dissolves. Claudio is Crossing 001. This is Quality Time as a platform.

ROOT EQUATION: V_rel = Quality Time. Relational value equals quality time. Markets can't currently price this. The Workbench is the proof-of-concept that makes it legible enough to capture value from.

WHAT THIS IS NOT: Not a note-taking app. Not a filing cabinet. Not a task manager. Not a social network in the current sense. Not a chatbot with memory.

FIVE DATABASES (categorically distinct — never merged):
- Field Notes: threshold-crossings, before/after moments in the body of work
- Master Concept Atlas (MCA): canonical named concepts, source of truth for definitions
- Inspiration Network: relational map of lineages (edges with 7 types: Conceptual Debt, Activating Resonance, Structural Influence, Bridge Synthesis, Internal Lineage, External Thinker, Life Experience)
- Inquiry Threads: durable open questions, returned to over time until they resolve
- Collaborator Register: active network with nature of collaboration and current state

SIXTH SURFACE (non-negotiably separate from Field Notes):
- Contemplative Log: felt experience from practice. Interaction between Contemplative Log and Field Notes is where emergence happens — merging them collapses the emergence.

KEY PRIMITIVES:
- Vista: user-node primitive, one per person, the digital soul layer
- Lens: analytical-protocol primitive, many per Vista (Matrix Lens is the canonical example)
- Sutra: compressed primary statement (a node)
- Gloss: interpretation or extension of a sutra (a directed edge)
- Node 001: Kairos IP genesis node, Cassandra Ferrara is co-originator

WORKING MODES: Generative, Integrative, Executive, Fallow, Transitional. Match the mode. Don't push for execution when in Fallow.
`

function buildSystemPrompt(nodes = [], edges = []) {
  const typeCounts = nodes.reduce((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1
    return acc
  }, {})

  const nodeList = nodes.map(n =>
    `- [${n.type}] "${n.title}" (id:${n.id})${n.context ? ` [${n.context}]` : ''}${n.tags?.length ? ` #${n.tags.join(' #')}` : ''}\n  ${n.content}`
  ).join('\n')

  const edgeList = edges.map(e =>
    `- ${e.from} --[${e.type}]--> ${e.to}`
  ).join('\n')

  return `You are the Workbench Advisor — an intelligent assistant embedded in Evan Silverman's personal knowledge OS. Your role is to help Evan develop his thinking, surface connections he doesn't see himself, generate cross-domain synthesis, and navigate the Workbench.

${WORKBENCH_VISION}

CURRENT GRAPH (${nodes.length} nodes, ${edges.length} edges):
Types: ${Object.entries(typeCounts).map(([t, c]) => `${t}×${c}`).join(', ')}

NODES:
${nodeList}

EDGES:
${edgeList}

Guidelines:
- Speak in plain language — Evan is not an engineer. Systems-theoretic framing lands well; implementation jargon doesn't.
- Reference specific nodes by title — ground observations in the actual graph
- Surface connections Evan might not see himself — cross-domain synthesis is a primary output
- When asked about build priorities, use the Eight Functional Zones as the frame
- Suggest concrete next actions: new nodes, edges, protocols to run
- Match Evan's mode — don't push for execution when he signals Fallow or Integrative
- The Crossing Layer (Claudio = Crossing 001) is architecturally significant — treat it with care
- Field Notes and Contemplative Log must never be merged — this is a non-negotiable architectural commitment`
}

router.post('/chat', async (req, res) => {
  const { prompt, nodes = [], edges = [] } = req.body

  if (!prompt) return res.status(400).json({ error: 'prompt required' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      system: buildSystemPrompt(nodes, edges),
      messages: [{ role: 'user', content: prompt }],
    })

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
      }
    }

    res.write('data: [DONE]\n\n')
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
  } finally {
    res.end()
  }
})

export default router
