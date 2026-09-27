export type Category = {
  id: string
  name: string
  slug: string
  icon: string
  description?: string
}

/**
 * Midrag-aligned home-service professions (Hebrew-first).
 * Beauty / tutors removed — Fixly focuses on home trades like Midrag popular sectors.
 */
export const CATEGORIES: Category[] = [
  { id: '1', name: 'אינסטלציה', slug: 'plumbing', icon: '🚿', description: 'תיקוני צנרת, כיורים, נזילות' },
  { id: '2', name: 'חשמל', slug: 'electricity', icon: '⚡', description: 'חשמלאים מוסמכים' },
  { id: '3', name: 'מיזוג אוויר', slug: 'ac', icon: '❄️', description: 'התקנה ותיקון מזגנים' },
  { id: '25', name: 'דודי שמש וחשמל', slug: 'solar', icon: '☀️', description: 'דודי שמש, חשמל וחימום מים' },
  { id: '22', name: 'איטום', slug: 'waterproofing', icon: '🛡️', description: 'איטום גגות, מרפסות ורטיבות' },
  { id: '12', name: 'הדברה', slug: 'pest_control', icon: '🐛', description: 'הדברת מזיקים' },
  { id: '7', name: 'הובלות', slug: 'moving', icon: '🚚', description: 'הובלת דירות ועסקים' },
  { id: '27', name: 'שיפוצים קטנים', slug: 'handyman', icon: '🔧', description: 'תיקונים קטנים בבית — הנדימן' },
  { id: '17', name: 'שיפוצים', slug: 'renovations', icon: '🏗️', description: 'שיפוץ דירות ועסקים' },
  { id: '6', name: 'ניקיון', slug: 'cleaning', icon: '✨', description: 'ניקיון דירות ומשרדים' },
  { id: '5', name: 'צביעה', slug: 'painting', icon: '🎨', description: 'צביעת קירות ודירות' },
  { id: '9', name: 'מנעולן', slug: 'locksmith', icon: '🔐', description: 'פתיחת מנעולים, הצלה' },
  { id: '14', name: 'תיקון מכשירים', slug: 'appliance_repair', icon: '🔌', description: 'מכשירי חשמל ביתיים' },
  { id: '28', name: 'תיקון סמארטפון', slug: 'phone_repair', icon: '📱', description: 'תיקון אייפון וסמארטפון' },
  { id: '8', name: 'גינון', slug: 'gardening', icon: '🌿', description: 'טיפוח גינות וחצרות' },
  { id: '4', name: 'נגרות', slug: 'carpentry', icon: '🪚', description: 'ריהוט, דקים ופרגולות עץ' },
  { id: '10', name: 'ריצוף וקרמיקה', slug: 'tiling', icon: '🧱', description: 'ריצוף, אריחים ומתקיני קרמיקה' },
  { id: '23', name: 'אלומיניום', slug: 'aluminum', icon: '🪟', description: 'חלונות, תריסים ופרגולות' },
  { id: '24', name: 'גבס וטיח', slug: 'drywall', icon: '🧱', description: 'מחיצות ותקרות גבס' },
  { id: '16', name: 'זגגות', slug: 'glazing', icon: '🪟', description: 'חלונות וזכוכית' },
  { id: '13', name: 'ריהוט', slug: 'furniture', icon: '🛋️', description: 'הרכבה ותיקון רהיטים' },
  { id: '11', name: 'מעליות', slug: 'elevators', icon: '🛗', description: 'תיקון ותחזוקת מעליות' },
  { id: '18', name: 'כללי / אחר', slug: 'general', icon: '🧰', description: 'שירותים כלליים' },
]

/** Home grid — Midrag-style popular home trades first */
export const HOME_DISPLAY_CATEGORIES = [
  { name: 'אינסטלציה', slug: 'plumbing', emoji: '🚿' },
  { name: 'חשמל', slug: 'electricity', emoji: '⚡' },
  { name: 'מיזוג אוויר', slug: 'ac', emoji: '❄️' },
  { name: 'דודי שמש וחשמל', slug: 'solar', emoji: '☀️' },
  { name: 'איטום', slug: 'waterproofing', emoji: '🛡️' },
  { name: 'הדברה', slug: 'pest_control', emoji: '🐛' },
  { name: 'הובלות', slug: 'moving', emoji: '🚚' },
  { name: 'שיפוצים קטנים', slug: 'handyman', emoji: '🔧' },
  { name: 'שיפוצים', slug: 'renovations', emoji: '🏗️' },
  { name: 'ניקיון', slug: 'cleaning', emoji: '✨' },
  { name: 'צביעה', slug: 'painting', emoji: '🎨' },
  { name: 'מנעולן', slug: 'locksmith', emoji: '🔐' },
  { name: 'תיקון מכשירים', slug: 'appliance_repair', emoji: '🔌' },
  { name: 'תיקון סמארטפון', slug: 'phone_repair', emoji: '📱' },
  { name: 'גינון', slug: 'gardening', emoji: '🌿' },
  { name: 'נגרות', slug: 'carpentry', emoji: '🪚' },
  { name: 'ריצוף וקרמיקה', slug: 'tiling', emoji: '🧱' },
  { name: 'אלומיניום', slug: 'aluminum', emoji: '🪟' },
  { name: 'גבס וטיח', slug: 'drywall', emoji: '🧱' },
]

/** Search / filter chips — full profession list */
export const PROFESSIONALS_FILTER_CATEGORIES = CATEGORIES.filter(
  (c) => c.slug !== 'general'
).map((c) => ({ slug: c.slug, name: c.name, icon: c.icon }))
