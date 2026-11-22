import '@fontsource-variable/inter'
import '@/styles/index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'motion/react'
import { Component, lazy, StrictMode, Suspense, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router'
import { Toaster } from 'sonner'
import { ThemeProvider, useTheme } from './theme'
import { useEffect } from 'react'

const Landing = lazy(() => import('@/features/landing/landing'))
const Auth = lazy(() => import('@/features/auth/auth'))
const AuthRoutes = lazy(() => import('@/features/auth/session').then((module) => ({ default: module.AuthRoutes })))
const AuthCallback = lazy(() => import('@/features/auth/callback'))
const Account = lazy(() => import('@/features/auth/account'))
const Demo = lazy(() => import('@/features/demo/demo'))

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } })

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return (
      <main className="message-screen">
        <h1>Something went wrong</h1>
        <p>Reload LumaLedger to try again.</p>
        <button className="button button-primary button-md" onClick={() => window.location.reload()}>Reload</button>
      </main>
    )
    return this.props.children
  }
}

function Application() {
  const { theme } = useTheme()
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <MotionConfig reducedMotion="user">
      <ErrorBoundary>
        <Suspense fallback={<div className="loading-page" role="status" aria-label="Loading LumaLedger"><span /><span /><span /></div>}>
          <Routes>
            <Route index element={<Landing />} />
            <Route element={<AuthRoutes />}>
              <Route path="login" element={<Auth mode="login" />} />
              <Route path="register" element={<Auth mode="register" />} />
              <Route path="forgot-password" element={<Auth mode="forgot" />} />
              <Route path="reset-password" element={<Auth mode="reset" />} />
              <Route path="auth/confirm" element={<AuthCallback recovery={false} />} />
              <Route path="auth/recovery" element={<AuthCallback recovery />} />
              <Route path="app" element={<Account />} />
            </Route>
            <Route path="demo/*" element={<Demo />} />
            <Route path="*" element={<main className="message-screen"><h1>Page not found</h1><Link className="button button-primary button-md" to="/">Back to home</Link></main>} />
          </Routes>
        </Suspense>
        <Toaster theme={theme} position="bottom-right" richColors />
      </ErrorBoundary>
    </MotionConfig>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter><Application /></BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
