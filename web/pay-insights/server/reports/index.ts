import type { ReportDefinition } from './types'
import serviceFees from './service-fees'

/** All reports, in the order shown on the home page. Add new reports here. */
export const reports: ReportDefinition[] = [
  serviceFees
]

export function findReport(id: string): ReportDefinition | undefined {
  return reports.find(report => report.id === id)
}
