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
  const headers = { 'Authorization': `Bearer ${token}`, 'x-apikey': ENV.apiKey };

  // ── STEP 2: GET Fees BCA/OLAARTOQ_B ───────────────────────────
  const fees1Res  = http.get(`${ENV.payBaseUrl}/fees/BCA/OLAARTOQ_B`, { headers });
  const fees1Body = JSON.parse(fees1Res.body);
  check(fees1Res, {
    'BCA/OLAARTOQ_B: status 200':         (r) => r.status === 200,
    'BCA/OLAARTOQ_B: total is 8.58':      (r) => fees1Body.total === 8.58,
    'BCA/OLAARTOQ_B: filing fee is 7.0':  (r) => fees1Body.filingFees === 7.0,
    'BCA/OLAARTOQ_B: service fee is 1.5': (r) => fees1Body.serviceFees === 1.5,
    'BCA/OLAARTOQ_B: gst is 0.08':       (r) => fees1Body.tax.gst === 0.08,
  });

  // ── STEP 3: GET Fees BCA/OLAARTAQ_B ───────────────────────────
  const fees2Res  = http.get(`${ENV.payBaseUrl}/fees/BCA/OLAARTAQ_B`, { headers });
  const fees2Body = JSON.parse(fees2Res.body);
  check(fees2Res, {
    'BCA/OLAARTAQ_B: status 200':         (r) => r.status === 200,
    'BCA/OLAARTAQ_B: total is 11.08':     (r) => fees2Body.total === 11.08,
    'BCA/OLAARTAQ_B: filing fee is 9.5':  (r) => fees2Body.filingFees === 9.5,
    'BCA/OLAARTAQ_B: service fee is 1.5': (r) => fees2Body.serviceFees === 1.5,
    'BCA/OLAARTAQ_B: gst is 0.08':       (r) => fees2Body.tax.gst === 0.08,
  });

  // ── STEP 4: GET Fees BCA/OLAARTIQ_B ───────────────────────────
  const fees3Res  = http.get(`${ENV.payBaseUrl}/fees/BCA/OLAARTIQ_B`, { headers });
  const fees3Body = JSON.parse(fees3Res.body);
  check(fees3Res, {
    'BCA/OLAARTIQ_B: status 200':          (r) => r.status === 200,
    'BCA/OLAARTIQ_B: total is 16.58':      (r) => fees3Body.total === 16.58,
    'BCA/OLAARTIQ_B: filing fee is 15.0':  (r) => fees3Body.filingFees === 15.0,
    'BCA/OLAARTIQ_B: service fee is 1.5':  (r) => fees3Body.serviceFees === 1.5,
    'BCA/OLAARTIQ_B: gst is 0.08':        (r) => fees3Body.tax.gst === 0.08,
  });

  // ── STEP 5: GET Fees BCA/LSEAL ────────────────────────────────
  const fees4Res  = http.get(`${ENV.payBaseUrl}/fees/BCA/LSEAL`, { headers });
  const fees4Body = JSON.parse(fees4Res.body);
  check(fees4Res, {
    'BCA/LSEAL: status 200':     (r) => r.status === 200,
    'BCA/LSEAL: total is 367.5': (r) => fees4Body.total === 367.5,
    'BCA/LSEAL: gst is 17.5':    (r) => fees4Body.tax.gst === 17.5,
  });

  // ── STEP 6: POST Invoice BCA/OLAARTAQ_B (DIRECT_PAY) ──────────
  const payload = JSON.stringify({
    businessInfo: { corpType: 'BCA' },
    filingInfo: {
      filingTypes: [
        { filingTypeCode: 'OLAARTAQ_B', filingDescription: 'CC Regression Test' }
      ],
    },
    details: [{ label: 'BCA REGRESSION', value: 'OLAARTAQ_B' }],
  });

  const invoiceRes = http.post(
    `${ENV.payBaseUrl}/payment-requests`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-apikey':      ENV.apiKey,
        'Content-Type':  'application/json',
        'Account-Id':    ENV.accountId,
      },
    }
  );

  const invoiceBody = JSON.parse(invoiceRes.body);
  check(invoiceRes, {
    'invoice BCA regression: status 201':            (r) => r.status === 201,
    'invoice BCA regression: DIRECT_PAY works':      (r) => invoiceBody.paymentMethod === 'DIRECT_PAY',
    'invoice BCA regression: statusCode is CREATED': (r) => invoiceBody.statusCode === 'CREATED',
    'invoice BCA regression: total correct':         (r) => invoiceBody.total === 11.08,
  });

  sleep(1);

}

export function handleSummary(data) {
  return {
    'reports/summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}