import { SITE_URL } from '@/lib/site-config'
import { routes } from '@/lib/routes'
import type { Professional } from '@/types/professional'

type BreadcrumbItem = {
  name: string
  path: string
}

export function buildOrganizationSchema(options?: {
  sameAs?: string[]
}): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Fixly',
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon-512.png`,
    areaServed: {
      '@type': 'Country',
      name: 'Israel',
    },
    potentialAction: {
      '@type': 'JoinAction',
      target: `${SITE_URL}/waitlist`,
      name: 'הרשמה ל-Fixly',
    },
  }
  if (options?.sameAs && options.sameAs.length > 0) {
    schema.sameAs = options.sameAs
  }
  return schema
}

/** WebSite + SearchAction pointing at the professionals search. */
export function buildWebSiteSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Fixly',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/professionals?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildBreadcrumbListSchema(
  items: BreadcrumbItem[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.path.startsWith('http') ? item.path : `${SITE_URL}${item.path}`,
    })),
  }
}

export function buildProfessionalServiceSchema(
  pro: Professional,
  options?: { cityNameHe?: string; categoryNameHe?: string },
): Record<string, unknown> {
  const url = `${SITE_URL}${routes.professional(pro.id)}`
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': url,
    name: pro.name,
    url,
    description:
      pro.description ||
      [pro.title ?? pro.category, options?.cityNameHe]
        .filter(Boolean)
        .join(' · ') ||
      pro.name,
    image: pro.avatarUrl || `${SITE_URL}/icons/icon-512.png`,
    priceRange: `₪${pro.startingPrice}+`,
    areaServed: options?.cityNameHe
      ? { '@type': 'City', name: options.cityNameHe }
      : pro.location
        ? { '@type': 'Place', name: pro.location }
        : { '@type': 'Country', name: 'Israel' },
  }

  if (options?.categoryNameHe || pro.category) {
    schema.serviceType = options?.categoryNameHe ?? pro.category
  }

  if (pro.reviewCount > 0 && pro.rating > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(pro.rating.toFixed(1)),
      reviewCount: pro.reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  return schema
}

export function buildProfessionalsItemListSchema(
  pros: Professional[],
  options: { name: string; description?: string },
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: options.name,
    description: options.description,
    numberOfItems: pros.length,
    itemListElement: pros.map((pro, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}${routes.professional(pro.id)}`,
      name: pro.name,
    })),
  }
}

export function buildCategoriesCollectionSchema(
  links: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'קטגוריות שירותים ב-Fixly',
    url: `${SITE_URL}/categories`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: links.length,
      itemListElement: links.map((link, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: link.name,
        url: link.path.startsWith('http') ? link.path : `${SITE_URL}${link.path}`,
      })),
    },
  }
}
