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
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { isSupabaseEnabled } from '@/lib/data/config'
import { DEMO_PROFESSIONAL_ID } from '@/lib/auth/constants'
import { GUEST_USER, type AppUser } from '@/lib/auth/types'

type AuthContextValue = {
  user: AppUser
  isLoading: boolean
  isSupabase: boolean
  signInWithEmail: (email: string, password: string) => Promise<string | null>
  signUpWithEmail: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<string | null>
  signInAnonymously: () => Promise<string | null>
  signInWithGoogle: () => Promise<string | null>
  claimProfessionalProfile: (professionalId: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapSupabaseUser(sbUser: {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
  is_anonymous?: boolean
}): AppUser {
  const meta = sbUser.user_metadata ?? {}
  return {
    id: sbUser.id,
    email: sbUser.email ?? (sbUser.is_anonymous ? 'אורח' : ''),
    fullName:
      (meta.full_name as string) ||
      (meta.fullName as string) ||
      (sbUser.is_anonymous ? 'אורח' : 'משתמש'),
    phone: (meta.phone as string) || undefined,
    avatarUrl: (meta.avatar_url as string) || undefined,
    location: (meta.location as string) || 'תל אביב-יפו',
    role: (meta.role as AppUser['role']) || 'customer',
    professionalId: (meta.professional_id as string) || undefined,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser>(GUEST_USER)
  const [isLoading, setIsLoading] = useState(true)

  const getClient = useCallback(() => createBrowserSupabaseClient(), [])

  const applySession = useCallback(async () => {
    const supabase = getClient()
    if (!supabase) {
      setUser(GUEST_USER)
      setIsLoading(false)
      return
    }

    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      setUser(mapSupabaseUser(data.session.user))
    } else if (isSupabaseEnabled()) {
      const { data: anon, error } = await supabase.auth.signInAnonymously()
      if (!error && anon.user) {
        setUser(mapSupabaseUser(anon.user))
      } else {
        setUser(GUEST_USER)
      }
    }
    setIsLoading(false)
  }, [getClient])

  useEffect(() => {
    applySession()

    const supabase = getClient()
    if (!supabase) return

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user))
      } else {
        setUser(GUEST_USER)
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [applySession, getClient])

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const supabase = getClient()
      if (!supabase) return 'Supabase לא מוגדר'
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return error?.message ?? null
    },
    [getClient]
  )

  const signUpWithEmail = useCallback(
    async (email: string, password: string, fullName: string) => {
      const supabase = getClient()
      if (!supabase) return 'Supabase לא מוגדר'
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: 'customer' },
        },
      })
      return error?.message ?? null
    },
    [getClient]
  )

  const signInAnonymously = useCallback(async () => {
    const supabase = getClient()
    if (!supabase) return 'Supabase לא מוגדר'
    const { error } = await supabase.auth.signInAnonymously()
    return error?.message ?? null
  }, [getClient])

  const signInWithGoogle = useCallback(async () => {
    const supabase = getClient()
    if (!supabase) return 'Supabase לא מוגדר'
    const origin =
      typeof window !== 'undefined' ? window.location.origin : ''
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })
    return error?.message ?? null
  }, [getClient])

  const claimProfessionalProfile = useCallback(async (professionalId: string) => {
    const res = await fetch('/api/pro/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ professionalId }),
    })
    const json = await res.json()
    if (!res.ok) return json.error || 'שגיאה'

    const supabase = getClient()
    if (supabase) {
      const { data } = await supabase.auth.getUser()
      if (data.user) setUser(mapSupabaseUser(data.user))
    }
    return null
  }, [getClient])

  const signOut = useCallback(async () => {
    const supabase = getClient()
    if (supabase) {
      await supabase.auth.signOut()
      await supabase.auth.signInAnonymously()
      const { data } = await supabase.auth.getUser()
      if (data.user) setUser(mapSupabaseUser(data.user))
      else setUser(GUEST_USER)
    } else {
      setUser(GUEST_USER)
    }
  }, [getClient])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isSupabase: isSupabaseEnabled(),
      signInWithEmail,
      signUpWithEmail,
      signInAnonymously,
      signInWithGoogle,
      claimProfessionalProfile,
      signOut,
    }),
    [
      user,
      isLoading,
      signInWithEmail,
      signUpWithEmail,
      signInAnonymously,
      signInWithGoogle,
      claimProfessionalProfile,
      signOut,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { DEMO_PROFESSIONAL_ID }
