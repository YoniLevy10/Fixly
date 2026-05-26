import MarketplaceHero from '@/components/layout/MarketplaceHero'
import MarketplaceScreen from '@/components/layout/MarketplaceScreen'
import MarketplaceSection from '@/components/layout/MarketplaceSection'
import ProfessionalCard from '@/components/marketplace/ProfessionalCard'
import CategoryChips from '@/components/ui/CategoryChips'
import SearchBar from '@/components/ui/SearchBar'
import { professionals } from '@/lib/mock-data'

export default function ProfessionalsPage() {
  return (
    <MarketplaceScreen>
      <MarketplaceHero
        title="Professionals"
        subtitle="Browse trusted local professionals ready to help with cleaning, plumbing, electrical repairs and more."
      />

      <SearchBar placeholder="Search professionals..." />

      <div style={{ marginBottom: '32px' }}>
        <CategoryChips
          active="All"
          items={[
            'All',
            'Electrician',
            'Cleaning',
            'Plumber',
            'Painting',
          ]}
        />
      </div>

      <MarketplaceSection title="Available Near You">
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
    </MarketplaceScreen>
  )
}
