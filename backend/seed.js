import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_FILE = join(__dirname, '..', 'data', 'workbench.json')

export function seedData() {
  if (existsSync(DATA_FILE)) {
    try {
      return JSON.parse(readFileSync(DATA_FILE, 'utf8'))
    } catch {
      // fall through to minimal seed
    }
  }

  // Minimal fallback if JSON file is missing
  const now = Date.now()
  return {
    nodes: [
      {
        id: 'n-evan',
        type: 'person',
        title: 'Evan',
        content: 'Primary user. The apparatus proves itself from the inside out.',
        context: 'self',
        tags: ['user'],
        createdAt: now,
      },
    ],
    edges: [],
    activeSession: { startedAt: now, liveThreads: [] },
  }
}
