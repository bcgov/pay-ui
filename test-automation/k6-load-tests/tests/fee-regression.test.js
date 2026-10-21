import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { htmlReport } from '../libs/k6-reporter.js';
import { textSummary } from '../libs/k6-summary.js';
export { options } from '../config/options.js';
import { ENV } from '../config/env.js';

// PAY-API #35025 — Scenario 6: General fee regression
//   Priority / future effective / variable fees, on a public account (no override)
//   and a GovN account (BCA service fee override), fee calculation + invoice creation.
//
// Fee admin setup BEFORE running (revert afterwards):
//   OLAARTIQ_N  priority = 20.00, future effective = 20.00
//   OLAARTIQ_A  priority = 20.00, future effective = 20.00
//   OLAARTIQ_T  leave priority / FE NOT configured (control: flags sent, no fee)
//   Variable fee (optional): turn on Variable Fee Flag for VARIABLE.code, then set VARIABLE.enabled = true
//
// Run:
//   k6 run --vus 1 --iterations 1 -e ENV=test tests/fee-regression.test.js

// ── Fee schedule (must match Fee admin) ──────────────────────────────
const CODES = [
  { code: 'OLAARTIQ_N', filingFee: 15.00, serviceFee: 1.00, priorityFee: 20.00, feFee: 20.00 },
  { code: 'OLAARTIQ_A', filingFee: 0,     serviceFee: 1.50, priorityFee: 20.00, feFee: 20.00 }, // new logic + extras
  { code: 'OLAARTIQ_T', filingFee: 1.00,  serviceFee: 1.50, priorityFee: 0,     feFee: 0     }, // control
];

const VARIANTS = [
  { name: 'none' },
  { name: 'priority',        priority: true },
  { name: 'futureEffective', futureEffective: true },
  { name: 'both',            priority: true, futureEffective: true },
];

// Variable fee — field names are an ASSUMPTION; confirm with dev and adjust.
const VARIABLE = {
  enabled:    false,              // set true after turning on Variable Fee Flag in Fee admin
  code:       'OLAARTIQ_B',
  amount:     25.00,
  serviceFee: 1.50,               // schedule service fee for this code
  bodyField:  'fee',              // field on filingTypes[] in POST /payment-requests
  queryParam: 'variableFeeAmount' // query param on GET /fees
};

// ── Accounts ───────────────────────────────────────────────────────
// serviceOverride: BCA account service fee override (null = use fee schedule)
const PUBLIC_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI1MFhzaDlCbVJ6VWJ3Q2lDdnJ3a3hITGI4dEpYNkFFdWRmR3Y0c1NVNURNIn0.eyJleHAiOjE3OTA3OTI2MDUsImlhdCI6MTc5MDc5MDgwNSwiYXV0aF90aW1lIjoxNzkwNzkwNzg4LCJqdGkiOiJvbnJ0cnQ6MjI3MzcyYTktMDk1Yy0zOTBkLTA5Y2QtMDdiY2JhNzJhNTgwIiwiaXNzIjoiaHR0cHM6Ly90ZXN0LmxvZ2lucHJveHkuZ292LmJjLmNhL2F1dGgvcmVhbG1zL2JjcmVnaXN0cnkiLCJhdWQiOlsiZW50aXR5LXNlcnZpY2VzIiwiTmFtZVgtVGVzdCIsInBwci1zZXJ2aWNlcyIsImFjY291bnQtc2VydmljZXMiLCJuYW1lLXJlcXVlc3RzLXdlYiIsImFjY291bnQiXSwic3ViIjoiOGFkYTk1OTUtMzU0ZS00ZGY1LWI0NTMtZDE3MTgzOTllOTM5IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiY29ubmVjdC13ZWIiLCJzaWQiOiJzc2djOU1vSXZBTEVEOW1jY3BEZkNRNVgiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cHM6Ly90ZXN0LmNyZWF0ZS5idXNpbmVzcy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5hY2NvdW50LmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0YXBwcy5ucnMuZ292LmJjLmNhL2JjLWZvc3NpbC1tYW5hZ2VtZW50IiwiaHR0cHM6Ly90ZXN0LmV4YW1pbmVyLWRhc2hib2FyZC5zaG9ydHRlcm1yZW50YWwucmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0Lmp1c3RpY2UuZ292LmJjLmNhL2NzbyIsImh0dHBzOi8vZXdpbGxzLWRldi52cy5nb3YuYmMuY2E6NDQzIiwiaHR0cHM6Ly90ZXN0LmRpcmVjdG9yc2VhcmNoLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly9kZXYuaHViLmNvbm5lY3QuZ292LmJjLmNhIiwiaHR0cHM6Ly9kZXYuanVzdGljZS5nb3YuYmMuY2EvY3NvIiwiaHR0cHM6Ly90ZXN0LmJ1c2luZXNzLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5lZGl0LmJ1c2luZXNzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0LnBsYXRmb3JtLnNob3J0dGVybXJlbnRhbC5yZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwOi8vMTI3LjAuMC4xOjcxMDEiLCJodHRwczovL3Rlc3QuZXhhbWluZXIuc2hvcnR0ZXJtcmVudGFsLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5iY3JlZ2lzdHJ5LmNhIiwiaHR0cHM6Ly9ld2lsbHMtdWF0LnZzLmdvdi5iYy5jYTo0NDMiLCJodHRwczovL3Rlc3RhcHBzLm5ycy5nb3YuYmMuY2EvYmNhcCIsImh0dHBzOi8vZXdpbGxzLWRldi52cy5nb3YuYmMuY2EiLCJodHRwczovL2RvY3VtZW50cy11aS10ZXN0LndlYmFwcCIsImh0dHBzOi8vYmNyZWdpc3RyeS1hY2NvdW50LWRldi0tcHItdGVzdC0zMzc2LTNqM3lsYWRwLndlYi5hcHAiLCJodHRwczovL2V3aWxscy11YXQudnMuZ292LmJjLmNhL2UvZXdpbGxzL3BheW1lbnQtcHJvY2VzcyIsImh0dHBzOi8vdGVzdC5hc3NldHMuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwOi8vZXdpbGxzLXVhdC52cy5nb3YuYmMuY2EvZS9ld2lsbHMvcGF5bWVudC1wcm9jZXNzIiwiaHR0cHM6Ly9iY2FyZXBvcnRzZGV2LmJjYXNzZXNzbWVudC5jYSIsImh0dHBzOi8vc3RhZ2luZy53d3cuZXRheC5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QucGVvcGxlLmJ1c2luZXNzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cDovL2xvY2FsaG9zdDo4MDg4IiwiaHR0cHM6Ly9ld2lsbHMtdWF0LnZzLmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdGFwcHMubnJzLmdvdi5iYy5jYS9pbnQvYmMtZm9zc2lsLW1hbmFnZW1lbnQiLCJodHRwczovL3Rlc3Quc3RyYXRhaG90ZWwuc2hvcnR0ZXJtcmVudGFsLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vYmNyb3N3ZWItdGVzdC5iY2Fzc2Vzc21lbnQuY2E6NTQ1NzkiLCJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJodHRwOi8vbG9jYWxob3N0OjgwODEiLCJodHRwczovL3NlYXJjaC13ZWItdGVzdC5hcHBzLnNpbHZlci5kZXZvcHMuZ292LmJjLmNhIiwiaHR0cHM6Ly9zaG93Y2FzZS1jb25uZWN0LWRldi53ZWIuYXBwIiwiaHR0cHM6Ly90ZXN0Lmhvc3Quc2hvcnR0ZXJtcmVudGFsLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHA6Ly9ld2lsbHMtZGV2LnZzLmdvdi5iYy5jYS9lL2V3aWxscy9wYXltZW50LXByb2Nlc3MiLCJodHRwczovL3Rlc3QuYmNyZWdpc3RyeS5jYS9kaXJlY3RvcnNlYXJjaCIsImh0dHBzOi8vdGVzdC5zZWFyY2guYnVzaW5lc3MuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuaHViLmNvbm5lY3QuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0LmRvY3VtZW50cy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMCIsImh0dHBzOi8vdGVzdC5iY3JlZ2lzdHJ5LmNhL2J1c2luZXNzIiwiaHR0cHM6Ly9ld2lsbHMtZGV2LnZzLmdvdi5iYy5jYS9lL2V3aWxscy9wYXltZW50LXByb2Nlc3MiLCJodHRwczovL3Rlc3QuYnVzaW5lc3MuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuYW5udWFscmVwb3J0LmJ1c2luZXNzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly9lc3JhLWIxODNhNS1kZXYtZnJvbnRlbmQuYXBwcy5zaWx2ZXIuZGV2b3BzLmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdGFwcHMubnJzLmdvdi5iYy5jYS9iY3JocCIsImh0dHBzOi8vbG9jYWhvc3Q6NTAwMSIsImh0dHBzOi8vdGVzdC5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5uYW1lcy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5idXNpbmVzcy1yZWdpc3RyeS1kYXNoYm9hcmQuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3N0YWdpbmcud3d3LmV0YXguZ292LmJjLmNhL2J0cyIsImh0dHBzOi8vdGVzdGFwcHMubnJzLmdvdi5iYy5jYS9pbnQvYmNyaHAiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbInB1YmxpY191c2VyIiwibWhyX3BheW1lbnQiLCJlZGl0IiwibWhyX3RyYW5zcG9ydCIsIm1ocl90cmFuc2Zlcl9kZWF0aCIsInBwciIsImFjY291bnRfaG9sZGVyIiwibWhyIiwib2ZmbGluZV9hY2Nlc3MiLCJtaHJfZXhlbXB0aW9uX3JlcyIsInVtYV9hdXRob3JpemF0aW9uIiwiZGVmYXVsdC1yb2xlcy1iY3JlZ2lzdHJ5IiwibWhyX3RyYW5zZmVyX3NhbGUiXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgZW1haWwgcHJvZmlsZSIsImZpcnN0bmFtZSI6IkJDUkVHVEVTVCBEZWxwaGlhIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJyb2xlcyI6WyJwdWJsaWNfdXNlciIsIm1ocl9wYXltZW50IiwiZWRpdCIsIm1ocl90cmFuc3BvcnQiLCJtaHJfdHJhbnNmZXJfZGVhdGgiLCJwcHIiLCJhY2NvdW50X2hvbGRlciIsIm1ociIsIm9mZmxpbmVfYWNjZXNzIiwibWhyX2V4ZW1wdGlvbl9yZXMiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtYmNyZWdpc3RyeSIsIm1ocl90cmFuc2Zlcl9zYWxlIl0sIm5hbWUiOiJCQ1JFR1RFU1QgRGVscGhpYSBFSUdIVEVFTiIsImlkcF91c2VyaWQiOiJYNUxFVlZPVUdFTjU0R05WVFZDWUg3TlJFTFFDWVQ0VCIsInByZWZlcnJlZF91c2VybmFtZSI6ImJjc2MveDVsZXZ2b3VnZW41NGdudnR2Y3loN25yZWxxY3l0NHQiLCJnaXZlbl9uYW1lIjoiQkNSRUdURVNUIERlbHBoaWEiLCJmYW1pbHlfbmFtZSI6IkVJR0hURUVOIiwibG9naW5Tb3VyY2UiOiJCQ1NDIiwibGFzdG5hbWUiOiJFSUdIVEVFTiIsInVzZXJuYW1lIjoiYmNzYy94NWxldnZvdWdlbjU0Z252dHZjeWg3bnJlbHFjeXQ0dCJ9.GxrYwHA3la36sbqyO9UfdWvR4mRGgHQaK_2YTcaztUY8jnPj_DiaDC-TNBejlbEIMXzSxtHj9mXTZ1WwmS7owVgo_vlYlQgqx0IkPBgHGLsfQfsd7nPXt2T6mGSph7cKgCcHLqhdZmiRfamAOee8utw-LH9y9tNXbrVHDlFK9Dj4BeAVkVzadNKFxmBs022y25WbMUFCkIhbeydpaEGhQMBAKxaCMT-WK5BJ16kX_vjjVvQNAUZcUjlaiDeZSdSpfMMm8ML-IDBkXamDWVkKseoBmTP_t1Mn-E2xEnxPqkYSd7LqyclO2ZIPHqhTRbG5GOKvxIztV9nv3xk7NcGkwQ';   // BCSC user token for 3141
const GOVN_TOKEN   = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI1MFhzaDlCbVJ6VWJ3Q2lDdnJ3a3hITGI4dEpYNkFFdWRmR3Y0c1NVNURNIn0.eyJleHAiOjE3OTA3OTI1NDQsImlhdCI6MTc5MDc5MDc0NCwiYXV0aF90aW1lIjoxNzkwNzkwNzI4LCJqdGkiOiJvbnJ0cnQ6ZDZhNDY3NTAtNmVlZC1hYTIzLWE2OWQtODY3NzVlZTIxOTcxIiwiaXNzIjoiaHR0cHM6Ly90ZXN0LmxvZ2lucHJveHkuZ292LmJjLmNhL2F1dGgvcmVhbG1zL2JjcmVnaXN0cnkiLCJhdWQiOlsiZW50aXR5LXNlcnZpY2VzIiwiTmFtZVgtVGVzdCIsInBwci1zZXJ2aWNlcyIsImFjY291bnQtc2VydmljZXMiLCJuYW1lLXJlcXVlc3RzLXdlYiIsImFjY291bnQiXSwic3ViIjoiZjQxOWY4YTUtOTU0OS00NDNiLTkxODItNjM1YzU3OWQ1ODk3IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiY29ubmVjdC13ZWIiLCJzaWQiOiJkd0MyTUMtNVoxVnJ6b1dFUzhyNzZwZEIiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cHM6Ly90ZXN0LmNyZWF0ZS5idXNpbmVzcy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5hY2NvdW50LmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0YXBwcy5ucnMuZ292LmJjLmNhL2JjLWZvc3NpbC1tYW5hZ2VtZW50IiwiaHR0cHM6Ly90ZXN0LmV4YW1pbmVyLWRhc2hib2FyZC5zaG9ydHRlcm1yZW50YWwucmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0Lmp1c3RpY2UuZ292LmJjLmNhL2NzbyIsImh0dHBzOi8vZXdpbGxzLWRldi52cy5nb3YuYmMuY2E6NDQzIiwiaHR0cHM6Ly90ZXN0LmRpcmVjdG9yc2VhcmNoLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly9kZXYuaHViLmNvbm5lY3QuZ292LmJjLmNhIiwiaHR0cHM6Ly9kZXYuanVzdGljZS5nb3YuYmMuY2EvY3NvIiwiaHR0cHM6Ly90ZXN0LmJ1c2luZXNzLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5lZGl0LmJ1c2luZXNzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0LnBsYXRmb3JtLnNob3J0dGVybXJlbnRhbC5yZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwOi8vMTI3LjAuMC4xOjcxMDEiLCJodHRwczovL3Rlc3QuZXhhbWluZXIuc2hvcnR0ZXJtcmVudGFsLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5iY3JlZ2lzdHJ5LmNhIiwiaHR0cHM6Ly9ld2lsbHMtdWF0LnZzLmdvdi5iYy5jYTo0NDMiLCJodHRwczovL3Rlc3RhcHBzLm5ycy5nb3YuYmMuY2EvYmNhcCIsImh0dHBzOi8vZXdpbGxzLWRldi52cy5nb3YuYmMuY2EiLCJodHRwczovL2RvY3VtZW50cy11aS10ZXN0LndlYmFwcCIsImh0dHBzOi8vYmNyZWdpc3RyeS1hY2NvdW50LWRldi0tcHItdGVzdC0zMzc2LTNqM3lsYWRwLndlYi5hcHAiLCJodHRwczovL2V3aWxscy11YXQudnMuZ292LmJjLmNhL2UvZXdpbGxzL3BheW1lbnQtcHJvY2VzcyIsImh0dHBzOi8vdGVzdC5hc3NldHMuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwOi8vZXdpbGxzLXVhdC52cy5nb3YuYmMuY2EvZS9ld2lsbHMvcGF5bWVudC1wcm9jZXNzIiwiaHR0cHM6Ly9iY2FyZXBvcnRzZGV2LmJjYXNzZXNzbWVudC5jYSIsImh0dHBzOi8vc3RhZ2luZy53d3cuZXRheC5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QucGVvcGxlLmJ1c2luZXNzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cDovL2xvY2FsaG9zdDo4MDg4IiwiaHR0cHM6Ly9ld2lsbHMtdWF0LnZzLmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdGFwcHMubnJzLmdvdi5iYy5jYS9pbnQvYmMtZm9zc2lsLW1hbmFnZW1lbnQiLCJodHRwczovL3Rlc3Quc3RyYXRhaG90ZWwuc2hvcnR0ZXJtcmVudGFsLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vYmNyb3N3ZWItdGVzdC5iY2Fzc2Vzc21lbnQuY2E6NTQ1NzkiLCJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJodHRwOi8vbG9jYWxob3N0OjgwODEiLCJodHRwczovL3NlYXJjaC13ZWItdGVzdC5hcHBzLnNpbHZlci5kZXZvcHMuZ292LmJjLmNhIiwiaHR0cHM6Ly9zaG93Y2FzZS1jb25uZWN0LWRldi53ZWIuYXBwIiwiaHR0cHM6Ly90ZXN0Lmhvc3Quc2hvcnR0ZXJtcmVudGFsLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHA6Ly9ld2lsbHMtZGV2LnZzLmdvdi5iYy5jYS9lL2V3aWxscy9wYXltZW50LXByb2Nlc3MiLCJodHRwczovL3Rlc3QuYmNyZWdpc3RyeS5jYS9kaXJlY3RvcnNlYXJjaCIsImh0dHBzOi8vdGVzdC5zZWFyY2guYnVzaW5lc3MuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuaHViLmNvbm5lY3QuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0LmRvY3VtZW50cy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMCIsImh0dHBzOi8vdGVzdC5iY3JlZ2lzdHJ5LmNhL2J1c2luZXNzIiwiaHR0cHM6Ly9ld2lsbHMtZGV2LnZzLmdvdi5iYy5jYS9lL2V3aWxscy9wYXltZW50LXByb2Nlc3MiLCJodHRwczovL3Rlc3QuYnVzaW5lc3MuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuYW5udWFscmVwb3J0LmJ1c2luZXNzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly9lc3JhLWIxODNhNS1kZXYtZnJvbnRlbmQuYXBwcy5zaWx2ZXIuZGV2b3BzLmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdGFwcHMubnJzLmdvdi5iYy5jYS9iY3JocCIsImh0dHBzOi8vbG9jYWhvc3Q6NTAwMSIsImh0dHBzOi8vdGVzdC5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5uYW1lcy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5idXNpbmVzcy1yZWdpc3RyeS1kYXNoYm9hcmQuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3N0YWdpbmcud3d3LmV0YXguZ292LmJjLmNhL2J0cyIsImh0dHBzOi8vdGVzdGFwcHMubnJzLmdvdi5iYy5jYS9pbnQvYmNyaHAiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbInB1YmxpY191c2VyIiwicHByIiwiZWRpdCIsImFjY291bnRfaG9sZGVyIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtYmNyZWdpc3RyeSJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwcm9maWxlIiwiZmlyc3RuYW1lIjoiYW5pc2ggYmF0cmEiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsInJvbGVzIjpbInB1YmxpY191c2VyIiwicHByIiwiZWRpdCIsImFjY291bnRfaG9sZGVyIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtYmNyZWdpc3RyeSJdLCJuYW1lIjoiYW5pc2ggYmF0cmEiLCJpZHBfdXNlcmlkIjoiOTkwQUEzQ0Y2MkMyNEJDNzgxNTJCMjg5OERCMjk0OUQiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJhbmlzaHNlcDMwQGJjZWlkIiwiZ2l2ZW5fbmFtZSI6ImFuaXNoIGJhdHJhIiwiZW1haWwiOiJhbmlzaHJiYzE5MkBnbWFpbC5jb20iLCJsb2dpblNvdXJjZSI6IkJDRUlEIiwidXNlcm5hbWUiOiJhbmlzaHNlcDMwQGJjZWlkIn0.Org_ojPA8RTN9fFu2ecsA0s417FhMiJMyrzJCG78HO5wI27DqfVOz6W8y8MFTK8KJF2mAh6LFUz-EUU1P-EXnUG92MR1y4YlJ_OmUvTuhsBfLbYmNJoTjpvvu2OI2jWAE_koLJcYkGXY7BULIZ58TC8i3zUAzZGf_vpVhVaqv2E2rIwRrsUnAZAVpIUZUkXHRJ3e8HeVUeWe-XoNWzQqP0LZugLL0oPk7ug2mCL7J8AGZrrzu7QtxpTkm8EDF2Ztok-LntVaEgH_tlk-GkE0mGISCwvqymwmfKD3wABNcjyBrf-CQTGBtR1htqouULWdd4HmqdzwlydmL66UGksvaQ';   // BCeID user token for 3179
const IDIR_TOKEN   = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI1MFhzaDlCbVJ6VWJ3Q2lDdnJ3a3hITGI4dEpYNkFFdWRmR3Y0c1NVNURNIn0.eyJleHAiOjE3OTA3OTI0MjgsImlhdCI6MTc5MDc5MDYyOCwiYXV0aF90aW1lIjoxNzkwNzgwMjMzLCJqdGkiOiJvbnJ0cnQ6YjNhMWI2YzMtMWE4MC03ZDI3LWMyOGItYjY4ZDc3MTQzOThlIiwiaXNzIjoiaHR0cHM6Ly90ZXN0LmxvZ2lucHJveHkuZ292LmJjLmNhL2F1dGgvcmVhbG1zL2JjcmVnaXN0cnkiLCJhdWQiOlsiZW50aXR5LXNlcnZpY2VzIiwiTmFtZVgtVGVzdCIsInBwci1zZXJ2aWNlcyIsImFjY291bnQtc2VydmljZXMiLCJuYW1lLXJlcXVlc3RzLXdlYiIsInJlYWxtLW1hbmFnZW1lbnQiLCJhY2NvdW50Il0sInN1YiI6IjdiNjUxZjg2LWExZjctNDE2Yi04NGExLTg2YjQ5ZjM1MjQwZSIsInR5cCI6IkJlYXJlciIsImF6cCI6ImNvbm5lY3Qtd2ViIiwic2lkIjoiMlhBQ1Y4YXhGeWZaX3gxd09nc2NKZGZ5IiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHBzOi8vdGVzdC5jcmVhdGUuYnVzaW5lc3MuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuYWNjb3VudC5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdGFwcHMubnJzLmdvdi5iYy5jYS9iYy1mb3NzaWwtbWFuYWdlbWVudCIsImh0dHBzOi8vdGVzdC5leGFtaW5lci1kYXNoYm9hcmQuc2hvcnR0ZXJtcmVudGFsLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5qdXN0aWNlLmdvdi5iYy5jYS9jc28iLCJodHRwczovL2V3aWxscy1kZXYudnMuZ292LmJjLmNhOjQ0MyIsImh0dHBzOi8vdGVzdC5kaXJlY3RvcnNlYXJjaC5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vZGV2Lmh1Yi5jb25uZWN0Lmdvdi5iYy5jYSIsImh0dHBzOi8vZGV2Lmp1c3RpY2UuZ292LmJjLmNhL2NzbyIsImh0dHBzOi8vdGVzdC5idXNpbmVzcy5yZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuZWRpdC5idXNpbmVzcy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5wbGF0Zm9ybS5zaG9ydHRlcm1yZW50YWwucmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cDovLzEyNy4wLjAuMTo3MTAxIiwiaHR0cHM6Ly90ZXN0LmV4YW1pbmVyLnNob3J0dGVybXJlbnRhbC5yZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuYmNyZWdpc3RyeS5jYSIsImh0dHBzOi8vZXdpbGxzLXVhdC52cy5nb3YuYmMuY2E6NDQzIiwiaHR0cHM6Ly90ZXN0YXBwcy5ucnMuZ292LmJjLmNhL2JjYXAiLCJodHRwczovL2V3aWxscy1kZXYudnMuZ292LmJjLmNhIiwiaHR0cHM6Ly9kb2N1bWVudHMtdWktdGVzdC53ZWJhcHAiLCJodHRwczovL2JjcmVnaXN0cnktYWNjb3VudC1kZXYtLXByLXRlc3QtMzM3Ni0zajN5bGFkcC53ZWIuYXBwIiwiaHR0cHM6Ly9ld2lsbHMtdWF0LnZzLmdvdi5iYy5jYS9lL2V3aWxscy9wYXltZW50LXByb2Nlc3MiLCJodHRwczovL3Rlc3QuYXNzZXRzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cDovL2V3aWxscy11YXQudnMuZ292LmJjLmNhL2UvZXdpbGxzL3BheW1lbnQtcHJvY2VzcyIsImh0dHBzOi8vYmNhcmVwb3J0c2Rldi5iY2Fzc2Vzc21lbnQuY2EiLCJodHRwczovL3N0YWdpbmcud3d3LmV0YXguZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0LnBlb3BsZS5idXNpbmVzcy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHA6Ly9sb2NhbGhvc3Q6ODA4OCIsImh0dHBzOi8vZXdpbGxzLXVhdC52cy5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3RhcHBzLm5ycy5nb3YuYmMuY2EvaW50L2JjLWZvc3NpbC1tYW5hZ2VtZW50IiwiaHR0cHM6Ly90ZXN0LnN0cmF0YWhvdGVsLnNob3J0dGVybXJlbnRhbC5yZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL2Jjcm9zd2ViLXRlc3QuYmNhc3Nlc3NtZW50LmNhOjU0NTc5IiwiaHR0cDovL2xvY2FsaG9zdDo4MDgwIiwiaHR0cDovL2xvY2FsaG9zdDo4MDgxIiwiaHR0cHM6Ly9zZWFyY2gtd2ViLXRlc3QuYXBwcy5zaWx2ZXIuZGV2b3BzLmdvdi5iYy5jYSIsImh0dHBzOi8vc2hvd2Nhc2UtY29ubmVjdC1kZXYud2ViLmFwcCIsImh0dHBzOi8vdGVzdC5ob3N0LnNob3J0dGVybXJlbnRhbC5yZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwOi8vZXdpbGxzLWRldi52cy5nb3YuYmMuY2EvZS9ld2lsbHMvcGF5bWVudC1wcm9jZXNzIiwiaHR0cHM6Ly90ZXN0LmJjcmVnaXN0cnkuY2EvZGlyZWN0b3JzZWFyY2giLCJodHRwczovL3Rlc3Quc2VhcmNoLmJ1c2luZXNzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0Lmh1Yi5jb25uZWN0Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5kb2N1bWVudHMuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJodHRwczovL3Rlc3QuYmNyZWdpc3RyeS5jYS9idXNpbmVzcyIsImh0dHBzOi8vZXdpbGxzLWRldi52cy5nb3YuYmMuY2EvZS9ld2lsbHMvcGF5bWVudC1wcm9jZXNzIiwiaHR0cHM6Ly90ZXN0LmJ1c2luZXNzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0LmFubnVhbHJlcG9ydC5idXNpbmVzcy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vZXNyYS1iMTgzYTUtZGV2LWZyb250ZW5kLmFwcHMuc2lsdmVyLmRldm9wcy5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3RhcHBzLm5ycy5nb3YuYmMuY2EvYmNyaHAiLCJodHRwczovL2xvY2Fob3N0OjUwMDEiLCJodHRwczovL3Rlc3QuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QubmFtZXMuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuYnVzaW5lc3MtcmVnaXN0cnktZGFzaGJvYXJkLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly9zdGFnaW5nLnd3dy5ldGF4Lmdvdi5iYy5jYS9idHMiLCJodHRwczovL3Rlc3RhcHBzLm5ycy5nb3YuYmMuY2EvaW50L2JjcmhwIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJtYW5hZ2VfYnVzaW5lc3MiLCJuYW1lc19hcHByb3ZlciIsIm5hbWVzX3ZpZXdlciIsImFkbWluX2VkaXQiLCJmYXNfZWRpdCIsImZhc192aWV3IiwiYWRtaW5fdmlldyIsInZpZXciLCJzZWFyY2giLCJtYW5hZ2VfYWNjb3VudHMiLCJtaHJfc3RhZmYiLCJjcmVhdGVfY3JlZGl0cyIsIm9mZmxpbmVfYWNjZXNzIiwiYmNvbF9zdGFmZl9hZG1pbiIsInN1c3BlbmRfYWNjb3VudHMiLCJ1bWFfYXV0aG9yaXphdGlvbiIsIm1ha2VfcGF5bWVudCIsImZhc19saW5rIiwiZGVmYXVsdC1yb2xlcy1iY3JlZ2lzdHJ5IiwibWhyX3RyYW5zZmVyX3NhbGUiLCJuYW1lc19lZGl0b3IiLCJ2aWV3X2FjY291bnRzIiwiZWRpdCIsIm1ocl9wYXltZW50IiwibWhyX3N0YWZmX2FjdGl2aXRpZXMiLCJmYXNfcmVwb3J0cyIsIm1hbmFnZV9lZnQiLCJmYXNfdHJhbnNhY3Rpb24iLCJzdGFmZiIsIm1ocl9yZWdpc3RlciIsImZhc19zZWFyY2giLCJlZnRfcmVmdW5kX2FwcHJvdmVyIiwiaGVscGRlc2siLCJmYXNfY3JlYXRlIiwiZmFzX3JlZnVuZCIsIm1ocl90cmFuc3BvcnQiLCJtaHJfdHJhbnNmZXJfZGVhdGgiLCJmYXNfdXNlciIsInBwcl9zdGFmZiIsInBwciIsImNyZWF0ZV9hY2NvdW50cyIsIm1ociIsIm1ocl9leGVtcHRpb25fbm9uX3JlcyIsInZpZXdfYWxsX3RyYW5zYWN0aW9ucyIsIm1ocl9leGVtcHRpb25fcmVzIiwibmFtZXNfbWFuYWdlciIsImVmdF9yZWZ1bmQiXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctZXZlbnRzIiwibWFuYWdlLXVzZXJzIiwidmlldy11c2VycyIsInF1ZXJ5LWdyb3VwcyIsInF1ZXJ5LXVzZXJzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgZW1haWwgcHJvZmlsZSIsImZpcnN0bmFtZSI6IkFuaXNoIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJyb2xlcyI6WyJtYW5hZ2VfYnVzaW5lc3MiLCJuYW1lc19hcHByb3ZlciIsIm5hbWVzX3ZpZXdlciIsImFkbWluX2VkaXQiLCJmYXNfZWRpdCIsImZhc192aWV3IiwiYWRtaW5fdmlldyIsInZpZXciLCJzZWFyY2giLCJtYW5hZ2VfYWNjb3VudHMiLCJtaHJfc3RhZmYiLCJjcmVhdGVfY3JlZGl0cyIsIm9mZmxpbmVfYWNjZXNzIiwiYmNvbF9zdGFmZl9hZG1pbiIsInN1c3BlbmRfYWNjb3VudHMiLCJ1bWFfYXV0aG9yaXphdGlvbiIsIm1ha2VfcGF5bWVudCIsImZhc19saW5rIiwiZGVmYXVsdC1yb2xlcy1iY3JlZ2lzdHJ5IiwibWhyX3RyYW5zZmVyX3NhbGUiLCJuYW1lc19lZGl0b3IiLCJ2aWV3X2FjY291bnRzIiwiZWRpdCIsIm1ocl9wYXltZW50IiwibWhyX3N0YWZmX2FjdGl2aXRpZXMiLCJmYXNfcmVwb3J0cyIsIm1hbmFnZV9lZnQiLCJmYXNfdHJhbnNhY3Rpb24iLCJzdGFmZiIsIm1ocl9yZWdpc3RlciIsImZhc19zZWFyY2giLCJlZnRfcmVmdW5kX2FwcHJvdmVyIiwiaGVscGRlc2siLCJmYXNfY3JlYXRlIiwiZmFzX3JlZnVuZCIsIm1ocl90cmFuc3BvcnQiLCJtaHJfdHJhbnNmZXJfZGVhdGgiLCJmYXNfdXNlciIsInBwcl9zdGFmZiIsInBwciIsImNyZWF0ZV9hY2NvdW50cyIsIm1ociIsIm1ocl9leGVtcHRpb25fbm9uX3JlcyIsInZpZXdfYWxsX3RyYW5zYWN0aW9ucyIsIm1ocl9leGVtcHRpb25fcmVzIiwibmFtZXNfbWFuYWdlciIsImVmdF9yZWZ1bmQiXSwibmFtZSI6IkJhdHJhLCBBbmlzaCBDSVRaOkVYIiwiaWRwX3VzZXJpZCI6IjAxMENFNUFBMDE3NjRCQTNBRTBEMEY3RDU0REYyNkFEIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiaWRpclxcYW5iYXRyYSIsImdpdmVuX25hbWUiOiJBbmlzaCIsImZhbWlseV9uYW1lIjoiQmF0cmEiLCJlbWFpbCI6ImFuaXNoLmJhdHJhQGdvdi5iYy5jYSIsImxvZ2luU291cmNlIjoiSURJUiIsImxhc3RuYW1lIjoiQmF0cmEiLCJ1c2VybmFtZSI6ImlkaXJcXGFuYmF0cmEifQ.KNvnkxg6GpPPA1m1jJ9_OB0M4Af8bD_yunP3tGDQnB4YKRaSwwO1lCfORASmsvNwtWBBOu2_jljMr3F-bfyygfF3yR5Uz-Qhy-yRjqddiXpz8ZPMJKKDSDwktpLZhfJ2eStNeodc1k5BlEgMC2CP_jA2TXhOPXsdnbVYV8KDQ4qdFDZk832RIFiqcZ4lQ53bndr8PoDZt1ZWAWs46suf2qm_C3HADm5vCPsN0Fg3r-iPo3eg5FjNBrSRxEhoHLiyVtuvW9tt7oLaI7lOva0mYRjcENpmeAzk39MJzS1eRgIlibVI1Ba_vAvw3upkBKeh61Vo3AbVSPlwv328cysjRQ';   // optional: verifies account overrides before testing

const ACCOUNTS = [
  { label: 'public-3141', id: '3141', token: PUBLIC_TOKEN || __ENV.PUBLIC_TOKEN, serviceOverride: null, overrideCode: null },
  { label: 'govn-3179',   id: '3179', token: GOVN_TOKEN   || __ENV.GOVN_TOKEN,   serviceOverride: 1.00, overrideCode: 'TRF02' },
];

const CORP_TYPE = 'BCA';
const GST_RATE  = 0.05;   // service fee GST only; statutory (filing/priority/FE) GST not added
const PAY_URL   = __ENV.PAY_BASE_URL || ENV.payBaseUrl;
const APIKEY    = __ENV.API_KEY || ENV.apiKey;
const STAFF     = IDIR_TOKEN || __ENV.IDIR_TOKEN;

// ── Helpers ───────────────────────────────────────────────────────
const round2   = (n) => Math.round(n * 100) / 100;
const eq       = (a, e) => typeof a === 'number' && Math.abs(a - e) < 0.001;
const eqOrNull = (a, e) => a == null ? e === 0 : eq(a, e);

function headers(token, accountId) {
  return {
    'Authorization': `Bearer ${token}`,
    'x-apikey':      APIKEY,
    'Content-Type':  'application/json',
    'Account-Id':    accountId,
  };
}
function safeJson(res) { try { return res.json(); } catch (e) { return {}; } }
function logIfError(label, res) {
  if (res.status < 200 || res.status >= 300) {
    console.error(`${label} → HTTP ${res.status}: ${String(res.body).slice(0, 300)}`);
  }
}

function expected(acct, { filingFee, serviceFee, priorityFee = 0, feFee = 0 }, v) {
  const service  = acct.serviceOverride != null ? acct.serviceOverride : serviceFee;
  const priority = v.priority ? priorityFee : 0;
  const fe       = v.futureEffective ? feFee : 0;
  const gst      = round2(service * GST_RATE);
  return { filing: filingFee, priority, fe, service, gst,
           total: round2(filingFee + priority + fe + service + gst) };
}

// One fee-calc + invoice + read-back cycle.
function runCase(acct, L, code, exp, { query = '', filingType }) {
  // 1. Fee calculation
  const feeRes = http.get(`${PAY_URL}/fees/${CORP_TYPE}/${code}${query}`,
    { headers: headers(acct.token, acct.id), tags: { name: 'GET /fees' } });
  logIfError(`${L} GET /fees`, feeRes);
  const fee = safeJson(feeRes);
  const tax = fee.tax || {};
  check(feeRes, {
    [`${L} fees: HTTP 200`]:                        (r) => r.status === 200,
    [`${L} fees: filingFees = ${exp.filing}`]:      () => eq(fee.filingFees, exp.filing),
    [`${L} fees: priorityFees = ${exp.priority}`]:  () => eqOrNull(fee.priorityFees, exp.priority),
    [`${L} fees: futureEffectiveFees = ${exp.fe}`]: () => eqOrNull(fee.futureEffectiveFees, exp.fe),
    [`${L} fees: serviceFees = ${exp.service}`]:    () => eq(fee.serviceFees, exp.service),
    [`${L} fees: serviceFeeGst = ${exp.gst}`]:      () => eqOrNull(tax.serviceFeeGst, exp.gst),
    [`${L} fees: filingFeeGst = 0`]:                () => eqOrNull(tax.filingFeeGst, 0),
    [`${L} fees: total = ${exp.total}`]:            () => eq(fee.total, exp.total),
  });

  // 2. Invoice creation = fee calculation
  const payload = JSON.stringify({
    businessInfo: { corpType: CORP_TYPE, businessIdentifier: 'BCA1234' },
    filingInfo:   { filingTypes: [filingType] },
  });
  const postRes = http.post(`${PAY_URL}/payment-requests`, payload,
    { headers: headers(acct.token, acct.id), tags: { name: 'POST /payment-requests' } });
  logIfError(`${L} POST /payment-requests`, postRes);
  const inv  = safeJson(postRes);
  const item = (inv.lineItems && inv.lineItems[0]) || {};
  console.log(`${L} invoice id=${inv.id} status=${inv.statusCode} method=${inv.paymentMethod} total=${inv.total}`);
  check(postRes, {
    [`${L} invoice: HTTP 201`]:                            (r) => r.status === 201,
    [`${L} invoice: id present`]:                          () => inv.id !== undefined,
    [`${L} invoice: filingFees = fees endpoint`]:          () => eq(item.filingFees, fee.filingFees),
    [`${L} invoice: priorityFees = fees endpoint`]:        () => eqOrNull(item.priorityFees, fee.priorityFees || 0),
    [`${L} invoice: futureEffectiveFees = fees endpoint`]: () => eqOrNull(item.futureEffectiveFees, fee.futureEffectiveFees || 0),
    [`${L} invoice: serviceFees = fees endpoint`]:         () => eq(inv.serviceFees, fee.serviceFees),
    [`${L} invoice: total = fees endpoint`]:               () => eq(inv.total, fee.total),
    [`${L} invoice: total = ${exp.total}`]:                () => eq(inv.total, exp.total),
  });
  if (!inv.id) return;

  // 3. Read-back
  const getRes = http.get(`${PAY_URL}/payment-requests/${inv.id}`,
    { headers: headers(acct.token, acct.id), tags: { name: 'GET /payment-requests/{id}' } });
  logIfError(`${L} GET /payment-requests/${inv.id}`, getRes);
  const got = safeJson(getRes);
  check(getRes, {
    [`${L} GET: HTTP 200`]:             (r) => r.status === 200,
    [`${L} GET: total = ${exp.total}`]: () => eq(got.total, exp.total),
  });
}

export default function () {
  check(null, { 'setup: payBaseUrl present': () => !!PAY_URL });

  for (const acct of ACCOUNTS) {
    group(acct.label, () => {
      if (!acct.token) {
        console.warn(`${acct.label}: no token set — skipping.`);
        check(null, { [`[${acct.label}] token present`]: () => false });
        return;
      }

      // 0. Override guard (optional, needs IDIR)
      if (STAFF) {
        const res = http.get(`${PAY_URL}/accounts/${acct.id}/fees`, { headers: headers(STAFF, acct.id) });
        logIfError(`[${acct.label}] GET /accounts/fees`, res);
        const bca = (safeJson(res).accountFees || []).find((f) => f.product === 'BCA');
        console.log(`[${acct.label}] BCA override: ${bca ? `${bca.applyFilingFees}/${bca.serviceFeeCode}` : 'none'}`);
        check(res, {
          [`[${acct.label}] accounts/fees HTTP 200`]: (r) => r.status === 200,
          [`[${acct.label}] BCA override = ${acct.overrideCode || 'none'}`]: (r) => r.status === 200 &&
            (acct.overrideCode ? (bca && bca.applyFilingFees === true && bca.serviceFeeCode === acct.overrideCode) : !bca),
        });
      }

      // 1. Priority / future effective matrix
      for (const cfg of CODES) {
        for (const v of VARIANTS) {
          const q = [];
          const ft = { filingTypeCode: cfg.code };
          if (v.priority)        { q.push('priority=true');        ft.priority = true; }
          if (v.futureEffective) { q.push('futureEffective=true'); ft.futureEffective = true; }
          runCase(acct, `[${acct.label} ${cfg.code} ${v.name}]`, cfg.code, expected(acct, cfg, v),
                  { query: q.length ? `?${q.join('&')}` : '', filingType: ft });
        }
      }

      // 2. Variable fee
      if (VARIABLE.enabled) {
        const exp = expected(acct, { filingFee: VARIABLE.amount, serviceFee: VARIABLE.serviceFee }, {});
        runCase(acct, `[${acct.label} ${VARIABLE.code} variable ${VARIABLE.amount}]`, VARIABLE.code, exp, {
          query: `?${VARIABLE.queryParam}=${VARIABLE.amount}`,
          filingType: { filingTypeCode: VARIABLE.code, [VARIABLE.bodyField]: VARIABLE.amount },
        });
      } else {
        console.warn(`[${acct.label}] variable fee case skipped (VARIABLE.enabled = false).`);
      }
    });
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/fee-regression.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}