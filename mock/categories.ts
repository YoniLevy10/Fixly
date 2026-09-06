export type Category = {
  id: string
  name: string
  slug: string
  icon: string
  description?: string
}

/** Full marketplace profession list (Hebrew-first). */
export const CATEGORIES: Category[] = [
  { id: '1', name: 'אינסטלציה', slug: 'plumbing', icon: '🚿', description: 'תיקוני צנרת, כיורים, שירותים' },
  { id: '2', name: 'חשמל', slug: 'electricity', icon: '⚡', description: 'חשמלאים מוסמכים' },
  { id: '3', name: 'מיזוג אוויר', slug: 'ac', icon: '❄️', description: 'התקנה ותיקון מזגנים' },
  { id: '4', name: 'נגרות', slug: 'carpentry', icon: '🪚', description: 'ריהוט ועץ' },
  { id: '5', name: 'צביעה', slug: 'painting', icon: '🎨', description: 'צביעת קירות ודירות' },
  { id: '6', name: 'ניקיון', slug: 'cleaning', icon: '✨', description: 'ניקיון דירות ומשרדים' },
  { id: '7', name: 'הובלות', slug: 'moving', icon: '🚚', description: 'הובלת רהיטים ועסקים' },
  { id: '8', name: 'גינון', slug: 'gardening', icon: '🌿', description: 'טיפוח גינות וחצרות' },
  { id: '9', name: 'מנעולן', slug: 'locksmith', icon: '🔐', description: 'פתיחת מנעולים, הצלה' },
  { id: '10', name: 'ריצוף', slug: 'tiling', icon: '🧱', description: 'ריצוף ואריחים' },
  { id: '11', name: 'מעליות', slug: 'elevators', icon: '🛗', description: 'תיקון ותחזוקת מעליות' },
  { id: '12', name: 'הדברה', slug: 'pest_control', icon: '🐛', description: 'הדברת מזיקים' },
  { id: '13', name: 'ריהוט', slug: 'furniture', icon: '🛋️', description: 'הרכבה ותיקון רהיטים' },
  { id: '14', name: 'תיקון מכשירים', slug: 'appliance_repair', icon: '🔌', description: 'מכשירי חשמל ביתיים' },
  { id: '15', name: 'מחשבים', slug: 'computers', icon: '💻', description: 'תיקון מחשבים וטכנולוגיה' },
  { id: '16', name: 'זגגות', slug: 'glazing', icon: '🪟', description: 'חלונות וזכוכית' },
  { id: '17', name: 'שיפוצים', slug: 'renovations', icon: '🏗️', description: 'שיפוץ דירות ועסקים' },
  { id: '22', name: 'איטום', slug: 'waterproofing', icon: '🛡️', description: 'איטום גגות, מרפסות ורטיבות' },
  { id: '23', name: 'אלומיניום', slug: 'aluminum', icon: '🪟', description: 'חלונות, תריסים ופרגולות' },
  { id: '24', name: 'גבס וטיח', slug: 'drywall', icon: '🧱', description: 'מחיצות ותקרות גבס' },
  { id: '25', name: 'סולאר ואנרגיה', slug: 'solar', icon: '☀️', description: 'דודי שמש ומערכות סולאריות' },
  { id: '19', name: 'מניקור וציפורניים', slug: 'nails', icon: '💅', description: 'מניקור, ג׳ל ופדיקור עד הבית' },
  { id: '20', name: 'תספורת ועיצוב', slug: 'hair', icon: '✂️', description: 'ספרים ומעצבי שיער ניידים' },
  { id: '21', name: 'איפור', slug: 'makeup', icon: '💄', description: 'מאפרות עד הבית, מלון או משרד' },
  { id: '18', name: 'כללי / אחר', slug: 'general', icon: '🧰', description: 'שירותים כלליים' },
]

/** Grid tiles on home — mix of beauty + top home services */
export const HOME_DISPLAY_CATEGORIES = [
  { name: 'מניקור וציפורניים', slug: 'nails', emoji: '💅' },
  { name: 'תספורת ועיצוב', slug: 'hair', emoji: '✂️' },
  { name: 'איפור', slug: 'makeup', emoji: '💄' },
  { name: 'מיזוג אוויר', slug: 'ac', emoji: '❄️' },
  { name: 'אינסטלציה', slug: 'plumbing', emoji: '🚿' },
  { name: 'חשמל', slug: 'electricity', emoji: '⚡' },
  { name: 'מנעולן', slug: 'locksmith', emoji: '🔐' },
  { name: 'צביעה', slug: 'painting', emoji: '🎨' },
  { name: 'ניקיון', slug: 'cleaning', emoji: '✨' },
  { name: 'גינון', slug: 'gardening', emoji: '🌿' },
  { name: 'נגרות', slug: 'carpentry', emoji: '🪚' },
  { name: 'ריצוף', slug: 'tiling', emoji: '🧱' },
  { name: 'שיפוצים', slug: 'renovations', emoji: '🏗️' },
  { name: 'הדברה', slug: 'pest_control', emoji: '🐛' },
  { name: 'איטום', slug: 'waterproofing', emoji: '🛡️' },
  { name: 'אלומיניום', slug: 'aluminum', emoji: '🪟' },
]

/** Search / filter chips — full profession list */
export const PROFESSIONALS_FILTER_CATEGORIES = CATEGORIES.filter(
  (c) => c.slug !== 'general'
).map((c) => ({ slug: c.slug, name: c.name, icon: c.icon }))
