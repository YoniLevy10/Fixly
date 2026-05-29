/** Slugs highlighted by season (Israel-oriented) */
export function getSeasonalCategorySlugs(date = new Date()): string[] {
  const month = date.getMonth() + 1
  if (month >= 6 && month <= 9) return ['ac', 'plumbing', 'electricity']
  if (month >= 11 || month <= 2) return ['plumbing', 'electricity', 'locksmith']
  if (month >= 3 && month <= 5) return ['gardening', 'painting', 'cleaning']
  return ['plumbing', 'electricity', 'ac']
}
