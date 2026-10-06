import { createContext } from 'react'

export interface AuthState {
  loading: boolean
  userId: string | null
  email: string | null
  role: string | null
}

export const AuthContext = createContext<AuthState>({
  loading: true,
  userId: null,
  email: null,
  role: null,
})
