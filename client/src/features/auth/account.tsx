import { useQuery } from '@tanstack/react-query'
import { UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { apiUrl } from '@/lib/api'
import { AuthLayout } from './layout'
import { authMessage } from './messages'
import { useAuth } from './session'

const accountSchema = z.object({ id: z.uuid(), email: z.email(), name: z.string().nullable() })

function AccountContent() {
  const { client, session, pending, recovery, retry } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const [failure, setFailure] = useState('')
  const account = useQuery({
    queryKey: ['current-account', session?.user.id, session?.expires_at],
    enabled: !!session && !recovery,
    retry: false,
    gcTime: 0,
    queryFn: async ({ signal }) => {
      const response = await fetch(apiUrl('/api/auth/me'), {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
      })
      if (response.status === 401) return null
      if (!response.ok) throw new Error('Account service unavailable')
      return accountSchema.parse(await response.json())
    },
  })

  async function signOut() {
    if (!client) return
    setSigningOut(true)
    setFailure('')
    try {
      const { error } = await client.auth.signOut({ scope: 'local' })
      if (error) throw error
      navigate('/login', { replace: true })
    } catch (error) {
      setFailure(authMessage(error))
    } finally {
      setSigningOut(false)
    }
  }

  if (pending) return <p role="status">Checking your session…</p>
  if (!client) return <><h1>Account services are unavailable</h1><Button onClick={retry}>Reconnect</Button></>
  if (!session) return <Navigate to="/login" replace />
  if (recovery) return <Navigate to="/reset-password" replace />
  const user = account.data
  return <>
    <div className="feature-icon"><UserRound size={22} aria-hidden="true" /></div>
    <h1>{user?.name ? `Welcome, ${user.name}` : 'Your LumaLedger account'}</h1>
    {account.isPending && <p className="auth-subtitle" role="status">Verifying your account…</p>}
    {account.isError && <div><p className="auth-subtitle" role="alert">We couldn’t verify your account. Try again in a moment.</p><Button variant="outline" onClick={() => account.refetch()}>Retry verification</Button></div>}
    {user === null && <p className="auth-subtitle" role="alert">Your session expired. Sign out and then sign in again.</p>}
    {user && <>
      <p className="auth-subtitle break-all">Signed in as {user.email}</p>
      <p className="auth-subtitle">Your account is ready. The dashboard preview is available with a separate sample ledger.</p>
      <Button asChild><Link to="/demo">Open dashboard preview</Link></Button>
    </>}
    <div className="auth-actions"><Button variant="outline" onClick={signOut} disabled={signingOut}>{signingOut ? 'Signing out…' : 'Sign out'}</Button></div>
    {failure && <p role="alert" className="auth-error">{failure}</p>}
  </>
}

export default function Account() {
  return <AuthLayout><AccountContent /></AuthLayout>
}
