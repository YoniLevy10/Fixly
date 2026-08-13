export type Category = {
  id: string
  name: string
  slug: string
  icon: string
  description?: string
}

export const CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'מניקור וציפורניים',
    slug: 'nails',
    icon: '💅',
    description: 'מניקור, ג׳ל ופדיקור עד הבית',
  },
  {
    id: '2',
    name: 'תספורת ועיצוב',
    slug: 'hair',
    icon: '✂️',
    description: 'ספרים ומעצבי שיער ניידים',
  },
]

/** Grid tiles on home */
export const HOME_DISPLAY_CATEGORIES = [
  { name: 'מניקור וציפורניים', slug: 'nails', emoji: '💅' },
  { name: 'תספורת ועיצוב', slug: 'hair', emoji: '✂️' },
]

export const PROFESSIONALS_FILTER_CATEGORIES = [
  { slug: 'nails', name: 'מניקור וציפורניים', icon: '💅' },
  { slug: 'hair', name: 'תספורת ועיצוב', icon: '✂️' },
]
