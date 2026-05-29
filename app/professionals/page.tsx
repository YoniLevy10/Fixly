import { Suspense } from 'react'
import ProfessionalsScreen from '@/components/professionals/ProfessionalsScreen'

export default function ProfessionalsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <ProfessionalsScreen />
    </Suspense>
  )
}
