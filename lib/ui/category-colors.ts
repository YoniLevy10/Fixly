/** Distinct accent per category slug — improves scanability on home grid */
export const CATEGORY_ACCENTS: Record<
  string,
  { chip: string; card: string; iconBg: string }
> = {
  electricity: {
    chip: 'bg-amber-100 text-amber-900 border-amber-300',
    card: 'border-amber-300 hover:border-amber-500 hover:bg-amber-50/80',
    iconBg: 'bg-amber-100',
  },
  plumbing: {
    chip: 'bg-sky-100 text-sky-900 border-sky-300',
    card: 'border-sky-300 hover:border-sky-500 hover:bg-sky-50/80',
    iconBg: 'bg-sky-100',
  },
  ac: {
    chip: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    card: 'border-cyan-300 hover:border-cyan-500 hover:bg-cyan-50/80',
    iconBg: 'bg-cyan-100',
  },
  cleaning: {
    chip: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    card: 'border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/80',
    iconBg: 'bg-emerald-100',
  },
  painting: {
    chip: 'bg-violet-100 text-violet-900 border-violet-300',
    card: 'border-violet-300 hover:border-violet-500 hover:bg-violet-50/80',
    iconBg: 'bg-violet-100',
  },
}

const FALLBACK = {
  chip: 'bg-primary/15 text-primary border-primary/30',
  card: 'border-primary/30 hover:border-primary hover:bg-primary/5',
  iconBg: 'bg-primary/10',
}

export function getCategoryAccent(slug: string) {
  return CATEGORY_ACCENTS[slug] ?? FALLBACK
}
