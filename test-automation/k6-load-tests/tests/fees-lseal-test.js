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

  // 👁️ Print response to verify data
  console.log('=================================');
  console.log('Fees BCA/LSEAL Status:', feesRes.status);
  console.log('Fees BCA/LSEAL Body:');
  console.log(JSON.stringify(JSON.parse(feesRes.body), null, 2));
  console.log('=================================');

  check(feesRes, {
    'fees BCA/LSEAL: status is 200':        (r) => r.status === 200,
    'fees BCA/LSEAL: corp type is BCA':     (r) => JSON.parse(r.body).filingTypeCode === 'LSEAL',
    'fees BCA/LSEAL: body not empty':       (r) => r.body.length > 0,
  });

  sleep(1);

}

export function handleSummary(data) {
  return {
    'reports/summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}