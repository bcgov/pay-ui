import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from '../libs/k6-reporter.js';
import { textSummary } from '../libs/k6-summary.js';
export { options } from '../config/options.js';
import { ENV } from '../config/env.js';

export default function () {

// TODO: Replace USER_TOKEN with service account credentials once
// name-request-service-account secret is updated on test env.
// Run with: k6 run -e ENV=test -e USER_TOKEN="<idir-token>" tests/authorized-accounts-test.js
// Service account credentials needed: clientId + clientSecret for auth API access
  let token;

  if (__ENV.USER_TOKEN) {
    // Use provided user token (IDIR/BCSC)
    token = __ENV.USER_TOKEN;
  } else {
    // Fetch service account token
    const tokenRes = http.post(
      ENV.tokenUrl,
      `grant_type=client_credentials&client_id=${ENV.clientId}&client_secret=${ENV.clientSecret}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    check(tokenRes, {
      'token: status is 200':        (r) => r.status === 200,
      'token: access_token present': (r) => JSON.parse(r.body).access_token !== undefined,
    });
    token = JSON.parse(tokenRes.body).access_token;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'x-apikey':      ENV.authApiKey,
  };

  // ── STEP 2: GET Authorized Accounts — Business 1 ───────────────
  const res1 = http.get(
    `${ENV.authBaseUrl}/entities/${ENV.businessId1}/authorized-accounts`,
    { headers }
  );

  const body1 = JSON.parse(res1.body);

  check(res1, {
    'BC1199869 authorized-accounts: status 200':             (r) => r.status === 200,
    'BC1199869 authorized-accounts: has authorizedAccounts': (r) => body1.authorizedAccounts !== undefined,
    'BC1199869 authorized-accounts: has items':              (r) => body1.authorizedAccounts.length > 0,
    'BC1199869 authorized-accounts: name present':           (r) => body1.authorizedAccounts[0].name !== undefined,
    'BC1199869 authorized-accounts: uuid present':           (r) => body1.authorizedAccounts[0].uuid !== undefined,
    'BC1199869 authorized-accounts: dateAdded present':      (r) => body1.authorizedAccounts[0].dateAdded !== undefined,
    'BC1199869 authorized-accounts: contains Ody Test 1':   (r) => body1.authorizedAccounts.some(a => a.name === 'Ody Test 1'),
    'BC1199869 authorized-accounts: contains Test Acc 18.1':(r) => body1.authorizedAccounts.some(a => a.name === 'Test Acc 18.1'),
  });

  // ── STEP 3: GET Authorized Accounts — Business 2 ───────────────
  const res2 = http.get(
    `${ENV.authBaseUrl}/entities/${ENV.businessId2}/authorized-accounts`,
    { headers }
  );

  const body2 = JSON.parse(res2.body);

  check(res2, {
    'BC0879688 authorized-accounts: status 200':             (r) => r.status === 200,
    'BC0879688 authorized-accounts: has authorizedAccounts': (r) => body2.authorizedAccounts !== undefined,
    'BC0879688 authorized-accounts: has items':              (r) => body2.authorizedAccounts.length > 0,
    'BC0879688 authorized-accounts: name present':           (r) => body2.authorizedAccounts[0].name !== undefined,
    'BC0879688 authorized-accounts: uuid present':           (r) => body2.authorizedAccounts[0].uuid !== undefined,
    'BC0879688 authorized-accounts: dateAdded present':      (r) => body2.authorizedAccounts[0].dateAdded !== undefined,
    'BC0879688 authorized-accounts: contains Ody Test 1':   (r) => body2.authorizedAccounts.some(a => a.name === 'Ody Test 1'),
  });

  sleep(1);

}

export function handleSummary(data) {
  return {
    'reports/summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}