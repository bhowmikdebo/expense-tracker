import { randomUUID } from 'node:crypto'
import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import pino from 'pino'
import { pinoHttp } from 'pino-http'
import type { Config } from './config/env.js'
import { handleError, HttpError, notFound } from './middleware/errors.js'
import { createAuthRouter } from './routes/auth.js'
import { createClientRouter } from './routes/client.js'
import { healthRouter } from './routes/health.js'

export function createApp(config: Config, request: typeof fetch = fetch) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', config.TRUST_PROXY_HOPS || false)

  app.use(pinoHttp({
    logger: pino({ level: config.LOG_LEVEL }),
    genReqId: (_req, res) => {
      const id = randomUUID()
      res.setHeader('X-Request-Id', id)
      return id
    },
    serializers: {
      req: (req) => ({ id: req.id, method: req.method }),
      res: (res) => ({ statusCode: res.statusCode }),
      err: (err) => ({ type: err.type }),
    },
    quietReqLogger: true,
  }))
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        connectSrc: ["'self'", ...(config.SUPABASE_URL ? [config.SUPABASE_URL] : [])],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
  }))
  app.use(cors({
    origin: (origin, done) => {
      if (!origin) return done(null, false)
      if (config.CLIENT_ORIGINS.includes(origin)) return done(null, true)
      done(new HttpError(403, 'ORIGIN_DENIED', 'This origin cannot access the API.'))
    },
    methods: ['GET', 'HEAD', 'OPTIONS'],
  }))
  const limiter = rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new HttpError(429, 'RATE_LIMIT', 'Too many requests. Try again in a minute.')),
  })
  app.use('/api', healthRouter)
  app.use('/api', limiter, express.json({ limit: '32kb' }))
  app.use('/api/auth', createAuthRouter(config, request))
  app.use('/api', notFound)
  if (config.SERVE_CLIENT) app.use(createClientRouter())
  app.use(notFound)
  app.use(handleError)
  return app
}
