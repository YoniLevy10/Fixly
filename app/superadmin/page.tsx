import ProspectsRecruitmentScreen from '@/components/admin/ProspectsRecruitmentScreen'
import SuperadminGate from '@/components/admin/SuperadminGate'

export default function SuperadminPage() {
  return (
    <SuperadminGate>
      <ProspectsRecruitmentScreen />
    </SuperadminGate>
  )
}
