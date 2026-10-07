import ProspectSmsComposer from '@/components/admin/ProspectSmsComposer'
import SuperadminGate from '@/components/admin/SuperadminGate'

export default function ProspectSmsPage() {
  return (
    <SuperadminGate>
      <ProspectSmsComposer />
    </SuperadminGate>
  )
}
