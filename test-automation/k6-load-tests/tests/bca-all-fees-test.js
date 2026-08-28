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

  // ── GOVN — Zero dollar fees ────────────────────────────────────

  // STEP 2: OLAARTOQ_A
  const r1 = JSON.parse(http.get(`${ENV.payBaseUrl}/fees/BCA/OLAARTOQ_A`, { headers }).body);
  check(r1, {
    'OLAARTOQ_A: status 200':      () => r1.filingTypeCode === 'OLAARTOQ_A',
    'OLAARTOQ_A: total is 0':      () => r1.total === 0.0,
    'OLAARTOQ_A: filing fee is 0': () => r1.filingFees === 0.0,
    'OLAARTOQ_A: gst is 0':        () => r1.tax.gst === 0.0,
  });

  // STEP 3: OLAARTAQ_A
  const r2 = JSON.parse(http.get(`${ENV.payBaseUrl}/fees/BCA/OLAARTAQ_A`, { headers }).body);
  check(r2, {
    'OLAARTAQ_A: status 200':      () => r2.filingTypeCode === 'OLAARTAQ_A',
    'OLAARTAQ_A: total is 0':      () => r2.total === 0.0,
    'OLAARTAQ_A: filing fee is 0': () => r2.filingFees === 0.0,
    'OLAARTAQ_A: gst is 0':        () => r2.tax.gst === 0.0,
  });

  // STEP 4: OLAARTIQ_A
  const r3 = JSON.parse(http.get(`${ENV.payBaseUrl}/fees/BCA/OLAARTIQ_A`, { headers }).body);
  check(r3, {
    'OLAARTIQ_A: status 200':      () => r3.filingTypeCode === 'OLAARTIQ_A',
    'OLAARTIQ_A: total is 0':      () => r3.total === 0.0,
    'OLAARTIQ_A: filing fee is 0': () => r3.filingFees === 0.0,
    'OLAARTIQ_A: gst is 0':        () => r3.tax.gst === 0.0,
  });

  // ── GOVN — T codes ─────────────────────────────────────────────

  // STEP 5: OLAARTOQ_T
  const r4 = JSON.parse(http.get(`${ENV.payBaseUrl}/fees/BCA/OLAARTOQ_T`, { headers }).body);
  check(r4, {
    'OLAARTOQ_T: status 200':      () => r4.filingTypeCode === 'OLAARTOQ_T',
    'OLAARTOQ_T: total is 0':      () => r4.total === 0.0,
    'OLAARTOQ_T: filing fee is 0': () => r4.filingFees === 0.0,
    'OLAARTOQ_T: gst is 0':        () => r4.tax.gst === 0.0,
  });

  // STEP 6: OLAARTAQ_T
  const r5 = JSON.parse(http.get(`${ENV.payBaseUrl}/fees/BCA/OLAARTAQ_T`, { headers }).body);
  check(r5, {
    'OLAARTAQ_T: status 200':      () => r5.filingTypeCode === 'OLAARTAQ_T',
    'OLAARTAQ_T: total is 0':      () => r5.total === 0.0,
    'OLAARTAQ_T: filing fee is 0': () => r5.filingFees === 0.0,
    'OLAARTAQ_T: gst is 0':        () => r5.tax.gst === 0.0,
  });

  // STEP 7: OLAARTIQ_T
  const r6 = JSON.parse(http.get(`${ENV.payBaseUrl}/fees/BCA/OLAARTIQ_T`, { headers }).body);
  check(r6, {
    'OLAARTIQ_T: status 200':         () => r6.filingTypeCode === 'OLAARTIQ_T',
    'OLAARTIQ_T: total is 2.58':      () => r6.total === 2.58,
    'OLAARTIQ_T: filing fee is 1.0':  () => r6.filingFees === 1.0,
    'OLAARTIQ_T: service fee is 1.5': () => r6.serviceFees === 1.5,
    'OLAARTIQ_T: gst is 0.08':        () => r6.tax.gst === 0.08,
  });

  // ── GOVM — N codes ─────────────────────────────────────────────

  // STEP 8: OLAARTOQ_N
  const r7 = JSON.parse(http.get(`${ENV.payBaseUrl}/fees/BCA/OLAARTOQ_N`, { headers }).body);
  check(r7, {
    'OLAARTOQ_N: status 200':         () => r7.filingTypeCode === 'OLAARTOQ_N',
    'OLAARTOQ_N: total is 3.05':      () => r7.total === 3.05,
    'OLAARTOQ_N: filing fee is 2.0':  () => r7.filingFees === 2.0,
    'OLAARTOQ_N: service fee is 1.0': () => r7.serviceFees === 1.0,
    'OLAARTOQ_N: gst is 0.05':        () => r7.tax.gst === 0.05,
  });

  // STEP 9: OLAARTAQ_N
  const r8 = JSON.parse(http.get(`${ENV.payBaseUrl}/fees/BCA/OLAARTAQ_N`, { headers }).body);
  check(r8, {
    'OLAARTAQ_N: status 200':         () => r8.filingTypeCode === 'OLAARTAQ_N',
    'OLAARTAQ_N: total is 5.05':      () => r8.total === 5.05,
    'OLAARTAQ_N: filing fee is 4.0':  () => r8.filingFees === 4.0,
    'OLAARTAQ_N: service fee is 1.0': () => r8.serviceFees === 1.0,
    'OLAARTAQ_N: gst is 0.05':        () => r8.tax.gst === 0.05,
  });

  // STEP 10: OLAARTIQ_N
  const r9 = JSON.parse(http.get(`${ENV.payBaseUrl}/fees/BCA/OLAARTIQ_N`, { headers }).body);
  check(r9, {
    'OLAARTIQ_N: status 200':          () => r9.filingTypeCode === 'OLAARTIQ_N',
    'OLAARTIQ_N: total is 16.05':      () => r9.total === 16.05,
    'OLAARTIQ_N: filing fee is 15.0':  () => r9.filingFees === 15.0,
    'OLAARTIQ_N: service fee is 1.0':  () => r9.serviceFees === 1.0,
    'OLAARTIQ_N: gst is 0.05':         () => r9.tax.gst === 0.05,
  });

  // ── GOVM — H codes ─────────────────────────────────────────────

  // STEP 11: OLAARTOQ_H
  const r10 = JSON.parse(http.get(`${ENV.payBaseUrl}/fees/BCA/OLAARTOQ_H`, { headers }).body);
  check(r10, {
    'OLAARTOQ_H: status 200':              () => r10.filingTypeCode === 'OLAARTOQ_H',
    'OLAARTOQ_H: total is 3.15':           () => r10.total === 3.15,
    'OLAARTOQ_H: filing fee is 2.0':       () => r10.filingFees === 2.0,
    'OLAARTOQ_H: service fee is 1.0':      () => r10.serviceFees === 1.0,
    'OLAARTOQ_H: gst is 0.15':             () => r10.tax.gst === 0.15,
    'OLAARTOQ_H: filingFeeGst is 0.1':     () => r10.tax.filingFeeGst === 0.1,
    'OLAARTOQ_H: serviceFeeGst is 0.05':   () => r10.tax.serviceFeeGst === 0.05,
  });

  // STEP 12: OLAARTAQ_H
  const r11 = JSON.parse(http.get(`${ENV.payBaseUrl}/fees/BCA/OLAARTAQ_H`, { headers }).body);
  check(r11, {
    'OLAARTAQ_H: status 200':              () => r11.filingTypeCode === 'OLAARTAQ_H',
    'OLAARTAQ_H: total is 2.97':           () => r11.total === 2.97,
    'OLAARTAQ_H: filing fee is 1.83':      () => r11.filingFees === 1.83,
    'OLAARTAQ_H: service fee is 1.0':      () => r11.serviceFees === 1.0,
    'OLAARTAQ_H: gst is 0.14':             () => r11.tax.gst === 0.14,
    'OLAARTAQ_H: filingFeeGst is 0.09':    () => r11.tax.filingFeeGst === 0.09,
    'OLAARTAQ_H: serviceFeeGst is 0.05':   () => r11.tax.serviceFeeGst === 0.05,
  });

  // STEP 13: OLAARTIQ_H
  const r12 = JSON.parse(http.get(`${ENV.payBaseUrl}/fees/BCA/OLAARTIQ_H`, { headers }).body);
  check(r12, {
    'OLAARTIQ_H: status 200':              () => r12.filingTypeCode === 'OLAARTIQ_H',
    'OLAARTIQ_H: total is 16.8':           () => r12.total === 16.8,
    'OLAARTIQ_H: filing fee is 15.0':      () => r12.filingFees === 15.0,
    'OLAARTIQ_H: service fee is 1.0':      () => r12.serviceFees === 1.0,
    'OLAARTIQ_H: gst is 0.8':              () => r12.tax.gst === 0.8,
    'OLAARTIQ_H: filingFeeGst is 0.75':    () => r12.tax.filingFeeGst === 0.75,
    'OLAARTIQ_H: serviceFeeGst is 0.05':   () => r12.tax.serviceFeeGst === 0.05,
  });

  sleep(1);

}

export function handleSummary(data) {
  return {
    'reports/summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}