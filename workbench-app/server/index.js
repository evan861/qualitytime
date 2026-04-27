// Workbench server. Reads .env from the workspace root.

import { config } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { chatHandler } from './chat.js'
import { listSessions, getSession } from './sessions.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
config({ path: path.resolve(__dirname, '..', '.env') })

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('\n  ANTHROPIC_API_KEY is missing from workbench-app/.env')
  console.error('  Copy .env.example to .env and add your key, then restart.\n')
  process.exit(1)
}

const PORT  = Number(process.env.PORT) || 3001
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'

const app = express()
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => {
  res.json({ ok: true, model: MODEL })
})

app.post('/api/chat', chatHandler)

app.get('/api/sessions', async (req, res) => {
  res.json(await listSessions())
})

app.get('/api/sessions/:id', async (req, res) => {
  const s = await getSession(req.params.id)
  if (!s) return res.status(404).json({ error: 'not found' })
  res.json(s)
})

app.listen(PORT, () => {
  console.log(`  Workbench server  ·  http://localhost:${PORT}`)
  console.log(`  Model             ·  ${MODEL}`)
})
