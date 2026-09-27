const BASE_BY_SLUG: Record<string, [number, number]> = {
  plumbing: [150, 400],
  electricity: [200, 500],
  ac: [250, 600],
  cleaning: [120, 300],
  painting: [300, 800],
  locksmith: [180, 350],
  carpentry: [200, 500],
  gardening: [150, 400],
  tiling: [250, 700],
  moving: [400, 1200],
  handyman: [150, 400],
  phone_repair: [120, 450],
}

export function estimatePriceRange(categorySlug: string): { min: number; max: number } | null {
  const range = BASE_BY_SLUG[categorySlug]
  if (!range) return null
  return { min: range[0], max: range[1] }
}

export function guessCategorySlug(categoryLabel: string): string {
  const lower = categoryLabel.toLowerCase()
  if (lower.includes('סמארטפון') || lower.includes('אייפון') || lower.includes('phone'))
    return 'phone_repair'
  if (lower.includes('הנדימן') || lower.includes('שיפוצים קטנים') || lower.includes('handyman'))
    return 'handyman'
  if (lower.includes('אינסטל') || lower.includes('plumb')) return 'plumbing'
  if (lower.includes('חשמל') || lower.includes('electric')) return 'electricity'
  if (lower.includes('מיזוג') || lower.includes('ac')) return 'ac'
  if (lower.includes('ניקיון') || lower.includes('clean')) return 'cleaning'
  return 'plumbing'
}
