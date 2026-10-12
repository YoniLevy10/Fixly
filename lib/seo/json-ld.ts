import { SITE_NAME, SITE_URL } from '@/lib/site-config'

export type BreadcrumbItem = {
  name: string
  path: string
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'he-IL',
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

export function serviceJsonLd(options: {
  name: string
  description: string
  path: string
  areaServed: string
  category: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: options.name,
    description: options.description,
    url: `${SITE_URL}${options.path}`,
    serviceType: options.category,
    areaServed: {
      '@type': 'City',
      name: options.areaServed,
      containedInPlace: { '@type': 'Country', name: 'Israel' },
    },
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  }
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  }
}

/** LocalBusiness only when we have a real named professional with location. */
export function localBusinessJsonLd(options: {
  name: string
  description?: string
  path: string
  category: string
  city?: string
  rating?: number
  reviewCount?: number
  image?: string
}) {
  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: options.name,
    url: `${SITE_URL}${options.path}`,
    description: options.description,
    image: options.image,
    areaServed: options.city
      ? { '@type': 'City', name: options.city }
      : { '@type': 'Country', name: 'Israel' },
    knowsAbout: options.category,
  }
  if (
    options.rating != null &&
    options.rating > 0 &&
    options.reviewCount != null &&
    options.reviewCount > 0
  ) {
    node.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: options.rating,
      reviewCount: options.reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }
  return node
}
