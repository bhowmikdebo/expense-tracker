import { Router } from 'express'
import { z } from 'zod'
import type { Config } from '../config/env.js'
import { HttpError } from '../middleware/errors.js'

const userSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  is_anonymous: z.literal(false).optional(),
  user_metadata: z.object({ full_name: z.string().trim().min(1).max(80).optional().catch(undefined) }).optional(),
})

export function createAuthRouter(config: Config, request: typeof fetch) {
  const router = Router()
  const url = config.SUPABASE_URL
  const publishableKey = config.SUPABASE_PUBLISHABLE_KEY

  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    if (!url || !publishableKey) {
      next(new HttpError(503, 'AUTH_NOT_CONFIGURED', 'Account services are not configured.'))
      return
    }
    next()
  })

  router.get('/config', (_req, res) => {
    res.json({ url, publishableKey })
  })

  router.get('/me', async (req, res) => {
    const bearer = /^Bearer ([\w.-]+)$/i.exec(req.get('Authorization') ?? '')
    if (!bearer || bearer[1].length > 8192) {
      throw new HttpError(401, 'SESSION_REQUIRED', 'Sign in to access your account.')
    }

    const unavailable = new HttpError(503, 'AUTH_UNAVAILABLE', 'The account service is temporarily unavailable.')
    let response: Response
    try {
      response = await request(`${url}/auth/v1/user`, {
        headers: { apikey: publishableKey, Authorization: `Bearer ${bearer[1]}` },
        signal: AbortSignal.timeout(8000),
        redirect: 'error',
      })
    } catch {
      throw unavailable
    }

    if (response.status === 401 || response.status === 403) {
      throw new HttpError(401, 'SESSION_EXPIRED', 'Your session has expired. Sign in again.')
    }
    if (!response.ok) throw unavailable

    const user = userSchema.safeParse(await response.json().catch(() => null))
    if (!user.success) throw new HttpError(403, 'ACCOUNT_REQUIRED', 'Sign in with an email account.')
    res.json({ id: user.data.id, email: user.data.email, name: user.data.user_metadata?.full_name ?? null })
  })

  return router
}
