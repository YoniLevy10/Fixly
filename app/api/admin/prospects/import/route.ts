import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/require-admin-api'
import { parseJsonBody } from '@/lib/api/parse-body'
import { importProspectsCsvSchema } from '@/lib/api/schemas'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { CsvProspectAdapter } from '@/lib/prospects/adapters/csv'
import { ingestFromAdapter } from '@/lib/prospects/service'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, 'admin-prospects-import', 5, 60_000)
  if (limited) return limited

  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const parsed = await parseJsonBody(request, importProspectsCsvSchema)
  if (!parsed.success) return parsed.response

  try {
    const adapter = new CsvProspectAdapter(parsed.data.csv)
    const meta = adapter.parseMeta()
    const result = await ingestFromAdapter(auth.admin, adapter, auth.user.id)

    return NextResponse.json({
      created: result.created.length,
      skipped: result.skipped,
      errors: [...meta.errors.map((e) => ({ name: `line ${e.line}`, error: e.error })), ...result.errors],
      prospects: result.created,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Import failed'
    trackError(error, { route: 'POST /api/admin/prospects/import' })
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
