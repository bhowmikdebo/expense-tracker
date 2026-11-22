import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useState } from 'react'
import { Outlet } from 'react-router'
import { z } from 'zod'
import { apiUrl } from '@/lib/api'

const configSchema = z.object({ url: z.url(), publishableKey: z.string().regex(/^sb_publishable_[\w-]+$/) })
type AuthConfig = z.infer<typeof configSchema>

type AuthState = {
  client: SupabaseClient | null
  session: Session | null
  pending: boolean
  recovery: boolean
  setRecovery: (active: boolean) => void
  retry: () => void
}

const AuthContext = createContext<AuthState | null>(null)
let authClient: SupabaseClient | undefined

async function readAuthConfig(signal: AbortSignal) {
  const response = await fetch(apiUrl('/api/auth/config'), { signal: AbortSignal.any([signal, AbortSignal.timeout(9000)]) })
  if (!response.ok) throw new Error('Account service unavailable')
  return configSchema.parse(await response.json())
}

function SessionProvider({ config, retry }: { config: AuthConfig; retry: () => void }) {
  const [client] = useState(() => {
    authClient ??= createClient(config.url, config.publishableKey, {
      auth: { flowType: 'pkce', detectSessionInUrl: false, persistSession: true, autoRefreshToken: true },
    })
    return authClient
  })
  const [session, setSession] = useState<Session | null>(null)
  const [pending, setPending] = useState(true)
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = client.auth.onAuthStateChange((event, current) => {
      setSession(current)
      setPending(false)
      if (event === 'SIGNED_OUT') setRecovery(false)
    })
    return () => subscription.unsubscribe()
  }, [client])

  return <AuthContext.Provider value={{ client, session, pending, recovery, setRecovery, retry }}><Outlet /></AuthContext.Provider>
}

export function AuthRoutes() {
  const configuration = useQuery({ queryKey: ['auth-config'], queryFn: ({ signal }) => readAuthConfig(signal), staleTime: Infinity, retry: false })
  const retry = () => { void configuration.refetch() }
  if (configuration.data) return <SessionProvider config={configuration.data} retry={retry} />
  const unavailable: AuthState = { client: null, session: null, pending: configuration.isFetching, recovery: false, setRecovery: () => {}, retry }
  return <AuthContext.Provider value={unavailable}><Outlet /></AuthContext.Provider>
}

export function useAuth() {
  const state = useContext(AuthContext)
  if (!state) throw new Error('Account routes require an auth session provider.')
  return state
}
