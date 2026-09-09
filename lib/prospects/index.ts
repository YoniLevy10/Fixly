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
  confirmContactSent,
  exportProspectsCsv,
  linkProspectOnWaitlistJoin,
  linkProspectToProfessional,
  writeProspectEvent,
  mapProspectRow,
  clearReplaceableAutoProspects,
} from '@/lib/prospects/service'
export { runProspectDiscovery, listDiscoveryRuns } from '@/lib/prospects/discover'
export {
  DISCOVERY_CATEGORY_MAP,
  isAllowedDiscoverySource,
  ALLOWED_DISCOVERY_SOURCES,
  getCityGeoProfile,
} from '@/lib/prospects/discovery-mapping'
export {
  assessProspectFit,
  shouldKeepDiscoveredProspect,
  shouldKeepAsSoloProspect,
  fitClassLabelHe,
  contactabilityLabelHe,
} from '@/lib/prospects/fit-score'
