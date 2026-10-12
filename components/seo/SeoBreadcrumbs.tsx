import Link from 'next/link'
import type { BreadcrumbItem } from '@/lib/seo/json-ld'

export default function SeoBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="פירורי לחם" className="text-xs text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <li key={item.path} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden className="text-border">/</span>}
              {last ? (
                <span className="font-medium text-foreground">{item.name}</span>
              ) : (
                <Link href={item.path} className="hover:text-primary underline-offset-2 hover:underline">
                  {item.name}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
