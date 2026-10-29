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

  // ── STEP 2: GET Fees BCA/OLAARTOQ_B ───────────────────────────
  const feesRes = http.get(
    `${ENV.payBaseUrl}/fees/BCA/OLAARTOQ_B`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-apikey':      ENV.apiKey,
      },
    }
  );

  const body = JSON.parse(feesRes.body);

  check(feesRes, {
    // ── status ──────────────────────────────────────────────────
    'fees BCA/OLAARTOQ_B: status is 200':             (r) => r.status === 200,

    // ── filing type ─────────────────────────────────────────────
    'fees BCA/OLAARTOQ_B: filing type code correct':  (r) => body.filingTypeCode === 'OLAARTOQ_B',
    'fees BCA/OLAARTOQ_B: filing type name correct':  (r) => body.filingType === 'Owner Location Report',

    // ── fee amounts ─────────────────────────────────────────────
    'fees BCA/OLAARTOQ_B: filing fee is 7.0':         (r) => body.filingFees === 7.0,
    'fees BCA/OLAARTOQ_B: service fee is 1.5':        (r) => body.serviceFees === 1.5,
    'fees BCA/OLAARTOQ_B: future effective is 0':     (r) => body.futureEffectiveFees === 0.0,
    'fees BCA/OLAARTOQ_B: priority fees is 0':        (r) => body.priorityFees === 0.0,
    'fees BCA/OLAARTOQ_B: processing fees is 0':      (r) => body.processingFees === 0,

    // ── separate tax verification (the key assertions) ──────────
    'fees BCA/OLAARTOQ_B: tax.gst is 0.08':           (r) => body.tax.gst === 0.08,
    'fees BCA/OLAARTOQ_B: tax.pst is 0':              (r) => body.tax.pst === 0.0,
    'fees BCA/OLAARTOQ_B: tax.filingFeeGst is 0':     (r) => body.tax.filingFeeGst === 0.0,
    'fees BCA/OLAARTOQ_B: tax.serviceFeeGst is 0.08': (r) => body.tax.serviceFeeGst === 0.08,

    // ── total ───────────────────────────────────────────────────
    'fees BCA/OLAARTOQ_B: total is 8.58':             (r) => body.total === 8.58,
  });

  sleep(1);

}

export function handleSummary(data) {
  return {
    'reports/summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}