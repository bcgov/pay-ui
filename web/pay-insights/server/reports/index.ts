import type { ReportDefinition } from './types'
import serviceFees from './service-fees'

/**
 * Hand-written reports, in the order shown on the home page. Add new reports here.
 * Warehouse views are listed automatically (see utils/viewReports.ts).
 */
export const reports: ReportDefinition[] = [
  serviceFees
]
