// Local JSON persistence. The only file that knows about storage shape —
// swap these functions for Notion / Fireflies adapters later.

import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STORE_PATH = path.join(__dirname, 'data', 'store.json')

async function readStore() {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch (e) {
    if (e.code === 'ENOENT') return { sessions: [] }
    throw e
  }
}

async function writeStore(data) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true })
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2))
}

export async function saveSession(record) {
  const data = await readStore()
  const session = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...record,
  }
  data.sessions.unshift(session)
  await writeStore(data)
  return session
}

export async function listSessions() {
  const data = await readStore()
  return data.sessions
}

export async function getSession(id) {
  const data = await readStore()
  return data.sessions.find(s => s.id === id) || null
}
