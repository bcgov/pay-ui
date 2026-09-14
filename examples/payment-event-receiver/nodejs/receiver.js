'use strict';
/**
 * BC Registries – Partner payment-event webhook receiver (Node.js).
 *
 * Uses the stdlib http module — no web framework required.
 * JWT verification uses google-auth-library against Google's OIDC endpoint.
 *
 * Environment variables:
 *   AUDIENCE        Audience the JWT must carry — set to this server's public URL.
 *   PUBSUB_SA_EMAIL Service account email Pub/Sub signs tokens as.
 *
 * Run:
 *   npm install
 *   AUDIENCE=https://... node receiver.js
 */

const http = require('http');
const { OAuth2Client } = require('google-auth-library');

const AUDIENCE = process.env.AUDIENCE;
const EXPECTED_SA_EMAIL = process.env.PUBSUB_SA_EMAIL;

if (!AUDIENCE) { console.error('AUDIENCE is required'); process.exit(1); }
if (!EXPECTED_SA_EMAIL) { console.error('PUBSUB_SA_EMAIL is required'); process.exit(1); }

const _defaultClient = new OAuth2Client();

/**
 * Verify a Pub/Sub OIDC JWT and return its decoded claims.
 *
 * GCP Pub/Sub signs every push request with an OIDC token issued for the
 * configured delivery service account. This function:
 *   1. Fetches Google's public keys (cached internally by google-auth-library).
 *   2. Verifies the RS256 signature.
 *   3. Confirms the audience matches AUDIENCE (this server's URL).
 *   4. Confirms the token has not expired.
 *
 * Throws if any check fails — the caller should treat any error as an invalid token.
 * Returns the payload object, e.g. { email: '...', sub: '...', ... }.
 *
 * @param {string} token - Raw JWT string from the Authorization: Bearer header.
 * @param {OAuth2Client} [authClient] - Override for testing; defaults to a shared client.
 */
async function verifyJwt(token, authClient = _defaultClient) {
    const ticket = await authClient.verifyIdToken({ idToken: token, audience: AUDIENCE });
    return ticket.getPayload();
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        req.on('error', reject);
    });
}

function send(res, status, body) {
    if (body) {
        const payload = JSON.stringify(body);
        res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) });
        res.end(payload);
    } else {
        res.writeHead(status);
        res.end();
    }
}

const server = http.createServer(async (req, res) => {
    if (req.method !== 'POST' || req.url !== '/pay-events') {
        return send(res, 404);
    }

    const auth = req.headers['authorization'] ?? '';
    if (!auth.startsWith('Bearer ')) {
        return send(res, 401, { error: 'missing bearer token' });
    }

    let claims;
    try {
        claims = await verifyJwt(auth.slice(7));
    } catch (err) {
        console.warn('JWT verification failed:', err.message);
        return send(res, 401, { error: 'invalid token' });
    }

    if (claims.email !== EXPECTED_SA_EMAIL) {
        console.warn('unexpected caller:', claims.email);
        return send(res, 403, { error: 'unexpected service account' });
    }

    const raw = await readBody(req);
    let body;
    try { body = JSON.parse(raw); } catch { body = raw; }

    console.log(
        `event  message_id=${req.headers['x-goog-message-id'] ?? '-'}` +
        `  publish_time=${req.headers['x-goog-publish-time'] ?? '-'}`
    );
    console.log(typeof body === 'object' ? JSON.stringify(body, null, 2) : body);

    send(res, 204);
});

// Guard lets test files require this module without starting the server.
if (require.main === module) {
    server.listen(8090, () => console.log('listening on :8090'));
}

module.exports = { verifyJwt };
