import CategoryCard from '@/components/marketplace/CategoryCard'

const categories = [
  {
    title: 'Electrician',
    icon: '⚡',
  },
  {
    title: 'Plumber',
    icon: '🔧',
  },
  {
    title: 'Cleaning',
    icon: '✨',
  },
  {
    title: 'Painting',
    icon: '🎨',
  },
]

export default function CategoryGrid() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '18px',
      }}
    >
      {categories.map((category) => (
        <CategoryCard
          key={category.title}
          title={category.title}
          icon={category.icon}
        />
      ))}
    </div>
  )
}
