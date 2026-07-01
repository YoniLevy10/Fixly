import type { Metadata } from 'next'
import Link from 'next/link'
import {
  SEO_CATEGORIES,
  SEO_CITIES,
  getCategoryBySlug,
  getCityBySlug,
} from '@/lib/seo/marketplace-pages'
import { listProfessionals } from '@/lib/data/professionals-service'
import { routes } from '@/lib/routes'
import ProListCard from '@/components/professionals/ProListCard'
import FixlyGuaranteeBanner from '@/components/shared/FixlyGuaranteeBanner'

type PageProps = {
  params: Promise<{ city: string; category: string }>
}

export async function generateStaticParams() {
  return SEO_CITIES.flatMap((city) =>
    SEO_CATEGORIES.map((cat) => ({
      city: city.slug,
      category: cat.slug,
    })),
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city, category } = await params
  const cityMeta = getCityBySlug(city)
  const catMeta = getCategoryBySlug(category)
  if (!cityMeta || !catMeta) return { title: 'Fixly' }

  return {
    title: `${catMeta.nameHe} ב${cityMeta.nameHe} | Fixly`,
    description: `מצא ${catMeta.nameHe} מומלץ ב${cityMeta.nameHe}. בקשה מהירה, מעקב חי, ביקורות אמיתיות — Fixly.`,
    openGraph: {
      title: `${catMeta.nameHe} ב${cityMeta.nameHe}`,
      description: `אנשי מקצוע מאומתים ב${cityMeta.nameHe}`,
    },
  }
}

export default async function ServiceLandingPage({ params }: PageProps) {
  const { city, category } = await params
  const cityMeta = getCityBySlug(city)
  const catMeta = getCategoryBySlug(category)

  if (!cityMeta || !catMeta) {
    return <main className="p-6">Not found</main>
  }

  const pros = await listProfessionals({
    categorySlug: category,
    query: cityMeta.query,
  })

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 pb-28 space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Fixly</p>
        <h1 className="text-3xl font-black">
          {catMeta.nameHe} ב{cityMeta.nameHe}
        </h1>
        <p className="text-muted-foreground mt-2">
          {pros.length} אנשי מקצוע זמינים • בקשה חינם • מעקב חי
        </p>
      </div>

      <FixlyGuaranteeBanner compact />

      <div className="space-y-3">
        {pros.slice(0, 12).map((pro) => (
          <ProListCard key={pro.id} professional={pro} />
        ))}
      </div>

      {pros.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          עדיין אין מקצוענים —{' '}
          <Link href={routes.proJoin} className="text-primary font-bold">
            הצטרף כאיש מקצוע
          </Link>
        </p>
      )}

      <Link
        href={routes.newRequest}
        className="block text-center bg-primary text-white py-3 rounded-xl font-bold"
      >
        שלח בקשה עכשיו
      </Link>
    </main>
  )
}
