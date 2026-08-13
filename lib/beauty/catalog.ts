/** גלאם — catalog for home beauty services (phase 1: nails + hair) */

export type BeautyVertical = {
  slug: string
  nameHe: string
  nameEn: string
  taglineHe: string
  emoji: string
  /** Dominant service menu for this vertical */
  services: { id: string; nameHe: string; durationMin: number; basePrice: number }[]
}

export const BEAUTY_VERTICALS: BeautyVertical[] = [
  {
    slug: 'nails',
    nameHe: 'מניקור וציפורניים',
    nameEn: 'Nails',
    taglineHe: 'מניקור, ג׳ל ופדיקור עד הבית',
    emoji: '💅',
    services: [
      { id: 'mani-classic', nameHe: 'מניקור קלאסי', durationMin: 45, basePrice: 120 },
      { id: 'mani-gel', nameHe: 'מניקור ג׳ל', durationMin: 60, basePrice: 160 },
      { id: 'pedi-classic', nameHe: 'פדיקור קלאסי', durationMin: 50, basePrice: 150 },
      { id: 'pedi-gel', nameHe: 'פדיקור ג׳ל', durationMin: 70, basePrice: 190 },
      { id: 'nails-combo', nameHe: 'מניקור + פדיקור', durationMin: 90, basePrice: 260 },
      { id: 'nails-fill', nameHe: 'מילוי / תיקון', durationMin: 40, basePrice: 100 },
    ],
  },
  {
    slug: 'hair',
    nameHe: 'תספורת ועיצוב',
    nameEn: 'Hair',
    taglineHe: 'ספרים ומעצבי שיער עד הבית',
    emoji: '✂️',
    services: [
      { id: 'haircut-women', nameHe: 'תספורת נשים', durationMin: 45, basePrice: 180 },
      { id: 'haircut-men', nameHe: 'תספורת גברים', durationMin: 30, basePrice: 100 },
      { id: 'blowout', nameHe: 'פן / עיצוב', durationMin: 40, basePrice: 140 },
      { id: 'color-touch', nameHe: 'צביעה / ריענון', durationMin: 90, basePrice: 280 },
      { id: 'bridal-hair', nameHe: 'עיצוב לאירוע', durationMin: 75, basePrice: 350 },
    ],
  },
]

export const BRAND = {
  nameHe: 'גלאם',
  nameEn: 'Glam',
  taglineHe: 'ביוטי עד הבית — מיידי ומקצועי',
  taglineEn: 'Beauty to your door — on demand',
  heroHeadlineHe: 'יופי שמגיע אליכם',
  heroSupportHe: 'בחרו שירות, השוו דירוגים ומחירים, והזמינו בעל מקצוע מסונן עד הבית, המלון או המשרד.',
  cities: ['תל אביב', 'רמת גן', 'גבעתיים', 'הרצליה', 'רעננה', 'חולון'],
} as const

export function getVertical(slug: string): BeautyVertical | undefined {
  return BEAUTY_VERTICALS.find((v) => v.slug === slug)
}

export function getServiceLabel(serviceId: string): string | undefined {
  for (const v of BEAUTY_VERTICALS) {
    const s = v.services.find((x) => x.id === serviceId)
    if (s) return s.nameHe
  }
  return undefined
}
