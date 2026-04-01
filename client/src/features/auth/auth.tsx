import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Info, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'
import { Brand, ThemeToggle } from '@/components/brand'
import { Button } from '@/components/ui/button'
import '@/styles/auth.css'

type Mode = 'login' | 'register' | 'forgot' | 'reset'

const content = {
  login: { title: 'Welcome back', subtitle: 'Sign in to your LumaLedger workspace.', action: 'Sign in' },
  register: { title: 'Create your account', subtitle: 'Put your spending, budgets, and goals in one place.', action: 'Create account' },
  forgot: { title: 'Reset your password', subtitle: 'Enter the email associated with your LumaLedger account.', action: 'Send reset link' },
  reset: { title: 'Choose a new password', subtitle: 'Use at least eight characters for your new password.', action: 'Update password' },
}

function authSchema(mode: Mode) {
  return z.object({
    name: mode === 'register' ? z.string().trim().min(2, 'Enter at least two characters.').max(80) : z.string(),
    email: mode !== 'reset' ? z.email('Enter a valid email address.') : z.string(),
    password: mode === 'forgot' ? z.string() : z.string().min(mode === 'login' ? 1 : 8, mode === 'login' ? 'Enter your password.' : 'Use at least eight characters.').max(256),
  })
}

function AuthForm({ mode }: { mode: Mode }) {
  const [showPassword, setShowPassword] = useState(false)
  const [previewMessage, setPreviewMessage] = useState(false)
  const { register, handleSubmit, resetField, formState: { errors } } = useForm({
    resolver: zodResolver(authSchema(mode)),
    defaultValues: { name: '', email: '', password: '' },
  })
  const { title, subtitle, action } = content[mode]
  const hasPassword = mode !== 'forgot'
  return (
    <div className="auth-card">
      <div className="feature-icon"><LockKeyhole size={22} /></div>
      <h1>{title}</h1><p className="auth-subtitle">{subtitle}</p>
      <div className="auth-preview"><Info size={17} /><span>Preview only. Use example details to test the form. Live authentication arrives in Phase 2.</span></div>
      <form onSubmit={handleSubmit(() => {
        resetField('password')
        setShowPassword(false)
        setPreviewMessage(true)
      })} noValidate>
        {mode === 'register' && <label className="field">Full name
          <input {...register('name')} autoComplete="off" placeholder="Alex Morgan" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'auth-name-error' : undefined} />
          {errors.name && <small id="auth-name-error" className="field-error">{errors.name.message}</small>}
        </label>}
        {mode !== 'reset' && <label className="field">Email address
          <input {...register('email')} type="email" autoComplete="off" placeholder="alex@example.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'auth-email-error' : undefined} />
          {errors.email && <small id="auth-email-error" className="field-error">{errors.email.message}</small>}
        </label>}
        {hasPassword && <div className="field">
          <div className="auth-label"><label htmlFor="auth-password">Password</label>{mode === 'login' && <Link to="/forgot-password">Forgot password?</Link>}</div>
          <div className="password-wrap">
            <input {...register('password')} id="auth-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder={mode === 'login' ? 'Example password' : 'At least eight characters'} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'auth-password-error' : undefined} />
            <Button size="icon" variant="ghost" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </Button>
          </div>
          {errors.password && <small id="auth-password-error" className="field-error">{errors.password.message}</small>}
        </div>}
        <Button type="submit" size="lg" className="auth-submit">{action}</Button>
        {previewMessage && <div className="auth-preview" role="status"><Info size={17} /><span>Form checked. This preview does not send or save credentials.</span></div>}
      </form>
      <p className="auth-switch">
        {mode === 'register' && <>Already have an account? <Link to="/login">Sign in</Link></>}
        {mode === 'login' && <>New to LumaLedger? <Link to="/register">Create an account</Link></>}
        {(mode === 'forgot' || mode === 'reset') && <Link to="/login">Back to sign in</Link>}
      </p>
    </div>
  )
}

export default function Auth({ mode }: { mode: Mode }) {
  return (
    <main className="auth-layout">
      <section className="auth-page">
        <header className="auth-header"><Brand /><ThemeToggle /></header>
        <AuthForm key={mode} mode={mode} />
        <footer className="auth-footer"><Link to="/demo">Explore the dashboard preview</Link></footer>
      </section>
      <aside className="auth-visual" aria-label="LumaLedger overview">
        <div className="auth-orbit" aria-hidden="true"><i /><i /><i /><img src="/luma.svg" alt="" /></div>
        <div className="auth-visual-copy"><h2>Give every rupee a place.</h2><p>Track what you earn, where you spend, and what you’re saving toward.</p></div>
      </aside>
    </main>
  )
}
