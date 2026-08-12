import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  normalizeCategorySlug,
  resolveCategoryEmoji,
  resolveCategoryNameEn,
  resolveCategoryNameHe,
} from '@/lib/categories/catalog'

export type DbCategory = {
  id: string
  slug: string
  name: string
  nameHe: string
  icon: string
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

  return (data ?? []).map((row) => {
    const slug = normalizeCategorySlug(row.slug, row.name)
    return {
      id: row.id,
      slug,
      name: resolveCategoryNameEn(slug, row.name, row.name_he),
      nameHe: resolveCategoryNameHe(slug, row.name_he, row.name),
      icon: resolveCategoryEmoji(slug, row.icon),
    }
  })
}
