import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { publicEnv } from '@/lib/env/public-env'

/**
 * Google / OAuth callback.
 * Cookies MUST be written onto the redirect response — setting only
 * `cookies()` from next/headers can drop the session on redirect.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/profile'
  const next = rawNext.startsWith('/') ? rawNext : '/profile'

  if (!code || !publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) {
    return NextResponse.redirect(`${origin}/profile?auth=error`)
  }

  const cookieStore = await cookies()
  let redirectResponse = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
            redirectResponse.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/profile?auth=error`)
  }

  return redirectResponse
}
