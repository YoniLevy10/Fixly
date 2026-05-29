import { isDemoDataMode } from '@/lib/data/demo-mode'
import { getDemoDataset } from '@/mock/demo-seed'
import { LEGACY_DEMO_REQUESTS } from '@/mock/legacy-demo-requests'

/** Rich demo dataset — platform feels alive for investor demos */
export function getDemoRequests() {
  return isDemoDataMode() ? getDemoDataset().requests : LEGACY_DEMO_REQUESTS
}

/** @deprecated Prefer getDemoRequests() — evaluated at import time */
export const DEMO_REQUESTS = getDemoRequests()
