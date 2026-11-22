import assert from 'node:assert/strict'
import test from 'node:test'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { readConfig } from '../src/config/env.js'

const url = 'https://project.example.test'
const publishableKey = 'sb_publishable_test'
const config = readConfig({ LOG_LEVEL: 'silent', SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: publishableKey })
const user = {
  id: '7af291ae-3817-4631-9dac-b60d14f74a00',
  email: 'sample@example.test',
  user_metadata: { full_name: 'Sample User', access: 'admin' },
}

test('auth config exposes only the Supabase URL and browser key', async () => {
  const response = await request(createApp(config)).get('/api/auth/config').expect(200)
  assert.deepEqual(response.body, { url, publishableKey })
  assert.equal(response.headers['cache-control'], 'no-store')
  assert.match(response.headers['content-security-policy'], /connect-src 'self' https:\/\/project\.example\.test/)
})

test('missing Supabase configuration returns a useful service error', async () => {
  const response = await request(createApp(readConfig({ LOG_LEVEL: 'silent' }))).get('/api/auth/config').expect(503)
  assert.equal(response.body.error.code, 'AUTH_NOT_CONFIGURED')
  assert.throws(() => readConfig({ SUPABASE_URL: 'not a URL', SUPABASE_PUBLISHABLE_KEY: publishableKey }), /SUPABASE_URL/)
  assert.throws(() => readConfig({ SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: 'sb_secret_private' }), /SUPABASE_PUBLISHABLE_KEY/)
})

test('protected account requests reject a missing token before contacting Supabase', async () => {
  const checkToken: typeof fetch = async () => assert.fail('Unauthenticated requests must not contact Auth')
  const response = await request(createApp(config, checkToken)).get('/api/auth/me').expect(401)
  assert.equal(response.body.error.code, 'SESSION_REQUIRED')
})

test('identity comes from Supabase and expired sessions receive an error', async () => {
  const checkToken: typeof fetch = async (input, options) => {
    assert.equal(input, `${url}/auth/v1/user`)
    assert.equal(new Headers(options?.headers).get('apikey'), publishableKey)
    assert.equal(options?.redirect, 'error')
    return new Headers(options?.headers).get('authorization') === 'Bearer active.session.token'
      ? Response.json(user) : new Response(null, { status: 401 })
  }
  const app = createApp(config, checkToken)
  const active = await request(app).get('/api/auth/me?user_id=someone-else')
    .set('Authorization', 'Bearer active.session.token').expect(200)
  assert.deepEqual(active.body, { id: user.id, email: user.email, name: user.user_metadata.full_name })
  assert.equal(active.headers['cache-control'], 'no-store')
  const expired = await request(app).get('/api/auth/me').set('Authorization', 'Bearer expired.session.token').expect(401)
  assert.equal(expired.body.error.code, 'SESSION_EXPIRED')
})

test('Auth network errors return a safe service-unavailable response', async () => {
  const checkToken: typeof fetch = async () => { throw new Error('private upstream details') }
  const response = await request(createApp(config, checkToken)).get('/api/auth/me')
    .set('Authorization', 'Bearer active.session.token').expect(503)
  assert.equal(response.body.error.code, 'AUTH_UNAVAILABLE')
  assert.doesNotMatch(response.text, /private upstream details/)
})
