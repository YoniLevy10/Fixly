import { NextResponse } from 'next/server'
import { getProfessional } from '@/lib/data/professionals-service'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const professional = await getProfessional(id)
  if (!professional) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(professional)
}
