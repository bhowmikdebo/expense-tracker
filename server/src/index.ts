import pino from 'pino'
import { createApp } from './app.js'
import { readConfig } from './config/env.js'

const config = readConfig()
const logger = pino({ level: config.LOG_LEVEL })
const server = createApp(config).listen(config.PORT, config.HOST, () => {
  logger.info({ host: config.HOST, port: config.PORT }, 'LumaLedger API is listening')
})

server.on('error', (error: NodeJS.ErrnoException) => {
  logger.fatal({ code: error.code }, 'API failed to listen')
  process.exitCode = 1
})

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    const deadline = setTimeout(() => server.closeAllConnections(), 10_000)
    deadline.unref()
    server.close(() => clearTimeout(deadline))
  })
}
