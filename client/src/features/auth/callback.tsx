import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { AuthLayout } from './layout'
import { useAuth } from './session'

function Confirmation({ recovery }: { recovery: boolean }) {
  const [params] = useSearchParams()
  const { client, pending, retry, setRecovery } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState(false)
  const code = params.get('code')
  const tokenHash = params.get('token_hash')
  const tokenType = params.get('type')
  const expectedType = recovery ? 'recovery' : 'email'
  const validLink = !params.has('error') && (code || (tokenHash && tokenType === expectedType))

  async function confirm() {
    if (!client || !validLink || busy) return
    setBusy(true)
    let recoveryUserId: string | undefined
    const { data: { subscription } } = client.auth.onAuthStateChange((event, current) => {
      if (event === 'PASSWORD_RECOVERY') recoveryUserId = current?.user.id
    })
    try {
      if (code) {
        const { data, error } = await client.auth.exchangeCodeForSession(code)
        if (error || !data.session || (recoveryUserId === data.session.user.id) !== recovery) throw new Error('Invalid confirmation')
      } else if (tokenHash) {
        const { data, error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: expectedType })
        if (error || !data.session) throw new Error('Invalid confirmation')
      }
      setRecovery(recovery)
      navigate(recovery ? '/reset-password' : '/app', { replace: true })
    } catch {
      setFailure(true)
    } finally {
      subscription.unsubscribe()
      setBusy(false)
    }
  }

  return <>
    <h1>{recovery ? 'Verify your password reset' : 'Confirm your email'}</h1>
    {pending ? <p role="status" className="auth-subtitle">Connecting to account services…</p>
      : !client ? <div><p className="auth-subtitle" role="alert">Account services are unavailable.</p><Button onClick={retry}>Reconnect</Button></div>
        : !validLink || failure ? <>
          <p className="auth-subtitle" role="alert">This link couldn’t be verified. It may have expired or been opened in a different browser. Request a fresh link and open it in the same browser.</p>
          <Button asChild><Link to={recovery ? '/forgot-password' : '/register'}>{recovery ? 'Request a reset link' : 'Return to signup'}</Link></Button>
        </> : <>
          <p className="auth-subtitle">{recovery ? 'Continue to choose a new password for your account.' : 'Verify this address to open your LumaLedger account.'}</p>
          <Button onClick={confirm} disabled={busy}>{busy ? 'Verifying…' : recovery ? 'Continue to reset password' : 'Confirm email address'}</Button>
        </>}
  </>
}

export default function AuthCallback({ recovery }: { recovery: boolean }) {
  return <AuthLayout><Confirmation key={String(recovery)} recovery={recovery} /></AuthLayout>
}
