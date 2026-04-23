// Seed data for first-run backend init.
// Mirrors the frontend store.js seed so the app has demo content on first launch.

const now = Date.now()
const D = 86_400_000

export function seedData() {
  return {
    nodes: [
      { id: 'n-evan',    type: 'person',   title: 'Evan',                               content: 'Primary user. Not just using the system — discovering what it should be by using it.',                                                                                 context: 'self',          tags: ['user'],                         createdAt: now - D * 30 },
      { id: 'n-claudio', type: 'person',   title: 'Claudio',                            content: 'Collaborator. Brings systems thinking and philosophical rigor.',                                                                                                         context: 'collaborator',  tags: ['collaborator', 'philosophy'],    createdAt: now - D * 20 },
      { id: 'n1',        type: 'idea',     title: 'Relational Ontology',                content: 'Everything that exists does so in relation. Identity is not intrinsic but emergent from the web of connections a thing participates in.',                                context: 'foundation',    tags: ['philosophy', 'emergence'],       createdAt: now - D * 14 },
      { id: 'n2',        type: 'moment',   title: 'Morning walk — April 2',             content: 'Long walk, no phone. The city felt alive. Thought about how ecosystems and cities mirror each other at every scale.',                                                    context: 'physical',      tags: ['walk', 'observation'],           createdAt: now - D * 12 },
      { id: 'n3',        type: 'artifact', title: 'Field Note: Emergence vs Structure', content: 'The tension between emergent order and designed structure. Neither wins — the interesting territory is the boundary between them.',                                      context: 'draft',         tags: ['emergence', 'design'],           createdAt: now - D * 11 },
      { id: 'n4',        type: 'idea',     title: 'The Residual',                       content: 'What remains when the explicit content of a conversation is removed. Not extractable by summarization.',                                                                 context: 'recurring',     tags: ['cognition', 'conversation'],     createdAt: now - D * 10 },
      { id: 'n5',        type: 'artifact', title: 'Essay Draft: The Residual',          content: 'Working through what the Residual is, why it resists capture, and what it implies for knowledge system design. Current draft: 1,200 words.',                           context: 'in-progress',   tags: ['essay', 'knowledge'],            createdAt: now - D * 8  },
      { id: 'n6',        type: 'moment',   title: 'Conversation with Claudio',          content: 'Two hours. Covered systems thinking, the Residual, and attribution in collaborative intellectual work.',                                                                 context: 'collaborative', tags: ['conversation', 'collaboration'],  createdAt: now - D * 7  },
      { id: 'n7',        type: 'artifact', title: 'Voice Memo: Systems Thinking',       content: 'Post-conversation recording. The Residual is what makes conversation irreducible — you cannot replay and get the same understanding.',                                  context: 'capture',       tags: ['systems', 'voice'],              createdAt: now - D * 6  },
      { id: 'n8',        type: 'idea',     title: 'Coherence as Navigation',            content: 'Coherence is not a state to achieve but a direction to move toward. Orienting, not arriving.',                                                                          context: 'design',        tags: ['coherence', 'navigation'],       createdAt: now - D * 5  },
      { id: 'n9',        type: 'artifact', title: 'Protocol: Field Note System',        content: 'Filing protocol for any artifact entering the graph. Requires: source moment, expressed idea, context tag, at least one edge.',                                         context: 'protocol',      tags: ['protocol', 'filing'],            createdAt: now - D * 4  },
      { id: 'n10',       type: 'moment',   title: 'Session: Workbench architecture',    content: 'Three-hour design session. Settled on five-layer architecture, seven node types, fourteen edge types.',                                                                  context: 'design',        tags: ['architecture', 'session'],       createdAt: now - D * 2  },
      { id: 'n11',       type: 'idea',     title: 'Placement as Generative Act',        content: 'The moment of deciding where something goes should feel meaningful. When the user places something, the system should respond.',                                         context: 'design',        tags: ['design', 'pedagogy'],            createdAt: now - D * 1  },
    ],
    edges: [
      { id: 'e1',  from: 'n3',        to: 'n2',        type: 'EMERGED_FROM',    createdAt: now - D * 11 },
      { id: 'e2',  from: 'n7',        to: 'n6',        type: 'EMERGED_FROM',    createdAt: now - D * 6  },
      { id: 'e3',  from: 'n3',        to: 'n1',        type: 'EXPRESSES',       createdAt: now - D * 11 },
      { id: 'e4',  from: 'n5',        to: 'n4',        type: 'EXPRESSES',       createdAt: now - D * 8  },
      { id: 'e5',  from: 'n7',        to: 'n4',        type: 'EXPRESSES',       createdAt: now - D * 6  },
      { id: 'e6',  from: 'n3',        to: 'n5',        type: 'EVOLVES_INTO',    createdAt: now - D * 8  },
      { id: 'e7',  from: 'n4',        to: 'n1',        type: 'REFINES',         createdAt: now - D * 5  },
      { id: 'e8',  from: 'n8',        to: 'n1',        type: 'DESCENDED_FROM',  createdAt: now - D * 5  },
      { id: 'e9',  from: 'n11',       to: 'n8',        type: 'REFINES',         createdAt: now - D * 1  },
      { id: 'e10', from: 'n4',        to: 'n6',        type: 'RECOGNIZED_IN',   createdAt: now - D * 7  },
      { id: 'e11', from: 'n8',        to: 'n10',       type: 'RECOGNIZED_IN',   createdAt: now - D * 2  },
      { id: 'e12', from: 'n3',        to: 'n-evan',    type: 'CREATED_BY',      createdAt: now - D * 11 },
      { id: 'e13', from: 'n5',        to: 'n-evan',    type: 'CREATED_BY',      createdAt: now - D * 8  },
      { id: 'e14', from: 'n7',        to: 'n-evan',    type: 'CREATED_BY',      createdAt: now - D * 6  },
      { id: 'e15', from: 'n-claudio', to: 'n6',        type: 'PARTICIPATED_IN', createdAt: now - D * 7  },
      { id: 'e16', from: 'n-evan',    to: 'n6',        type: 'PARTICIPATED_IN', createdAt: now - D * 7  },
      { id: 'e17', from: 'n-evan',    to: 'n2',        type: 'PARTICIPATED_IN', createdAt: now - D * 12 },
      { id: 'e18', from: 'n8',        to: 'n6',        type: 'INSPIRED_BY',     createdAt: now - D * 7  },
      { id: 'e19', from: 'n9',        to: 'n-evan',    type: 'CREATED_BY',      createdAt: now - D * 4  },
      { id: 'e20', from: 'n10',       to: 'n-evan',    type: 'PARTICIPATED_IN', createdAt: now - D * 2  },
    ],
    activeSession: {
      startedAt: Date.now(),
      liveThreads: ['The Residual', 'Coherence as Navigation', 'Placement as Generative Act'],
    },
  }
}
