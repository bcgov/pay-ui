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

  // ── STEP 2: Get Fees ───────────────────────────────────────────
  const feesRes = http.get(
    ENV.feesUrl,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-apikey':      ENV.apiKey,
      },
    }
  );

  // 👁️ debug
//   console.log('fees status:', feesRes.status);
//   console.log('fees body:',   feesRes.body);

  check(feesRes, {
    'fees: status is 200':  (r) => r.status === 200,
    'fees: body not empty': (r) => r.body.length > 0,
  });

  // ── STEP 3: POST Payment Request ───────────────────────────────
  const payload = JSON.stringify({
    businessInfo: {
      corpType:           'NRO',
      businessIdentifier: 'NR1234',
    },
    filingInfo: {
      filingTypes: [
        { filingTypeCode: 'NM620' },
      ],
    },
  });

  const paymentRes = http.post(
    ENV.paymentRequestUrl,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-apikey':      ENV.apiKey,
        'Content-Type':  'application/json',
      },
    }
  );

  // 👁️ debug
//   console.log('payment status:', paymentRes.status);
  console.log('payment body:',   paymentRes.body);

  check(paymentRes, {
    'payment: status is 201':     (r) => r.status === 201,
    'payment: invoiceId present': (r) => JSON.parse(r.body).id !== undefined,
  });

  sleep(1);

}

export function handleSummary(data) {
  return {
    'reports/summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}