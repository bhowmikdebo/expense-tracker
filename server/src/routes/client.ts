import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import express, { Router } from 'express'

export function createClientRouter() {
  const directory = fileURLToPath(new URL('../../../client/dist/', import.meta.url))
  const index = fileURLToPath(new URL('../../../client/dist/index.html', import.meta.url))
  if (!existsSync(index)) throw new Error('Run the client build before setting SERVE_CLIENT=true.')

  const router = Router()
  router.use(express.static(directory, { index: false, redirect: false, dotfiles: 'ignore' }))
  router.get('/{*path}', (req, res, next) => {
    if (!req.accepts('html') || req.path.startsWith('/assets/')) return next()
    res.set('Cache-Control', 'no-cache').sendFile(index)
  })
  return router
}
