import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from '../libs/k6-reporter.js';
import { textSummary } from '../libs/k6-summary.js';
export { options } from '../config/options.js';
import { ENV } from '../config/env.js';

function makePayload(filingTypeCode) {
  return JSON.stringify({
    businessInfo: {
      corpType:           'BCA',
      businessIdentifier: 'BCA1234',
    },
    filingInfo: {
      filingTypes: [{ filingTypeCode }],
    },
  });
}

function postInvoice(token, filingTypeCode) {
  const res = http.post(
    `${ENV.payBaseUrl}/payment-requests`,
    makePayload(filingTypeCode),
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-apikey':      ENV.apiKey,
        'Content-Type':  'application/json',
        'Account-Id':    ENV.accountId,
      },
    }
  );
  return res;
}

function getInvoice(token, invoiceId) {
  return http.get(
    `${ENV.payBaseUrl}/payment-requests/${invoiceId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-apikey':      ENV.apiKey,
      },
    }
  );
}

export default function () {

  // ── STEP 1: Get Token (service account) ───────────────────────
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

  // ── STEP 2: OLAARTOQ_A (filingFees=0, serviceFees=1.5, total=1.58) ──
  const inv1    = JSON.parse(postInvoice(token, 'OLAARTOQ_A').body);
  const inv1Get = JSON.parse(getInvoice(token, inv1.id).body);
  check(inv1, {
    'OLAARTOQ_A invoice: id present':                    () => inv1.id !== undefined,
    'OLAARTOQ_A invoice: statusCode CREATED':            () => inv1.statusCode === 'CREATED',
    'OLAARTOQ_A invoice: total is 1.58':                 () => inv1.total === 1.58,
    'OLAARTOQ_A invoice: filingFees is 0':               () => inv1.lineItems[0].filingFees === 0.0,
    'OLAARTOQ_A invoice: serviceFees is 1.5':            () => inv1.serviceFees === 1.5,
    'OLAARTOQ_A invoice: gst is 0.08':                   () => inv1.gst === 0.08,
    'OLAARTOQ_A invoice: isPaymentActionRequired true':  () => inv1.isPaymentActionRequired === true,
  });
  check(inv1Get, {
    'OLAARTOQ_A GET: statusCode CREATED': () => inv1Get.statusCode === 'CREATED',
    'OLAARTOQ_A GET: total is 1.58':      () => inv1Get.total === 1.58,
    'OLAARTOQ_A GET: filingFees is 0':    () => inv1Get.lineItems[0].filingFees === 0.0,
    'OLAARTOQ_A GET: serviceFees is 1.5': () => inv1Get.serviceFees === 1.5,
    'OLAARTOQ_A GET: gst is 0.08':        () => inv1Get.gst === 0.08,
  });

  // ── STEP 3: OLAARTAQ_A (filingFees=0, serviceFees=1.5, total=1.58) ──
  const inv2    = JSON.parse(postInvoice(token, 'OLAARTAQ_A').body);
  const inv2Get = JSON.parse(getInvoice(token, inv2.id).body);
  check(inv2, {
    'OLAARTAQ_A invoice: id present':                    () => inv2.id !== undefined,
    'OLAARTAQ_A invoice: statusCode CREATED':            () => inv2.statusCode === 'CREATED',
    'OLAARTAQ_A invoice: total is 1.58':                 () => inv2.total === 1.58,
    'OLAARTAQ_A invoice: filingFees is 0':               () => inv2.lineItems[0].filingFees === 0.0,
    'OLAARTAQ_A invoice: serviceFees is 1.5':            () => inv2.serviceFees === 1.5,
    'OLAARTAQ_A invoice: gst is 0.08':                   () => inv2.gst === 0.08,
    'OLAARTAQ_A invoice: isPaymentActionRequired true':  () => inv2.isPaymentActionRequired === true,
  });
  check(inv2Get, {
    'OLAARTAQ_A GET: statusCode CREATED': () => inv2Get.statusCode === 'CREATED',
    'OLAARTAQ_A GET: total is 1.58':      () => inv2Get.total === 1.58,
    'OLAARTAQ_A GET: filingFees is 0':    () => inv2Get.lineItems[0].filingFees === 0.0,
    'OLAARTAQ_A GET: serviceFees is 1.5': () => inv2Get.serviceFees === 1.5,
    'OLAARTAQ_A GET: gst is 0.08':        () => inv2Get.gst === 0.08,
  });

  // ── STEP 4: OLAARTIQ_A (filingFees=0, serviceFees=1.5, total=1.58) ──
  const inv3    = JSON.parse(postInvoice(token, 'OLAARTIQ_A').body);
  const inv3Get = JSON.parse(getInvoice(token, inv3.id).body);
  check(inv3, {
    'OLAARTIQ_A invoice: id present':                    () => inv3.id !== undefined,
    'OLAARTIQ_A invoice: statusCode CREATED':            () => inv3.statusCode === 'CREATED',
    'OLAARTIQ_A invoice: total is 1.58':                 () => inv3.total === 1.58,
    'OLAARTIQ_A invoice: filingFees is 0':               () => inv3.lineItems[0].filingFees === 0.0,
    'OLAARTIQ_A invoice: serviceFees is 1.5':            () => inv3.serviceFees === 1.5,
    'OLAARTIQ_A invoice: gst is 0.08':                   () => inv3.gst === 0.08,
    'OLAARTIQ_A invoice: isPaymentActionRequired true':  () => inv3.isPaymentActionRequired === true,
  });
  check(inv3Get, {
    'OLAARTIQ_A GET: statusCode CREATED': () => inv3Get.statusCode === 'CREATED',
    'OLAARTIQ_A GET: total is 1.58':      () => inv3Get.total === 1.58,
    'OLAARTIQ_A GET: filingFees is 0':    () => inv3Get.lineItems[0].filingFees === 0.0,
    'OLAARTIQ_A GET: serviceFees is 1.5': () => inv3Get.serviceFees === 1.5,
    'OLAARTIQ_A GET: gst is 0.08':        () => inv3Get.gst === 0.08,
  });

  // ── STEP 5: OLAARTOQ_T (filingFees=0, serviceFees=1.5, total=1.58) ──
  const inv4    = JSON.parse(postInvoice(token, 'OLAARTOQ_T').body);
  const inv4Get = JSON.parse(getInvoice(token, inv4.id).body);
  check(inv4, {
    'OLAARTOQ_T invoice: id present':                    () => inv4.id !== undefined,
    'OLAARTOQ_T invoice: statusCode CREATED':            () => inv4.statusCode === 'CREATED',
    'OLAARTOQ_T invoice: total is 1.58':                 () => inv4.total === 1.58,
    'OLAARTOQ_T invoice: filingFees is 0':               () => inv4.lineItems[0].filingFees === 0.0,
    'OLAARTOQ_T invoice: serviceFees is 1.5':            () => inv4.serviceFees === 1.5,
    'OLAARTOQ_T invoice: gst is 0.08':                   () => inv4.gst === 0.08,
    'OLAARTOQ_T invoice: isPaymentActionRequired true':  () => inv4.isPaymentActionRequired === true,
  });
  check(inv4Get, {
    'OLAARTOQ_T GET: statusCode CREATED': () => inv4Get.statusCode === 'CREATED',
    'OLAARTOQ_T GET: total is 1.58':      () => inv4Get.total === 1.58,
    'OLAARTOQ_T GET: filingFees is 0':    () => inv4Get.lineItems[0].filingFees === 0.0,
    'OLAARTOQ_T GET: serviceFees is 1.5': () => inv4Get.serviceFees === 1.5,
    'OLAARTOQ_T GET: gst is 0.08':        () => inv4Get.gst === 0.08,
  });

  // ── STEP 6: OLAARTAQ_T (filingFees=0, serviceFees=1.5, total=1.58) ──
  const inv5    = JSON.parse(postInvoice(token, 'OLAARTAQ_T').body);
  const inv5Get = JSON.parse(getInvoice(token, inv5.id).body);
  check(inv5, {
    'OLAARTAQ_T invoice: id present':                    () => inv5.id !== undefined,
    'OLAARTAQ_T invoice: statusCode CREATED':            () => inv5.statusCode === 'CREATED',
    'OLAARTAQ_T invoice: total is 1.58':                 () => inv5.total === 1.58,
    'OLAARTAQ_T invoice: filingFees is 0':               () => inv5.lineItems[0].filingFees === 0.0,
    'OLAARTAQ_T invoice: serviceFees is 1.5':            () => inv5.serviceFees === 1.5,
    'OLAARTAQ_T invoice: gst is 0.08':                   () => inv5.gst === 0.08,
    'OLAARTAQ_T invoice: isPaymentActionRequired true':  () => inv5.isPaymentActionRequired === true,
  });
  check(inv5Get, {
    'OLAARTAQ_T GET: statusCode CREATED': () => inv5Get.statusCode === 'CREATED',
    'OLAARTAQ_T GET: total is 1.58':      () => inv5Get.total === 1.58,
    'OLAARTAQ_T GET: filingFees is 0':    () => inv5Get.lineItems[0].filingFees === 0.0,
    'OLAARTAQ_T GET: serviceFees is 1.5': () => inv5Get.serviceFees === 1.5,
    'OLAARTAQ_T GET: gst is 0.08':        () => inv5Get.gst === 0.08,
  });

  // ── STEP 7: OLAARTIQ_T (filingFees=1.0, serviceFees=1.5, total=2.58) ──
  const inv6    = JSON.parse(postInvoice(token, 'OLAARTIQ_T').body);
  const inv6Get = JSON.parse(getInvoice(token, inv6.id).body);
  check(inv6, {
    'OLAARTIQ_T invoice: id present':                    () => inv6.id !== undefined,
    'OLAARTIQ_T invoice: statusCode CREATED':            () => inv6.statusCode === 'CREATED',
    'OLAARTIQ_T invoice: total is 2.58':                 () => inv6.total === 2.58,
    'OLAARTIQ_T invoice: filingFees is 1.0':             () => inv6.lineItems[0].filingFees === 1.0,
    'OLAARTIQ_T invoice: serviceFees is 1.5':            () => inv6.serviceFees === 1.5,
    'OLAARTIQ_T invoice: gst is 0.08':                   () => inv6.gst === 0.08,
    'OLAARTIQ_T invoice: isPaymentActionRequired true':  () => inv6.isPaymentActionRequired === true,
  });
  check(inv6Get, {
    'OLAARTIQ_T GET: statusCode CREATED':   () => inv6Get.statusCode === 'CREATED',
    'OLAARTIQ_T GET: total is 2.58':        () => inv6Get.total === 2.58,
    'OLAARTIQ_T GET: filingFees is 1.0':    () => inv6Get.lineItems[0].filingFees === 1.0,
    'OLAARTIQ_T GET: serviceFees is 1.5':   () => inv6Get.serviceFees === 1.5,
    'OLAARTIQ_T GET: gst is 0.08':          () => inv6Get.gst === 0.08,
  });

  // ── STEP 8: OLAARTOQ_N (filingFees=2.0, serviceFees=1.0, total=3.05) ──
  const inv7    = JSON.parse(postInvoice(token, 'OLAARTOQ_N').body);
  const inv7Get = JSON.parse(getInvoice(token, inv7.id).body);
  check(inv7, {
    'OLAARTOQ_N invoice: id present':                    () => inv7.id !== undefined,
    'OLAARTOQ_N invoice: statusCode CREATED':            () => inv7.statusCode === 'CREATED',
    'OLAARTOQ_N invoice: total is 3.05':                 () => inv7.total === 3.05,
    'OLAARTOQ_N invoice: filingFees is 2.0':             () => inv7.lineItems[0].filingFees === 2.0,
    'OLAARTOQ_N invoice: serviceFees is 1.0':            () => inv7.serviceFees === 1.0,
    'OLAARTOQ_N invoice: gst is 0.05':                   () => inv7.gst === 0.05,
    'OLAARTOQ_N invoice: isPaymentActionRequired true':  () => inv7.isPaymentActionRequired === true,
  });
  check(inv7Get, {
    'OLAARTOQ_N GET: statusCode CREATED':   () => inv7Get.statusCode === 'CREATED',
    'OLAARTOQ_N GET: total is 3.05':        () => inv7Get.total === 3.05,
    'OLAARTOQ_N GET: filingFees is 2.0':    () => inv7Get.lineItems[0].filingFees === 2.0,
    'OLAARTOQ_N GET: serviceFees is 1.0':   () => inv7Get.serviceFees === 1.0,
    'OLAARTOQ_N GET: gst is 0.05':          () => inv7Get.gst === 0.05,
  });

  // ── STEP 9: OLAARTAQ_N (filingFees=4.0, serviceFees=1.0, total=5.05) ──
  const inv8    = JSON.parse(postInvoice(token, 'OLAARTAQ_N').body);
  const inv8Get = JSON.parse(getInvoice(token, inv8.id).body);
  check(inv8, {
    'OLAARTAQ_N invoice: id present':                    () => inv8.id !== undefined,
    'OLAARTAQ_N invoice: statusCode CREATED':            () => inv8.statusCode === 'CREATED',
    'OLAARTAQ_N invoice: total is 5.05':                 () => inv8.total === 5.05,
    'OLAARTAQ_N invoice: filingFees is 4.0':             () => inv8.lineItems[0].filingFees === 4.0,
    'OLAARTAQ_N invoice: serviceFees is 1.0':            () => inv8.serviceFees === 1.0,
    'OLAARTAQ_N invoice: gst is 0.05':                   () => inv8.gst === 0.05,
    'OLAARTAQ_N invoice: isPaymentActionRequired true':  () => inv8.isPaymentActionRequired === true,
  });
  check(inv8Get, {
    'OLAARTAQ_N GET: statusCode CREATED':   () => inv8Get.statusCode === 'CREATED',
    'OLAARTAQ_N GET: total is 5.05':        () => inv8Get.total === 5.05,
    'OLAARTAQ_N GET: filingFees is 4.0':    () => inv8Get.lineItems[0].filingFees === 4.0,
    'OLAARTAQ_N GET: serviceFees is 1.0':   () => inv8Get.serviceFees === 1.0,
    'OLAARTAQ_N GET: gst is 0.05':          () => inv8Get.gst === 0.05,
  });

  // ── STEP 10: OLAARTIQ_N (filingFees=15.0, serviceFees=1.0, total=16.05) ──
  const inv9    = JSON.parse(postInvoice(token, 'OLAARTIQ_N').body);
  const inv9Get = JSON.parse(getInvoice(token, inv9.id).body);
  check(inv9, {
    'OLAARTIQ_N invoice: id present':                    () => inv9.id !== undefined,
    'OLAARTIQ_N invoice: statusCode CREATED':            () => inv9.statusCode === 'CREATED',
    'OLAARTIQ_N invoice: total is 16.05':                () => inv9.total === 16.05,
    'OLAARTIQ_N invoice: filingFees is 15.0':            () => inv9.lineItems[0].filingFees === 15.0,
    'OLAARTIQ_N invoice: serviceFees is 1.0':            () => inv9.serviceFees === 1.0,
    'OLAARTIQ_N invoice: gst is 0.05':                   () => inv9.gst === 0.05,
    'OLAARTIQ_N invoice: isPaymentActionRequired true':  () => inv9.isPaymentActionRequired === true,
  });
  check(inv9Get, {
    'OLAARTIQ_N GET: statusCode CREATED':   () => inv9Get.statusCode === 'CREATED',
    'OLAARTIQ_N GET: total is 16.05':       () => inv9Get.total === 16.05,
    'OLAARTIQ_N GET: filingFees is 15.0':   () => inv9Get.lineItems[0].filingFees === 15.0,
    'OLAARTIQ_N GET: serviceFees is 1.0':   () => inv9Get.serviceFees === 1.0,
    'OLAARTIQ_N GET: gst is 0.05':          () => inv9Get.gst === 0.05,
  });

  // ── STEP 11: OLAARTOQ_H (filingFees=2.0, serviceFees=1.0, total=3.05) ──
  const inv10    = JSON.parse(postInvoice(token, 'OLAARTOQ_H').body);
  const inv10Get = JSON.parse(getInvoice(token, inv10.id).body);
  check(inv10, {
    'OLAARTOQ_H invoice: id present':                    () => inv10.id !== undefined,
    'OLAARTOQ_H invoice: statusCode CREATED':            () => inv10.statusCode === 'CREATED',
    'OLAARTOQ_H invoice: total is 3.05':                 () => inv10.total === 3.05,
    'OLAARTOQ_H invoice: filingFees is 2.0':             () => inv10.lineItems[0].filingFees === 2.0,
    'OLAARTOQ_H invoice: serviceFees is 1.0':            () => inv10.serviceFees === 1.0,
    'OLAARTOQ_H invoice: gst is 0.05':                   () => inv10.gst === 0.05,
    'OLAARTOQ_H invoice: isPaymentActionRequired true':  () => inv10.isPaymentActionRequired === true,
  });
  check(inv10Get, {
    'OLAARTOQ_H GET: statusCode CREATED':   () => inv10Get.statusCode === 'CREATED',
    'OLAARTOQ_H GET: total is 3.05':        () => inv10Get.total === 3.05,
    'OLAARTOQ_H GET: filingFees is 2.0':    () => inv10Get.lineItems[0].filingFees === 2.0,
    'OLAARTOQ_H GET: serviceFees is 1.0':   () => inv10Get.serviceFees === 1.0,
    'OLAARTOQ_H GET: gst is 0.05':          () => inv10Get.gst === 0.05,
  });

  // ── STEP 12: OLAARTAQ_H (filingFees=1.83, serviceFees=1.0, total=2.88) ──
  const inv11    = JSON.parse(postInvoice(token, 'OLAARTAQ_H').body);
  const inv11Get = JSON.parse(getInvoice(token, inv11.id).body);
  check(inv11, {
    'OLAARTAQ_H invoice: id present':                    () => inv11.id !== undefined,
    'OLAARTAQ_H invoice: statusCode CREATED':            () => inv11.statusCode === 'CREATED',
    'OLAARTAQ_H invoice: total is 2.88':                 () => inv11.total === 2.88,
    'OLAARTAQ_H invoice: filingFees is 1.83':            () => inv11.lineItems[0].filingFees === 1.83,
    'OLAARTAQ_H invoice: serviceFees is 1.0':            () => inv11.serviceFees === 1.0,
    'OLAARTAQ_H invoice: gst is 0.05':                   () => inv11.gst === 0.05,
    'OLAARTAQ_H invoice: isPaymentActionRequired true':  () => inv11.isPaymentActionRequired === true,
  });
  check(inv11Get, {
    'OLAARTAQ_H GET: statusCode CREATED':   () => inv11Get.statusCode === 'CREATED',
    'OLAARTAQ_H GET: total is 2.88':        () => inv11Get.total === 2.88,
    'OLAARTAQ_H GET: filingFees is 1.83':   () => inv11Get.lineItems[0].filingFees === 1.83,
    'OLAARTAQ_H GET: serviceFees is 1.0':   () => inv11Get.serviceFees === 1.0,
    'OLAARTAQ_H GET: gst is 0.05':          () => inv11Get.gst === 0.05,
  });

  // ── STEP 13: OLAARTIQ_H (filingFees=15.0, serviceFees=1.0, total=16.05) ──
  const inv12    = JSON.parse(postInvoice(token, 'OLAARTIQ_H').body);
  const inv12Get = JSON.parse(getInvoice(token, inv12.id).body);
  check(inv12, {
    'OLAARTIQ_H invoice: id present':                    () => inv12.id !== undefined,
    'OLAARTIQ_H invoice: statusCode CREATED':            () => inv12.statusCode === 'CREATED',
    'OLAARTIQ_H invoice: total is 16.05':                () => inv12.total === 16.05,
    'OLAARTIQ_H invoice: filingFees is 15.0':            () => inv12.lineItems[0].filingFees === 15.0,
    'OLAARTIQ_H invoice: serviceFees is 1.0':            () => inv12.serviceFees === 1.0,
    'OLAARTIQ_H invoice: gst is 0.05':                   () => inv12.gst === 0.05,
    'OLAARTIQ_H invoice: isPaymentActionRequired true':  () => inv12.isPaymentActionRequired === true,
  });
  check(inv12Get, {
    'OLAARTIQ_H GET: statusCode CREATED':   () => inv12Get.statusCode === 'CREATED',
    'OLAARTIQ_H GET: total is 16.05':       () => inv12Get.total === 16.05,
    'OLAARTIQ_H GET: filingFees is 15.0':   () => inv12Get.lineItems[0].filingFees === 15.0,
    'OLAARTIQ_H GET: serviceFees is 1.0':   () => inv12Get.serviceFees === 1.0,
    'OLAARTIQ_H GET: gst is 0.05':          () => inv12Get.gst === 0.05,
  });

  sleep(1);

}

export function handleSummary(data) {
  return {
    'reports/summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}