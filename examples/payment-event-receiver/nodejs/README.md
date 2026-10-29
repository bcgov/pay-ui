# Payment Event Receiver – Node.js

A minimal webhook receiver for BC Registries payment events delivered via GCP Pub/Sub push. Verifies the OIDC JWT on every request before printing the payload.

## Prerequisites

- Node.js 18+

## Setup

```bash
npm install
```

## Run

Set `AUDIENCE` to the public HTTPS URL where Pub/Sub will deliver events (your deployed service URL in production, or a tunnel URL when testing locally):

```bash
AUDIENCE=https://your-service.example.com/pay-events \
PUBSUB_SA_EMAIL=pay-events-webhook-delivery@<project>.iam.gserviceaccount.com \
node receiver.js
```

### Local testing with ngrok

> **ngrok is only needed for local development.** Pub/Sub requires a public HTTPS endpoint and cannot reach `localhost` directly. In production your deployed URL is used instead.

Start ngrok first — it does not need the server to be up yet:

```bash
ngrok http 8090
# → Forwarding  https://<ngrok-id>.ngrok.io -> localhost:8090

AUDIENCE=https://<ngrok-id>.ngrok.io/pay-events \
PUBSUB_SA_EMAIL=pay-events-webhook-delivery@<project>.iam.gserviceaccount.com \
node receiver.js
```

## Test

```bash
node --test receiver.test.js
```

## Docker

```bash
docker build -t pay-event-receiver-nodejs .
docker run -p 8090:8090 \
  -e AUDIENCE=https://your-service.example.com/pay-events \
  -e PUBSUB_SA_EMAIL=pay-events-webhook-delivery@<project>.iam.gserviceaccount.com \
  pay-event-receiver-nodejs
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `AUDIENCE` | Yes | JWT audience — set to this server's public URL |
| `PUBSUB_SA_EMAIL` | Yes | Service account email Pub/Sub signs tokens as |
