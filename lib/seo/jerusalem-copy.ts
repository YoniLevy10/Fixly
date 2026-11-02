import { SEO_CATEGORIES } from '@/lib/seo/marketplace-pages'

/** Priority city×category intents for the Jerusalem organic cluster. */
export const JERUSALEM_PRIORITY_CATEGORIES = [
  'plumbing',
  'electricity',
  'ac',
] as const

export type JerusalemPriorityCategory =
  (typeof JERUSALEM_PRIORITY_CATEGORIES)[number]

type JerusalemIntro = {
  /** Short lead under the H1 — unique per category. */
  lead: string
  /** Supporting H2 heading. */
  h2: string
  /** Body under the H2. */
  body: string
}

/**
 * Unique Hebrew intros for Jerusalem priority landings.
 * Not generic “מצא X בעיר Y” boilerplate — city-specific intent copy.
 */
export const JERUSALEM_CATEGORY_INTROS: Record<
  JerusalemPriorityCategory,
  JerusalemIntro
> = {
  plumbing: {
    lead:
      'צריך אינסטלטור בירושלים? מתיחות מים בבניינים ישנים, סתימות במרכז העיר ודליפות אחרי שיפוץ — זה השגרה פה. Fixly מחברת אתכם לבעלי מקצוע מאומתים באזור, בלי רשימות דמו.',
    h2: 'אינסטלציה בירושלים — מה חשוב לבדוק',
    body:
      'בירושלים כדאי לוודא זמינות לשכונה שלכם (מרכז, קטמונים, רמות, גילה ועוד), רישיון רלוונטי לעבודות לחץ/ביוב, ומחיר שקוף לפני היציאה. דרך Fixly שולחים בקשה אחת ומקבלים מענה מסודר.',
  },
  electricity: {
    lead:
      'חשמלאי בירושלים נדרש לא רק לקצרים — גם לשדרוג לוחות בבניינים ותיקים, התקנות בטוחות בדירות שכורות ובדיקות אחרי שיפוץ. כאן תמצאו נתיב ברור לבקשה או להרשמה כשאין עדיין אספקה באזור.',
    h2: 'חשמל בירושלים — בטיחות וזמינות',
    body:
      'חפשו חשמלאי מוסמך שמכיר את השכונה, עובד עם לוחות ישנים ומספק הצעה לפני עבודה. ב-Fixly הבקשה מתועדת — פחות התכתבויות בואטסאפ ופחות הפתעות במחיר.',
  },
  ac: {
    lead:
      'מיזוג בירושלים זה סיפור של קיץ יבש וחורף קר: התקנות, תיקוני גז, ניקוי והחלפת יחידות בגגות ובמרפסות. דף זה מיועד למי שמחפש טכנאי מזגנים אמיתי בעיר — לא קטלוג דמו.',
    h2: 'מיזוג אוויר בירושלים — התקנה ותיקון',
    body:
      'ציינו סוג מערכת (עילי, מיני-מרכזי, אינוורטר), קומה/גישה לגג, ודחיפות. Fixly מעבירה את הפרטים לבעל מקצוע באזור או פותחת הרשמה כשיש ביקוש אבל עדיין אין אספקה מאומתת.',
  },
}

export function isJerusalemPriorityCategory(
  slug: string,
): slug is JerusalemPriorityCategory {
  return (JERUSALEM_PRIORITY_CATEGORIES as readonly string[]).includes(slug)
}

export function getJerusalemCategoryIntro(categorySlug: string): JerusalemIntro | null {
  if (!isJerusalemPriorityCategory(categorySlug)) return null
  return JERUSALEM_CATEGORY_INTROS[categorySlug]
}

/** Homepage / footer hot links: 3 Jerusalem priority category paths. */
export function jerusalemPriorityLinks() {
  return JERUSALEM_PRIORITY_CATEGORIES.map((slug) => {
    const cat = SEO_CATEGORIES.find((c) => c.slug === slug)!
    return {
      categorySlug: slug,
      path: `/professionals/${slug}/jerusalem`,
      label: `${cat.nameHe} בירושלים`,
    }
  })
}
