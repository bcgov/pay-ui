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

  // ── STEP 2: GET Fees DEVQA/QAALL_GST ──────────────────────────
  const feesRes = http.get(
    `${ENV.payBaseUrl}/fees/DEVQA/QAALL_GST`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-apikey':      ENV.apiKey,
      },
    }
  );

  check(feesRes, {
    'fees DEVQA/QAALL_GST: status is 200': (r) => r.status === 200,
    'fees DEVQA/QAALL_GST: has gst':       (r) => JSON.parse(r.body).tax.gst > 0,
  });

  // ── STEP 3: POST Invoice DEVQA/QAALL_GST ──────────────────────
  const payload = JSON.stringify({
    businessInfo: {
      corpType: 'DEVQA',
    },
    filingInfo: {
      filingTypes: [
        {
          filingTypeCode:    'QAALL_GST',
          filingDescription: 'Stat and Service Fee GST',
        }
      ],
    },
    details: [
      {
        label: 'DEVQA',
        value: 'Stat and Service Fee GST',
      }
    ],
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
    // ── status ────────────────────────────────────────────────
    'invoice: status is 201':                  (r) => r.status === 201,
    'invoice: id present':                     (r) => invoiceBody.id !== undefined,
    'invoice: statusCode is CREATED':          (r) => invoiceBody.statusCode === 'CREATED',

    // ── GST verification ──────────────────────────────────────
    'invoice: top level gst is 5.05':          (r) => invoiceBody.gst === 5.05,
    'invoice: line item gst is 5.05':          (r) => invoiceBody.lineItems[0].gst === 5.05,
    'invoice: statutory fees gst is 5.00':     (r) => invoiceBody.lineItems[0].statutoryFeesGst === 5.0,
    'invoice: service fees gst is 0.05':       (r) => invoiceBody.lineItems[0].serviceFeesGst === 0.05,

    // ── fee amounts ───────────────────────────────────────────
    'invoice: filing fee is 100':              (r) => invoiceBody.lineItems[0].filingFees === 100.0,
    'invoice: service fee is 1':               (r) => invoiceBody.lineItems[0].serviceFees === 1.0,
    'invoice: total is 106.05':                (r) => invoiceBody.total === 106.05,

    // ── payment ───────────────────────────────────────────────
    'invoice: payment method is DIRECT_PAY':   (r) => invoiceBody.paymentMethod === 'DIRECT_PAY',
    'invoice: corp type is DEVQA':             (r) => invoiceBody.corpTypeCode === 'DEVQA',
  });

  sleep(1);

}

export function handleSummary(data) {
  return {
    'reports/summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}