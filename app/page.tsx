import MarketplaceBanner from '@/components/marketplace/MarketplaceBanner'
import MarketplaceHero from '@/components/layout/MarketplaceHero'
import MarketplaceScreen from '@/components/layout/MarketplaceScreen'
import MarketplaceSection from '@/components/layout/MarketplaceSection'
import CategoryGrid from '@/components/marketplace/CategoryGrid'
import ProfessionalCard from '@/components/marketplace/ProfessionalCard'
import SearchBar from '@/components/ui/SearchBar'
import { professionals } from '@/lib/mock-data'

export default function HomePage() {
  return (
    <MarketplaceScreen>
      <MarketplaceHero
        title="Fixly"
        subtitle="Book trusted professionals instantly — electricians, cleaners, plumbers and repair experts near you."
      />

      <SearchBar placeholder="What service do you need?" />

      <MarketplaceSection
        title="Popular Services"
        action="View all"
      >
        <CategoryGrid />
      </MarketplaceSection>

      <MarketplaceSection
        title="Top Professionals"
        action="See all"
      >
        {professionals.map((professional) => (
          <ProfessionalCard
            key={professional.id}
            name={professional.name}
            category={professional.category}
            rating={professional.rating}
            jobsCompleted={professional.jobsCompleted}
            available={professional.available}
          />
        ))}
      </MarketplaceSection>

      <MarketplaceBanner />
    </MarketplaceScreen>
  )
}
