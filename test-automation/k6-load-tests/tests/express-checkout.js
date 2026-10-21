import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from '../libs/k6-reporter.js';
import { textSummary } from '../libs/k6-summary.js';
export { options } from '../config/options.js';
import { ENV } from '../config/env.js';

// Express checkout: service account token only, NO Account-Id header.
// Add to the env block in config/env.js:
//   expClientId:     'env-service-account',
//   expClientSecret: __ENV.EXP_CLIENT_SECRET,

// Per-VU token cache, so the load lands on pay-api and not on the token endpoint.
let token = null;
let tokenExpiresAt = 0;

function getToken() {
  if (token && Date.now() < tokenExpiresAt) return token;

  const res = http.post(
    ENV.tokenUrl,
    {
      grant_type:    'client_credentials',
      client_id:     ENV.expClientId,
      client_secret: ENV.expClientSecret,
    },
    { tags: { name: 'token' } }
  );

  const ok = check(res, {
    'token: status is 200':        (r) => r.status === 200,
    'token: access_token present': (r) => !!r.json('access_token'),
  });
  if (!ok) {
    console.error(`token failed: ${res.status} ${res.body}`);
    token = null;
    return null;
  }

  token = res.json('access_token');
  // refresh 30s before expiry
  tokenExpiresAt = Date.now() + (res.json('expires_in') - 30) * 1000;
  return token;
}

// Set this to the exact response field once the dev confirms it (e.g. 'paymentUrl').
// While it is null, the first http(s) string found anywhere in the response is used.
const PAY_URL_FIELD = 'paymentUrl';

function findPayUrl(body) {
  if (PAY_URL_FIELD) return body[PAY_URL_FIELD] || null;
  if (typeof body === 'string') return /^https?:\/\//.test(body) ? body : null;
  if (body && typeof body === 'object') {
    for (const key of Object.keys(body)) {
      const found = findPayUrl(body[key]);
      if (found) return found;
    }
  }
  return null;
}

export default function () {
  const accessToken = getToken();
  if (!accessToken) {
    sleep(1);
    return;
  }

  // Optional express-only fields (pay-api payment_request schema):
  //   -e RETURN_URL=https://...   -> shows "Return to ..." button; must be on pay-api's VALID_REDIRECT_URLS allowlist, else 400 INVALID_REDIRECT_URI
  //   -e EMAIL=you@example.com    -> notified if the payment link is not redeemed
  const body = {
    businessInfo: {
      corpType:           'ENV',
      businessIdentifier: 'ENVSRCH00001',
    },
    filingInfo: {
      filingTypes: [
        { filingTypeCode: 'ENVFILE' },
      ],
    },
  };
  if (__ENV.RETURN_URL) body.returnUrl = __ENV.RETURN_URL;
  if (__ENV.EMAIL) body.email = __ENV.EMAIL;
  const payload = JSON.stringify(body);

  const paymentRes = http.post(
    ENV.paymentRequestUrl,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-apikey':      ENV.apiKey,
        'Content-Type':  'application/json',
      },
      tags: { name: 'express-payment-request' },
    }
  );

  const payUrl = paymentRes.status === 201 ? findPayUrl(paymentRes.json()) : null;

  const passed = check(paymentRes, {
    'express: status is 201':      (r) => r.status === 201,
    'express: invoiceId present':  (r) => r.status === 201 && r.json('id') !== undefined,
    'express: payment URL present': () => !!payUrl && payUrl.includes('express.pay'),
    'express: status CREATED':      (r) => r.status === 201 && r.json('statusCode') === 'CREATED',
    'express: method DIRECT_PAY':   (r) => r.status === 201 && r.json('paymentMethod') === 'DIRECT_PAY',
    'express: total is 264.08':     (r) => r.status === 201 && r.json('total') === 264.08,
  });

  if (!passed) {
    console.error(`express payment failed: ${paymentRes.status} ${paymentRes.body}`);
  }

  // print one full response so the URL field can be confirmed
  if (__VU === 1 && __ITER === 0) {
    console.log(`sample response: ${paymentRes.body}`);
    console.log(`payment URL found: ${payUrl}`);
  }

  // token expired mid-run: drop it so the next iteration fetches a new one
  if (paymentRes.status === 401) token = null;

  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/express-checkout-summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}