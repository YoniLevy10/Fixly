/** Canonical category presentation — Hebrew-first for IL market */

export type CategoryCatalogEntry = {
  emoji: string
  nameHe: string
  nameEn: string
}

export const CATEGORY_CATALOG: Record<string, CategoryCatalogEntry> = {
  plumbing: { emoji: '🚿', nameHe: 'אינסטלציה', nameEn: 'Plumbing' },
  electricity: { emoji: '⚡', nameHe: 'חשמל', nameEn: 'Electrical' },
  ac: { emoji: '❄️', nameHe: 'מיזוג אוויר', nameEn: 'Air conditioning' },
  cleaning: { emoji: '✨', nameHe: 'ניקיון', nameEn: 'Cleaning' },
  painting: { emoji: '🎨', nameHe: 'צביעה', nameEn: 'Painting' },
  carpentry: { emoji: '🪚', nameHe: 'נגרות', nameEn: 'Carpentry' },
  moving: { emoji: '🚚', nameHe: 'הובלות', nameEn: 'Moving' },
  gardening: { emoji: '🌿', nameHe: 'גינון', nameEn: 'Gardening' },
  locksmith: { emoji: '🔐', nameHe: 'מנעולן', nameEn: 'Locksmith' },
  tiling: { emoji: '🧱', nameHe: 'ריצוף', nameEn: 'Tiling' },
  elevators: { emoji: '🛗', nameHe: 'מעליות', nameEn: 'Elevators' },
  pest_control: { emoji: '🐛', nameHe: 'הדברה', nameEn: 'Pest control' },
  general: { emoji: '🧰', nameHe: 'כללי / אחר', nameEn: 'General' },
  furniture: { emoji: '🛋️', nameHe: 'ריהוט', nameEn: 'Furniture' },
  appliance_repair: { emoji: '🔌', nameHe: 'תיקון מכשירים', nameEn: 'Appliance repair' },
  appliances: { emoji: '🔌', nameHe: 'תיקון מכשירים', nameEn: 'Appliance repair' },
  computers: { emoji: '💻', nameHe: 'מחשבים', nameEn: 'Computers' },
  glazing: { emoji: '🪟', nameHe: 'זגגות', nameEn: 'Glazing' },
  glass: { emoji: '🪟', nameHe: 'זגגות', nameEn: 'Glazing' },
  renovations: { emoji: '🏗️', nameHe: 'שיפוצים', nameEn: 'Renovations' },
  renovation: { emoji: '🏗️', nameHe: 'שיפוצים', nameEn: 'Renovations' },
  nails: { emoji: '💅', nameHe: 'מניקור וציפורניים', nameEn: 'Nails' },
  hair: { emoji: '✂️', nameHe: 'תספורת ועיצוב', nameEn: 'Hair' },
  makeup: { emoji: '💄', nameHe: 'איפור', nameEn: 'Makeup' },
  manicure: { emoji: '💅', nameHe: 'מניקור וציפורניים', nameEn: 'Manicure' },
  barber: { emoji: '✂️', nameHe: 'תספורת ועיצוב', nameEn: 'Barber' },
}

/** Lucide / legacy icon keys stored in DB → emoji */
const LEGACY_ICON_KEYS: Record<string, string> = {
  bolt: '⚡',
  droplets: '🚿',
  snowflake: '❄️',
  sparkles: '✨',
  paintbrush: '🎨',
  wrench: '🔧',
  hammer: '🔨',
  leaf: '🌿',
  truck: '🚚',
  key: '🔐',
  sofa: '🛋️',
  laptop: '💻',
  elevator: '🛗',
}

const ENGLISH_NAME_TO_SLUG: Record<string, string> = {
  furniture: 'furniture',
  'appliance repair': 'appliance_repair',
  appliances: 'appliances',
  computers: 'computers',
  glazing: 'glazing',
  glass: 'glass',
  renovations: 'renovations',
  renovation: 'renovation',
  elevators: 'elevators',
  'pest control': 'pest_control',
  general: 'general',
  other: 'general',
  carpentry: 'carpentry',
  painting: 'painting',
  cleaning: 'cleaning',
  plumbing: 'plumbing',
  electrician: 'electricity',
  electrical: 'electricity',
  'air conditioning': 'ac',
  moving: 'moving',
  gardening: 'gardening',
  locksmith: 'locksmith',
  tiling: 'tiling',
  nails: 'nails',
  manicure: 'nails',
  hair: 'hair',
  barber: 'hair',
  makeup: 'makeup',
}

function isMostlyLatin(text: string): boolean {
  const letters = text.replace(/[^A-Za-z\u0590-\u05FF]/g, '')
  if (!letters) return false
  const latin = (letters.match(/[A-Za-z]/g) ?? []).length
  return latin / letters.length > 0.6
}

export function normalizeCategorySlug(
  slug: string | null | undefined,
  name?: string | null,
): string {
  const raw = (slug ?? '').trim().toLowerCase().replace(/\s+/g, '_')
  if (raw && CATEGORY_CATALOG[raw]) return raw
  if (name) {
    const fromName = ENGLISH_NAME_TO_SLUG[name.trim().toLowerCase()]
    if (fromName) return fromName
  }
  return raw || (name ? name.trim().toLowerCase().replace(/\s+/g, '-') : '')
}

export function resolveCategoryEmoji(
  slug: string,
  iconFromDb?: string | null,
): string {
  const catalog = CATEGORY_CATALOG[slug]
  if (catalog) return catalog.emoji
  if (iconFromDb) {
    if (LEGACY_ICON_KEYS[iconFromDb]) return LEGACY_ICON_KEYS[iconFromDb]
    // Already an emoji / non-latin glyph (not a lucide key)
    if (!/^[a-z0-9_-]+$/i.test(iconFromDb)) return iconFromDb
  }
  return '🧰'
}

export function resolveCategoryNameHe(
  slug: string,
  nameHe?: string | null,
  nameEn?: string | null,
): string {
  const catalog = CATEGORY_CATALOG[slug]
  if (catalog) return catalog.nameHe
  if (nameHe && !isMostlyLatin(nameHe)) return nameHe
  if (nameEn && !isMostlyLatin(nameEn)) return nameEn
  return nameHe || nameEn || slug
}

export function resolveCategoryNameEn(
  slug: string,
  nameEn?: string | null,
  nameHe?: string | null,
): string {
  const catalog = CATEGORY_CATALOG[slug]
  if (catalog) return catalog.nameEn
  if (nameEn && isMostlyLatin(nameEn)) return nameEn
  return nameEn || nameHe || slug
}
