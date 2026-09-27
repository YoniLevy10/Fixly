/** Canonical category presentation — Hebrew-first for IL market (Midrag-aligned) */

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
  phone_repair: { emoji: '📱', nameHe: 'תיקון סמארטפון', nameEn: 'Phone repair' },
  glazing: { emoji: '🪟', nameHe: 'זגגות', nameEn: 'Glazing' },
  glass: { emoji: '🪟', nameHe: 'זגגות', nameEn: 'Glazing' },
  renovations: { emoji: '🏗️', nameHe: 'שיפוצים', nameEn: 'Renovations' },
  renovation: { emoji: '🏗️', nameHe: 'שיפוצים', nameEn: 'Renovations' },
  handyman: { emoji: '🔧', nameHe: 'שיפוצים קטנים', nameEn: 'Handyman' },
  waterproofing: { emoji: '🛡️', nameHe: 'איטום', nameEn: 'Waterproofing' },
  aluminum: { emoji: '🪟', nameHe: 'אלומיניום', nameEn: 'Aluminum' },
  drywall: { emoji: '🧱', nameHe: 'גבס וטיח', nameEn: 'Drywall' },
  solar: { emoji: '☀️', nameHe: 'דודי שמש וחשמל', nameEn: 'Solar water heaters' },
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
  phone: '📱',
}

const ENGLISH_NAME_TO_SLUG: Record<string, string> = {
  furniture: 'furniture',
  'appliance repair': 'appliance_repair',
  appliances: 'appliances',
  'phone repair': 'phone_repair',
  smartphone: 'phone_repair',
  glazing: 'glazing',
  glass: 'glass',
  renovations: 'renovations',
  renovation: 'renovation',
  handyman: 'handyman',
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
  fallback?: string | null,
): string {
  return CATEGORY_CATALOG[slug]?.nameHe ?? fallback ?? slug
}

export function resolveCategoryNameEn(
  slug: string,
  fallback?: string | null,
): string {
  return CATEGORY_CATALOG[slug]?.nameEn ?? fallback ?? slug
}

export function categoryDisplayName(
  slug: string,
  locale: 'he' | 'en',
  fallback?: string | null,
): string {
  if (locale === 'en') return resolveCategoryNameEn(slug, fallback)
  if (fallback && !isMostlyLatin(fallback)) return fallback
  return resolveCategoryNameHe(slug, fallback)
}
