import MarketplaceScreen from '@/components/layout/MarketplaceScreen'
import MarketplaceSection from '@/components/layout/MarketplaceSection'
import ProfileAbout from '@/components/marketplace/ProfileAbout'
import ProfileHeader from '@/components/marketplace/ProfileHeader'
import ProfileReviewsSection from '@/components/marketplace/ProfileReviewsSection'
import ProfileStats from '@/components/marketplace/ProfileStats'
import StickyCTA from '@/components/marketplace/StickyCTA'

export default function ProfessionalPage() {
  return (
    <MarketplaceScreen withNavigation={false}>
      <ProfileHeader
        name="Daniel Electric"
        category="Certified Electrician"
        rating={4.9}
      />

      <div style={{ height: '22px' }} />

      <ProfileStats
        completedJobs={120}
        rating={4.9}
        years={8}
      />

      <div style={{ height: '22px' }} />

      <ProfileAbout description="Professional electrician with over 8 years of experience in home and business electrical services. Fast response, clean work, and trusted by hundreds of customers." />

      <div style={{ height: '32px' }} />

      <MarketplaceSection title="Reviews">
        <ProfileReviewsSection />
      </MarketplaceSection>

      <StickyCTA label="Request Service" />
    </MarketplaceScreen>
  )
}
