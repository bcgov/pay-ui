/** All reports, for the home page. */
export default defineEventHandler(async () => {
  const reports = await allReports()
  return reports.map(report => ({ id: report.id, title: report.title, description: report.description }))
})
