'use client'

import { useState } from 'react'
import { useAuth, DEMO_PROFESSIONAL_ID } from '@/lib/auth/auth-provider'
import { useLocale } from '@/lib/i18n/locale-provider'
import Input from '@/components/ui/Input'
import Label from '@/components/ui/Label'

export default function AuthPanel() {
  const {
    user,
    isSupabase,
    signInWithEmail,
    signUpWithEmail,
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

  const handleClaimPro = async () => {
    setLoading(true)
    setError(null)
    const err = await claimProfessionalProfile(DEMO_PROFESSIONAL_ID)
    setError(err)
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="font-bold">{user.fullName}</p>
        <p className="text-sm text-gray-500">{user.email || user.id.slice(0, 8)}</p>
        <p className="text-xs text-primary mt-1">
          {user.role === 'professional' ? t('auth.rolePro') : t('auth.roleCustomer')}
          {user.professionalId ? ` • ${user.professionalId.slice(0, 8)}…` : ''}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 bg-white rounded-2xl border p-4">
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
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2.5 rounded-xl font-bold disabled:opacity-60"
        >
          {loading
            ? '...'
            : mode === 'login'
              ? t('auth.signIn')
              : t('auth.signUp')}
        </button>
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
        className="w-full text-sm text-gray-500 underline"
      >
        {t('auth.signOut')}
      </button>
    </div>
  )
}
