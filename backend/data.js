import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { seedData } from './seed.js'

const __dir = dirname(fileURLToPath(import.meta.url))
const DATA_DIR  = join(__dir, '..', 'data')
const DATA_FILE = join(DATA_DIR, 'workbench.json')

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
}

export function loadData() {
  ensureDir()
  if (!existsSync(DATA_FILE)) {
    const seed = seedData()
    writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2))
    return seed
  }
  return JSON.parse(readFileSync(DATA_FILE, 'utf8'))
}

export function saveData(data) {
  ensureDir()
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}
