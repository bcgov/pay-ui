import http from 'k6/http';
import { check, group, sleep } from 'k6';
import encoding from 'k6/encoding';
import { htmlReport } from '../libs/k6-reporter.js';
import { textSummary } from '../libs/k6-summary.js';
export { options } from '../config/options.js';
import { ENV } from '../config/env.js';

// PAY-API #35025 — GovM (IDIR) account overrides  [retest with a GovM account token, not a staff token]
//   • Fee calculation reflects pay admin config (incl. new zero-filing-fee logic)
//   • Account overrides (Product Fee → BC Assessment) are the end result when they exist
//   • Invoice creation reflects the fee calculation from the fees endpoint
//
// HOW TO USE
//   1. Set the BC Assessment Product Fee on the account in Auth admin.
//   2. Run with the matching STEP:
//        k6 run --vus 1 --iterations 1 -e ENV=test -e STEP=baseline tests/govm-overrides.test.js
//   3. Change the override, re-run with the next STEP.

// ── Override steps: must match what is set on the account for BC Assessment ──
const STEPS = {
  baseline:  { applyFilingFees: true,  serviceFee: 1.50, serviceFeeCode: 'TRF01' }, // Yes / $1.50 (initial on 3187)
  svc100:    { applyFilingFees: true,  serviceFee: 1.00, serviceFeeCode: 'TRF02' }, // Yes / $1.00
  svc0:      { applyFilingFees: true,  serviceFee: 0.00, serviceFeeCode: 'TRF04' }, // Yes / $0.00
  noStat:    { applyFilingFees: false, serviceFee: 1.50, serviceFeeCode: 'TRF01' }, // No  / $1.50
  noStat100: { applyFilingFees: false, serviceFee: 1.00, serviceFeeCode: 'TRF02' }, // No  / $1.00
  noStat0:   { applyFilingFees: false, serviceFee: 0.00, serviceFeeCode: 'TRF04' }, // No  / $0.00 (old test's Override 2)
};
const STEP_NAME = __ENV.STEP || 'baseline';
const STEP = STEPS[STEP_NAME];
if (!STEP) throw new Error(`Unknown STEP "${STEP_NAME}". Valid: ${Object.keys(STEPS).join(', ')}`);

// BCA codes with a service fee configured in the fee schedule (from pay admin).
// filingFee = configured statutory fee.
const IQ_CODES = [
  { code: 'OLAARTIQ_A', filingFee: 0    },   // zero filing fee → new logic must still charge service fee
  // -e T_FILING=0 → use after changing OLAARTIQ_T's filing fee to $0.00 in Fee admin (fee schedule change test)
  { code: 'OLAARTIQ_T', filingFee: __ENV.T_FILING !== undefined ? Number(__ENV.T_FILING) : 1.00 },
  { code: 'OLAARTIQ_N', filingFee: 15.00 },
  { code: 'OLAARTIQ_H', filingFee: 15.00 },
  { code: 'OLAARTIQ_B', filingFee: 15.00 },
];
// The other 8 codes from the original 12-code GovM run. Run with -e CODES=all.
// ASSUMPTION: the account's service fee override applies to these codes too.
const OQ_AQ_CODES = [
  { code: 'OLAARTOQ_A', filingFee: 0    },
  { code: 'OLAARTAQ_A', filingFee: 0    },
  { code: 'OLAARTOQ_T', filingFee: 0    },
  { code: 'OLAARTAQ_T', filingFee: 0    },
  { code: 'OLAARTOQ_N', filingFee: 2.00 },
  { code: 'OLAARTAQ_N', filingFee: 4.00 },
  { code: 'OLAARTOQ_H', filingFee: 2.00 },
  { code: 'OLAARTAQ_H', filingFee: 1.83 },
];
const FILING_CODES = __ENV.CODES === 'all' ? IQ_CODES.concat(OQ_AQ_CODES) : IQ_CODES;

const CORP_TYPE = 'BCA';
const GST_RATE  = 0.05;   // GST applies to the service fee only (filingFeeGst = 0 observed)

// ── Credentials: paste here or pass with -e. Do NOT commit real values. ──
const GOVM_TOKEN  = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI1MFhzaDlCbVJ6VWJ3Q2lDdnJ3a3hITGI4dEpYNkFFdWRmR3Y0c1NVNURNIn0.eyJleHAiOjE3OTEzOTU3MzEsImlhdCI6MTc5MTM5MzkzMSwiYXV0aF90aW1lIjoxNzkxMzkwNDE4LCJqdGkiOiJvbnJ0cnQ6NzY5NDAzYjktM2UxNS0wYjc2LTk1NGItNmFhMmVlOWJiMzU0IiwiaXNzIjoiaHR0cHM6Ly90ZXN0LmxvZ2lucHJveHkuZ292LmJjLmNhL2F1dGgvcmVhbG1zL2JjcmVnaXN0cnkiLCJhdWQiOlsiZW50aXR5LXNlcnZpY2VzIiwiTmFtZVgtVGVzdCIsInBwci1zZXJ2aWNlcyIsImFjY291bnQtc2VydmljZXMiLCJuYW1lLXJlcXVlc3RzLXdlYiIsImFjY291bnQiXSwic3ViIjoiNmI3YmE4YjItMjU1Yy00Y2I0LWJiMzYtYWJmYWYzNjhhYmJhIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiY29ubmVjdC13ZWIiLCJzaWQiOiJQR29WOFJpa2xOQzlhQ1dBdDBITW44Tm4iLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cHM6Ly90ZXN0LmNyZWF0ZS5idXNpbmVzcy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5hY2NvdW50LmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0YXBwcy5ucnMuZ292LmJjLmNhL2JjLWZvc3NpbC1tYW5hZ2VtZW50IiwiaHR0cHM6Ly90ZXN0LmV4YW1pbmVyLWRhc2hib2FyZC5zaG9ydHRlcm1yZW50YWwucmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0Lmp1c3RpY2UuZ292LmJjLmNhL2NzbyIsImh0dHBzOi8vZXdpbGxzLWRldi52cy5nb3YuYmMuY2E6NDQzIiwiaHR0cHM6Ly90ZXN0LmRpcmVjdG9yc2VhcmNoLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly9kZXYuaHViLmNvbm5lY3QuZ292LmJjLmNhIiwiaHR0cHM6Ly9kZXYuanVzdGljZS5nb3YuYmMuY2EvY3NvIiwiaHR0cHM6Ly90ZXN0LmJ1c2luZXNzLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5lZGl0LmJ1c2luZXNzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0LnBsYXRmb3JtLnNob3J0dGVybXJlbnRhbC5yZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwOi8vMTI3LjAuMC4xOjcxMDEiLCJodHRwczovL3Rlc3QuZXhhbWluZXIuc2hvcnR0ZXJtcmVudGFsLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5iY3JlZ2lzdHJ5LmNhIiwiaHR0cHM6Ly9ld2lsbHMtdWF0LnZzLmdvdi5iYy5jYTo0NDMiLCJodHRwczovL3Rlc3RhcHBzLm5ycy5nb3YuYmMuY2EvYmNhcCIsImh0dHBzOi8vZXdpbGxzLWRldi52cy5nb3YuYmMuY2EiLCJodHRwczovL2RvY3VtZW50cy11aS10ZXN0LndlYmFwcCIsImh0dHBzOi8vYmNyZWdpc3RyeS1hY2NvdW50LWRldi0tcHItdGVzdC0zMzc2LTNqM3lsYWRwLndlYi5hcHAiLCJodHRwczovL2V3aWxscy11YXQudnMuZ292LmJjLmNhL2UvZXdpbGxzL3BheW1lbnQtcHJvY2VzcyIsImh0dHBzOi8vdGVzdC5hc3NldHMuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwOi8vZXdpbGxzLXVhdC52cy5nb3YuYmMuY2EvZS9ld2lsbHMvcGF5bWVudC1wcm9jZXNzIiwiaHR0cHM6Ly9iY2FyZXBvcnRzZGV2LmJjYXNzZXNzbWVudC5jYSIsImh0dHBzOi8vc3RhZ2luZy53d3cuZXRheC5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QucGVvcGxlLmJ1c2luZXNzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cDovL2xvY2FsaG9zdDo4MDg4IiwiaHR0cHM6Ly9ld2lsbHMtdWF0LnZzLmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdGFwcHMubnJzLmdvdi5iYy5jYS9pbnQvYmMtZm9zc2lsLW1hbmFnZW1lbnQiLCJodHRwczovL3Rlc3Quc3RyYXRhaG90ZWwuc2hvcnR0ZXJtcmVudGFsLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vYmNyb3N3ZWItdGVzdC5iY2Fzc2Vzc21lbnQuY2E6NTQ1NzkiLCJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJodHRwOi8vbG9jYWxob3N0OjgwODEiLCJodHRwczovL3NlYXJjaC13ZWItdGVzdC5hcHBzLnNpbHZlci5kZXZvcHMuZ292LmJjLmNhIiwiaHR0cHM6Ly9zaG93Y2FzZS1jb25uZWN0LWRldi53ZWIuYXBwIiwiaHR0cHM6Ly90ZXN0Lmhvc3Quc2hvcnR0ZXJtcmVudGFsLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHA6Ly9ld2lsbHMtZGV2LnZzLmdvdi5iYy5jYS9lL2V3aWxscy9wYXltZW50LXByb2Nlc3MiLCJodHRwczovL3Rlc3QuYmNyZWdpc3RyeS5jYS9kaXJlY3RvcnNlYXJjaCIsImh0dHBzOi8vdGVzdC5zZWFyY2guYnVzaW5lc3MuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuaHViLmNvbm5lY3QuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0LmRvY3VtZW50cy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMCIsImh0dHBzOi8vdGVzdC5iY3JlZ2lzdHJ5LmNhL2J1c2luZXNzIiwiaHR0cHM6Ly9ld2lsbHMtZGV2LnZzLmdvdi5iYy5jYS9lL2V3aWxscy9wYXltZW50LXByb2Nlc3MiLCJodHRwczovL3Rlc3QuYnVzaW5lc3MuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuYW5udWFscmVwb3J0LmJ1c2luZXNzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly9lc3JhLWIxODNhNS1kZXYtZnJvbnRlbmQuYXBwcy5zaWx2ZXIuZGV2b3BzLmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdGFwcHMubnJzLmdvdi5iYy5jYS9iY3JocCIsImh0dHBzOi8vbG9jYWhvc3Q6NTAwMSIsImh0dHBzOi8vdGVzdC5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5uYW1lcy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5idXNpbmVzcy1yZWdpc3RyeS1kYXNoYm9hcmQuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3N0YWdpbmcud3d3LmV0YXguZ292LmJjLmNhL2J0cyIsImh0dHBzOi8vdGVzdGFwcHMubnJzLmdvdi5iYy5jYS9pbnQvYmNyaHAiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbInB1YmxpY191c2VyIiwiZ292X2FjY291bnRfdXNlciIsInBwciIsIm1ocl9wYXltZW50IiwiZWRpdCIsImFjY291bnRfaG9sZGVyIiwibWhyIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtYmNyZWdpc3RyeSJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwcm9maWxlIiwiZmlyc3RuYW1lIjoiVkVMTUEiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicm9sZXMiOlsicHVibGljX3VzZXIiLCJnb3ZfYWNjb3VudF91c2VyIiwicHByIiwibWhyX3BheW1lbnQiLCJlZGl0IiwiYWNjb3VudF9ob2xkZXIiLCJtaHIiLCJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIiwiZGVmYXVsdC1yb2xlcy1iY3JlZ2lzdHJ5Il0sIm5hbWUiOiJWRUxNQSBDSE8iLCJpZHBfdXNlcmlkIjoiSkhHS0M3RU1SWkZPNTRWNkw1TEFaSEJPUVlUNFM3SFkiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJiY3NjL2poZ2tjN2VtcnpmbzU0djZsNWxhemhib3F5dDRzN2h5IiwiZ2l2ZW5fbmFtZSI6IlZFTE1BIiwiZmFtaWx5X25hbWUiOiJDSE8iLCJlbWFpbCI6ImFuaXNoLmJhdHJhQGdvdi5iYy5jYSIsImxvZ2luU291cmNlIjoiSURJUiIsImxhc3RuYW1lIjoiQ0hPIiwidXNlcm5hbWUiOiJiY3NjL2poZ2tjN2VtcnpmbzU0djZsNWxhemhib3F5dDRzN2h5In0.BCfP7OAPO_7NvCRC-1tGLS1TB7kzxGd-mEYcIRDUs9TZF0bW8SAsazVSYMP--IL9sUjTwXOSyC-MCWab2hXZ56derk8PMZ6CilRetmN49hl24DUYp_5LyPqNqprgob0bsG2wIXMk-TggLhyIOCF1bV2nnqjTDwePRQ3YzKVa2LLQMQ5b1hRC7S8AJ-kffU2Zq20-DVSFk7AlMEGCXOga2LZffjeiOCxPh_diXfQ0s9_Fy-iSBWKwLHZ_CZJMUIlzn6UJTrB7K_A6pp5OQ6HdiQihyOQyLMdbXdOTg4qamNYWSB3IOc4gZtiBZAw5JE_tGq5B11xmjdsVUlIUH7E0jg';   // GovM account user token (without "Bearer ") — must NOT have the staff role
const IDIR_TOKEN  = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI1MFhzaDlCbVJ6VWJ3Q2lDdnJ3a3hITGI4dEpYNkFFdWRmR3Y0c1NVNURNIn0.eyJleHAiOjE3OTEzOTUwODIsImlhdCI6MTc5MTM5MzI4MiwiYXV0aF90aW1lIjoxNzkxMzkxMTM1LCJqdGkiOiJvbnJ0cnQ6Njc0MmRlYmItMDNmNC02ODVjLWZiZjUtZDE1MDM4YTlkOTI1IiwiaXNzIjoiaHR0cHM6Ly90ZXN0LmxvZ2lucHJveHkuZ292LmJjLmNhL2F1dGgvcmVhbG1zL2JjcmVnaXN0cnkiLCJhdWQiOlsiZW50aXR5LXNlcnZpY2VzIiwiTmFtZVgtVGVzdCIsInBwci1zZXJ2aWNlcyIsImFjY291bnQtc2VydmljZXMiLCJuYW1lLXJlcXVlc3RzLXdlYiIsInJlYWxtLW1hbmFnZW1lbnQiLCJhY2NvdW50Il0sInN1YiI6IjdiNjUxZjg2LWExZjctNDE2Yi04NGExLTg2YjQ5ZjM1MjQwZSIsInR5cCI6IkJlYXJlciIsImF6cCI6ImNvbm5lY3Qtd2ViIiwic2lkIjoiTUJMd1BuMGUyOXhfcHZsTlFPcHJQSjhCIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHBzOi8vdGVzdC5jcmVhdGUuYnVzaW5lc3MuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuYWNjb3VudC5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdGFwcHMubnJzLmdvdi5iYy5jYS9iYy1mb3NzaWwtbWFuYWdlbWVudCIsImh0dHBzOi8vdGVzdC5leGFtaW5lci1kYXNoYm9hcmQuc2hvcnR0ZXJtcmVudGFsLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5qdXN0aWNlLmdvdi5iYy5jYS9jc28iLCJodHRwczovL2V3aWxscy1kZXYudnMuZ292LmJjLmNhOjQ0MyIsImh0dHBzOi8vdGVzdC5kaXJlY3RvcnNlYXJjaC5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vZGV2Lmh1Yi5jb25uZWN0Lmdvdi5iYy5jYSIsImh0dHBzOi8vZGV2Lmp1c3RpY2UuZ292LmJjLmNhL2NzbyIsImh0dHBzOi8vdGVzdC5idXNpbmVzcy5yZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuZWRpdC5idXNpbmVzcy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5wbGF0Zm9ybS5zaG9ydHRlcm1yZW50YWwucmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cDovLzEyNy4wLjAuMTo3MTAxIiwiaHR0cHM6Ly90ZXN0LmV4YW1pbmVyLnNob3J0dGVybXJlbnRhbC5yZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuYmNyZWdpc3RyeS5jYSIsImh0dHBzOi8vZXdpbGxzLXVhdC52cy5nb3YuYmMuY2E6NDQzIiwiaHR0cHM6Ly90ZXN0YXBwcy5ucnMuZ292LmJjLmNhL2JjYXAiLCJodHRwczovL2V3aWxscy1kZXYudnMuZ292LmJjLmNhIiwiaHR0cHM6Ly9kb2N1bWVudHMtdWktdGVzdC53ZWJhcHAiLCJodHRwczovL2JjcmVnaXN0cnktYWNjb3VudC1kZXYtLXByLXRlc3QtMzM3Ni0zajN5bGFkcC53ZWIuYXBwIiwiaHR0cHM6Ly9ld2lsbHMtdWF0LnZzLmdvdi5iYy5jYS9lL2V3aWxscy9wYXltZW50LXByb2Nlc3MiLCJodHRwczovL3Rlc3QuYXNzZXRzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cDovL2V3aWxscy11YXQudnMuZ292LmJjLmNhL2UvZXdpbGxzL3BheW1lbnQtcHJvY2VzcyIsImh0dHBzOi8vYmNhcmVwb3J0c2Rldi5iY2Fzc2Vzc21lbnQuY2EiLCJodHRwczovL3N0YWdpbmcud3d3LmV0YXguZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0LnBlb3BsZS5idXNpbmVzcy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHA6Ly9sb2NhbGhvc3Q6ODA4OCIsImh0dHBzOi8vZXdpbGxzLXVhdC52cy5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3RhcHBzLm5ycy5nb3YuYmMuY2EvaW50L2JjLWZvc3NpbC1tYW5hZ2VtZW50IiwiaHR0cHM6Ly90ZXN0LnN0cmF0YWhvdGVsLnNob3J0dGVybXJlbnRhbC5yZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL2Jjcm9zd2ViLXRlc3QuYmNhc3Nlc3NtZW50LmNhOjU0NTc5IiwiaHR0cDovL2xvY2FsaG9zdDo4MDgwIiwiaHR0cDovL2xvY2FsaG9zdDo4MDgxIiwiaHR0cHM6Ly9zZWFyY2gtd2ViLXRlc3QuYXBwcy5zaWx2ZXIuZGV2b3BzLmdvdi5iYy5jYSIsImh0dHBzOi8vc2hvd2Nhc2UtY29ubmVjdC1kZXYud2ViLmFwcCIsImh0dHBzOi8vdGVzdC5ob3N0LnNob3J0dGVybXJlbnRhbC5yZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwOi8vZXdpbGxzLWRldi52cy5nb3YuYmMuY2EvZS9ld2lsbHMvcGF5bWVudC1wcm9jZXNzIiwiaHR0cHM6Ly90ZXN0LmJjcmVnaXN0cnkuY2EvZGlyZWN0b3JzZWFyY2giLCJodHRwczovL3Rlc3Quc2VhcmNoLmJ1c2luZXNzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0Lmh1Yi5jb25uZWN0Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5kb2N1bWVudHMuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJodHRwczovL3Rlc3QuYmNyZWdpc3RyeS5jYS9idXNpbmVzcyIsImh0dHBzOi8vZXdpbGxzLWRldi52cy5nb3YuYmMuY2EvZS9ld2lsbHMvcGF5bWVudC1wcm9jZXNzIiwiaHR0cHM6Ly90ZXN0LmJ1c2luZXNzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0LmFubnVhbHJlcG9ydC5idXNpbmVzcy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vZXNyYS1iMTgzYTUtZGV2LWZyb250ZW5kLmFwcHMuc2lsdmVyLmRldm9wcy5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3RhcHBzLm5ycy5nb3YuYmMuY2EvYmNyaHAiLCJodHRwczovL2xvY2Fob3N0OjUwMDEiLCJodHRwczovL3Rlc3QuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QubmFtZXMuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuYnVzaW5lc3MtcmVnaXN0cnktZGFzaGJvYXJkLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly9zdGFnaW5nLnd3dy5ldGF4Lmdvdi5iYy5jYS9idHMiLCJodHRwczovL3Rlc3RhcHBzLm5ycy5nb3YuYmMuY2EvaW50L2JjcmhwIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJtYW5hZ2VfYnVzaW5lc3MiLCJuYW1lc19hcHByb3ZlciIsIm5hbWVzX3ZpZXdlciIsImFkbWluX2VkaXQiLCJmYXNfZWRpdCIsImZhc192aWV3IiwiYWRtaW5fdmlldyIsInZpZXciLCJzZWFyY2giLCJtYW5hZ2VfYWNjb3VudHMiLCJtaHJfc3RhZmYiLCJjcmVhdGVfY3JlZGl0cyIsIm9mZmxpbmVfYWNjZXNzIiwiYmNvbF9zdGFmZl9hZG1pbiIsInN1c3BlbmRfYWNjb3VudHMiLCJ1bWFfYXV0aG9yaXphdGlvbiIsIm1ha2VfcGF5bWVudCIsImZhc19saW5rIiwiZGVmYXVsdC1yb2xlcy1iY3JlZ2lzdHJ5IiwibWhyX3RyYW5zZmVyX3NhbGUiLCJuYW1lc19lZGl0b3IiLCJ2aWV3X2FjY291bnRzIiwiZWRpdCIsIm1ocl9wYXltZW50IiwibWhyX3N0YWZmX2FjdGl2aXRpZXMiLCJmYXNfcmVwb3J0cyIsIm1hbmFnZV9lZnQiLCJmYXNfdHJhbnNhY3Rpb24iLCJzdGFmZiIsIm1ocl9yZWdpc3RlciIsImZhc19zZWFyY2giLCJlZnRfcmVmdW5kX2FwcHJvdmVyIiwiaGVscGRlc2siLCJmYXNfY3JlYXRlIiwiZmFzX3JlZnVuZCIsIm1ocl90cmFuc3BvcnQiLCJtaHJfdHJhbnNmZXJfZGVhdGgiLCJmYXNfdXNlciIsInBwcl9zdGFmZiIsInBwciIsImZhc19jb3JyZWN0aW9uIiwiY3JlYXRlX2FjY291bnRzIiwibWhyIiwibWhyX2V4ZW1wdGlvbl9ub25fcmVzIiwidmlld19hbGxfdHJhbnNhY3Rpb25zIiwibWhyX2V4ZW1wdGlvbl9yZXMiLCJuYW1lc19tYW5hZ2VyIiwiZWZ0X3JlZnVuZCJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InJlYWxtLW1hbmFnZW1lbnQiOnsicm9sZXMiOlsidmlldy1ldmVudHMiLCJtYW5hZ2UtdXNlcnMiLCJ2aWV3LXVzZXJzIiwicXVlcnktZ3JvdXBzIiwicXVlcnktdXNlcnMiXX0sImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwcm9maWxlIiwiZmlyc3RuYW1lIjoiQW5pc2giLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsInJvbGVzIjpbIm1hbmFnZV9idXNpbmVzcyIsIm5hbWVzX2FwcHJvdmVyIiwibmFtZXNfdmlld2VyIiwiYWRtaW5fZWRpdCIsImZhc19lZGl0IiwiZmFzX3ZpZXciLCJhZG1pbl92aWV3IiwidmlldyIsInNlYXJjaCIsIm1hbmFnZV9hY2NvdW50cyIsIm1ocl9zdGFmZiIsImNyZWF0ZV9jcmVkaXRzIiwib2ZmbGluZV9hY2Nlc3MiLCJiY29sX3N0YWZmX2FkbWluIiwic3VzcGVuZF9hY2NvdW50cyIsInVtYV9hdXRob3JpemF0aW9uIiwibWFrZV9wYXltZW50IiwiZmFzX2xpbmsiLCJkZWZhdWx0LXJvbGVzLWJjcmVnaXN0cnkiLCJtaHJfdHJhbnNmZXJfc2FsZSIsIm5hbWVzX2VkaXRvciIsInZpZXdfYWNjb3VudHMiLCJlZGl0IiwibWhyX3BheW1lbnQiLCJtaHJfc3RhZmZfYWN0aXZpdGllcyIsImZhc19yZXBvcnRzIiwibWFuYWdlX2VmdCIsImZhc190cmFuc2FjdGlvbiIsInN0YWZmIiwibWhyX3JlZ2lzdGVyIiwiZmFzX3NlYXJjaCIsImVmdF9yZWZ1bmRfYXBwcm92ZXIiLCJoZWxwZGVzayIsImZhc19jcmVhdGUiLCJmYXNfcmVmdW5kIiwibWhyX3RyYW5zcG9ydCIsIm1ocl90cmFuc2Zlcl9kZWF0aCIsImZhc191c2VyIiwicHByX3N0YWZmIiwicHByIiwiZmFzX2NvcnJlY3Rpb24iLCJjcmVhdGVfYWNjb3VudHMiLCJtaHIiLCJtaHJfZXhlbXB0aW9uX25vbl9yZXMiLCJ2aWV3X2FsbF90cmFuc2FjdGlvbnMiLCJtaHJfZXhlbXB0aW9uX3JlcyIsIm5hbWVzX21hbmFnZXIiLCJlZnRfcmVmdW5kIl0sIm5hbWUiOiJCYXRyYSwgQW5pc2ggQ0lUWjpFWCIsImlkcF91c2VyaWQiOiIwMTBDRTVBQTAxNzY0QkEzQUUwRDBGN0Q1NERGMjZBRCIsInByZWZlcnJlZF91c2VybmFtZSI6ImlkaXJcXGFuYmF0cmEiLCJnaXZlbl9uYW1lIjoiQW5pc2giLCJmYW1pbHlfbmFtZSI6IkJhdHJhIiwiZW1haWwiOiJhbmlzaC5iYXRyYUBnb3YuYmMuY2EiLCJsb2dpblNvdXJjZSI6IklESVIiLCJsYXN0bmFtZSI6IkJhdHJhIiwidXNlcm5hbWUiOiJpZGlyXFxhbmJhdHJhIn0.c7gIOVcwpC-_OAUZy7DUzuzm0AP8HxEjHdu9y-5KtMwnzmuIibh07dyHa7malt5oq3ebGPI7BCJuXMjAmvjLK7xKlNjWD0JglrutkY_F3ys92v5Cw27JNpQMEdCXj4e3RslOLK23MsazAsbOg5HlaOlaMXrFphUfx4xLt7u7PnZOVNpKe2uDcLTjvBt2-PimxZNF-wJ5OdNVjlr3bUANgYFzRPA_9HUOr6G75gWoU8pUGfuZD6qZzy3fUJxWkAd-i9q3skY09kF2hq8CA5qkGnf2PtjjlxgT-sKNJ8a3CrgQk0nRw9u99iTfi-F9itiupq0UBDxGmbRWtPuAexFujQ';   // optional: verifies the account override is set as STEP says before testing
const GOVM_ACCOUNT_ID = '3187';

const PAY_URL = __ENV.PAY_BASE_URL || ENV.payBaseUrl;
const TOKEN   = GOVM_TOKEN || __ENV.GOVM_TOKEN;
const STAFF   = IDIR_TOKEN  || __ENV.IDIR_TOKEN;
const APIKEY  = __ENV.API_KEY || ENV.apiKey;
const ACCOUNT = __ENV.GOVM_ACCOUNT_ID || GOVM_ACCOUNT_ID;

// ── Helpers ───────────────────────────────────────────────────────
const round2   = (n) => Math.round(n * 100) / 100;
const eq       = (a, e) => typeof a === 'number' && Math.abs(a - e) < 0.001;
const eqOrNull = (a, e) => a == null ? e === 0 : eq(a, e);

function headers(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'x-apikey':      APIKEY,
    'Content-Type':  'application/json',
    'Account-Id':    ACCOUNT,
  };
}
function safeJson(res) { try { return res.json(); } catch (e) { return {}; } }
function logIfError(label, res) {
  if (res.status < 200 || res.status >= 300) {
    console.error(`${label} → HTTP ${res.status}: ${String(res.body).slice(0, 300)}`);
  }
}

function expected(filingFee) {
  const filing  = STEP.applyFilingFees ? filingFee : 0;
  const service = STEP.serviceFee;                 // applies even when filing = 0 (ticket #35025)
  const gst     = round2(service * GST_RATE);
  return { filing, service, gst, total: round2(filing + service + gst) };
}

export default function () {
  const ok = check(null, {
    'setup: GOVM_TOKEN present': () => !!TOKEN,
    'setup: apiKey present':      () => !!APIKEY,
    'setup: payBaseUrl present':  () => !!PAY_URL,
  });
  if (!ok) return;
  // The GovM token must not carry the staff role, or service fees are always 0 (staff exemption).
  let tokenRoles = [];
  try { tokenRoles = JSON.parse(encoding.b64decode(TOKEN.split('.')[1], 'rawurl', 's')).realm_access.roles || []; } catch (e) { /* ignore */ }
  check(null, { 'setup: GovM token is NOT a staff token': () => tokenRoles.length > 0 && !tokenRoles.includes('staff') });
  console.log(`▶ STEP=${STEP_NAME} | account ${ACCOUNT} | BCA applyFilingFees=${STEP.applyFilingFees}, serviceFee=${STEP.serviceFee}`);

  // ── 0. Guard: confirm the account override matches STEP (needs IDIR token) ──
  if (STAFF) {
    group('0 - account override matches STEP', () => {
      const res = http.get(`${PAY_URL}/accounts/${ACCOUNT}/fees`, { headers: headers(STAFF) });
      logIfError('GET /accounts/fees', res);
      const bca = (safeJson(res).accountFees || []).find((f) => f.product === 'BCA') || {};
      console.log(`[override] BCA applyFilingFees=${bca.applyFilingFees}, serviceFeeCode=${bca.serviceFeeCode}, version=${bca.version}`);
      check(res, {
        '[override] HTTP 200':                                          (r) => r.status === 200,
        [`[override] applyFilingFees = ${STEP.applyFilingFees}`]:       () => bca.applyFilingFees === STEP.applyFilingFees,
        [`[override] serviceFeeCode = ${STEP.serviceFeeCode}`]:         () => bca.serviceFeeCode === STEP.serviceFeeCode,
      });
    });
  } else {
    console.warn('IDIR_TOKEN not set — skipping override guard. Make sure the account setting matches STEP.');
  }

  for (const { code, filingFee } of FILING_CODES) {
    const exp = expected(filingFee);
    const L = `[${STEP_NAME} ${code}]`;

    group(`${STEP_NAME} - ${code}`, () => {
      // ── 1. Fee calculation ──────────────────────────────────
      const feeRes = http.get(`${PAY_URL}/fees/${CORP_TYPE}/${code}`,
        { headers: headers(TOKEN), tags: { name: 'GET /fees' } });
      logIfError(`${L} GET /fees`, feeRes);
      const fee = safeJson(feeRes);
      const tax = fee.tax || {};
      check(feeRes, {
        [`${L} fees: HTTP 200`]:                         (r) => r.status === 200,
        [`${L} fees: filingFees = ${exp.filing}`]:       () => eq(fee.filingFees, exp.filing),
        [`${L} fees: serviceFees = ${exp.service}`]:     () => eq(fee.serviceFees, exp.service),
        [`${L} fees: serviceFeeGst = ${exp.gst}`]:       () => eqOrNull(tax.serviceFeeGst, exp.gst),
        [`${L} fees: filingFeeGst = 0`]:                 () => eqOrNull(tax.filingFeeGst, 0),
        [`${L} fees: total = ${exp.total}`]:             () => eq(fee.total, exp.total),
      });

      // ── 2. Invoice creation — must reflect the fee calculation ──
      const payload = JSON.stringify({
        businessInfo: { corpType: CORP_TYPE, businessIdentifier: 'BCA1234' },
        filingInfo:   { filingTypes: [{ filingTypeCode: code }] },
      });
      const postRes = http.post(`${PAY_URL}/payment-requests`, payload,
        { headers: headers(TOKEN), tags: { name: 'POST /payment-requests' } });
      logIfError(`${L} POST /payment-requests`, postRes);
      const inv  = safeJson(postRes);
      const item = (inv.lineItems && inv.lineItems[0]) || {};
      const invGst = typeof inv.total === 'number' ? round2(inv.total - (item.filingFees || 0) - (inv.serviceFees || 0)) : undefined;
      console.log(`${L} invoice id=${inv.id} status=${inv.statusCode} method=${inv.paymentMethod} total=${inv.total}`);
      check(postRes, {
        [`${L} invoice: HTTP 201`]:                      (r) => r.status === 201,
        [`${L} invoice: id present`]:                    () => inv.id !== undefined,
        [`${L} invoice: filingFees = fees endpoint`]:    () => eq(item.filingFees, fee.filingFees),
        [`${L} invoice: serviceFees = fees endpoint`]:   () => eq(inv.serviceFees, fee.serviceFees),
        [`${L} invoice: total = fees endpoint`]:         () => eq(inv.total, fee.total),
        [`${L} invoice: total = ${exp.total}`]:          () => eq(inv.total, exp.total),
        [`${L} invoice: gst = ${exp.gst}`]:              () => eq(invGst, exp.gst),
      });
      if (!inv.id) return;

      // ── 3. Read-back ────────────────────────────────────────
      const getRes = http.get(`${PAY_URL}/payment-requests/${inv.id}`,
        { headers: headers(TOKEN), tags: { name: 'GET /payment-requests/{id}' } });
      logIfError(`${L} GET /payment-requests/${inv.id}`, getRes);
      const got = safeJson(getRes);
      const gotItem = (got.lineItems && got.lineItems[0]) || {};
      check(getRes, {
        [`${L} GET: HTTP 200`]:                          (r) => r.status === 200,
        [`${L} GET: total = ${exp.total}`]:              () => eq(got.total, exp.total),
        [`${L} GET: serviceFees = ${exp.service}`]:      () => eq(got.serviceFees, exp.service),
        [`${L} GET: filingFees = ${exp.filing}`]:        () => eq(gotItem.filingFees, exp.filing),
      });
    });
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    [`reports/govm-${STEP_NAME}.html`]: htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}