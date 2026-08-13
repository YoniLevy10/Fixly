/** Shared seeds for investor-grade demo dataset */

export const DEMO_CITIES = [
  'תל אביב',
  'ירושלים',
  'חיפה',
  'באר שבע',
  'פתח תקווה',
  'ראשון לציון',
  'נתניה',
  'הרצליה',
  'רמת גן',
  'גבעתיים',
  'חולון',
  'אשדוד',
  'מודיעין',
  'כפר סבא',
  'רעננה',
] as const

export const DEMO_FIRST_NAMES = [
  'יוסי',
  'דוד',
  'מוחמד',
  'רחל',
  'אמיר',
  'ניר',
  'מיכל',
  'שרה',
  'אבי',
  'יעל',
  'רון',
  'נועה',
  'תומר',
  'הילה',
  'גיא',
  'לינוי',
  'עמית',
  'מאיה',
  'אלון',
  'שירה',
  'ניב',
  'טל',
  'קרן',
  'אורית',
  'דנה',
  'עידו',
  'ליאור',
  'מור',
  'גל',
  'איתי',
  'שי',
  'רותם',
  'אסף',
  'מעיין',
  'בן',
  'הדר',
  'יובל',
  'עומר',
  'ניצן',
  'אלה',
] as const

export const DEMO_LAST_NAMES = [
  'כהן',
  'לוי',
  'מזרחי',
  'אברהם',
  'פרץ',
  'שמש',
  'בר',
  'גולן',
  'שחר',
  'קורן',
  'וייס',
  'אטיאס',
  'חזן',
  'אולמן',
  'נחמיאס',
  'פלד',
  'דהן',
  'גרין',
  'עבאס',
  'שלמה',
  'רוזן',
  'ביטון',
  'חדד',
  'סבג',
  'אזולאי',
  'מלכה',
  'טובי',
  'שפירא',
  'אדרי',
  'זוהר',
] as const

export const DEMO_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1557862921-37829c790f19?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&crop=face',
] as const

export const DEMO_GALLERY = [
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop',
] as const

export type DemoCategoryDef = {
  category: string
  slug: string
  titleTemplates: string[]
  count: number
  basePrice: number
  services: { name: string; price: number }[]
  jobTitles: string[]
}

export const DEMO_CATEGORY_DEFS: DemoCategoryDef[] = [
  {
    category: 'מניקור וציפורניים',
    slug: 'nails',
    titleTemplates: ['טכנאית ציפורניים', 'מניקוריסטית מוסמכת', 'מומחית ג׳ל'],
    count: 8,
    basePrice: 120,
    services: [
      { name: 'מניקור קלאסי', price: 120 },
      { name: 'מניקור ג׳ל', price: 160 },
      { name: 'פדיקור ג׳ל', price: 190 },
    ],
    jobTitles: ['מניקור ג׳ל עד הבית', 'פדיקור ספא', 'מילוי ציפורניים', 'מניקור לאירוע'],
  },
  {
    category: 'תספורת ועיצוב',
    slug: 'hair',
    titleTemplates: ['ספר נייד', 'מעצבת שיער', 'ספר גברים'],
    count: 5,
    basePrice: 100,
    services: [
      { name: 'תספורת גברים', price: 100 },
      { name: 'תספורת נשים', price: 180 },
      { name: 'פן / עיצוב', price: 140 },
    ],
    jobTitles: ['תספורת עד הבית', 'פן לאירוע', 'תספורת + זקן', 'עיצוב שיער'],
  },
]

export const DEMO_REVIEW_TEXTS = [
  'הגיעה בזמן, עבודה מושלמת. ממליצה בחום!',
  'מחיר הוגן, תוצאה מקצועית עד הבית.',
  'נקייה, מדויקת ואדיבה — חוויה מעולה.',
  'כמו במכון, רק בסלון שלי. וואו.',
  'קצת איחור אבל התוצאה שווה.',
  'הכי טובה שעבדתי איתה בתחום.',
  'זמינות גבוהה, מענה מהיר באפליקציה.',
  'מומלץ מאוד לחברות ולמשפחה.',
  'סטריליזציה מלאה, הרגשה בטוחה.',
  'שירות VIP, שווה כל שקל.',
  'הסבירה את האפשרויות לפני שהתחילה.',
  'עבודה מהירה בלי להתפשר על איכות.',
] as const

export const DEMO_STREETS = [
  'דיזנגוף',
  'רוטשילד',
  'הרצל',
  'בן יהודה',
  'ויצמן',
  'ביאליק',
  'הנביאים',
  'אבן גבירול',
  'ארלוזורוב',
  'ז׳בוטינסקי',
  'השלום',
  'הפלמ״ח',
] as const
