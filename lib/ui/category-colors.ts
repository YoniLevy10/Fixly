/** Distinct accent per category slug — improves scanability on home grid */
export const CATEGORY_ACCENTS: Record<
  string,
  { chip: string; card: string; iconBg: string }
> = {
  nails: {
    chip: 'bg-rose-100 text-rose-900 border-rose-300',
    card: 'border-rose-300 hover:border-rose-500 hover:bg-rose-50/80',
    iconBg: 'bg-rose-100',
  },
  hair: {
    chip: 'bg-stone-200 text-stone-900 border-stone-400',
    card: 'border-stone-400 hover:border-stone-600 hover:bg-stone-50/80',
    iconBg: 'bg-stone-200',
  },
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
  carpentry: {
    chip: 'bg-orange-100 text-orange-900 border-orange-300',
    card: 'border-orange-300 hover:border-orange-500 hover:bg-orange-50/80',
    iconBg: 'bg-orange-100',
  },
  moving: {
    chip: 'bg-blue-100 text-blue-900 border-blue-300',
    card: 'border-blue-300 hover:border-blue-500 hover:bg-blue-50/80',
    iconBg: 'bg-blue-100',
  },
  gardening: {
    chip: 'bg-lime-100 text-lime-900 border-lime-300',
    card: 'border-lime-300 hover:border-lime-500 hover:bg-lime-50/80',
    iconBg: 'bg-lime-100',
  },
  locksmith: {
    chip: 'bg-slate-100 text-slate-900 border-slate-300',
    card: 'border-slate-300 hover:border-slate-500 hover:bg-slate-50/80',
    iconBg: 'bg-slate-100',
  },
  elevators: {
    chip: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    card: 'border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50/80',
    iconBg: 'bg-indigo-100',
  },
  furniture: {
    chip: 'bg-rose-100 text-rose-900 border-rose-300',
    card: 'border-rose-300 hover:border-rose-500 hover:bg-rose-50/80',
    iconBg: 'bg-rose-100',
  },
  appliance_repair: {
    chip: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    card: 'border-yellow-300 hover:border-yellow-500 hover:bg-yellow-50/80',
    iconBg: 'bg-yellow-100',
  },
  computers: {
    chip: 'bg-teal-100 text-teal-900 border-teal-300',
    card: 'border-teal-300 hover:border-teal-500 hover:bg-teal-50/80',
    iconBg: 'bg-teal-100',
  },
  glazing: {
    chip: 'bg-sky-50 text-sky-900 border-sky-200',
    card: 'border-sky-200 hover:border-sky-400 hover:bg-sky-50/80',
    iconBg: 'bg-sky-50',
  },
  renovations: {
    chip: 'bg-stone-100 text-stone-900 border-stone-300',
    card: 'border-stone-300 hover:border-stone-500 hover:bg-stone-50/80',
    iconBg: 'bg-stone-100',
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
