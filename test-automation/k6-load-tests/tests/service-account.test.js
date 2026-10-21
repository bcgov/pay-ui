import http from 'k6/http';
import { check, group, sleep } from 'k6';
import encoding from 'k6/encoding';
import { htmlReport } from '../libs/k6-reporter.js';
import { textSummary } from '../libs/k6-summary.js';
export { options } from '../config/options.js';
import { ENV } from '../config/env.js';

// PAY-API #35025 — Scenario 5: Service accounts
//   Service accounts have service fees unless the fee is configured otherwise
//   or the account has the `exclude_service_fees` role.
//   • Fee calculation returns 0 if the fee is configured with zero
//   • Fee calculation returns 0 service fee if the SA has `exclude_service_fees`
//   • Invoice creation reflects the fee calculation from the fees endpoint
//
// Run:
//   k6 run --vus 1 --iterations 1 -e ENV=test tests/service-account.test.js

// Pay admin fee schedule for BCA.
// For the "configured with zero" case: remove OLAARTIQ_A's service fee in Fee admin,
// set its serviceFee to 0 below, re-run — both SAs should return 0. Revert afterwards.
const FILING_CODES = [
  { code: 'OLAARTIQ_A', filingFee: 0,     serviceFee: 0.00 },
  { code: 'OLAARTIQ_T', filingFee: 1.00,  serviceFee: 1.50 },
  { code: 'OLAARTIQ_N', filingFee: 15.00, serviceFee: 1.00 },
  { code: 'OLAARTIQ_H', filingFee: 15.00, serviceFee: 1.00 },
  { code: 'OLAARTIQ_B', filingFee: 15.00, serviceFee: 1.50 },
];

const CORP_TYPE = 'BCA';
const GST_RATE  = 0.05;

// ── Service accounts. Do NOT commit real secrets. ──
const AUTH_ENTITY_SECRET = '';   // client secret for auth-entity-service-account (from dev)
const SA_ACCOUNT_ID      = '';   // optional Account-Id header for SA calls; leave empty to send none

const SERVICE_ACCOUNTS = [
  {
    label: 'SA-no-exclusion',
    clientId: ENV.clientId || 'name-request-service-account',
    secret:   __ENV.NR_SECRET || ENV.clientSecret,
    excludeServiceFees: false,
  },
  {
    label: 'SA-exclude-fees',
    clientId: 'auth-entity-service-account',
    secret:   AUTH_ENTITY_SECRET || __ENV.AUTH_ENTITY_SECRET,
    excludeServiceFees: true,
  },
];

const PAY_URL = __ENV.PAY_BASE_URL || ENV.payBaseUrl;
const APIKEY  = __ENV.API_KEY || ENV.apiKey;
const ACCOUNT = SA_ACCOUNT_ID || __ENV.SA_ACCOUNT_ID;

// ── Helpers ───────────────────────────────────────────────────────
const round2   = (n) => Math.round(n * 100) / 100;
const eq       = (a, e) => typeof a === 'number' && Math.abs(a - e) < 0.001;
const eqOrNull = (a, e) => a == null ? e === 0 : eq(a, e);

function headers(token) {
  const h = {
    'Authorization': `Bearer ${token}`,
    'x-apikey':      APIKEY,
    'Content-Type':  'application/json',
  };
  if (ACCOUNT) h['Account-Id'] = ACCOUNT;
  return h;
}
function safeJson(res) { try { return res.json(); } catch (e) { return {}; } }
function logIfError(label, res) {
  if (res.status < 200 || res.status >= 300) {
    console.error(`${label} → HTTP ${res.status}: ${String(res.body).slice(0, 300)}`);
  }
}
function decodeRoles(token) {
  try {
    const json = JSON.parse(encoding.b64decode(token.split('.')[1], 'rawurl', 's'));
    return (json.realm_access && json.realm_access.roles) || [];
  } catch (e) { return []; }
}
function getToken(sa) {
  const res = http.post(ENV.tokenUrl, {
    grant_type: 'client_credentials', client_id: sa.clientId, client_secret: sa.secret,
  });
  logIfError(`${sa.label} token`, res);
  return safeJson(res).access_token;
}
function expected(cfg, excludeServiceFees) {
  const service = excludeServiceFees ? 0 : cfg.serviceFee;
  const gst = round2(service * GST_RATE);
  return { filing: cfg.filingFee, service, gst, total: round2(cfg.filingFee + service + gst) };
}

export default function () {
  check(null, {
    'setup: payBaseUrl present': () => !!PAY_URL,
    'setup: tokenUrl present':   () => !!ENV.tokenUrl,
  });

  for (const sa of SERVICE_ACCOUNTS) {
    group(`${sa.label} (${sa.clientId})`, () => {
      if (!sa.secret) {
        console.warn(`${sa.label}: no client secret set — skipping.`);
        check(null, { [`[${sa.label}] client secret present`]: () => false });
        return;
      }

      // ── 0. Token + role check ────────────────────────────
      const token = getToken(sa);
      const roles = token ? decodeRoles(token) : [];
      console.log(`[${sa.label}] roles: ${roles.join(', ')}`);
      check(null, {
        [`[${sa.label}] token obtained`]: () => !!token,
        [`[${sa.label}] exclude_service_fees role = ${sa.excludeServiceFees}`]:
          () => roles.includes('exclude_service_fees') === sa.excludeServiceFees,
      });
      if (!token) return;
      if (roles.includes('staff')) {
        console.warn(`[${sa.label}] also has the "staff" role — staff exemption may also zero the service fee.`);
      }

      for (const cfg of FILING_CODES) {
        const exp = expected(cfg, sa.excludeServiceFees);
        const L = `[${sa.label} ${cfg.code}]`;

        // ── 1. Fee calculation ─────────────────────────────
        const feeRes = http.get(`${PAY_URL}/fees/${CORP_TYPE}/${cfg.code}`,
          { headers: headers(token), tags: { name: 'GET /fees' } });
        logIfError(`${L} GET /fees`, feeRes);
        const fee = safeJson(feeRes);
        const tax = fee.tax || {};
        check(feeRes, {
          [`${L} fees: HTTP 200`]:                     (r) => r.status === 200,
          [`${L} fees: filingFees = ${exp.filing}`]:   () => eq(fee.filingFees, exp.filing),
          [`${L} fees: serviceFees = ${exp.service}`]: () => eq(fee.serviceFees, exp.service),
          [`${L} fees: serviceFeeGst = ${exp.gst}`]:   () => eqOrNull(tax.serviceFeeGst, exp.gst),
          [`${L} fees: total = ${exp.total}`]:         () => eq(fee.total, exp.total),
        });

        // ── 2. Invoice creation = fee calculation ──────────
        const payload = JSON.stringify({
          businessInfo: { corpType: CORP_TYPE, businessIdentifier: 'BCA1234' },
          filingInfo:   { filingTypes: [{ filingTypeCode: cfg.code }] },
        });
        const postRes = http.post(`${PAY_URL}/payment-requests`, payload,
          { headers: headers(token), tags: { name: 'POST /payment-requests' } });
        logIfError(`${L} POST /payment-requests`, postRes);
        const inv  = safeJson(postRes);
        const item = (inv.lineItems && inv.lineItems[0]) || {};
        console.log(`${L} invoice id=${inv.id} status=${inv.statusCode} method=${inv.paymentMethod} total=${inv.total}`);
        check(postRes, {
          [`${L} invoice: HTTP 201`]:                    (r) => r.status === 201,
          [`${L} invoice: id present`]:                  () => inv.id !== undefined,
          [`${L} invoice: filingFees = fees endpoint`]:  () => eq(item.filingFees, fee.filingFees),
          [`${L} invoice: serviceFees = fees endpoint`]: () => eq(inv.serviceFees, fee.serviceFees),
          [`${L} invoice: total = fees endpoint`]:       () => eq(inv.total, fee.total),
          [`${L} invoice: total = ${exp.total}`]:        () => eq(inv.total, exp.total),
        });
        if (!inv.id) continue;

        // ── 3. Read-back ───────────────────────────────────
        const getRes = http.get(`${PAY_URL}/payment-requests/${inv.id}`,
          { headers: headers(token), tags: { name: 'GET /payment-requests/{id}' } });
        logIfError(`${L} GET /payment-requests/${inv.id}`, getRes);
        const got = safeJson(getRes);
        check(getRes, {
          [`${L} GET: HTTP 200`]:                     (r) => r.status === 200,
          [`${L} GET: total = ${exp.total}`]:         () => eq(got.total, exp.total),
          [`${L} GET: serviceFees = ${exp.service}`]: () => eq(got.serviceFees, exp.service),
        });
      }
    });
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/service-account.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}