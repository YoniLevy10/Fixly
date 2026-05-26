import type { MarketplaceRequest } from '@/types/marketplace'

export function mapRequestRow(row: Record<string, unknown>): MarketplaceRequest {
  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    description: row.description
      ? String(row.description)
      : undefined,
    address: row.address
      ? String(row.address)
      : undefined,
    status: row.status as MarketplaceRequest['status'],
    customerId: String(row.customer_id ?? ''),
    professionalId: row.professional_id
      ? String(row.professional_id)
      : undefined,
    createdAt: String(row.created_at ?? ''),
  }
}
