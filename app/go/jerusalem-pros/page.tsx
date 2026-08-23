import type { Metadata } from 'next'
import CampaignLanding from '@/components/marketing/CampaignLanding'

export const metadata: Metadata = {
  title: 'עבודות חדשות לבעלי מקצוע בירושלים',
  description: 'קבלו פניות רלוונטיות לפי תחום, אזור וזמינות עם Fixly.',
}

export default function JerusalemProLanding() {
  return <CampaignLanding variant="professional" />
}
