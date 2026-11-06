import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  decideIsraelAccess,
  GEO_COOKIE_BLOCKED,
  GEO_COOKIE_IL,
  GEO_COOKIE_NAME,
  isIsraelOnlyGateEnabled,
  resolveRequestCountry,
} from '@/lib/geo/israel-access'
import { getCategoryBySlug, getCityBySlug } from '@/lib/seo/marketplace-pages'
import {
  isMarketingHost,
  isMarketingPublicPath,
  normalizeHost,
  normalizePathname,
} from '@/lib/site-hosts'

function applyGeoCookie(response: NextResponse, value: typeof GEO_COOKIE_IL | typeof GEO_COOKIE_BLOCKED) {
  response.cookies.set(GEO_COOKIE_NAME, value, {
    path: '/',
    sameSite: 'lax',
    secure: true,
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function middleware(request: NextRequest) {
  const host = normalizeHost(
    request.headers.get('x-forwarded-host') || request.headers.get('host'),
  )

  const pathname = normalizePathname(request.nextUrl.pathname)
  if (isUnknownSeoSlug(pathname)) {
    return new NextResponse('העמוד לא נמצא', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'x-robots-tag': 'noindex',
      },
    })
  }

  // Purchased domain = registration/landing only — no marketplace product UI.
  if (isMarketingHost(host) && !isMarketingPublicPath(pathname)) {
    const dest = request.nextUrl.clone()
    dest.pathname = '/waitlist'
    dest.search = ''
    return NextResponse.redirect(dest, 308)
  }

  const country = resolveRequestCountry(request.headers)
  const geoDecision = decideIsraelAccess({
    enabled: isIsraelOnlyGateEnabled(),
    country,
    userAgent: request.headers.get('user-agent'),
    pathname: request.nextUrl.pathname,
    host,
  })

  if (geoDecision === 'block') {
    const url = request.nextUrl.clone()
    url.pathname = '/il-only'
    url.search = ''
    const blocked = NextResponse.rewrite(url)
    applyGeoCookie(blocked, GEO_COOKIE_BLOCKED)
    blocked.headers.set('x-fixly-geo', GEO_COOKIE_BLOCKED)
    return blocked
  }

  let response = NextResponse.next({ request })
  if (country === 'IL') {
    applyGeoCookie(response, GEO_COOKIE_IL)
    response.headers.set('x-fixly-geo', GEO_COOKIE_IL)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        if (country === 'IL') {
          applyGeoCookie(response, GEO_COOKIE_IL)
          response.headers.set('x-fixly-geo', GEO_COOKIE_IL)
        }
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  await supabase.auth.getUser()
  return response
}

function isUnknownSeoSlug(pathname: string): boolean {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'professionals' && parts.length === 2) {
    return !getCategoryBySlug(parts[1])
  }
  if (parts[0] === 'professionals' && parts.length === 3) {
    return !getCategoryBySlug(parts[1]) || !getCityBySlug(parts[2])
  }
  if (parts[0] === 'locations' && parts.length === 2) {
    return !getCityBySlug(parts[1])
  }
  return false
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
