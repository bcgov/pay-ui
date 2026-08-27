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

  // ── STEP 2: POST Invoice BCA/OLAARTOQ_A (zero dollar → auto COMPLETED) ──
  const payload = JSON.stringify({
    businessInfo: {
      corpType:           'BCA',
      businessIdentifier: 'BCA1234',
    },
    filingInfo: {
      filingTypes: [
        { filingTypeCode: 'OLAARTOQ_A' }
      ],
    },
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
    // ── invoice status ────────────────────────────────────────
    'invoice receipt: status is 201':              (r) => r.status === 201,
    'invoice receipt: statusCode is COMPLETED':    (r) => invoiceBody.statusCode === 'COMPLETED',
    'invoice receipt: paymentMethod is INTERNAL':  (r) => invoiceBody.paymentMethod === 'INTERNAL',
    'invoice receipt: total is 0':                 (r) => invoiceBody.total === 0.0,
    'invoice receipt: corp type is BCA':           (r) => invoiceBody.corpTypeCode === 'BCA',

    // ── receipt verification ──────────────────────────────────
    'invoice receipt: receipts not null':          (r) => invoiceBody.receipts !== null,
    'invoice receipt: receipts has 1 entry':       (r) => invoiceBody.receipts.length === 1,
    'invoice receipt: receipt id present':         (r) => invoiceBody.receipts[0].id !== undefined,
    'invoice receipt: receipt amount is 0':        (r) => invoiceBody.receipts[0].receiptAmount === 0.0,
    'invoice receipt: receipt number present':     (r) => invoiceBody.receipts[0].receiptNumber !== undefined,
    'invoice receipt: receipt number starts REGT': (r) => invoiceBody.receipts[0].receiptNumber.startsWith('REGT'),
    'invoice receipt: receipt date present':       (r) => invoiceBody.receipts[0].receiptDate !== undefined,

    // ── no payment action needed (zero dollar) ────────────────
    'invoice receipt: no payment action required': (r) => invoiceBody.isPaymentActionRequired === false,
  });

  sleep(1);

}

export function handleSummary(data) {
  return {
    'reports/summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}