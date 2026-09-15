'use client'

import { useLocale } from '@/lib/i18n/locale-provider'
import { DEMO_TOUR_STEPS } from '@/lib/demo/investor-tour'
import { narrativeFor, stepIndex, TOUR_NARRATIVE } from '@/lib/demo/tour-narrative'
import { useDemoTour } from '@/components/demo/DemoTourProvider'
import { isDemoDataMode } from '@/lib/data/demo-mode'

/**
 * Calm storyboard chrome for the investor tour —
 * progress, role, and a short Hebrew beat so screen jumps make sense.
 */
export default function DemoTourNarrator() {
  const { t } = useLocale()
  const { tourRunning, tourStep, tourError, stopTour } = useDemoTour()

  if (!isDemoDataMode() || !tourRunning) return null

  const idx = stepIndex(tourStep)
  const total = TOUR_NARRATIVE.length
  const beat = tourStep ? narrativeFor(tourStep) : null
  const titleKey = tourStep
    ? DEMO_TOUR_STEPS.find((s) => s.id === tourStep)?.labelKey
    : null
  const storyKey = tourStep ? `demo.tourStory${capitalize(tourStep)}` : null
  const roleKey =
    beat?.role === 'customer'
      ? 'demo.roleCustomer'
      : beat?.role === 'professional'
        ? 'demo.rolePro'
        : 'demo.tourRoleSystem'

  return (
    <div
      className="fixly-tour-narrator fixed inset-x-3 z-[85] pointer-events-none"
      style={{
        bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
      }}
      dir="rtl"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto mx-auto max-w-lg rounded-2xl border border-[#123563]/15 bg-white/95 p-4 shadow-[0_18px_50px_rgba(18,53,99,0.22)] backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#123563] px-2.5 py-0.5 text-[11px] font-black text-white">
              {t('demo.tourProgress', { current: idx + 1, total })}
            </span>
            <span className="rounded-full bg-[#fff7e8] px-2.5 py-0.5 text-[11px] font-bold text-[#123563]">
              {t(roleKey)}
            </span>
          </div>
          <button
            type="button"
            onClick={stopTour}
            className="text-xs font-bold text-slate-500 underline underline-offset-2 hover:text-[#123563]"
          >
            {t('demo.tourStop')}
          </button>
        </div>

        <div className="mb-3 flex items-center justify-center gap-1.5" aria-hidden>
          {TOUR_NARRATIVE.map((b, i) => (
            <span
              key={b.id}
              className={`h-1.5 rounded-full transition-all ${
                i < idx
                  ? 'w-4 bg-emerald-500'
                  : i === idx
                    ? 'w-6 bg-[#F59E0B]'
                    : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

        <p className="text-base font-black text-[#123563]">
          {titleKey ? t(titleKey) : t('demo.tourRunning')}
        </p>
        {storyKey ? (
          <p className="mt-1.5 text-sm font-medium leading-6 text-slate-600">{t(storyKey)}</p>
        ) : null}

        {tourError ? (
          <p className="mt-2 rounded-lg bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-800">
            {tourError}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function capitalize(step: string): string {
  // pending → Pending; on_the_way → On_the_way — map explicitly
  const map: Record<string, string> = {
    create: 'Create',
    pending: 'Pending',
    accepted: 'Accepted',
    on_the_way: 'OnTheWay',
    customer_map: 'Map',
    in_progress: 'InProgress',
    completed: 'Completed',
    done: 'Done',
  }
  return map[step] ?? step
}
