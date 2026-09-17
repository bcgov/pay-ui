import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from '../libs/k6-reporter.js';
import { textSummary } from '../libs/k6-summary.js';
export { options } from '../config/options.js';
import { ENV } from '../config/env.js';

// NOTE: Requires a staff/user token — service account does not have permission
// Run with: k6 run -e ENV=test -e USER_TOKEN="<idir-token>" tests/users-terms-test.js

export default function () {

  const token = __ENV.USER_TOKEN;

  if (!token) {
    console.error('USER_TOKEN env var is required. Run with: -e USER_TOKEN="<token>"');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'x-apikey':      ENV.authApiKey,
    'Content-Type':  'application/json',
  };

  // ── STEP 1: POST /users with isLogin:true ──────────────────────
  const postRes = http.post(
    `${ENV.authBaseUrl}/users`,
    JSON.stringify({ isLogin: true }),
    { headers }
  );

  const postBody = JSON.parse(postRes.body);

  check(postRes, {
    'POST /users: status is 200 or 201':         (r) => r.status === 200 || r.status === 201,
    'POST /users: userTerms present':            (r) => postBody.userTerms !== undefined,
    'POST /users: isTermsOfUseAccepted present': (r) => postBody.userTerms.isTermsOfUseAccepted !== undefined,
    'POST /users: username present':             (r) => postBody.username !== undefined,
    'POST /users: loginSource present':          (r) => postBody.loginSource !== undefined,
  });

  const postTermsAccepted = postBody.userTerms?.isTermsOfUseAccepted;
  const postTermsVersion  = postBody.userTerms?.termsOfUseAcceptedVersion;

  sleep(0.5);

  // ── STEP 2: GET /users/@me ─────────────────────────────────────
  const getRes = http.get(
    `${ENV.authBaseUrl}/users/@me`,
    { headers }
  );

  const getBody = JSON.parse(getRes.body);

  check(getRes, {
    'GET /users/@me: status is 200':                (r) => r.status === 200,
    'GET /users/@me: userTerms present':            (r) => getBody.userTerms !== undefined,
    'GET /users/@me: isTermsOfUseAccepted present': (r) => getBody.userTerms.isTermsOfUseAccepted !== undefined,
  });

  const getTermsAccepted = getBody.userTerms?.isTermsOfUseAccepted;
  const getTermsVersion  = getBody.userTerms?.termsOfUseAcceptedVersion;

  // ── STEP 3: Cross-verify — this is the regression check ───────
  check({}, {
    'userTerms: isTermsOfUseAccepted matches between POST and GET': () =>
      postTermsAccepted === getTermsAccepted,
    'userTerms: termsOfUseAcceptedVersion matches between POST and GET': () =>
      postTermsVersion === getTermsVersion,
  });

  sleep(1);

}

export function handleSummary(data) {
  return {
    'test-automation/k6-load-tests/reports/summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}