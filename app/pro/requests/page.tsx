import BottomNav from '@/components/BottomNav'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import RequestCard from '@/components/request/RequestCard'
import Button from '@/components/ui/Button'
import { requests } from '@/lib/mock-data'

export default function ProRequestsPage() {
  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Operations"
        title="Incoming Requests"
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {requests.map((request) => (
          <div key={request.id}>
            <RequestCard request={request} />

            <div style={{ height: '12px' }} />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              <Button variant="secondary">Decline</Button>
              <Button>Accept</Button>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </PageContainer>
  )
}
