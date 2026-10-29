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

  // ── STEP 2: GET Fees BCA/OLAARTAQ_B ───────────────────────────
  const feesRes = http.get(
    `${ENV.payBaseUrl}/fees/BCA/OLAARTAQ_B`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-apikey':      ENV.apiKey,
      },
    }
  );

  check(feesRes, {
    'fees BCA/OLAARTAQ_B: status is 200':  (r) => r.status === 200,
    'fees BCA/OLAARTAQ_B: body not empty': (r) => r.body.length > 0,
  });

  // ── STEP 3: POST Invoice BCA/OLAARTAQ_B (Credit Card) ─────────
  const payload = JSON.stringify({
    businessInfo: {
      corpType: 'BCA',
    },
    filingInfo: {
      filingTypes: [
        {
          filingTypeCode:    'OLAARTAQ_B',
          filingDescription: 'Credit Card Test OLAARTAQ_B',
        }
      ],
    },
    details: [
      {
        label: 'BCA CC TEST',
        value: 'OLAARTAQ_B',
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
    'invoice BCA CC: status is 201':               (r) => r.status === 201,
    'invoice BCA CC: statusCode is CREATED':       (r) => invoiceBody.statusCode === 'CREATED',
    'invoice BCA CC: id present':                  (r) => invoiceBody.id !== undefined,

    // ── credit card verification ──────────────────────────────
    'invoice BCA CC: paymentMethod is DIRECT_PAY': (r) => invoiceBody.paymentMethod === 'DIRECT_PAY',

    // ── corp type ─────────────────────────────────────────────
    'invoice BCA CC: corp type is BCA':            (r) => invoiceBody.corpTypeCode === 'BCA',

    // ── amounts ───────────────────────────────────────────────
    'invoice BCA CC: total is 11.08':              (r) => invoiceBody.total === 11.08,
    'invoice BCA CC: service fee is 1.5':          (r) => invoiceBody.serviceFees === 1.5,
    'invoice BCA CC: filing fee is 9.5':           (r) => invoiceBody.lineItems[0].filingFees === 9.5,

    // ── GST on invoice ────────────────────────────────────────
    'invoice BCA CC: gst is 0.08':                 (r) => invoiceBody.gst === 0.08,
    'invoice BCA CC: serviceFeesGst is 0.08':      (r) => invoiceBody.lineItems[0].serviceFeesGst === 0.08,

    // ── invoice reference ─────────────────────────────────────
    'invoice BCA CC: invoice number present':      (r) => invoiceBody.references[0].invoiceNumber !== undefined,
    'invoice BCA CC: reference is ACTIVE':         (r) => invoiceBody.references[0].statusCode === 'ACTIVE',
    'invoice BCA CC: payment action required':     (r) => invoiceBody.isPaymentActionRequired === true,
  });

  sleep(1);

}

export function handleSummary(data) {
  return {
    'reports/summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}