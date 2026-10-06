import { supabase } from '../../lib/supabase'

export async function loginAdmin(email: string, password: string) {
  return await supabase.auth.signInWithPassword({ email, password })
}

// FIX: Explicitly remove the tracking flag when logging out
export async function logoutAdmin() {
  const result = await supabase.auth.signOut()
  localStorage.removeItem('cydo-remember-me') 
  return result
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getAdminRole(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_uuid', userId)
    .maybeSingle()

  if (error) {
    console.error(error)
    return null
  }

  return data?.role ?? null
}

export async function handleLogout(): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Supabase signOut error:', error.message)
      return { success: false, error: error.message }
    }

    localStorage.removeItem('cydo-remember-me')
    return { success: true, error: null }
  } catch (error) {
    console.error('Unexpected error during logout:', error)
    return { success: false, error: 'An unexpected error occurred.' }
  }
}