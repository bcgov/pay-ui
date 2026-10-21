import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from '../libs/k6-reporter.js';
import { textSummary } from '../libs/k6-summary.js';
export { options } from '../config/options.js';
import { ENV } from '../config/env.js';

// GOVM (BC Government Ministry) — account 1999, IDIR token
// Test strategy:
//   1. GET /fees/BCA/{code} with Account-Id: 1999  → expected fees (reflects pay admin config + any account overrides)
//   2. POST /payment-requests                       → create invoice
//   3. Assert invoice fields == fees endpoint values (not hardcoded)
//   4. GET /payment-requests/{id}                   → assert same
// This ensures invoice creation reflects whatever is configured in pay admin,
// and will catch mismatches if UI overrides are applied and not reflected in invoices.

const GOVM_ACCOUNT_ID = '1999';

const HEADERS = (token) => ({
  'Authorization': `Bearer ${token}`,
  'x-apikey':      ENV.apiKey,
  'Content-Type':  'application/json',
  'Account-Id':    GOVM_ACCOUNT_ID,
});

const GET_HEADERS = (token) => ({
  'Authorization': `Bearer ${token}`,
  'x-apikey':      ENV.apiKey,
  'Account-Id':    GOVM_ACCOUNT_ID,
});

// Fetch expected fees from pay admin (account-override-aware)
function getFees(token, filingTypeCode) {
  const res = http.get(
    `${ENV.payBaseUrl}/fees/BCA/${filingTypeCode}`,
    { headers: GET_HEADERS(token) }
  );
  let body = {};
  try { body = JSON.parse(res.body); } catch(e) {}
  return {
    filingFees:  body.filingFees  ?? null,
    serviceFees: body.serviceFees ?? null,
    total:       body.total       ?? null,
    gst:         body.tax?.gst    ?? null,
  };
}

function postInvoice(token, filingTypeCode) {
  return http.post(
    `${ENV.payBaseUrl}/payment-requests`,
    JSON.stringify({
      businessInfo: { corpType: 'BCA', businessIdentifier: 'BCA1234' },
      filingInfo:   { filingTypes: [{ filingTypeCode }] },
    }),
    { headers: HEADERS(token) }
  );
}

function getInvoice(token, invoiceId) {
  const res = http.get(
    `${ENV.payBaseUrl}/payment-requests/${invoiceId}`,
    { headers: GET_HEADERS(token) }
  );
  let body = {};
  try { body = JSON.parse(res.body); } catch(e) {}
  if (!body.lineItems) {
    console.log(`GET ${invoiceId} error (status ${res.status}):`, res.body);
    body.lineItems = [{ filingFees: null }];
  }
  return body;
}

function testCode(token, filingTypeCode) {
  // Step 1: get expected fees from fees endpoint (account-override-aware)
  const expected = getFees(token, filingTypeCode);
  check(expected, {
    [`${filingTypeCode} fees: endpoint reachable`]: () => expected.filingFees !== null,
  });

  // Step 2: create invoice
  const inv    = JSON.parse(postInvoice(token, filingTypeCode).body);
  const invGet = getInvoice(token, inv.id);

  // Step 3: assert invoice matches fees endpoint
  check(inv, {
    [`${filingTypeCode} invoice: id present`]:
      () => inv.id !== undefined,
    [`${filingTypeCode} invoice: statusCode COMPLETED`]:
      () => inv.statusCode === 'COMPLETED',
    [`${filingTypeCode} invoice: paymentMethod INTERNAL`]:
      () => inv.paymentMethod === 'INTERNAL',
    [`${filingTypeCode} invoice: isPaymentActionRequired false`]:
      () => inv.isPaymentActionRequired === false,
    [`${filingTypeCode} invoice: total matches fees endpoint`]:
      () => inv.total === expected.total,
    [`${filingTypeCode} invoice: serviceFees matches fees endpoint`]:
      () => inv.serviceFees === expected.serviceFees,
    [`${filingTypeCode} invoice: filingFees matches fees endpoint`]:
      () => inv.lineItems[0].filingFees === expected.filingFees,
    [`${filingTypeCode} invoice: gst matches fees endpoint`]:
      () => (inv.gst ?? 0) === (expected.gst ?? 0),
  });

  // Step 4: GET invoice — assert same values
  check(invGet, {
    [`${filingTypeCode} GET: statusCode COMPLETED`]:
      () => invGet.statusCode === 'COMPLETED',
    [`${filingTypeCode} GET: total matches fees endpoint`]:
      () => invGet.total === expected.total,
    [`${filingTypeCode} GET: serviceFees matches fees endpoint`]:
      () => invGet.serviceFees === expected.serviceFees,
    [`${filingTypeCode} GET: filingFees matches fees endpoint`]:
      () => invGet.lineItems && invGet.lineItems[0].filingFees === expected.filingFees,
    [`${filingTypeCode} GET: gst matches fees endpoint`]:
      () => (invGet.gst ?? 0) === (expected.gst ?? 0),
  });
}

export default function () {

  const token = __ENV.IDIR_TOKEN;
  check({ token }, {
    'token: IDIR_TOKEN present': () => token !== undefined && token !== '',
  });

  // All 12 BCA codes — A (annual), T (transition), N (new), H (historical)
  testCode(token, 'OLAARTOQ_A');
  testCode(token, 'OLAARTAQ_A');
  testCode(token, 'OLAARTIQ_A');
  testCode(token, 'OLAARTOQ_T');
  testCode(token, 'OLAARTAQ_T');
  testCode(token, 'OLAARTIQ_T');
  testCode(token, 'OLAARTOQ_N');
  testCode(token, 'OLAARTAQ_N');
  testCode(token, 'OLAARTIQ_N');
  testCode(token, 'OLAARTOQ_H');
  testCode(token, 'OLAARTAQ_H');
  testCode(token, 'OLAARTIQ_H');

  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}