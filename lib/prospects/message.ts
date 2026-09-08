import { JOIN_URL, getRecruitCity } from '@/lib/prospects/config'

export type RecruitMessageInput = {
  name: string
  category: string
  city?: string
  /** Only pass when counted from real matching open requests. */
  matchingOpenRequests?: number | null
}

/**
 * Trusted recruitment copy. Never invent demand numbers.
 * matchingOpenRequests is appended only when > 0 from a real DB count.
 */
export function buildRecruitWhatsAppMessage(input: RecruitMessageInput): string {
  const city = input.city?.trim() || getRecruitCity()
  const name = input.name.trim() || 'שלום'
  const category = input.category.trim() || 'השירות שלך'

  const lines = [
    `שלום ${name}, ראינו שאתה נותן שירות בתחום ${category} ב${city}. Fixly היא פלטפורמה חדשה שמחברת בין לקוחות לאנשי מקצוע זמינים, וכרגע אנחנו מגייסים את קבוצת אנשי המקצוע הראשונית ב${city}. ההצטרפות ללא עלות וללא התחייבות, וכשיתקבלו פניות מתאימות בתחום ובאזור שלך נעדכן אותך. להצטרפות: ${JOIN_URL}`,
  ]

  const demand = input.matchingOpenRequests
  if (typeof demand === 'number' && demand > 0 && Number.isInteger(demand)) {
    lines.push(
      `כרגע יש אצלנו ${demand} בקשות פעילות ומתאימות בתחום ובאזור שלך.`,
    )
  }

  return lines.join('\n')
}
