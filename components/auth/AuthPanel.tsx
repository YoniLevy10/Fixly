'use client'

import { useState } from 'react'
import { useAuth, DEMO_PROFESSIONAL_ID } from '@/lib/auth/auth-provider'
import { useLocale } from '@/lib/i18n/locale-provider'
import { featureFlags } from '@/lib/feature-flags'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Label from '@/components/ui/Label'
import { GUEST_USER_ID } from '@/lib/auth/constants'

export default function AuthPanel() {
  const {
    user,
    isSupabase,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    claimProfessionalProfile,
    signOut,
  } = useAuth()
  const { t } = useLocale()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!isSupabase) {
    return (
      <p className="text-sm text-muted-foreground">{t('auth.devNoSupabase')}</p>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const err =
      mode === 'login'
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password, fullName)
    setError(err)
    setLoading(false)
  }

  const isGuestLike =
    user.id === GUEST_USER_ID ||
    user.email === 'guest@fixly.app' ||
    user.email === 'אורח' ||
    user.fullName === 'אורח'

  const handleClaimPro = async () => {
    setLoading(true)
    setError(null)
    const err = await claimProfessionalProfile(DEMO_PROFESSIONAL_ID)
    setError(err)
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      {isGuestLike && featureFlags.googleOAuth && (
        <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-4">
          <p className="font-bold text-foreground mb-1">{t('auth.signInPromptTitle')}</p>
          <p className="text-sm text-foreground/80 mb-4">{t('auth.signInPromptBody')}</p>
          <GoogleSignInButton
            disabled={loading}
            onClick={async () => {
              setLoading(true)
              setError(null)
              setError(await signInWithGoogle())
              setLoading(false)
            }}
          />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <p className="font-bold text-foreground">{user.fullName}</p>
        <p className="text-sm text-foreground/70">{user.email || user.id.slice(0, 8)}</p>
        <p className="text-xs font-semibold text-primary mt-1">
          {user.role === 'professional' ? t('auth.rolePro') : t('auth.roleCustomer')}
          {user.professionalId ? ` • ${user.professionalId.slice(0, 8)}…` : ''}
        </p>
      </div>

      {!isGuestLike && featureFlags.googleOAuth && (
        <GoogleSignInButton
          disabled={loading}
          onClick={async () => {
            setLoading(true)
            setError(null)
            setError(await signInWithGoogle())
            setLoading(false)
          }}
        />
      )}

      <div className="flex items-center gap-3">
        <span className="flex-1 h-px bg-border" />
        <span className="text-xs font-medium text-foreground/60 shrink-0">
          {t('auth.orEmail')}
        </span>
        <span className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${mode === 'login' ? 'bg-primary text-white' : 'bg-gray-100'}`}
          >
            {t('auth.login')}
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${mode === 'signup' ? 'bg-primary text-white' : 'bg-gray-100'}`}
          >
            {t('auth.signup')}
          </button>
        </div>

        {mode === 'signup' && (
          <div>
            <Label>{t('auth.fullName')}</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1"
              required
            />
          </div>
        )}
        <div>
          <Label>{t('auth.email')}</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
            dir="ltr"
            required
          />
        </div>
        <div>
          <Label>{t('auth.password')}</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
            dir="ltr"
            required
            minLength={6}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} variant="primary" size="md">
          {loading
            ? '...'
            : mode === 'login'
              ? t('auth.signIn')
              : t('auth.signUp')}
        </Button>
      </form>

      <button
        type="button"
        onClick={handleClaimPro}
        disabled={loading}
        className="w-full border border-primary text-primary py-2.5 rounded-xl font-bold text-sm"
      >
        {t('auth.claimPro')}
      </button>

      <button
        type="button"
        onClick={() => signOut()}
        className="w-full text-sm text-foreground/60 underline hover:text-foreground"
      >
        {t('auth.signOut')}
      </button>
    </div>
  )
}
