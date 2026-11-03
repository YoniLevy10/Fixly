import Link from 'next/link'

export type SeoBreadcrumbItem = {
  name: string
  /** Preferred href for UI crumbs */
  href?: string
  /** Alternate field used by national SEO landings / JSON-LD helpers */
  path?: string
}

type SeoBreadcrumbsProps = {
  items: SeoBreadcrumbItem[]
}

/** Visual breadcrumb trail for SEO landing / profile pages. */
export default function SeoBreadcrumbs({ items }: SeoBreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <nav aria-label="breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const href = item.href ?? item.path
          return (
            <li key={`${item.name}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? (
                <span aria-hidden className="text-muted-foreground/60">
                  /
                </span>
              ) : null}
              {href && !isLast ? (
                <Link
                  href={href}
                  className="hover:text-primary underline-offset-2 hover:underline"
                >
                  {item.name}
                </Link>
              ) : (
                <span className={isLast ? 'text-foreground font-medium' : undefined}>
                  {item.name}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
