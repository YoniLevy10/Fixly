'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocale } from '@/lib/i18n/locale-provider'
import { DEMO_TOUR_STEPS } from '@/lib/demo/investor-tour'
import { narrativeFor, stepIndex, TOUR_NARRATIVE } from '@/lib/demo/tour-narrative'
import { useDemoTour } from '@/components/demo/DemoTourProvider'
import { isDemoDataMode } from '@/lib/data/demo-mode'

/**
 * Top storyboard chrome — kept at the top so it never stacks on bottom sheets,
 * live maps, or driver.js stage cutouts.
 */
export default function DemoTourNarrator() {
  const { t } = useLocale()
  const { tourRunning, tourStep, tourError, stopTour } = useDemoTour()
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('fixly-tour-active', tourRunning)
    if (!tourRunning) {
      document.documentElement.style.removeProperty('--fixly-tour-narrator-h')
    }
    return () => {
      document.documentElement.classList.remove('fixly-tour-active')
      document.documentElement.style.removeProperty('--fixly-tour-narrator-h')
    }
  }, [tourRunning])

  useLayoutEffect(() => {
    if (!tourRunning) return
    const el = barRef.current
    if (!el) return
    const publish = () => {
      document.documentElement.style.setProperty(
        '--fixly-tour-narrator-h',
        `${el.offsetHeight}px`
      )
    }
    publish()
    const ro = new ResizeObserver(publish)
    ro.observe(el)
    return () => ro.disconnect()
  }, [tourRunning, tourStep, tourError])

  if (!isDemoDataMode() || !tourRunning) return null

  const idx = stepIndex(tourStep)
  const total = TOUR_NARRATIVE.length
  const beat = tourStep ? narrativeFor(tourStep) : null
  const titleKey = tourStep
    ? DEMO_TOUR_STEPS.find((s) => s.id === tourStep)?.labelKey
    : null
  const storyKey = tourStep ? `demo.tourStory${storySuffix(tourStep)}` : null
  const roleKey =
    beat?.role === 'customer'
      ? 'demo.roleCustomer'
      : beat?.role === 'professional'
        ? 'demo.rolePro'
        : 'demo.tourRoleSystem'

  return (
    <div
      className="fixly-tour-narrator fixed inset-x-0 top-0 z-[90] pointer-events-none pt-[env(safe-area-inset-top,0px)]"
      dir="rtl"
      role="status"
      aria-live="polite"
    >
      <div
        ref={barRef}
        className="pointer-events-auto border-b border-[#123563]/10 bg-white/95 px-4 py-3 shadow-[0_10px_30px_rgba(18,53,99,0.12)] backdrop-blur-md"
      >
        <div className="mx-auto max-w-lg">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 rounded-full bg-[#123563] px-2.5 py-0.5 text-[11px] font-black text-white">
                {t('demo.tourProgress', { current: idx + 1, total })}
              </span>
              <span className="shrink-0 rounded-full bg-[#fff7e8] px-2.5 py-0.5 text-[11px] font-bold text-[#123563]">
                {t(roleKey)}
              </span>
            </div>
            <button
              type="button"
              onClick={stopTour}
              className="shrink-0 text-xs font-bold text-slate-500 underline underline-offset-2 hover:text-[#123563]"
            >
              {t('demo.tourStop')}
            </button>
          </div>

          <div className="mb-2 flex items-center gap-1.5" aria-hidden>
            {TOUR_NARRATIVE.map((b, i) => (
              <span
                key={b.id}
                className={`h-1.5 rounded-full transition-all ${
                  i < idx
                    ? 'w-4 bg-emerald-500'
                    : i === idx
                      ? 'w-5 bg-[#F59E0B]'
                      : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>

          <p className="text-sm font-black text-[#123563] sm:text-base">
            {titleKey ? t(titleKey) : t('demo.tourRunning')}
          </p>
          {storyKey ? (
            <p className="mt-1 text-xs font-medium leading-5 text-slate-600 sm:text-sm sm:leading-6">
              {t(storyKey)}
            </p>
          ) : null}

          {tourError ? (
            <p className="mt-2 rounded-lg bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-800">
              {tourError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function storySuffix(step: string): string {
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
