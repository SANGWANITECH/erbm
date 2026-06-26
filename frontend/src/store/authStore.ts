import { create } from 'zustand'

interface AuthState {
  token: string | null
  name: string | null
  role: string | null
  setAuth: (token: string, name: string, role: string) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('erbm_token'),
  name: localStorage.getItem('erbm_name'),
  role: localStorage.getItem('erbm_role'),

  setAuth: (token, name, role) => {
    localStorage.setItem('erbm_token', token)
    localStorage.setItem('erbm_name', name)
    localStorage.setItem('erbm_role', role)
    set({ token, name, role })
  },

  logout: () => {
    localStorage.removeItem('erbm_token')
    localStorage.removeItem('erbm_name')
    localStorage.removeItem('erbm_role')
    set({ token: null, name: null, role: null })
  },

  isAuthenticated: () => !!get().token,
}))
