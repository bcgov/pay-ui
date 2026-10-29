import { reports } from '../../../reports'

/** All reports, for the home page. */
export default defineEventHandler(() => {
  return reports.map(report => ({ id: report.id, title: report.title, description: report.description }))
})
