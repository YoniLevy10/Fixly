/**
 * Midrag-aligned profession options for pro waitlist signup.
 * Sourced from midrag.co.il SectorPortal list (home / building / tech trades).
 * Sorted א→ת with localeCompare('he').
 */

/** Home-service professions from Midrag — multi-select for pros. */
export const WAITLIST_PROFESSION_OPTIONS: readonly string[] = [
  'אדריכלים והנדסאי אדריכלות',
  'אינסטלטורים',
  'אנשי תריסים',
  'בודקי קרינה',
  'גגנים',
  'גוזמי עצים',
  'גננים',
  'הנדימנים',
  'זגגים',
  'חברות בדק בית',
  'חברות ביובית',
  'חברות מטבחים',
  'חברות ניקוי ספות',
  'חברות ניקיון ופוליש',
  'חשמלאים',
  'טכנאי אינטרקום וקודנים',
  'טכנאי גז',
  'טכנאי דודי שמש',
  'טכנאי טלויזיה',
  'טכנאי מוצרי חשמל',
  'טכנאי מזגנים',
  'טכנאי מחשבים',
  'טכנאי מצלמות ואזעקות',
  'טכנאי רשתות',
  'טכנאי שערים חשמליים',
  'מאתרי נזילות',
  'מדביקי טפטים',
  'מדבירים',
  'מובילים',
  'מנעולנים',
  'מסגרים',
  'מעבדות סלולר',
  'מעצבות פנים',
  'מעצבי וילונות',
  'מפקחי בנייה',
  'מקימי גינות',
  'מרחיקי יונים',
  'מתקיני דודי שמש',
  'מתקיני דלתות',
  'מתקיני מזגנים',
  'מתקיני סוככים',
  'מתקיני פרגולות אלומיניום',
  'מתקיני פרקטים',
  'נגרי מטבחים',
  'נגרי פרגולות ודקים',
  'נגרים',
  'צבעים',
  'קבלני איטום',
  'קבלני אלומיניום',
  'קבלני בניה קלה',
  'קבלני גבס',
  'קבלני ממדים',
  'קבלני שיפוצים',
  'קבלני שיש',
  'קונסטרוקטורים',
  'רפדים',
  'שיפוצניקים',
].slice().sort((a, b) => a.localeCompare(b, 'he'))

const PROFESSION_SET = new Set(WAITLIST_PROFESSION_OPTIONS)

/** Max professions a single pro can select on signup. */
export const WAITLIST_MAX_PROFESSIONS = 8

/** Joined category string length budget for `pro_waitlist.category`. */
export const WAITLIST_CATEGORY_MAX_LEN = 500

export function isWaitlistProfession(value: string): boolean {
  return PROFESSION_SET.has(value.trim())
}

/**
 * Normalize multi-select into a single `category` text column value.
 * Returns null when empty / invalid.
 */
export function joinWaitlistProfessions(
  professions: string[] | undefined | null,
): string | null {
  if (!professions?.length) return null
  const unique = [
    ...new Set(
      professions
        .map((p) => p.trim())
        .filter((p) => p && isWaitlistProfession(p)),
    ),
  ].sort((a, b) => a.localeCompare(b, 'he'))

  if (!unique.length) return null
  const limited = unique.slice(0, WAITLIST_MAX_PROFESSIONS)
  const joined = limited.join(', ')
  return joined.length > WAITLIST_CATEGORY_MAX_LEN
    ? joined.slice(0, WAITLIST_CATEGORY_MAX_LEN)
    : joined
}

export function parseWaitlistProfessions(
  category: string | null | undefined,
): string[] {
  if (!category?.trim()) return []
  return category
    .split(',')
    .map((p) => p.trim())
    .filter((p) => isWaitlistProfession(p))
}
