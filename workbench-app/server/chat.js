// POST /api/chat — relays Anthropic's SSE stream to the client.
// On completion, persists the full exchange via sessions.saveSession.

import { SYSTEM_PROMPT } from './systemPrompt.js'
import { saveSession } from './sessions.js'

const PURSUIT_NAMES = {
  finance: 'Finance',
  qt:      'Quality Time',
  fh:      'Future HOW',
  cp:      'Contemplative / Personal',
}

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

function buildUserMessage({ intent, activePursuits = [], edgeHint = '' }) {
  const labeled = activePursuits.map(p => PURSUIT_NAMES[p]).filter(Boolean)
  const pursuitCtx = labeled.length > 0
    ? `Active pursuits: ${labeled.join(', ')}.${labeled.length > 1 && edgeHint ? '\nEdge in play: ' + edgeHint : ''}`
    : ''
  return [pursuitCtx, intent].filter(Boolean).join('\n\n')
}

export async function chatHandler(req, res) {
  const { intent = '', activePursuits = [], edgeHint = '' } = req.body || {}
  if (!intent.trim()) {
    return res.status(400).json({ error: 'intent is required' })
  }

  const userMessage = buildUserMessage({ intent, activePursuits, edgeHint })
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders?.()

  const upstreamController = new AbortController()
  req.on('close', () => upstreamController.abort())

  let upstream
  try {
    upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        stream: true,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
      signal: upstreamController.signal,
    })
  } catch (err) {
    res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`)
    return res.end()
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '')
    res.write(`event: error\ndata: ${JSON.stringify({ status: upstream.status, body: text })}\n\n`)
    return res.end()
  }

  const reader = upstream.body.getReader()
  const decoder = new TextDecoder()
  let fullText = ''
  let sseBuffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      res.write(chunk)

      // Tee a copy through an SSE parser so we can accumulate response text
      // for persistence without breaking the forwarded stream.
      sseBuffer += chunk
      const events = sseBuffer.split('\n\n')
      sseBuffer = events.pop() || ''
      for (const evt of events) {
        for (const line of evt.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (!payload) continue
          try {
            const j = JSON.parse(payload)
            if (j.type === 'content_block_delta' && j.delta?.text) {
              fullText += j.delta.text
            }
          } catch { /* ignore non-JSON keepalives */ }
        }
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`)
    }
  }

  res.end()

  if (fullText) {
    try {
      await saveSession({
        intent,
        activePursuits,
        edgeHint,
        response: fullText,
        model,
      })
    } catch (err) {
      console.error('[chat] failed to persist session:', err)
    }
  }
}
