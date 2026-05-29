import { createServerSupabaseClient } from '@/lib/supabase/server'

export type DbCategory = {
  id: string
  slug: string
  name: string
  nameHe: string
  icon: string
}

const ICON_MAP: Record<string, string> = {
  bolt: '⚡',
  droplets: '🚿',
  snowflake: '❄️',
  sparkles: '✨',
  paintbrush: '🎨',
  wrench: '🔧',
}

export async function supabaseListCategories(): Promise<DbCategory[] | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('service_categories')
    .select('id, slug, name, name_he, icon')
    .order('name')

  if (error) {
    console.error('[supabase] categories', error.message)
    return null
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug ?? row.name.toLowerCase().replace(/\s+/g, '-'),
    name: row.name,
    nameHe: row.name_he ?? row.name,
    icon: ICON_MAP[row.icon ?? ''] ?? '🔧',
  }))
}
