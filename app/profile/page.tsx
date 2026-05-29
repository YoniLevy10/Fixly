'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth/auth-provider'
import { routes } from '@/lib/routes'
import { isSupabaseEnabled } from '@/lib/data/config'

export default function ProfilePage() {
  const { user, signInAsGuest, signInAsDemoPro, signOut } = useAuth()

  return (
    <div className="px-4 py-6 max-w-lg mx-auto lg:max-w-2xl lg:px-8">
      <h1 className="text-2xl font-black mb-2 lg:text-3xl">הפרופיל שלי</h1>
      <p className="text-muted-foreground text-sm mb-6">
        {isSupabaseEnabled()
          ? 'מחובר ל-Supabase Auth'
          : 'מצב דמו — בחר תפקיד לבדיקה'}
      </p>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
          {user.fullName.charAt(0)}
        </div>
        <div>
          <p className="font-bold">{user.fullName}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <p className="text-xs text-primary mt-1">
            {user.role === 'professional' ? 'בעל מקצוע' : 'לקוח'}
          </p>
        </div>
      </div>

      {!isSupabaseEnabled() && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={signInAsGuest}
            className="text-sm bg-muted px-4 py-2 rounded-xl font-medium"
          >
            לקוח (אורח)
          </button>
          <button
            type="button"
            onClick={signInAsDemoPro}
            className="text-sm bg-primary text-white px-4 py-2 rounded-xl font-medium"
          >
            בעל מקצוע (דמו)
          </button>
          <button
            type="button"
            onClick={signOut}
            className="text-sm border border-border px-4 py-2 rounded-xl font-medium"
          >
            התנתק
          </button>
        </div>
      )}

      <nav className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        <Link
          href={routes.myRequests}
          className="block bg-white rounded-2xl border border-gray-100 px-4 py-3 font-medium hover:border-primary/30"
        >
          הבקשות שלי
        </Link>
        <Link
          href={routes.professionals}
          className="block bg-white rounded-2xl border border-gray-100 px-4 py-3 font-medium hover:border-primary/30"
        >
          חיפוש אנשי מקצוע
        </Link>
        <Link
          href={routes.proDashboard}
          className="block bg-white rounded-2xl border border-gray-100 px-4 py-3 font-medium hover:border-primary/30"
        >
          דשבורד מקצועי
        </Link>
        <Link
          href={routes.newRequest}
          className="block bg-secondary text-white rounded-2xl px-4 py-3 font-bold text-center"
        >
          שלח בקשה חדשה
        </Link>
      </nav>
    </div>
  )
}
