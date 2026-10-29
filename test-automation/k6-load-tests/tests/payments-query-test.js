import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from '../libs/k6-reporter.js';
import { textSummary } from '../libs/k6-summary.js';
export { options } from '../config/options.js';
import { ENV } from '../config/env.js';

export default function () {

  // ── STEP 1: Get Token ──────────────────────────────────────────
  const tokenRes = http.post(
    ENV.tokenUrl,
    `grant_type=client_credentials&client_id=${ENV.clientId}&client_secret=${ENV.clientSecret}`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  check(tokenRes, {
    'token: status is 200':        (r) => r.status === 200,
    'token: access_token present': (r) => JSON.parse(r.body).access_token !== undefined,
  });

  const token = JSON.parse(tokenRes.body).access_token;

  // ── STEP 2: POST Payments Query ────────────────────────────────
  const payload = JSON.stringify({
    dateFilter: {
      startDate: '2020-01-01',
      endDate:   '2026-12-31',
      isDefault: true,
    },
    excludeCounts: true,
  });

  const paymentsQueryRes = http.post(
    `${ENV.payBaseUrl}/accounts/${ENV.accountId}/payments/queries?page=1&limit=5`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-apikey':      ENV.apiKey,
        'Content-Type':  'application/json',
      },
    }
  );

  const body = JSON.parse(paymentsQueryRes.body);

  check(paymentsQueryRes, {
    // ── status ────────────────────────────────────────────────
    'payments query: status is 200':          (r) => r.status === 200,

    // ── pagination ────────────────────────────────────────────
    'payments query: page is 1':              (r) => body.page === 1,
    'payments query: limit is 5':             (r) => body.limit === 5,
    'payments query: hasMore is false':       (r) => body.hasMore === false,

    // ── items ─────────────────────────────────────────────────
    'payments query: has items':              (r) => body.items.length > 0,
    'payments query: item has id':            (r) => body.items[0].id !== undefined,
    'payments query: item has invoiceNumber': (r) => body.items[0].invoiceNumber !== undefined,
    'payments query: item has corpTypeCode':  (r) => body.items[0].corpTypeCode !== undefined,
    'payments query: item has statusCode':    (r) => body.items[0].statusCode !== undefined,
    'payments query: item has total':         (r) => body.items[0].total !== undefined,

    // ── account verification ──────────────────────────────────
    'payments query: account id matches':     (r) => body.items[0].paymentAccount.accountId === ENV.accountId,
    'payments query: item has paymentMethod': (r) => body.items[0].paymentMethod !== undefined,
  });

  sleep(1);

}

export function handleSummary(data) {
  return {
    'reports/summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}