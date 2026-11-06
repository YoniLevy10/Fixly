import {
  JsonLd,
} from '@/components/seo/JsonLd'
import SeoBreadcrumbs from '@/components/seo/SeoBreadcrumbs'
import SeoLandingTracker from '@/components/seo/SeoLandingTracker'
import ProListCard from '@/components/professionals/ProListCard'
import FixlyGuaranteeBanner from '@/components/shared/FixlyGuaranteeBanner'
import {
  categoryCityFaqs,
} from '@/lib/seo/faq'
import {
  breadcrumbJsonLd,
  faqJsonLd,
  serviceJsonLd,
} from '@/lib/seo/json-ld'
import {
  categoryHubPath,
  getCategoryBySlug,
  getCityBySlug,
  locationHubPath,
  seoPagePath,
  type SeoCategory,
  type SeoCity,
} from '@/lib/seo/marketplace-pages'
import { routes } from '@/lib/routes'
import { PRODUCT_URL } from '@/lib/site-config'
import type { Professional } from '@/types/professional'
import type { SeoValueResult } from '@/lib/seo/has-seo-value'
import Link from 'next/link'

type Props = {
  city: SeoCity
  category: SeoCategory
  seo: SeoValueResult
  pros: Professional[]
}

export default function CategoryCityLanding({ city, category, seo, pros }: Props) {
  const path = seoPagePath(category.slug, city.slug)
  const proSignupHref = `${routes.forProfessionals}?utm_source=fixly&utm_medium=organic&utm_campaign=seo_pro_${category.slug}_${city.slug}`
  const requestHref = `${PRODUCT_URL}${routes.newRequest}?category=${category.slug}&city=${city.slug}`
  const crumbs = [
    { name: 'Fixly', path: '/' },
    { name: 'בעלי מקצוע', path: routes.professionals },
    { name: category.nameHe, path: categoryHubPath(category.slug) },
    { name: city.nameHe, path },
  ]
  const faqs = categoryCityFaqs(category, city, pros.length)

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 pb-28 space-y-8">
      <SeoLandingTracker
        pageType="category_city"
        category={category.slug}
        city={city.slug}
        indexable={seo.hasValue}
      />
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          serviceJsonLd({
            name: `${category.nameHe} ב${city.nameHe}`,
            description: `מציאת ${category.nameHe} ב${city.nameHe} דרך Fixly — בקשה אחת ומעקב עד סיום.`,
            path,
            areaServed: city.nameHe,
            category: category.nameHe,
          }),
          faqJsonLd(faqs),
        ]}
      />

      <SeoBreadcrumbs items={crumbs} />

      <header className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">
          {category.nameHe} ב{city.nameHe}
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          {pros.length > 0
            ? `${pros.length} אנשי מקצוע רלוונטיים באזור • בקשה חינם • מעקב עד סיום העבודה`
            : seo.reason === 'waitlist_demand'
              ? `יש ביקוש מאומת ב${city.nameHe}, אבל אין עדיין ${category.nameHe} מאומת. הזמנת עבודה תיפתח כשיהיה בעל מקצוע.`
              : `אין עדיין ${category.nameHe} מאומת ב${city.nameHe}. הדף ייפתח לאינדוקס כשיהיה בעל מקצוע או ביקוש מאומת.`}
        </p>
      </header>

      {pros.length > 0 ? (
        <section className="space-y-4" aria-labelledby="pros-heading">
          <h2 id="pros-heading" className="text-lg font-bold">
            {category.nameHe} מומלצים ב{city.nameHe}
          </h2>
          <FixlyGuaranteeBanner compact />
          <div className="space-y-3">
            {pros.slice(0, 12).map((pro) => (
              <ProListCard
                key={pro.id}
                professional={pro}
                productBaseUrl={PRODUCT_URL}
              />
            ))}
          </div>
          <a
            href={requestHref}
            data-seo-cta="request_pro"
            className="block text-center bg-primary text-white py-3.5 rounded-xl font-bold active:scale-[0.99]"
          >
            בקשו {category.nameHe} ב{city.nameHe}
          </a>
          <p className="text-sm text-muted-foreground text-center">
            {category.nameHe} שמחפש עבודות?{' '}
            <Link href={proSignupHref} data-seo-cta="waitlist_pro" className="font-bold text-primary underline">
              הצטרפות נפרדת, בחינם ובלי עמלה
            </Link>
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            אין עדיין {category.nameHe} מאומת ב{city.nameHe}, ולכן אי אפשר להזמין מכאן עבודה.
            הדף לא מציג פרופילים לדוגמה.
          </p>
          <Link
            href={proSignupHref}
            data-seo-cta="waitlist_pro"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white"
          >
            אני {category.nameHe} — הצטרפות בחינם
          </Link>
        </section>
      )}

      <section className="space-y-3" aria-labelledby="about-heading">
        <h2 id="about-heading" className="text-lg font-bold">
          למה Fixly ל{category.nameHe} ב{city.nameHe}?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Fixly היא רשת ביצוע ארצית לתחזוקה ובעלי מקצוע בישראל — לא מרקטפלייס פתוח של פרופילי דמו.
          הלקוח שולח בקשה אחת; ההתאמה לפי תחום, אזור וזמינות; והמעקב נמשך עד סיום.
          העמוד הזה ממוקד בחיפושים כמו «{category.nameHe} ב{city.nameHe}» ו«{category.nameEn.toLowerCase()} {city.nameEn.toLowerCase()}».
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-lg font-bold">
          שאלות נפוצות
        </h2>
        <dl className="space-y-3">
          {faqs.map((f) => (
            <div key={f.question} className="rounded-xl border border-border bg-card p-4">
              <dt className="font-bold text-sm">{f.question}</dt>
              <dd className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{f.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="text-sm text-muted-foreground">
        <Link href={categoryHubPath(category.slug)} className="underline font-medium">
          {category.nameHe} בערים נוספות
        </Link>
        {' · '}
        <Link href={locationHubPath(city.slug)} className="underline font-medium">
          מקצועות נוספים ב{city.nameHe}
        </Link>
      </p>
    </main>
  )
}

export function resolveCategoryCity(categorySlug: string, citySlug: string) {
  const category = getCategoryBySlug(categorySlug)
  const city = getCityBySlug(citySlug)
  return { category, city }
}
