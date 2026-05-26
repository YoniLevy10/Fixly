interface SearchBarProps {
  placeholder?: string
}

export default function SearchBar({ placeholder = 'Search services...' }: SearchBarProps) {
  return (
    <div style={{ width: '100%', background: '#F3F4F6', borderRadius: '18px', padding: '14px 18px', color: '#9CA3AF', marginBottom: '24px' }}>
      {placeholder}
    </div>
  )
}
