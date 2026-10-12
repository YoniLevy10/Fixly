/** Derive a public SEO slug without requiring a DB column. */
export function slugifyHe(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"`׳״]/g, '')
    .replace(/[^a-z0-9\u0590-\u05ff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function professionalPublicSlug(name: string, id: string): string {
  const base = slugifyHe(name) || 'pro'
  const short = id.replace(/-/g, '').slice(0, 8)
  return `${base}-${short}`
}

/** Resolve id suffix from `/pro/[slug]` style URLs. */
export function professionalIdFromPublicSlug(slug: string): string | null {
  const m = slug.match(/-([a-f0-9]{8})$/i)
  return m?.[1] ?? null
}
