const reviews = [
  {
    name: 'Sarah M.',
    text: 'Amazing service and very professional.',
  },
  {
    name: 'David L.',
    text: 'Arrived quickly and fixed everything perfectly.',
  },
]

export default function ProfessionalPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f7fb',
        padding: '24px',
        paddingBottom: '120px',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '32px',
          padding: '28px',
          marginBottom: '24px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            width: '90px',
            height: '90px',
            borderRadius: '999px',
            background: '#EEF4FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '42px',
            marginBottom: '20px',
          }}
        >
          ⚡
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: '32px',
            marginBottom: '8px',
          }}
        >
          Daniel Electric
        </h1>

        <p
          style={{
            margin: 0,
            color: '#6B7280',
            fontSize: '18px',
            marginBottom: '18px',
          }}
        >
          Certified Electrician
        </p>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              background: '#EEF4FF',
              color: '#005BFF',
              padding: '10px 14px',
              borderRadius: '999px',
              fontWeight: 700,
            }}
          >
            ⭐ 4.9 Rating
          </div>

          <div
            style={{
              background: '#F3F4F6',
              color: '#111827',
              padding: '10px 14px',
              borderRadius: '999px',
              fontWeight: 700,
            }}
          >
            120 Jobs
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: '32px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: '18px',
            fontSize: '24px',
          }}
        >
          About
        </h2>

        <p
          style={{
            color: '#6B7280',
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          Professional electrician with over 8 years of experience in home and business electrical services.
        </p>
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: '32px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: '18px',
            fontSize: '24px',
          }}
        >
          Reviews
        </h2>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {reviews.map((review) => (
            <div
              key={review.name}
              style={{
                background: '#F9FAFB',
                borderRadius: '20px',
                padding: '18px',
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: '8px',
                }}
              >
                {review.name}
              </div>

              <div
                style={{
                  color: '#6B7280',
                  lineHeight: 1.6,
                }}
              >
                {review.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          right: '20px',
          background: 'white',
          padding: '16px',
          borderRadius: '28px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        }}
      >
        <button
          style={{
            width: '100%',
            border: 'none',
            background: '#005BFF',
            color: 'white',
            padding: '18px',
            borderRadius: '18px',
            fontSize: '17px',
            fontWeight: 700,
          }}
        >
          Request Service
        </button>
      </div>
    </main>
  )
}
