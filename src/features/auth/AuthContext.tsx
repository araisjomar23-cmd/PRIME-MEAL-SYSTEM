import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import { getAdminRole } from './authService'
import { AuthContext } from './authContext'
import type { AuthState } from './authContext'

async function resolveRole(userId: string): Promise<string | null> {
  const staffRole = await getAdminRole(userId)
  if (staffRole) return staffRole

  const { data, error } = await supabase
    .from('participants')
    .select('id')
    .eq('user_uuid', userId)
    .maybeSingle()
    
  if (!error && data) return 'participant'
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ loading: true, userId: null, email: null, role: null })

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      const session = data.session
      if (session?.user) {
        const role = await resolveRole(session.user.id)
        setState({ loading: false, userId: session.user.id, email: session.user.email ?? null, role })
      } else {
        setState({ loading: false, userId: null, email: null, role: null })
      }
    }
    init()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const role = await resolveRole(session.user.id)
        setState({ loading: false, userId: session.user.id, email: session.user.email ?? null, role })
      } else {
        setState({ loading: false, userId: null, email: null, role: null })
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}
