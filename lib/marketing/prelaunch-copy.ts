/**
 * Pre-launch landing copy — keep short; one idea per block.
 */
export const prelaunchCopy = {
  brand: 'Fixly',
  eyebrow: 'בקרוב בישראל',
  headline: 'בעל מקצוע עד הבית — בלי עשרות טלפונים',
  subheadline: 'בקשה אחת, התאמה לפי תחום ואזור, ומעקב עד סיום.',
  primaryCta: 'הצטרפו בחינם',
  trustLine: 'בלי כרטיס אשראי · הרשמה ב־30 שניות',
  waitlistTitle: 'הרשמה מוקדמת',
  waitlistLead: 'שם וטלפון — ונעדכן כשנפתח באזור שלכם.',
  customerHint: 'לקוחות — חינם, בלי התחייבות',
  proHint: 'בעלי מקצוע — עדיפות בפיילוט',
  submitCustomer: 'שמרו לי מקום',
  submitPro: 'הצטרפו כבעלי מקצוע',
  successTitle: 'נרשמתם בהצלחה',
  successCustomer: 'נעדכן אתכם לקראת הפתיחה.',
  successPro: 'נעדכן אתכם עם פרטי הצטרפות לבעלי מקצוע.',
  faqTitle: 'שאלות קצרות',
  faq: [
    {
      q: 'זה עולה כסף?',
      a: 'ללקוחות בחינם. בעלי מקצוע מקבלים 3 לידים ראשונים — בלי חיוב בהרשמה.',
    },
    {
      q: 'למי זה מתאים?',
      a: 'למי שצריך תיקון בבית, ולבעלי מקצוע שמחפשים בקשות רלוונטיות באזור.',
    },
  ],
  stickyCta: 'הצטרפו בחינם',
} as const

export type PrelaunchCopy = typeof prelaunchCopy
