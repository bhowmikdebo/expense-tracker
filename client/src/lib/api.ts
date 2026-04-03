import { z } from 'zod'

const healthSchema = z.object({ status: z.literal('ok'), service: z.literal('lumaledger-api') })

export async function getApiHealth(signal: AbortSignal) {
  const origin = (import.meta.env.VITE_API_ORIGIN ?? '').replace(/\/$/, '')
  const response = await fetch(`${origin}/api/health`, { signal })
  if (!response.ok) throw new Error('The API did not respond successfully.')
  return healthSchema.parse(await response.json())
}
