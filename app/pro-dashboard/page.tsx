const incomingRequests = [
  {
    customer: 'Sarah Cohen',
    service: 'Electricity Repair',
    location: 'Tel Aviv',
  },
  {
    customer: 'David Levi',
    service: 'Air Conditioner Fix',
    location: 'Ramat Gan',
  },
]

const activeJobs = [
  {
    customer: 'Noam Israeli',
    status: 'On The Way',
  },
]

export default function ProfessionalDashboard() {
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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '34px',
              marginTop: 0,
              marginBottom: '8px',
            }}
          >
            Professional Dashboard
          </h1>

          <p
            style={{
              color: '#6B7280',
              fontSize: '17px',
              margin: 0,
            }}
          >
            Manage your requests and active jobs.
          </p>
        </div>

        <div
          style={{
            background: '#DCFCE7',
            color: '#166534',
            padding: '12px 16px',
            borderRadius: '999px',
            fontWeight: 700,
          }}
        >
          Available
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <div>
            <div
              style={{
                color: '#6B7280',
                marginBottom: '6px',
              }}
            >
              Today Earnings
            </div>

            <div
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: '#005BFF',
              }}
            >
              ₪1,240
            </div>
          </div>

          <div
            style={{
              background: '#EEF4FF',
              color: '#005BFF',
              padding: '12px 16px',
              borderRadius: '999px',
              fontWeight: 700,
            }}
          >
            ⭐ 4.9
          </div>
        </div>
      </div>

      <div
        style={{
          marginBottom: '24px',
        }}
      >
        <h2
          style={{
            fontSize: '24px',
            marginBottom: '18px',
          }}
        >
          Incoming Requests
        </h2>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {incomingRequests.map((request) => (
            <div
              key={request.customer}
              style={{
                background: 'white',
                borderRadius: '28px',
                padding: '22px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '18px',
                  marginBottom: '8px',
                }}
              >
                {request.customer}
              </div>

              <div
                style={{
                  color: '#6B7280',
                  marginBottom: '6px',
                }}
              >
                {request.service}
              </div>

              <div
                style={{
                  color: '#9CA3AF',
                  marginBottom: '18px',
                }}
              >
                📍 {request.location}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                }}
              >
                <button
                  style={{
                    flex: 1,
                    border: 'none',
                    background: '#DCFCE7',
                    color: '#166534',
                    padding: '14px',
                    borderRadius: '16px',
                    fontWeight: 700,
                  }}
                >
                  Accept
                </button>

                <button
                  style={{
                    flex: 1,
                    border: 'none',
                    background: '#FEE2E2',
                    color: '#991B1B',
                    padding: '14px',
                    borderRadius: '16px',
                    fontWeight: 700,
                  }}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2
          style={{
            fontSize: '24px',
            marginBottom: '18px',
          }}
        >
          Active Jobs
        </h2>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {activeJobs.map((job) => (
            <div
              key={job.customer}
              style={{
                background: 'white',
                borderRadius: '28px',
                padding: '22px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '18px',
                  marginBottom: '8px',
                }}
              >
                {job.customer}
              </div>

              <div
                style={{
                  color: '#005BFF',
                  fontWeight: 700,
                  marginBottom: '18px',
                }}
              >
                {job.status}
              </div>

              <button
                style={{
                  width: '100%',
                  border: 'none',
                  background: '#005BFF',
                  color: 'white',
                  padding: '16px',
                  borderRadius: '18px',
                  fontWeight: 700,
                  fontSize: '16px',
                }}
              >
                Update Status
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
