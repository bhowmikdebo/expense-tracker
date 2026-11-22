import { z } from 'zod'

const origin = z.string().refine((value) => {
  const url = URL.parse(value)
  return url !== null && ['http:', 'https:'].includes(url.protocol) && url.origin === value
}, 'Use an HTTP(S) origin with no trailing slash or path')

const envSchema = z.object({
  HOST: z.string().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CLIENT_ORIGINS: z.string().default('http://localhost:5174,http://127.0.0.1:5174')
    .transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean))
    .pipe(z.array(origin).min(1)),
  RENDER_EXTERNAL_URL: z.union([z.literal(''), origin]).default(''),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),
  SERVE_CLIENT: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  SUPABASE_URL: z.union([z.literal(''), origin]).default('').refine((value) => {
    if (!value) return true
    const url = URL.parse(value)
    return url !== null && (url.protocol === 'https:' || ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname))
  }, 'Use an HTTPS Supabase origin'),
  SUPABASE_PUBLISHABLE_KEY: z.string().regex(/^(?:sb_publishable_[\w-]+)?$/).default(''),
}).refine((env) => !!env.SUPABASE_URL === !!env.SUPABASE_PUBLISHABLE_KEY, {
  path: ['SUPABASE_URL'],
  message: 'Set the Supabase URL and publishable key together',
})

export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  const result = envSchema.safeParse(env)
  if (!result.success) {
    throw new Error(`Invalid server configuration: ${result.error.issues.map((issue) => issue.path.join('.')).join(', ')}`)
  }
  return result.data
}

export type Config = ReturnType<typeof readConfig>
