import assert from 'node:assert/strict'
import test from 'node:test'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { readConfig } from '../src/config/env.js'

const webOrigin = 'https://web.example.test'
const app = createApp(readConfig({ LOG_LEVEL: 'silent', CLIENT_ORIGINS: webOrigin }))

test('health responds with a request ID and no caching', async () => {
  const response = await request(app).get('/api/health').expect(200)
  assert.deepEqual(response.body, { status: 'ok', service: 'lumaledger-api' })
  assert.match(response.headers['x-request-id'], /^[0-9a-f-]{36}$/)
  assert.equal(response.headers['cache-control'], 'no-store')
  assert.equal(response.headers['x-content-type-options'], 'nosniff')
})

test('only configured browser origins receive CORS permission', async () => {
  await request(app).get('/api/health').set('Origin', webOrigin)
    .expect('Access-Control-Allow-Origin', webOrigin).expect(200)
  const denied = await request(app).get('/api/health').set('Origin', 'https://other.example.test').expect(403)
  assert.equal(denied.body.error.code, 'ORIGIN_DENIED')
  assert.equal(denied.headers['access-control-allow-origin'], undefined)
})

test('Render’s provisioned origin can access the hosted API', async () => {
  const origin = 'https://preview-app.onrender.com'
  const config = readConfig({ LOG_LEVEL: 'silent', RENDER_EXTERNAL_URL: origin })
  await request(createApp(config)).get('/api/health').set('Origin', origin)
    .expect('Access-Control-Allow-Origin', origin).expect(200)
})

test('unknown routes and malformed JSON use the API error envelope', async () => {
  const missing = await request(app).get('/api/missing').expect(404)
  assert.equal(missing.body.error.code, 'NOT_FOUND')
  assert.equal(missing.body.error.requestId, missing.headers['x-request-id'])

  const invalid = await request(app).post('/api/missing').set('Content-Type', 'application/json').send('{').expect(400)
  assert.equal(invalid.body.error.code, 'INVALID_JSON')
})

test('server config rejects unsafe origins and invalid ports', () => {
  assert.throws(() => readConfig({ PORT: 'oops' }), /PORT/)
  assert.throws(() => readConfig({ CLIENT_ORIGINS: '*' }), /CLIENT_ORIGINS/)
  assert.throws(() => readConfig({ CLIENT_ORIGINS: 'https://web.example.test/a' }), /CLIENT_ORIGINS/)
})
