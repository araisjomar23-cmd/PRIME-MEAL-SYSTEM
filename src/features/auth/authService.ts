import { supabase } from '../../lib/supabase'

export async function loginAdmin(email: string, password: string) {
  return await supabase.auth.signInWithPassword({ email, password })
}

export async function logoutAdmin() {
  return await supabase.auth.signOut()
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