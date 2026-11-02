import Link from 'next/link'
import { routes } from '@/lib/routes'
import { SEO_CATEGORIES, SEO_CITIES, seoPagePath } from '@/lib/seo/marketplace-pages'

/** Hot-intent city×category combos for light SEO footer links. */
const HOT_INTENT = [
  { city: 'tel-aviv', category: 'plumbing' },
  { city: 'tel-aviv', category: 'electricity' },
  { city: 'tel-aviv', category: 'ac' },
  { city: 'haifa', category: 'plumbing' },
  { city: 'jerusalem', category: 'electricity' },
] as const

type ServicesSeoFooterProps = {
  /** Current page path — omit from the hot list to avoid self-links. */
  currentPath?: string
}

export default function ServicesSeoFooter({ currentPath }: ServicesSeoFooterProps) {
  const hotLinks = HOT_INTENT.map((item) => {
    const city = SEO_CITIES.find((c) => c.slug === item.city)
    const cat = SEO_CATEGORIES.find((c) => c.slug === item.category)
    if (!city || !cat) return null
    const path = seoPagePath(city.slug, cat.slug)
    if (currentPath && path === currentPath) return null
    return {
      path,
      label: `${cat.nameHe} ב${city.nameHe}`,
    }
  }).filter(Boolean) as { path: string; label: string }[]

  return (
    <footer className="border-t border-slate-200 pt-6 mt-8 space-y-3 text-sm">
      <p className="font-bold text-foreground">עוד שירותים ב-Fixly</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-muted-foreground">
        {hotLinks.map((link) => (
          <li key={link.path}>
            <Link href={link.path} className="hover:text-primary underline-offset-2 hover:underline">
              {link.label}
            </Link>
          </li>
        ))}
        <li>
          <Link href={routes.about} className="hover:text-primary underline-offset-2 hover:underline">
            אודות
          </Link>
        </li>
        <li>
          <Link href={routes.waitlist} className="hover:text-primary underline-offset-2 hover:underline">
            הרשמה
          </Link>
        </li>
        <li>
          <Link href="/categories" className="hover:text-primary underline-offset-2 hover:underline">
            כל הקטגוריות
          </Link>
        </li>
      </ul>
    </footer>
  )
}
