const categories = [
  'Electrician',
  'Plumber',
  'Cleaning',
  'Locksmith',
  'Painting',
  'Appliance Repair',
]

const professionals = [
  {
    name: 'Daniel Electric',
    job: 'Electrician',
    rating: '4.9',
  },
  {
    name: 'Clean House IL',
    job: 'Cleaning',
    rating: '4.8',
  },
]

export default function HomePage() {
  return (
    <main
      style={{
        padding: '24px',
        minHeight: '100vh',
        background: '#f5f7fb',
      }}
    >
      <div style={{ marginBottom: '28px' }}>
        <h1
          style={{
            fontSize: '40px',
            fontWeight: 700,
            color: '#005BFF',
            marginBottom: '8px',
          }}
        >
          Fixly
        </h1>

        <p
          style={{
            color: '#6b7280',
            fontSize: '18px',
            margin: 0,
          }}
        >
          Book trusted professionals instantly
        </p>
      </div>

      <input
        placeholder="Search services..."
        style={{
          width: '100%',
          padding: '18px',
          borderRadius: '20px',
          border: 'none',
          fontSize: '16px',
          boxSizing: 'border-box',
          marginBottom: '28px',
          boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
        }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {categories.map((category) => (
          <div
            key={category}
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '24px 18px',
              fontWeight: 600,
              boxShadow: '0 10px 24px rgba(0,0,0,0.05)',
            }}
          >
            {category}
          </div>
        ))}
      </div>

      <h2
        style={{
          fontSize: '24px',
          marginBottom: '16px',
        }}
      >
        Top Professionals
      </h2>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {professionals.map((professional) => (
          <div
            key={professional.name}
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '20px',
              boxShadow: '0 10px 24px rgba(0,0,0,0.05)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '18px',
                    marginBottom: '6px',
                  }}
                >
                  {professional.name}
                </div>

                <div
                  style={{
                    color: '#6b7280',
                  }}
                >
                  {professional.job}
                </div>
              </div>

              <div
                style={{
                  background: '#EEF4FF',
                  color: '#005BFF',
                  padding: '8px 12px',
                  borderRadius: '999px',
                  fontWeight: 700,
                }}
              >
                ⭐ {professional.rating}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
