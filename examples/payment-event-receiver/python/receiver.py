#!/usr/bin/env python3
"""
BC Registries – Partner payment-event webhook receiver (Python).

Uses the stdlib http.server — no web framework required.
JWT verification uses google-auth against Google's OIDC endpoint.

Environment variables:
    AUDIENCE        Audience the JWT must carry — set to this server's public URL.
    PUBSUB_SA_EMAIL Service account email Pub/Sub signs tokens as.

Run:
    pip install -r requirements.txt
    AUDIENCE=https://... python receiver.py
"""

import json
import logging
import os
from http.server import BaseHTTPRequestHandler, HTTPServer

import google.auth.transport.requests
import google.oauth2.id_token

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

AUDIENCE = os.environ["AUDIENCE"]
EXPECTED_SA_EMAIL = os.environ["PUBSUB_SA_EMAIL"]

_http_request = google.auth.transport.requests.Request()


def verify_jwt(token: str) -> dict:
    """Verify a Pub/Sub OIDC JWT and return its decoded claims.

    GCP Pub/Sub signs every push request with an OIDC token issued for the
    configured delivery service account. This function:
      1. Fetches Google's public keys (cached internally by google-auth).
      2. Verifies the RS256 signature.
      3. Confirms the audience matches AUDIENCE (this server's URL).
      4. Confirms the token has not expired.

    Raises ValueError (or google.auth.exceptions.TransportError) if any
    check fails. The caller should treat any exception as an invalid token.

    Returns a dict of JWT claims, e.g. {"email": "...", "sub": "...", ...}.
    """
    return google.oauth2.id_token.verify_oauth2_token(token, _http_request, audience=AUDIENCE)


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/pay-events":
            self._send(404)
            return

        auth = self.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            self._send(401, {"error": "missing bearer token"})
            return

        try:
            claims = verify_jwt(auth.removeprefix("Bearer "))
        except Exception as exc:
            log.warning("JWT verification failed: %s", exc)
            self._send(401, {"error": "invalid token"})
            return

        if claims.get("email") != EXPECTED_SA_EMAIL:
            log.warning("unexpected caller: %s", claims.get("email"))
            self._send(403, {"error": "unexpected service account"})
            return

        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length).decode()
        try:
            body = json.loads(raw)
        except json.JSONDecodeError:
            body = raw

        log.info(
            "event  message_id=%s  publish_time=%s\n%s",
            self.headers.get("X-Goog-Message-Id", "-"),
            self.headers.get("X-Goog-Publish-Time", "-"),
            json.dumps(body, indent=2) if isinstance(body, dict) else body,
        )
        self._send(204)

    def _send(self, status: int, body: dict | None = None):
        self.send_response(status)
        if body:
            payload = json.dumps(body).encode()
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", len(payload))
            self.end_headers()
            self.wfile.write(payload)
        else:
            self.end_headers()

    def log_message(self, *_):
        pass  # silence default access log; we handle logging ourselves


if __name__ == "__main__":
    server = HTTPServer(("", 8090), Handler)
    log.info("listening on :8090")
    server.serve_forever()
