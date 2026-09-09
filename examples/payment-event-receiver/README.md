# Payment Event Receiver

Example webhook receivers for BC Registries payment events delivered via GCP Pub/Sub push.

GCP Pub/Sub signs every push request with an OIDC JWT. Each example verifies the JWT (signature, audience, expiry) before processing the payload. Pick whichever language fits your stack — the logic is identical across all three.

## Languages

| | Directory | Docs |
|---|---|---|
| Python | [`python/`](./python/) | [README](./python/README.md) |
| Node.js | [`nodejs/`](./nodejs/) | [README](./nodejs/README.md) |
| Java | [`java/`](./java/) | [README](./java/README.md) |

## Quick start with Docker Compose

Runs all three receivers simultaneously on different ports:

```bash
AUDIENCE=https://<your-public-url>/pay-events \
PUBSUB_SA_EMAIL=pay-events-webhook-delivery@<project>.iam.gserviceaccount.com \
docker compose up --build
```

| Port | Language |
|---|---|
| 8091 | Python |
| 8092 | Node.js |
| 8093 | Java |

## How it works

1. Pub/Sub pushes a signed request to `POST /pay-events`
2. The receiver extracts the `Authorization: Bearer <token>` header
3. `verify_jwt` / `verifyJwt` / `verifyToken` validates the JWT against Google's public keys
4. On success, the payload is logged and a `204` is returned — telling Pub/Sub the message was delivered
5. Any non-`2xx` response triggers a retry with exponential backoff (up to 10 attempts)

## Deploying in production

Set `AUDIENCE` to your service's public HTTPS URL. No tunnel or proxy is needed — Pub/Sub will push directly to your endpoint.

```bash
AUDIENCE=https://your-service.example.com/pay-events \
PUBSUB_SA_EMAIL=pay-events-webhook-delivery@<project>.iam.gserviceaccount.com \
python python/receiver.py
```

## Testing locally with ngrok

> **ngrok is only needed for local development.** In production, Pub/Sub pushes directly to your deployed service URL.

Pub/Sub requires a public HTTPS endpoint, so a tunnel like ngrok is the easiest way to expose a locally-running server during development.

ngrok does not need the server to be running before you start it — start ngrok first to get a stable URL, then start the receiver with that URL.

```bash
# 1. Start ngrok — the server does not need to be up yet.
ngrok http 8090
# → Forwarding  https://<ngrok-id>.ngrok.io -> localhost:8090

# 2. Start the receiver with the ngrok URL as the audience.
AUDIENCE=https://<ngrok-id>.ngrok.io/pay-events \
PUBSUB_SA_EMAIL=pay-events-webhook-delivery@<project>.iam.gserviceaccount.com \
python python/receiver.py

# 3. Update partners.sh with the same URL and re-provision the push subscription.
#    sites_dev) echo "https://<ngrok-id>.ngrok.io/pay-events" ;;
./scripts/partner_pubsub/provision-webhooks.sh apply dev sites

# 4. Publish a test message.
gcloud pubsub topics publish pay-events-sites-dev \
  --project=<project> \
  --message='{"type":"payment.completed","invoice_id":12345}'
```
