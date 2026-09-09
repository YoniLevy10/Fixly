'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { featureFlags } from '@/lib/feature-flags'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { isSupabaseEnabled } from '@/lib/data/config'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { DEMO_PROFESSIONAL_ID } from '@/lib/auth/constants'
import { DEMO_PRO_USER, GUEST_USER, type AppUser } from '@/lib/auth/types'

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
  switchDemoRole: (role: 'customer' | 'professional') => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapSupabaseUser(sbUser: {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
  is_anonymous?: boolean
}): AppUser {
  const meta = sbUser.user_metadata ?? {}
  const isAnonymous = Boolean(sbUser.is_anonymous)
  return {
    id: sbUser.id,
    email: sbUser.email ?? (isAnonymous ? 'אורח' : ''),
    fullName:
      (meta.full_name as string) ||
      (meta.fullName as string) ||
      (meta.name as string) ||
      (isAnonymous ? 'אורח' : 'משתמש'),
    phone: (meta.phone as string) || undefined,
    avatarUrl: (meta.avatar_url as string) || undefined,
    location: (meta.location as string) || 'תל אביב-יפו',
    role: (meta.role as AppUser['role']) || 'customer',
    professionalId: (meta.professional_id as string) || undefined,
    isAnonymous,
  }
}

function shouldAutoAnon(): boolean {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  if (params.has('code') || params.get('auth') === 'error') return false
  if (window.location.pathname.startsWith('/auth/callback')) return false
  return true
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser>(GUEST_USER)
  const [isLoading, setIsLoading] = useState(true)
  const demoRoleLockRef = useRef<'customer' | 'professional' | null>(null)
  const bootDoneRef = useRef(false)

  const getClient = useCallback(() => createBrowserSupabaseClient(), [])

  const applySession = useCallback(async () => {
    if (demoRoleLockRef.current) {
      setIsLoading(false)
      return
    }
    const supabase = getClient()
    if (!supabase) {
      setUser(GUEST_USER)
      setIsLoading(false)
      return
    }

    const { data: userData } = await supabase.auth.getUser()
    if (userData.user) {
      setUser(mapSupabaseUser(userData.user))
      setIsLoading(false)
      return
    }

    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData.session?.user) {
      setUser(mapSupabaseUser(sessionData.session.user))
      setIsLoading(false)
      return
    }

    if (isSupabaseEnabled() && shouldAutoAnon()) {
      const { data: anon, error } = await supabase.auth.signInAnonymously()
      if (!error && anon.user) {
        setUser(mapSupabaseUser(anon.user))
      } else {
        setUser(GUEST_USER)
      }
    } else {
      setUser(GUEST_USER)
    }
    setIsLoading(false)
  }, [getClient])

  useEffect(() => {
    if (bootDoneRef.current) return
    bootDoneRef.current = true
    void applySession()

    const supabase = getClient()
    if (!supabase) return

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (demoRoleLockRef.current) return
      if (session?.user) {
        setUser(mapSupabaseUser(session.user))
        setIsLoading(false)
        return
      }
      if (event === 'SIGNED_OUT') {
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
    [getClient],
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
    [getClient],
  )

  const signInAnonymously = useCallback(async () => {
    const supabase = getClient()
    if (!supabase) return 'Supabase לא מוגדר'
    const { error } = await supabase.auth.signInAnonymously()
    return error?.message ?? null
  }, [getClient])

  const signInWithGoogle = useCallback(async () => {
    if (!featureFlags.googleOAuth) return 'Google OAuth מושבת'
    const supabase = getClient()
    if (!supabase) return 'Supabase לא מוגדר'
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    try {
      const { data } = await supabase.auth.getUser()
      if (data.user?.is_anonymous) {
        await supabase.auth.signOut()
      }
    } catch {
      /* ignore */
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=/profile`,
        queryParams: { prompt: 'select_account' },
      },
    })
    return error?.message ?? null
  }, [getClient])

  const claimProfessionalProfile = useCallback(
    async (professionalId: string) => {
      if (isDemoDataMode()) {
        demoRoleLockRef.current = 'professional'
        setUser({
          ...DEMO_PRO_USER,
          professionalId: professionalId || DEMO_PROFESSIONAL_ID,
        })
        return null
      }

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
    },
    [getClient],
  )

  const switchDemoRole = useCallback((role: 'customer' | 'professional') => {
    if (!isDemoDataMode()) return
    demoRoleLockRef.current = role
    if (role === 'professional') {
      setUser({ ...DEMO_PRO_USER, professionalId: DEMO_PROFESSIONAL_ID })
    } else {
      setUser(GUEST_USER)
    }
  }, [])

  const signOut = useCallback(async () => {
    demoRoleLockRef.current = null
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
      switchDemoRole,
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
      switchDemoRole,
      signOut,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { DEMO_PROFESSIONAL_ID }
