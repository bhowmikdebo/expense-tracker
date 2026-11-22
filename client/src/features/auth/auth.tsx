import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Info, LockKeyhole, MailCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { AuthLayout } from './layout'
import { authMessage } from './messages'
import { useAuth } from './session'

type Mode = 'login' | 'register' | 'forgot' | 'reset'

const content = {
  login: { title: 'Welcome back', subtitle: 'Sign in to your LumaLedger workspace.', action: 'Sign in', working: 'Signing in…' },
  register: { title: 'Create your account', subtitle: 'Start with your name and email address.', action: 'Create account', working: 'Creating account…' },
  forgot: { title: 'Reset your password', subtitle: 'Enter the email address you used for LumaLedger.', action: 'Send reset link', working: 'Sending request…' },
  reset: { title: 'Choose a new password', subtitle: 'Use at least eight characters for your new password.', action: 'Update password', working: 'Updating password…' },
}

function authSchema(mode: Mode) {
  const email = z.string().trim().max(254).pipe(z.email('Enter a valid email address.'))
  return z.object({
    name: mode === 'register' ? z.string().trim().min(1, 'Enter your name.').max(80, 'Use 80 characters or fewer.') : z.string(),
    email: mode === 'reset' ? z.string() : email,
    password: mode === 'forgot' ? z.string() : z.string().min(mode === 'login' ? 1 : 8, mode === 'login' ? 'Enter your password.' : 'Use at least eight characters.').max(256, 'Use 256 characters or fewer.'),
  })
}

const callbackUrl = (flow: 'confirm' | 'recovery') => new URL(`/auth/${flow}`, window.location.origin).href

function AuthForm({ mode }: { mode: Mode }) {
  const { client, session, pending, recovery, setRecovery, retry } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [sent, setSent] = useState(false)
  const [failure, setFailure] = useState('')
  const { register, handleSubmit, resetField, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(authSchema(mode)),
    defaultValues: { name: '', email: '', password: '' },
  })
  const { title, subtitle, action, working } = content[mode]

  if (session && recovery && mode !== 'reset') return <Navigate to="/reset-password" replace />
  if (session && mode !== 'reset' && mode !== 'forgot') return <Navigate to="/app" replace />

  if (pending) return <><h1>{title}</h1><p className="auth-preview" role="status">Connecting to account services…</p></>
  if (!client) return <>
    <h1>{title}</h1>
    <div className="auth-preview" role="alert"><Info size={17} aria-hidden="true" /><div>
      <p>Account services are unavailable. Check your connection and try again.</p>
      <Button variant="outline" size="sm" onClick={retry}>Reconnect</Button>
    </div></div>
  </>

  if (mode === 'reset' && (!session || !recovery)) return <>
    <h1>Open your reset link</h1>
    <p className="auth-subtitle">Use the link from your password reset email to choose a new password. If the link has expired, request a new one.</p>
    <Button asChild><Link to="/forgot-password">Request a new link</Link></Button>
  </>

  if (sent) return <div role="status">
    <div className="feature-icon"><MailCheck size={22} aria-hidden="true" /></div>
    <h1>Check your inbox</h1>
    <p className="auth-subtitle">{mode === 'register'
      ? 'Look for a confirmation link from LumaLedger. Already have an account? Sign in with your existing password.'
      : 'If that address belongs to an account, you’ll receive a password reset link.'}</p>
    <p className="auth-subtitle">If it doesn’t arrive, check your spam folder and verify the address you entered.</p>
    <div className="auth-actions"><Button asChild><Link to="/login">Go to sign in</Link></Button>
      <Button variant="outline" onClick={() => setSent(false)}>{mode === 'register' ? 'Try another address' : 'Try again'}</Button></div>
  </div>

  return <>
    <div className="feature-icon"><LockKeyhole size={22} aria-hidden="true" /></div>
    <h1>{title}</h1><p className="auth-subtitle">{subtitle}</p>
    <form onSubmit={handleSubmit(async ({ name, email, password }) => {
      setFailure('')
      try {
        if (mode === 'register') {
          const { data, error } = await client.auth.signUp({
            email, password, options: { data: { full_name: name }, emailRedirectTo: callbackUrl('confirm') },
          })
          if (error) throw error
          if (data.session) navigate('/app', { replace: true })
          else setSent(true)
        } else if (mode === 'login') {
          const { error } = await client.auth.signInWithPassword({ email, password })
          if (error) throw error
          navigate('/app', { replace: true })
        } else if (mode === 'forgot') {
          const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: callbackUrl('recovery') })
          if (error) throw error
          setSent(true)
        } else {
          if (!session || !recovery) return
          const { error } = await client.auth.updateUser({ password })
          if (error) throw error
          setRecovery(false)
          navigate('/app', { replace: true })
        }
        if (mode !== 'forgot') resetField('password')
        setShowPassword(false)
      } catch (error) {
        setFailure(authMessage(error))
      }
    })} noValidate aria-busy={isSubmitting}>
      {mode === 'register' && <div className="field">
        <label htmlFor="auth-name">Full name</label>
        <input {...register('name')} id="auth-name" autoComplete="name" required aria-invalid={!!errors.name} aria-describedby={errors.name ? 'auth-name-error' : undefined} />
        {errors.name && <small id="auth-name-error" className="field-error">{errors.name.message}</small>}
      </div>}
      {mode !== 'reset' && <div className="field">
        <label htmlFor="auth-email">Email address</label>
        <input {...register('email')} id="auth-email" type="email" autoComplete={mode === 'login' ? 'username' : 'email'} autoCapitalize="none" spellCheck={false} required aria-invalid={!!errors.email} aria-describedby={errors.email ? 'auth-email-error' : undefined} />
        {errors.email && <small id="auth-email-error" className="field-error">{errors.email.message}</small>}
      </div>}
      {mode !== 'forgot' && <div className="field">
        <div className="auth-label"><label htmlFor="auth-password">Password</label>{mode === 'login' && <Link to="/forgot-password">Forgot password?</Link>}</div>
        <div className="password-wrap">
          <input {...register('password')} id="auth-password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required aria-invalid={!!errors.password} aria-describedby={errors.password ? 'auth-password-error' : mode === 'register' ? 'auth-password-hint' : undefined} />
          <Button size="icon" variant="ghost" aria-controls="auth-password" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
          </Button>
        </div>
        {errors.password ? <small id="auth-password-error" className="field-error">{errors.password.message}</small>
          : mode === 'register' && <small id="auth-password-hint" className="auth-hint">Use at least eight characters.</small>}
      </div>}
      <Button type="submit" size="lg" className="auth-submit" disabled={isSubmitting}>{isSubmitting ? working : action}</Button>
      {failure && <p className="auth-preview auth-error" role="alert"><Info size={17} aria-hidden="true" />{failure}</p>}
    </form>
    <p className="auth-switch">
      {mode === 'register' && <>Already have an account? <Link to="/login">Sign in</Link></>}
      {mode === 'login' && <>New to LumaLedger? <Link to="/register">Create an account</Link></>}
      {mode === 'forgot' && <Link to="/login">Back to sign in</Link>}
    </p>
  </>
}

export default function Auth({ mode }: { mode: Mode }) {
  return <AuthLayout><AuthForm key={mode} mode={mode} /></AuthLayout>
}
