'use client'

import { useMemo } from 'react'
import { Briefcase, Star, Users, ClipboardList } from 'lucide-react'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { getDemoPlatformMetrics } from '@/mock/demo-seed'
import { useLocale } from '@/lib/i18n/locale-provider'

export default function DemoPlatformStats() {
  const { t } = useLocale()
  const metrics = useMemo(
    () => (isDemoDataMode() ? getDemoPlatformMetrics() : null),
    []
  )

  if (!metrics) return null

  const items = [
    {
      icon: Users,
      value: metrics.professionals.toLocaleString('he-IL'),
      label: t('demo.statsPros'),
    },
    {
      icon: ClipboardList,
      value: metrics.activeRequests.toLocaleString('he-IL'),
      label: t('demo.statsActive'),
    },
    {
      icon: Briefcase,
      value: `${(metrics.totalCompletedJobs / 1000).toFixed(1)}K`,
      label: t('demo.statsJobs'),
    },
    {
      icon: Star,
      value: String(metrics.avgRating),
      label: t('demo.statsRating'),
    },
  ]

  return (
    <div className="mx-4 lg:mx-8 mb-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
      {items.map(({ icon: Icon, value, label }) => (
        <div
          key={label}
          className="bg-card border-2 border-primary/20 rounded-2xl px-3 py-3 flex items-center gap-2.5 shadow-sm"
        >
          <span className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Icon size={18} className="text-primary" />
          </span>
          <div className="min-w-0">
            <p className="text-lg font-black text-foreground leading-none">{value}</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-0.5 truncate">
              {label}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
