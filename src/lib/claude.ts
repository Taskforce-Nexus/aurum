import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type ModelTier = 'fast' | 'strong' | 'reasoning'

interface CallClaudeOptions {
  system: string
  messages: Array<{ role: string; content: string }>
  max_tokens?: number
  tier?: ModelTier
  model?: string  // overrides tier when provided
}

const getModel = (tier: ModelTier): string => {
  const models: Record<ModelTier, string> = {
    fast: process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',
    strong: process.env.CLAUDE_MODEL_STRONG || 'claude-sonnet-4-20250514',
    reasoning: process.env.CLAUDE_MODEL_REASONING || 'claude-opus-4-20250514',
  }
  return models[tier]
}

export async function callClaude({ system, messages, max_tokens = 2048, tier = 'fast', model: modelOverride }: CallClaudeOptions): Promise<string> {
  const model = modelOverride ?? getModel(tier)
  let attempt = 0
  while (attempt < 4) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens,
        system,
        messages: messages as Array<{ role: 'user' | 'assistant'; content: string }>,
      })
      const block = response.content[0]
      return block.type === 'text' ? block.text : ''
    } catch (err: unknown) {
      const error = err as { status?: number }
      if (error.status === 429) {
        await new Promise(r => setTimeout(r, 2 ** attempt * 1000))
        attempt++
      } else {
        throw err
      }
    }
  }
  throw new Error('Claude API: max retries exceeded')
}
