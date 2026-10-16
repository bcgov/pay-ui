import { defineReport } from './types'

// Same rules as the service fee revenue query (bcgov/entity#28379)
export default defineReport({
  id: 'service-fees',
  title: 'Service fees by product',
  description: 'Service fees collected on paid invoices, by product, for one fiscal year (April 1 to March 31).',
  note: 'Includes invoices with status PAID, by payment date in Pacific time. Refunded invoices are not included.',

  filters: [
    { key: 'fiscalYear', type: 'fiscalYear', label: 'Fiscal year' },
    {
      key: 'paymentMethod',
      type: 'select',
      label: 'Payment method',
      allLabel: 'All payment methods',
      optionsSql: 'SELECT code AS value, description AS label FROM pay.payment_methods ORDER BY description'
    }
  ],

  sql: `
    SELECT COALESCE(ct.description, i.corp_type_code) AS product,
           i.corp_type_code AS code,
           COUNT(*)::int AS transactions,
           COALESCE(SUM(i.service_fees), 0) AS service_fees
      FROM pay.invoices i
      LEFT JOIN pay.corp_types ct ON ct.code = i.corp_type_code
     WHERE i.invoice_status_code = 'PAID'
       AND i.payment_date >= :fiscalYearStart::timestamp
       AND i.payment_date <  :fiscalYearEnd::timestamp
       AND (:paymentMethod::text IS NULL OR i.payment_method_code = :paymentMethod::text)
     GROUP BY 1, 2
     ORDER BY 4 DESC, 2`,

  columns: [
    { key: 'product', label: 'Product' },
    { key: 'code', label: 'Code' },
    { key: 'transactions', label: 'Paid transactions', format: 'number', total: true },
    { key: 'service_fees', label: 'Service fees', format: 'currency', total: true }
  ]
})
