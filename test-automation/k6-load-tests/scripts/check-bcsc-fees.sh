#!/bin/bash

# ── CONFIG ─────────────────────────────────────────────────────
CLIENT_ID="name-request-service-account"
CLIENT_SECRET="txiHpvo8Z2AqRYpaawZssCif9p7Q6JeO"
TOKEN_URL="https://test.loginproxy.gov.bc.ca/auth/realms/bcregistry/protocol/openid-connect/token"
API_KEY="7idNlLcwvjFcQOaAL5y4ZOG1OJEW0M4GFA27pP3iFUlmWwW3"
BASE_URL="https://test.api.connect.gov.bc.ca/pay/api/v1"

CODES=(
  "OLAARTOQ_A"
  "OLAARTAQ_A"
  "OLAARTIQ_A"
  "OLAARTOQ_T"
  "OLAARTAQ_T"
  "OLAARTIQ_T"
  "OLAARTOQ_N"
  "OLAARTAQ_N"
  "OLAARTIQ_N"
  "OLAARTOQ_H"
  "OLAARTAQ_H"
  "OLAARTIQ_H"
)

# ── GET TOKEN ──────────────────────────────────────────────────
echo "🔑 Fetching service account token..."
TOKEN=$(curl -s -X POST "$TOKEN_URL" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo "✅ Token fetched"
echo ""

# ── RUN ────────────────────────────────────────────────────────
for CODE in "${CODES[@]}"; do
  echo "── $CODE ──────────────────────────────"
  curl -s "${BASE_URL}/fees/BCA/${CODE}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "x-apikey: ${API_KEY}" | python3 -m json.tool
  echo ""
done