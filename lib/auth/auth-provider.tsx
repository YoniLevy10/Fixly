'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { isSupabaseEnabled } from '@/lib/data/config'
import { DEMO_PRO_USER, GUEST_USER, type AppUser } from '@/lib/auth/types'

type AuthContextValue = {
  user: AppUser
  isLoading: boolean
  isSupabase: boolean
  signInAsGuest: () => void
  signInAsDemoPro: () => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapSupabaseUser(
  sbUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }
): AppUser {
  const meta = sbUser.user_metadata ?? {}
  return {
    id: sbUser.id,
    email: sbUser.email ?? '',
    fullName: (meta.full_name as string) || (meta.fullName as string) || 'משתמש',
    phone: (meta.phone as string) || undefined,
    avatarUrl: (meta.avatar_url as string) || undefined,
    location: (meta.location as string) || undefined,
    role: (meta.role as AppUser['role']) || 'customer',
    professionalId: (meta.professional_id as string) || undefined,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser>(GUEST_USER)
  const [isLoading, setIsLoading] = useState(isSupabaseEnabled())

  const loadSession = useCallback(async () => {
    if (!isSupabaseEnabled()) {
      setIsLoading(false)
      return
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      setIsLoading(false)
      return
    }

    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      setUser(mapSupabaseUser(data.session.user))
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadSession()

    const supabase = getSupabaseClient()
    if (!supabase) return

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user))
      } else {
        setUser(GUEST_USER)
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [loadSession])

  const signInAsGuest = useCallback(() => setUser(GUEST_USER), [])
  const signInAsDemoPro = useCallback(() => setUser(DEMO_PRO_USER), [])

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
    setUser(GUEST_USER)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isSupabase: isSupabaseEnabled(),
      signInAsGuest,
      signInAsDemoPro,
      signOut,
    }),
    [user, isLoading, signInAsGuest, signInAsDemoPro, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
