#!/bin/bash

# ── CONFIG ─────────────────────────────────────────────────────
TOKEN=""
API_KEY=""
ACCOUNT_ID="1999"
BASE_URL="https://test.api.connect.gov.bc.ca/pay/api/v1"

CODES=(
  "OLAARTOQ_N"
  "OLAARTAQ_N"
  "OLAARTIQ_N"
  "OLAARTOQ_H"
  "OLAARTAQ_H"
  "OLAARTIQ_H"
)

# ── RUN ────────────────────────────────────────────────────────
for CODE in "${CODES[@]}"; do
  echo "── $CODE ──────────────────────────────"
  curl -s "${BASE_URL}/fees/BCA/${CODE}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "x-apikey: ${API_KEY}" \
    -H "Account-Id: ${ACCOUNT_ID}" | python3 -m json.tool
  echo ""
done