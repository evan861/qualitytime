import { Router } from 'express'
import { loadData, saveData } from '../data.js'

const router = Router()

router.get('/', (_req, res) => {
  res.json(loadData())
})

router.post('/', (req, res) => {
  const data = req.body
  if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    return res.status(400).json({ error: 'Invalid store shape' })
  }
  saveData(data)
  res.json({ ok: true })
})

export default router
