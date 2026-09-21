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
    return 'OpenStreetMap (Overpass) לא הגיב במלואו — נסו שוב או הריצו גילוי מאוחר יותר'
  }
  if (
    msg.includes('נעילה שוחררה') ||
    msg.includes('הריצה הקודמת מתה') ||
    msg.includes('תהליך שרת נקטע')
  ) {
    return 'הנעילה שוחררה — הריצה הקודמת נקטעה; אפשר להריץ שוב'
  }
  if (msg.includes('timeout') || msg.includes('aborted') || msg.includes('abort')) {
    return 'החיפוש ארך יותר מדי ונקטע — נסו שוב'
  }
  if (
    msg.includes('website_url') &&
    (msg.includes('does not exist') || msg.includes('schema cache'))
  ) {
    return 'חסרה עמודת website_url במסד — הריצו את המיגרציה 20260909180000_prospect_source_refs_license ואז גילוי מחדש'
  }
  if (
    msg.includes('source_refs') &&
    (msg.includes('does not exist') || msg.includes('schema cache'))
  ) {
    return 'חסרות עמודות גיוס חדשות במסד — הריצו מיגרציית source_refs/license (ראה docs/PRO_OUTREACH.md)'
  }
  if (msg.includes('source failed') || msg.includes('ingest')) {
    return 'הסריקה מצאה לידים אבל השמירה למסד נכשלה — בדקו מיגרציות / עמודות חדשות'
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
