/**
 * Short Hebrew summaries for discovery-run errors (no raw API/SQL dumps).
 */

export function humanizeDiscoveryError(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  const msg = raw.toLowerCase()
  if (
    msg.includes('duplicate key') ||
    msg.includes('idx_prospects_phone') ||
    msg.includes('unique constraint')
  ) {
    return 'חלק מהמספרים כבר היו במערכת — נשמרו רק לידים חדשים'
  }
  if (
    msg.includes('places api') &&
    (msg.includes('disabled') || msg.includes('has not been used') || msg.includes('403'))
  ) {
    return 'Google Places לא פעיל בפרויקט — יש להפעיל Places API (New) ב-Google Cloud'
  }
  if (msg.includes('google places') || msg.includes('places.googleapis')) {
    if (msg.includes('403')) {
      return 'אין הרשאה ל-Google Places (403) — בדקו מפתח API והפעלת השירות'
    }
    if (msg.includes('429') || msg.includes('quota') || msg.includes('resource exhausted')) {
      return 'חרגתם ממכסת Google Places — נסו שוב מאוחר יותר'
    }
    return 'תקלה ב-Google Places — חלק מהחיפושים לא הושלמו'
  }
  if (msg.includes('403')) {
    return 'אין הרשאה ל-Google Places (403) — בדקו מפתח API והפעלת השירות'
  }
  if (msg.includes('429') || msg.includes('quota') || msg.includes('resource exhausted')) {
    return 'חרגתם ממכסת Google Places — נסו שוב מאוחר יותר'
  }
  if (msg.includes('google_places_api_key') || msg.includes('api key')) {
    return 'חסר או לא תקין מפתח Google Places'
  }
  if (msg.includes('אין מקורות')) {
    return 'אין מקורות גילוי זמינים'
  }
  if (
    msg.includes('could not embed') ||
    msg.includes('more than one relationship') ||
    (msg.includes('professional_prospects') && msg.includes('service_categories'))
  ) {
    return 'שגיאת שמירה במסד (קישור לקטגוריה) — הריצה מצאה לידים אבל לא שמרה אותם; יש לפרוס תיקון ה-embed'
  }
  if (
    msg.includes('overpass') ||
    msg.includes('osm') ||
    msg.includes('too many requests') ||
    msg.includes('gateway time') ||
    msg.includes('504') ||
    msg.includes('502') ||
    msg.includes('503')
  ) {
    return 'OpenStreetMap (Overpass) לא הגיב במלואו — רוב הלידים מגיעים מ-Google Places'
  }
  if (msg.includes('timeout') || msg.includes('aborted') || msg.includes('abort')) {
    return 'החיפוש ארך יותר מדי ונקטע — נסו שוב'
  }
  // Keep a short technical hint so Superadmin isn't stuck with a blank "partial"
  const clipped = raw.trim().replace(/\s+/g, ' ').slice(0, 160)
  return `תקלה חלקית: ${clipped}`
}

/** Dedupe humanized messages from a list of raw errors. */
export function humanizeDiscoveryErrors(
  rawErrors: Array<string | null | undefined>,
): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of rawErrors) {
    const h = humanizeDiscoveryError(raw)
    if (!h || seen.has(h)) continue
    seen.add(h)
    out.push(h)
  }
  return out
}
