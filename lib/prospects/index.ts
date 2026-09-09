export * from '@/lib/prospects/types'
export * from '@/lib/prospects/phone'
export * from '@/lib/prospects/status'
export * from '@/lib/prospects/dedupe'
export * from '@/lib/prospects/config'
export * from '@/lib/prospects/message'
export * from '@/lib/prospects/csv'
export {
  ingestFromAdapter,
  listProspects,
  getProspectCounters,
  getProspectById,
  updateProspect,
  bulkUpdateStatus,
  prepareContactLink,
  exportProspectsCsv,
  linkProspectOnWaitlistJoin,
  linkProspectToProfessional,
  writeProspectEvent,
  mapProspectRow,
} from '@/lib/prospects/service'
export { runProspectDiscovery, listDiscoveryRuns } from '@/lib/prospects/discover'
export {
  DISCOVERY_CATEGORY_MAP,
  isAllowedDiscoverySource,
  ALLOWED_DISCOVERY_SOURCES,
} from '@/lib/prospects/discovery-mapping'
