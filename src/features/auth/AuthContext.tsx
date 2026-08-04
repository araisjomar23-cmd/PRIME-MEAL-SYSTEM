import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import { getAdminRole } from './authService'

interface AuthState {
  loading: boolean
  userId: string | null
  email: string | null
  role: string | null
}

const AuthContext = createContext<AuthState>({
  loading: true,
  userId: null,
  email: null,
  role: null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    loading: true,
    userId: null,
    email: null,
    role: null,
  })

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      const session = data.session
      if (session?.user) {
        const role = await getAdminRole(session.user.id)
        setState({ loading: false, userId: session.user.id, email: session.user.email ?? null, role })
      } else {
        setState({ loading: false, userId: null, email: null, role: null })
      }
    }
    init()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const role = await getAdminRole(session.user.id)
        setState({ loading: false, userId: session.user.id, email: session.user.email ?? null, role })
      } else {
        setState({ loading: false, userId: null, email: null, role: null })
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}