import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MODEL = process.env.CLAUDE_USE_CHEAP === 'true'
  ? 'claude-haiku-4-5-20251001'
  : 'claude-sonnet-4-20250514'

export async function callClaude(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  maxTokens = 2048
): Promise<string> {
  let attempt = 0
  while (attempt < 4) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages,
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
