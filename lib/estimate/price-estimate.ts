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
  nails: [110, 280],
  hair: [90, 350],
  makeup: [220, 700],
}

export function estimatePriceRange(categorySlug: string): { min: number; max: number } | null {
  const range = BASE_BY_SLUG[categorySlug]
  if (!range) return null
  return { min: range[0], max: range[1] }
}

export function guessCategorySlug(categoryLabel: string): string {
  const lower = categoryLabel.toLowerCase()
  if (lower.includes('מניקור') || lower.includes('ציפורן') || lower.includes('nail')) return 'nails'
  if (
    lower.includes('תספורת') ||
    lower.includes('ספר') ||
    lower.includes('hair') ||
    lower.includes('barber')
  )
    return 'hair'
  if (lower.includes('איפור') || lower.includes('מאפר') || lower.includes('makeup')) return 'makeup'
  if (lower.includes('אינסטל') || lower.includes('plumb')) return 'plumbing'
  if (lower.includes('חשמל') || lower.includes('electric')) return 'electricity'
  if (lower.includes('מיזוג') || lower.includes('ac')) return 'ac'
  if (lower.includes('ניקיון') || lower.includes('clean')) return 'cleaning'
  return 'plumbing'
}
