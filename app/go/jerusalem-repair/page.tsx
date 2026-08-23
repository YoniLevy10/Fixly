import type { Metadata } from 'next'
import CampaignLanding from '@/components/marketing/CampaignLanding'

export const metadata: Metadata = {
  title: 'בעל מקצוע בירושלים בלי לרדוף אחרי אנשים',
  description: 'מתארים את התקלה, Fixly מאתרת בעלי מקצוע מתאימים ועוזרת לעקוב עד לסיום.',
}

export default function JerusalemCustomerLanding() {
  return <CampaignLanding variant="customer" />
}
