import type { SeoCategory, SeoCity } from '@/lib/seo/marketplace-pages'

export function categoryCityFaqs(
  category: SeoCategory,
  city: SeoCity,
  proCount: number,
): { question: string; answer: string }[] {
  const where = `ב${city.nameHe}`
  return [
    {
      question: `איך מוצאים ${category.nameHe} ${where}?`,
      answer:
        proCount > 0
          ? `ב-Fixly אפשר לראות ${category.nameHe} רלוונטיים ${where}, לשלוח בקשה אחת ולעקוב עד שהעבודה מסתיימת.`
          : `Fixly בונה מאגר ארצי של בעלי מקצוע. ${where} נפתח ללקוחות כשיש צפיפות אמיתית — אפשר להירשם לעדכון.`,
    },
    {
      question: `האם השירות של Fixly עולה כסף ללקוח?`,
      answer: `שליחת בקשה ומעקב ב-Fixly הם ללא תשלום ללקוח. התשלום על העבודה עצמה הוא מול בעל המקצוע.`,
    },
    {
      question: `האם Fixly פעילה רק ב${city.nameHe}?`,
      answer: `לא. Fixly היא מערכת ארצית בישראל. העמוד הזה ממוקד ב-${category.nameHe} ${where}, ויש עמודי ערים ומקצועות נוספים ברחבי הארץ.`,
    },
    {
      question: `${category.jobsHe} — איך מצטרפים כבעל מקצוע?`,
      answer: `ההצטרפות ל-Fixly חינם, ללא מנוי וללא עמלה וללא התחייבות. נרשמים בעמוד לבעלי מקצוע וממתינים להתאמה לפי תחום ואזור.`,
    },
  ]
}

export function categoryHubFaqs(category: SeoCategory): { question: string; answer: string }[] {
  return [
    {
      question: `איפה אפשר למצוא ${category.nameHe} ב-Fixly?`,
      answer: `בחר/י עיר מהרשימה למטה כדי לראות ${category.nameHe} באזור שלך. Fixly מכסה ערים ברחבי ישראל לפי צפיפות אמיתית.`,
    },
    {
      question: category.jobsHe + ' — איך זה עובד?',
      answer: `בעלי מקצוע נרשמים בחינם. כשיש ביקוש רלוונטי בתחום ובאזור, אפשר לקבל פניות דרך Fixly — בלי הבטחת כמות לידים.`,
    },
  ]
}

export function locationHubFaqs(city: SeoCity): { question: string; answer: string }[] {
  return [
    {
      question: `אילו בעלי מקצוע יש ב-Fixly ב${city.nameHe}?`,
      answer: `לכל עיר יש עמודי מקצוע נפרדים (אינסטלטור, חשמלאי, הנדימן ועוד). מוצגים רק אנשי מקצוע אמיתיים — בלי פרופילי דמו.`,
    },
    {
      question: `אני בעל מקצוע ב${city.nameHe} — איך מצטרפים?`,
      answer: `ההרשמה חינם, ללא מנוי וללא עמלה. נרשמים כבעל מקצוע ומציינים את אזור השירות.`,
    },
  ]
}
