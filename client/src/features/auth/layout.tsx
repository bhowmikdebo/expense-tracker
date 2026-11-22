import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Brand, ThemeToggle } from '@/components/brand'
import '@/styles/auth.css'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-layout">
      <a className="skip-link" href="#account-content">Skip to account form</a>
      <section className="auth-page">
        <header className="auth-header"><Brand /><ThemeToggle /></header>
        <div className="auth-card" id="account-content" tabIndex={-1}>{children}</div>
        <footer className="auth-footer"><Link to="/demo">Explore the dashboard preview</Link></footer>
      </section>
      <aside className="auth-visual" aria-label="LumaLedger overview">
        <div className="auth-orbit" aria-hidden="true"><i /><i /><i /><img src="/luma.svg" alt="" /></div>
        <div className="auth-visual-copy"><h2>Give every rupee a place.</h2><p>Track what you earn, where you spend, and what you’re saving toward.</p></div>
      </aside>
    </main>
  )
}
