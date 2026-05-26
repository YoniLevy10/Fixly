export default function SearchEmptyState() {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '34px',
        padding: '40px 24px',
        textAlign: 'center',
        boxShadow: '0 12px 32px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          fontSize: '52px',
          marginBottom: '20px',
        }}
      >
        🔎
      </div>

      <h3
        style={{
          margin: 0,
          marginBottom: '10px',
          fontSize: '28px',
          fontWeight: 900,
          letterSpacing: '-0.04em',
        }}
      >
        No Results Found
      </h3>

      <p
        style={{
          color: '#6B7280',
          lineHeight: 1.7,
          fontSize: '15px',
          margin: 0,
        }}
      >
        Try searching for another category or nearby professional.
      </p>
    </div>
  )
}
