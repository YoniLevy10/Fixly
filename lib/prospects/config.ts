export const DEFAULT_RECRUIT_CITY = 'ירושלים'

/**
 * Home-service categories for Jerusalem soft-launch recruitment.
 * Expanded beyond the first 10 after Places returned ceramic shops / renovators
 * that map better to dedicated trades (tiling+ceramics, renovations, solar, …).
 */
export const CORE_RECRUIT_CATEGORY_SLUGS = [
  'plumbing',
  'electricity',
  'ac',
  'cleaning',
  'painting',
  'carpentry',
  'locksmith',
  'gardening',
  'moving',
  'tiling',
  'renovations',
  'waterproofing',
  'aluminum',
  'drywall',
  'solar',
  'appliance_repair',
  'pest_control',
  'glazing',
  'furniture',
] as const

export const RECRUIT_PER_CATEGORY_TARGET = 10

export const RECRUIT_TOTAL_TARGET =
  CORE_RECRUIT_CATEGORY_SLUGS.length * RECRUIT_PER_CATEGORY_TARGET

export const JOIN_URL = 'https://fixly.tech/pro/join'

export function getRecruitCity(): string {
  return process.env.FIXLY_RECRUIT_CITY?.trim() || DEFAULT_RECRUIT_CITY
}

export function getRecruitCategorySlugs(): string[] {
  const raw = process.env.FIXLY_RECRUIT_CATEGORY_SLUGS?.trim()
  if (!raw) return [...CORE_RECRUIT_CATEGORY_SLUGS]
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function getRecruitPerCategoryTarget(): number {
  const n = Number(process.env.FIXLY_RECRUIT_PER_CATEGORY_TARGET)
  if (Number.isFinite(n) && n > 0) return Math.floor(n)
  return RECRUIT_PER_CATEGORY_TARGET
}
