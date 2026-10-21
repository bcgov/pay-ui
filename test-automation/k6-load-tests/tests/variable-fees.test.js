import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { htmlReport } from '../libs/k6-reporter.js';
import { textSummary } from '../libs/k6-summary.js';
export { options } from '../config/options.js';
import { ENV } from '../config/env.js';

// PAY-API #35025 — Scenario 7: Variable fees
//   • Variable fee amount overrides the base filing fee for ALL user types
//   • waiveFees (staff) waives priority / future effective fees, but NOT the variable base fee
//     on invoice creation
//
// Fee admin setup BEFORE running (revert afterwards):
//   OLAARTIQ_B  Variable Fee Flag = ON, priority = 20.00, future effective = 20.00
//
// Run:
//   k6 run --vus 1 --iterations 1 -e ENV=test tests/variable-fees.test.js

const CODE          = 'OLAARTIQ_B';
const BASE_FEE      = 15.00;   // fixed filing fee in Fee admin (must NOT be charged when amount is sent)
const VAR_AMOUNT    = 111.11;
const SCHEDULE_SVC  = 1.50;    // OLAARTIQ_B schedule service fee
const PRIORITY_FEE  = 20.00;
const FE_FEE        = 20.00;
const GST_RATE      = 0.05;    // service fee only
const CORP_TYPE     = 'BCA';

// ── Credentials: paste here or pass with -e. Do NOT commit real values. ──
const IDIR_TOKEN          = '';  // staff
const BCSC_TOKEN          = '';  // public BCSC user (3141)
const BCEID_PUBLIC_TOKEN  = '';  // public BCeID user (3180)
const GOVN_TOKEN          = '';  // GovN BCeID user (3179)
const AUTH_ENTITY_SECRET  = '';  // auth-entity-service-account secret

const PAY_URL = __ENV.PAY_BASE_URL || ENV.payBaseUrl;
const APIKEY  = __ENV.API_KEY || ENV.apiKey;

// service: service fee this user type should get on OLAARTIQ_B
const USERS = [
  { label: 'staff-2198',        token: () => IDIR_TOKEN || __ENV.IDIR_TOKEN,                 account: '2198', service: 0 },
  { label: 'public-bcsc-3141',  token: () => BCSC_TOKEN || __ENV.BCSC_TOKEN,                 account: '3141', service: SCHEDULE_SVC },
  { label: 'public-bceid-3180', token: () => BCEID_PUBLIC_TOKEN || __ENV.BCEID_PUBLIC_TOKEN, account: '3180', service: SCHEDULE_SVC },
  { label: 'govn-3179',         token: () => GOVN_TOKEN || __ENV.GOVN_TOKEN,                 account: '3179', service: 1.00 },
  { label: 'sa-name-request',   token: () => saToken(ENV.clientId || 'name-request-service-account', __ENV.NR_SECRET || ENV.clientSecret),
                                account: null, service: SCHEDULE_SVC },
  { label: 'sa-auth-entity',    token: () => saToken('auth-entity-service-account', AUTH_ENTITY_SECRET || __ENV.AUTH_ENTITY_SECRET),
                                account: null, service: 0 },
];

// ── Helpers ───────────────────────────────────────────────────────
const round2   = (n) => Math.round(n * 100) / 100;
const eq       = (a, e) => typeof a === 'number' && Math.abs(a - e) < 0.001;
const eqOrNull = (a, e) => a == null ? e === 0 : eq(a, e);

function saToken(clientId, secret) {
  if (!secret) return null;
  const res = http.post(ENV.tokenUrl, { grant_type: 'client_credentials', client_id: clientId, client_secret: secret });
  try { return res.json().access_token; } catch (e) { return null; }
}
function headers(token, account) {
  const h = { 'Authorization': `Bearer ${token}`, 'x-apikey': APIKEY, 'Content-Type': 'application/json' };
  if (account) h['Account-Id'] = account;
  return h;
}
function safeJson(res) { try { return res.json(); } catch (e) { return {}; } }
function logIfError(label, res) {
  if (res.status < 200 || res.status >= 300) {
    console.error(`${label} → HTTP ${res.status}: ${String(res.body).slice(0, 300)}`);
  }
}

// Creates an invoice and checks it (plus read-back) against exp.
function invoiceCase(L, token, account, filingType, exp) {
  const payload = JSON.stringify({
    businessInfo: { corpType: CORP_TYPE, businessIdentifier: 'BCA1234' },
    filingInfo:   { filingTypes: [filingType] },
  });
  const res = http.post(`${PAY_URL}/payment-requests`, payload,
    { headers: headers(token, account), tags: { name: 'POST /payment-requests' } });
  logIfError(`${L} POST /payment-requests`, res);
  const inv  = safeJson(res);
  const item = (inv.lineItems && inv.lineItems[0]) || {};
  console.log(`${L} id=${inv.id} filing=${item.filingFees} priority=${item.priorityFees} fe=${item.futureEffectiveFees} ` +
              `service=${inv.serviceFees} waived=${item.waivedFees} total=${inv.total} status=${inv.statusCode}`);
  const checks = {
    [`${L} HTTP 201`]:                        (r) => r.status === 201,
    [`${L} filingFees = ${exp.filing}`]:      () => eq(item.filingFees, exp.filing),
    [`${L} priorityFees = ${exp.priority}`]:  () => eqOrNull(item.priorityFees, exp.priority),
    [`${L} futureEffectiveFees = ${exp.fe}`]: () => eqOrNull(item.futureEffectiveFees, exp.fe),
    [`${L} serviceFees = ${exp.service}`]:    () => eq(inv.serviceFees, exp.service),
    [`${L} total = ${exp.total}`]:            () => eq(inv.total, exp.total),
  };
  if (exp.waived !== undefined) {
    checks[`${L} waivedFees = ${exp.waived}`] = () => eqOrNull(item.waivedFees, exp.waived);
  }
  check(res, checks);
  if (!inv.id) return;

  const got = safeJson(http.get(`${PAY_URL}/payment-requests/${inv.id}`,
    { headers: headers(token, account), tags: { name: 'GET /payment-requests/{id}' } }));
  const gotItem = (got.lineItems && got.lineItems[0]) || {};
  check(null, {
    [`${L} GET: total = ${exp.total}`]:        () => eq(got.total, exp.total),
    [`${L} GET: filingFees = ${exp.filing}`]:  () => eq(gotItem.filingFees, exp.filing),
  });
}

function exp({ filing, priority = 0, fe = 0, service, waived }) {
  const gst = round2(service * GST_RATE);
  return { filing, priority, fe, service, waived, total: round2(filing + priority + fe + service + gst) };
}

export default function () {
  check(null, { 'setup: payBaseUrl present': () => !!PAY_URL });

  // ── Part 1: variable amount overrides base fee for all user types ──
  group('1 - variable fee overrides base fee (all user types)', () => {
    for (const u of USERS) {
      const token = u.token();
      if (!token) {
        console.warn(`${u.label}: no token/secret — skipped.`);
        check(null, { [`[${u.label}] token present`]: () => false });
        continue;
      }
      invoiceCase(`[${u.label} fee=${VAR_AMOUNT}]`, token, u.account,
        { filingTypeCode: CODE, fee: VAR_AMOUNT },
        exp({ filing: VAR_AMOUNT, service: u.service }));
    }
  });

  // ── Part 2: staff waiveFees with variable amount + priority + FE ──
  group('2 - staff waiveFees with variable fee', () => {
    const token = IDIR_TOKEN || __ENV.IDIR_TOKEN;
    if (!token) { check(null, { '[staff] IDIR token present': () => false }); return; }
    const flags = { priority: true, futureEffective: true };

    // 2a. No waiver → variable + priority + FE all charged
    invoiceCase(`[staff var+pri+fe waive=false]`, token, '2198',
      { filingTypeCode: CODE, fee: VAR_AMOUNT, ...flags },
      exp({ filing: VAR_AMOUNT, priority: PRIORITY_FEE, fe: FE_FEE, service: 0 }));

    // 2b. waiveFees → priority + FE waived, variable base fee NOT waived
    invoiceCase(`[staff var+pri+fe waive=true]`, token, '2198',
      { filingTypeCode: CODE, fee: VAR_AMOUNT, ...flags, waiveFees: true },
      exp({ filing: VAR_AMOUNT, priority: 0, fe: 0, service: 0 }));   // observed waivedFees = 0 (see ticket notes)

    // 2c. Control: waiveFees with NO variable amount → total 0
    //     Observed: flag on + no amount = $0 filing fee (fixed BASE_FEE not charged), waivedFees = 0
    invoiceCase(`[staff no-amount waive=true]`, token, '2198',
      { filingTypeCode: CODE, waiveFees: true },
      exp({ filing: 0, service: 0 }));
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/variable-fees.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}