/** First breadcrumb on every page, so the header back arrow leads to the staff dashboard (same as pay-ui). */
export function staffDashboardBreadcrumb(): ConnectBreadcrumb {
  const authWebUrl = String(useRuntimeConfig().public.authWebUrl || '').replace(/\/+$/, '')
  return { label: 'Staff Dashboard', to: `${authWebUrl}/staff/dashboard` }
}
