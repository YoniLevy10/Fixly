/** Canonical category keys accepted by POST /api/v1/jobs (aliases normalize here) */
export const CATEGORY_ALIASES: Record<string, string> = {
  elevators: 'elevators',
  elevator: 'elevators',
  מעליות: 'elevators',
  cleaning: 'cleaning',
  ניקיון: 'cleaning',
  electrical: 'electricity',
  electricity: 'electricity',
  electric: 'electricity',
  חשמל: 'electricity',
  plumbing: 'plumbing',
  אינסטלציה: 'plumbing',
  hvac: 'ac',
  ac: 'ac',
  air_conditioning: 'ac',
  מיזוג: 'ac',
  gardening: 'gardening',
  גינון: 'gardening',
  locksmith: 'locksmith',
  מנעולים: 'locksmith',
  מנעולן: 'locksmith',
  pest_control: 'pest_control',
  pest: 'pest_control',
  הדברה: 'pest_control',
  general: 'general',
  other: 'general',
  כללי: 'general',
  אחר: 'general',
}

export function normalizeCategoryKey(input: string): string | null {
  const key = input.trim().toLowerCase()
  if (!key) return null
  return CATEGORY_ALIASES[key] ?? CATEGORY_ALIASES[input.trim()] ?? null
}

export const PHASE1_CATEGORY_SEEDS = [
  { slug: 'elevators', name: 'Elevators', name_he: 'מעליות' },
  { slug: 'cleaning', name: 'Cleaning', name_he: 'ניקיון' },
  { slug: 'electricity', name: 'Electrician', name_he: 'חשמל' },
  { slug: 'plumbing', name: 'Plumber', name_he: 'אינסטלציה' },
  { slug: 'ac', name: 'Air Conditioning', name_he: 'מיזוג' },
  { slug: 'gardening', name: 'Gardening', name_he: 'גינון' },
  { slug: 'locksmith', name: 'Locksmith', name_he: 'מנעולים' },
  { slug: 'pest_control', name: 'Pest Control', name_he: 'הדברה' },
  { slug: 'general', name: 'General', name_he: 'כללי / אחר' },
] as const
