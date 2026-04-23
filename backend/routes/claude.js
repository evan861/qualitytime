import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()
const client = new Anthropic()

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

  return `You are the Workbench Advisor — an intelligent assistant embedded in a personal knowledge OS called Workbench. Your role is to help the user develop their thinking, notice patterns in their graph, surface connections, and navigate their knowledge system.

You have full access to the user's current knowledge graph:

NODE INVENTORY (${nodes.length} nodes):
Types: ${Object.entries(typeCounts).map(([t, c]) => `${t}×${c}`).join(', ')}

${nodeList}

EDGE INVENTORY (${edges.length} edges):
${edgeList}

Guidelines:
- Reference specific nodes by title when relevant — ground your observations in the graph
- Help the user see patterns, gaps, and opportunities they might have missed
- Suggest concrete next actions: new nodes to capture, edges to draw, protocols to run
- Be direct and specific — avoid vague encouragement
- Use the node types and edge types from the system naturally in your suggestions
- Keep responses focused and actionable`
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
