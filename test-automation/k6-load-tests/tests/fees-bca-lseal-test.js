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

  // ── STEP 2: GET Fees BCA/LSEAL ─────────────────────────────────
  const feesRes = http.get(
    ENV.feesLsealUrl,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-apikey':      ENV.apiKey,
      },
    }
  );

  const feesBody = JSON.parse(feesRes.body);

  check(feesRes, {
    // ── status ──────────────────────────────────────────────────
    'fees BCA/LSEAL: status is 200':             (r) => r.status === 200,

    // ── filing type ─────────────────────────────────────────────
    'fees BCA/LSEAL: filing type code is LSEAL': (r) => feesBody.filingTypeCode === 'LSEAL',
    'fees BCA/LSEAL: filing type name correct':  (r) => feesBody.filingType === 'Letter Under Seal',

    // ── fee amounts ─────────────────────────────────────────────
    'fees BCA/LSEAL: filing fee is 250':         (r) => feesBody.filingFees === 250.0,
    'fees BCA/LSEAL: service fee is 100':        (r) => feesBody.serviceFees === 100.0,

    // ── GST verification (the key assertion) ────────────────────
    'fees BCA/LSEAL: GST is 17.5':              (r) => feesBody.tax.gst === 17.5,
    'fees BCA/LSEAL: PST is 0':                 (r) => feesBody.tax.pst === 0.0,

    // ── total ───────────────────────────────────────────────────
    'fees BCA/LSEAL: total is 367.5':           (r) => feesBody.total === 367.5,
  });

  sleep(1);

}

export function handleSummary(data) {
  return {
    'reports/summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}