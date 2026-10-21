import http from 'k6/http';
import { ENV } from '../config/env.js';

// Looks up one or more invoices using the same config/env.js values as express-checkout.js.
// Usage:
//   k6 run -e ENV=test -e INVOICE_ID=773162,773161 scripts/check-invoice.js
// (add any other -e flags you normally pass, e.g. the client secret)

export const options = { vus: 1, iterations: 1 };

export default function () {
  const ids = String(__ENV.INVOICE_ID || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (ids.length === 0) {
    console.error('Pass -e INVOICE_ID=<id>[,<id>...]');
    return;
  }

  const tokenRes = http.post(ENV.tokenUrl, {
    grant_type:    'client_credentials',
    client_id:     ENV.expClientId,
    client_secret: ENV.expClientSecret,
  });
  if (tokenRes.status !== 200) {
    console.error(`token failed: ${tokenRes.status} ${tokenRes.body}`);
    return;
  }
  const token = tokenRes.json('access_token');

  for (const id of ids) {
    const res = http.get(`${ENV.paymentRequestUrl}/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-apikey':      ENV.apiKey,
      },
    });

    if (res.status !== 200) {
      console.error(`invoice ${id}: HTTP ${res.status} ${res.body}`);
      continue;
    }

    const inv = res.json();
    console.log(`invoice ${id}: ${JSON.stringify({
      id:                      inv.id,
      invoiceNumber:           inv.references && inv.references[0] ? inv.references[0].invoiceNumber : null,
      statusCode:              inv.statusCode,
      paid:                    inv.paid,
      total:                   inv.total,
      isPaymentActionRequired: inv.isPaymentActionRequired,
      paymentMethod:           inv.paymentMethod,
      paymentDate:             inv.paymentDate || null,
    })}`);
  }
}