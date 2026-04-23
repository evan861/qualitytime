import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import storeRouter  from './routes/store.js'
import claudeRouter from './routes/claude.js'

const __dir = dirname(fileURLToPath(import.meta.url))
const PORT  = process.env.PORT || 3001

const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json({ limit: '2mb' }))

app.use('/api/store',  storeRouter)
app.use('/api/claude', claudeRouter)

// Serve built frontend in production
const dist = join(__dir, '..', 'dist')
app.use(express.static(dist))
app.get('*', (_req, res) => res.sendFile(join(dist, 'index.html')))

app.listen(PORT, () => {
  console.log(`Workbench backend running on http://localhost:${PORT}`)
})
