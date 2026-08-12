export type Category = {
  id: string
  name: string
  slug: string
  icon: string
  description?: string
}

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
  { id: '18', name: 'כללי / אחר', slug: 'general', icon: '🧰', description: 'שירותים כלליים' },
]

/** Grid tiles on home */
export const HOME_DISPLAY_CATEGORIES = [
  { name: 'מיזוג אוויר', slug: 'ac', emoji: '❄️' },
  { name: 'אינסטלציה', slug: 'plumbing', emoji: '🚿' },
  { name: 'חשמל', slug: 'electricity', emoji: '⚡' },
  { name: 'מנעולן', slug: 'locksmith', emoji: '🔐' },
  { name: 'צביעה', slug: 'painting', emoji: '🎨' },
  { name: 'ניקיון', slug: 'cleaning', emoji: '✨' },
  { name: 'גינון', slug: 'gardening', emoji: '🌿' },
  { name: 'נגרות', slug: 'carpentry', emoji: '🪚' },
  { name: 'ריצוף', slug: 'tiling', emoji: '🧱' },
]

export const PROFESSIONALS_FILTER_CATEGORIES = [
  { slug: 'ac', name: 'מיזוג אוויר', icon: '❄️' },
  { slug: 'plumbing', name: 'אינסטלציה', icon: '🚿' },
  { slug: 'electricity', name: 'חשמל', icon: '⚡' },
  { slug: 'locksmith', name: 'מנעולן', icon: '🔐' },
  { slug: 'painting', name: 'צביעה', icon: '🎨' },
  { slug: 'cleaning', name: 'ניקיון', icon: '✨' },
  { slug: 'gardening', name: 'גינון', icon: '🌿' },
  { slug: 'carpentry', name: 'נגרות', icon: '🪚' },
  { slug: 'tiling', name: 'ריצוף', icon: '🧱' },
  { slug: 'moving', name: 'הובלות', icon: '🚚' },
  { slug: 'elevators', name: 'מעליות', icon: '🛗' },
  { slug: 'furniture', name: 'ריהוט', icon: '🛋️' },
  { slug: 'appliance_repair', name: 'תיקון מכשירים', icon: '🔌' },
  { slug: 'computers', name: 'מחשבים', icon: '💻' },
  { slug: 'glazing', name: 'זגגות', icon: '🪟' },
  { slug: 'renovations', name: 'שיפוצים', icon: '🏗️' },
]
