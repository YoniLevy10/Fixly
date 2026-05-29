export type Category = {
  id: string
  name: string
  slug: string
  icon: string
  description?: string
}

export const CATEGORIES: Category[] = [
  { id: '1', name: 'אינסטלציה', slug: 'plumbing', icon: '🔧', description: 'תיקוני צנרת, כיורים, שירותים' },
  { id: '2', name: 'חשמל', slug: 'electricity', icon: '⚡', description: 'חשמלאים מוסמכים' },
  { id: '3', name: 'מיזוג אוויר', slug: 'ac', icon: '❄️', description: 'התקנה ותיקון מזגנים' },
  { id: '4', name: 'נגרות', slug: 'carpentry', icon: '🪚', description: 'ריהוט ועץ' },
  { id: '5', name: 'צביעה', slug: 'painting', icon: '🎨', description: 'צביעת קירות ודירות' },
  { id: '6', name: 'ניקיון', slug: 'cleaning', icon: '🧹', description: 'ניקיון דירות ומשרדים' },
  { id: '7', name: 'הובלות', slug: 'moving', icon: '🚚', description: 'הובלת רהיטים ועסקים' },
  { id: '8', name: 'גינון', slug: 'gardening', icon: '🌿', description: 'טיפוח גינות וחצרות' },
  { id: '9', name: 'מנעולן', slug: 'locksmith', icon: '🔑', description: 'פתיחת מנעולים, הצלה' },
  { id: '10', name: 'ריצוף', slug: 'tiling', icon: '🏗️', description: 'ריצוף ואריחים' },
]

/** Grid tiles on home (BASE44 Home.jsx) */
export const HOME_DISPLAY_CATEGORIES = [
  { name: 'מיזוג אוויר', slug: 'ac', emoji: '❄️' },
  { name: 'אינסטלטור', slug: 'plumbing', emoji: '🚿' },
  { name: 'חשמלאי', slug: 'electricity', emoji: '💡' },
  { name: 'מנעולן', slug: 'locksmith', emoji: '🔐' },
  { name: 'צבעי', slug: 'painting', emoji: '🎨' },
  { name: 'ניקיון', slug: 'cleaning', emoji: '🧹' },
  { name: 'גינון', slug: 'gardening', emoji: '🌿' },
  { name: 'נגרות', slug: 'carpentry', emoji: '🪑' },
  { name: 'ריצוף', slug: 'tiling', emoji: '🏗️' },
]

export const PROFESSIONALS_FILTER_CATEGORIES = [
  { slug: 'ac', name: 'מיזוג אוויר', icon: '❄️' },
  { slug: 'plumbing', name: 'אינסטלטור', icon: '🚿' },
  { slug: 'electricity', name: 'חשמלאי', icon: '💡' },
  { slug: 'locksmith', name: 'מנעולן', icon: '🔐' },
  { slug: 'painting', name: 'צבעי', icon: '🎨' },
  { slug: 'cleaning', name: 'ניקיון', icon: '🧹' },
  { slug: 'gardening', name: 'גינון', icon: '🌿' },
  { slug: 'carpentry', name: 'נגרות', icon: '🪑' },
  { slug: 'tiling', name: 'ריצוף', icon: '🏗️' },
]
