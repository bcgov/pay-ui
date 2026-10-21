import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { htmlReport } from '../libs/k6-reporter.js';
import { textSummary } from '../libs/k6-summary.js';
export { options } from '../config/options.js';
import { ENV } from '../config/env.js';

// PAY-API #35025 — Scenario 2: GovN (BCeID) account overrides
//   • Fee calculation reflects pay admin config (incl. new zero-filing-fee logic)
//   • Account overrides (Product Fee → BC Assessment) are the end result when they exist
//   • Invoice creation reflects the fee calculation from the fees endpoint
//
// HOW TO USE
//   1. Set the BC Assessment Product Fee on the account in Auth admin.
//   2. Run with the matching STEP:
//        k6 run --vus 1 --iterations 1 -e ENV=test -e STEP=baseline tests/govn-overrides.test.js
//   3. Change the override, re-run with the next STEP.

// ── Override steps: must match what is set on the account for BC Assessment ──
const STEPS = {
  baseline: { applyFilingFees: true,  serviceFee: 1.00, serviceFeeCode: 'TRF02' }, // Yes / $1.00 (initial)
  svc0:     { applyFilingFees: true,  serviceFee: 0.00, serviceFeeCode: 'TRF04' }, // Yes / $0.00
  svc150:   { applyFilingFees: true,  serviceFee: 1.50, serviceFeeCode: 'TRF01' }, // Yes / $1.50
  noStat:   { applyFilingFees: false, serviceFee: 1.00, serviceFeeCode: 'TRF02' }, // No  / $1.00
  noStat150:{ applyFilingFees: false, serviceFee: 1.50, serviceFeeCode: 'TRF01' }, // No  / $1.50
};
const STEP_NAME = __ENV.STEP || 'baseline';
const STEP = STEPS[STEP_NAME];
if (!STEP) throw new Error(`Unknown STEP "${STEP_NAME}". Valid: ${Object.keys(STEPS).join(', ')}`);

// BCA codes with a service fee configured in the fee schedule (from pay admin).
// filingFee = configured statutory fee.
const FILING_CODES = [
  { code: 'OLAARTIQ_A', filingFee: 0    },   // zero filing fee → new logic must still charge service fee
  { code: 'OLAARTIQ_T', filingFee: 1.00 },
  { code: 'OLAARTIQ_N', filingFee: 15.00 },
  { code: 'OLAARTIQ_H', filingFee: 15.00 },
  { code: 'OLAARTIQ_B', filingFee: 15.00 },
];

const CORP_TYPE = 'BCA';
const GST_RATE  = 0.05;   // GST applies to the service fee only (filingFeeGst = 0 observed)

// ── Credentials: paste here or pass with -e. Do NOT commit real values. ──
const BCEID_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI1MFhzaDlCbVJ6VWJ3Q2lDdnJ3a3hITGI4dEpYNkFFdWRmR3Y0c1NVNURNIn0.eyJleHAiOjE3OTA3ODI4NDIsImlhdCI6MTc5MDc4MTA0MiwiYXV0aF90aW1lIjoxNzkwNzc5ODkzLCJqdGkiOiJvbnJ0cnQ6OWIxZDI4YzktMTdiMy1iYThjLTk3YTUtNTEzNWE5M2IwNzEzIiwiaXNzIjoiaHR0cHM6Ly90ZXN0LmxvZ2lucHJveHkuZ292LmJjLmNhL2F1dGgvcmVhbG1zL2JjcmVnaXN0cnkiLCJhdWQiOlsiZW50aXR5LXNlcnZpY2VzIiwiTmFtZVgtVGVzdCIsInBwci1zZXJ2aWNlcyIsImFjY291bnQtc2VydmljZXMiLCJuYW1lLXJlcXVlc3RzLXdlYiIsImFjY291bnQiXSwic3ViIjoiZjQxOWY4YTUtOTU0OS00NDNiLTkxODItNjM1YzU3OWQ1ODk3IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiY29ubmVjdC13ZWIiLCJzaWQiOiJVQ2cwTWw3OU1pMGFGdk5aWGdsZHdBZ1QiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cHM6Ly90ZXN0LmNyZWF0ZS5idXNpbmVzcy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5hY2NvdW50LmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0YXBwcy5ucnMuZ292LmJjLmNhL2JjLWZvc3NpbC1tYW5hZ2VtZW50IiwiaHR0cHM6Ly90ZXN0LmV4YW1pbmVyLWRhc2hib2FyZC5zaG9ydHRlcm1yZW50YWwucmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0Lmp1c3RpY2UuZ292LmJjLmNhL2NzbyIsImh0dHBzOi8vZXdpbGxzLWRldi52cy5nb3YuYmMuY2E6NDQzIiwiaHR0cHM6Ly90ZXN0LmRpcmVjdG9yc2VhcmNoLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly9kZXYuaHViLmNvbm5lY3QuZ292LmJjLmNhIiwiaHR0cHM6Ly9kZXYuanVzdGljZS5nb3YuYmMuY2EvY3NvIiwiaHR0cHM6Ly90ZXN0LmJ1c2luZXNzLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5lZGl0LmJ1c2luZXNzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0LnBsYXRmb3JtLnNob3J0dGVybXJlbnRhbC5yZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwOi8vMTI3LjAuMC4xOjcxMDEiLCJodHRwczovL3Rlc3QuZXhhbWluZXIuc2hvcnR0ZXJtcmVudGFsLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5iY3JlZ2lzdHJ5LmNhIiwiaHR0cHM6Ly9ld2lsbHMtdWF0LnZzLmdvdi5iYy5jYTo0NDMiLCJodHRwczovL3Rlc3RhcHBzLm5ycy5nb3YuYmMuY2EvYmNhcCIsImh0dHBzOi8vZXdpbGxzLWRldi52cy5nb3YuYmMuY2EiLCJodHRwczovL2RvY3VtZW50cy11aS10ZXN0LndlYmFwcCIsImh0dHBzOi8vYmNyZWdpc3RyeS1hY2NvdW50LWRldi0tcHItdGVzdC0zMzc2LTNqM3lsYWRwLndlYi5hcHAiLCJodHRwczovL2V3aWxscy11YXQudnMuZ292LmJjLmNhL2UvZXdpbGxzL3BheW1lbnQtcHJvY2VzcyIsImh0dHBzOi8vdGVzdC5hc3NldHMuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwOi8vZXdpbGxzLXVhdC52cy5nb3YuYmMuY2EvZS9ld2lsbHMvcGF5bWVudC1wcm9jZXNzIiwiaHR0cHM6Ly9iY2FyZXBvcnRzZGV2LmJjYXNzZXNzbWVudC5jYSIsImh0dHBzOi8vc3RhZ2luZy53d3cuZXRheC5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QucGVvcGxlLmJ1c2luZXNzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cDovL2xvY2FsaG9zdDo4MDg4IiwiaHR0cHM6Ly9ld2lsbHMtdWF0LnZzLmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdGFwcHMubnJzLmdvdi5iYy5jYS9pbnQvYmMtZm9zc2lsLW1hbmFnZW1lbnQiLCJodHRwczovL3Rlc3Quc3RyYXRhaG90ZWwuc2hvcnR0ZXJtcmVudGFsLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vYmNyb3N3ZWItdGVzdC5iY2Fzc2Vzc21lbnQuY2E6NTQ1NzkiLCJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJodHRwOi8vbG9jYWxob3N0OjgwODEiLCJodHRwczovL3NlYXJjaC13ZWItdGVzdC5hcHBzLnNpbHZlci5kZXZvcHMuZ292LmJjLmNhIiwiaHR0cHM6Ly9zaG93Y2FzZS1jb25uZWN0LWRldi53ZWIuYXBwIiwiaHR0cHM6Ly90ZXN0Lmhvc3Quc2hvcnR0ZXJtcmVudGFsLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHA6Ly9ld2lsbHMtZGV2LnZzLmdvdi5iYy5jYS9lL2V3aWxscy9wYXltZW50LXByb2Nlc3MiLCJodHRwczovL3Rlc3QuYmNyZWdpc3RyeS5jYS9kaXJlY3RvcnNlYXJjaCIsImh0dHBzOi8vdGVzdC5zZWFyY2guYnVzaW5lc3MuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuaHViLmNvbm5lY3QuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0LmRvY3VtZW50cy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMCIsImh0dHBzOi8vdGVzdC5iY3JlZ2lzdHJ5LmNhL2J1c2luZXNzIiwiaHR0cHM6Ly9ld2lsbHMtZGV2LnZzLmdvdi5iYy5jYS9lL2V3aWxscy9wYXltZW50LXByb2Nlc3MiLCJodHRwczovL3Rlc3QuYnVzaW5lc3MuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuYW5udWFscmVwb3J0LmJ1c2luZXNzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly9lc3JhLWIxODNhNS1kZXYtZnJvbnRlbmQuYXBwcy5zaWx2ZXIuZGV2b3BzLmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdGFwcHMubnJzLmdvdi5iYy5jYS9iY3JocCIsImh0dHBzOi8vbG9jYWhvc3Q6NTAwMSIsImh0dHBzOi8vdGVzdC5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5uYW1lcy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5idXNpbmVzcy1yZWdpc3RyeS1kYXNoYm9hcmQuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3N0YWdpbmcud3d3LmV0YXguZ292LmJjLmNhL2J0cyIsImh0dHBzOi8vdGVzdGFwcHMubnJzLmdvdi5iYy5jYS9pbnQvYmNyaHAiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbInB1YmxpY191c2VyIiwicHByIiwiZWRpdCIsImFjY291bnRfaG9sZGVyIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtYmNyZWdpc3RyeSJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwcm9maWxlIiwiZmlyc3RuYW1lIjoiYW5pc2ggYmF0cmEiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsInJvbGVzIjpbInB1YmxpY191c2VyIiwicHByIiwiZWRpdCIsImFjY291bnRfaG9sZGVyIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtYmNyZWdpc3RyeSJdLCJuYW1lIjoiYW5pc2ggYmF0cmEiLCJpZHBfdXNlcmlkIjoiOTkwQUEzQ0Y2MkMyNEJDNzgxNTJCMjg5OERCMjk0OUQiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJhbmlzaHNlcDMwQGJjZWlkIiwiZ2l2ZW5fbmFtZSI6ImFuaXNoIGJhdHJhIiwiZW1haWwiOiJhbmlzaHJiYzE5MkBnbWFpbC5jb20iLCJsb2dpblNvdXJjZSI6IkJDRUlEIiwidXNlcm5hbWUiOiJhbmlzaHNlcDMwQGJjZWlkIn0.aBxhA_Ifk-cblG2YINqtkdXykhPk2MD_rbseczeJc3MLeHZN3PeuS8u6g7JgcMSMJhsrPKMuNJdgnZ_wH_cNWH7Q5N5W0bO-hpZRMRK_mmMEYEYmYblGXGQjuEmMO_YIw2XGNa9hLJXa2uk1Ey2aPh5q7OzSTTdj-gbbH_-g24xXijO3jFDrXOFC5WKxX5z7I7S3321ASx5gsm5uUB3GnJTPGTwZCX0uUk4aJntSz1mA31Aqtl66uq1TLMB_3a0f2eeO--QpQC20GzRFO76ZhgaqUHcrLlmx4H_ekDPGo9nj01QbY4EZ--l-lnbPHqBITELxXv_na8d7iChLF7Mo1w';   // GovN user token (without "Bearer ")
const IDIR_TOKEN  = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI1MFhzaDlCbVJ6VWJ3Q2lDdnJ3a3hITGI4dEpYNkFFdWRmR3Y0c1NVNURNIn0.eyJleHAiOjE3OTA3ODI1MTIsImlhdCI6MTc5MDc4MDcxMiwiYXV0aF90aW1lIjoxNzkwNzgwMjMzLCJqdGkiOiJvbnJ0cnQ6YWUxZjNiZDktNDM0Yy1mMjZlLWEzOTEtNzcyNGU0ZjA5NzA1IiwiaXNzIjoiaHR0cHM6Ly90ZXN0LmxvZ2lucHJveHkuZ292LmJjLmNhL2F1dGgvcmVhbG1zL2JjcmVnaXN0cnkiLCJhdWQiOlsiZW50aXR5LXNlcnZpY2VzIiwiTmFtZVgtVGVzdCIsInBwci1zZXJ2aWNlcyIsImFjY291bnQtc2VydmljZXMiLCJuYW1lLXJlcXVlc3RzLXdlYiIsInJlYWxtLW1hbmFnZW1lbnQiLCJhY2NvdW50Il0sInN1YiI6IjdiNjUxZjg2LWExZjctNDE2Yi04NGExLTg2YjQ5ZjM1MjQwZSIsInR5cCI6IkJlYXJlciIsImF6cCI6ImNvbm5lY3Qtd2ViIiwic2lkIjoiMlhBQ1Y4YXhGeWZaX3gxd09nc2NKZGZ5IiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHBzOi8vdGVzdC5jcmVhdGUuYnVzaW5lc3MuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuYWNjb3VudC5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdGFwcHMubnJzLmdvdi5iYy5jYS9iYy1mb3NzaWwtbWFuYWdlbWVudCIsImh0dHBzOi8vdGVzdC5leGFtaW5lci1kYXNoYm9hcmQuc2hvcnR0ZXJtcmVudGFsLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5qdXN0aWNlLmdvdi5iYy5jYS9jc28iLCJodHRwczovL2V3aWxscy1kZXYudnMuZ292LmJjLmNhOjQ0MyIsImh0dHBzOi8vdGVzdC5kaXJlY3RvcnNlYXJjaC5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vZGV2Lmh1Yi5jb25uZWN0Lmdvdi5iYy5jYSIsImh0dHBzOi8vZGV2Lmp1c3RpY2UuZ292LmJjLmNhL2NzbyIsImh0dHBzOi8vdGVzdC5idXNpbmVzcy5yZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuZWRpdC5idXNpbmVzcy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5wbGF0Zm9ybS5zaG9ydHRlcm1yZW50YWwucmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cDovLzEyNy4wLjAuMTo3MTAxIiwiaHR0cHM6Ly90ZXN0LmV4YW1pbmVyLnNob3J0dGVybXJlbnRhbC5yZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuYmNyZWdpc3RyeS5jYSIsImh0dHBzOi8vZXdpbGxzLXVhdC52cy5nb3YuYmMuY2E6NDQzIiwiaHR0cHM6Ly90ZXN0YXBwcy5ucnMuZ292LmJjLmNhL2JjYXAiLCJodHRwczovL2V3aWxscy1kZXYudnMuZ292LmJjLmNhIiwiaHR0cHM6Ly9kb2N1bWVudHMtdWktdGVzdC53ZWJhcHAiLCJodHRwczovL2JjcmVnaXN0cnktYWNjb3VudC1kZXYtLXByLXRlc3QtMzM3Ni0zajN5bGFkcC53ZWIuYXBwIiwiaHR0cHM6Ly9ld2lsbHMtdWF0LnZzLmdvdi5iYy5jYS9lL2V3aWxscy9wYXltZW50LXByb2Nlc3MiLCJodHRwczovL3Rlc3QuYXNzZXRzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cDovL2V3aWxscy11YXQudnMuZ292LmJjLmNhL2UvZXdpbGxzL3BheW1lbnQtcHJvY2VzcyIsImh0dHBzOi8vYmNhcmVwb3J0c2Rldi5iY2Fzc2Vzc21lbnQuY2EiLCJodHRwczovL3N0YWdpbmcud3d3LmV0YXguZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0LnBlb3BsZS5idXNpbmVzcy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHA6Ly9sb2NhbGhvc3Q6ODA4OCIsImh0dHBzOi8vZXdpbGxzLXVhdC52cy5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3RhcHBzLm5ycy5nb3YuYmMuY2EvaW50L2JjLWZvc3NpbC1tYW5hZ2VtZW50IiwiaHR0cHM6Ly90ZXN0LnN0cmF0YWhvdGVsLnNob3J0dGVybXJlbnRhbC5yZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL2Jjcm9zd2ViLXRlc3QuYmNhc3Nlc3NtZW50LmNhOjU0NTc5IiwiaHR0cDovL2xvY2FsaG9zdDo4MDgwIiwiaHR0cDovL2xvY2FsaG9zdDo4MDgxIiwiaHR0cHM6Ly9zZWFyY2gtd2ViLXRlc3QuYXBwcy5zaWx2ZXIuZGV2b3BzLmdvdi5iYy5jYSIsImh0dHBzOi8vc2hvd2Nhc2UtY29ubmVjdC1kZXYud2ViLmFwcCIsImh0dHBzOi8vdGVzdC5ob3N0LnNob3J0dGVybXJlbnRhbC5yZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwOi8vZXdpbGxzLWRldi52cy5nb3YuYmMuY2EvZS9ld2lsbHMvcGF5bWVudC1wcm9jZXNzIiwiaHR0cHM6Ly90ZXN0LmJjcmVnaXN0cnkuY2EvZGlyZWN0b3JzZWFyY2giLCJodHRwczovL3Rlc3Quc2VhcmNoLmJ1c2luZXNzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0Lmh1Yi5jb25uZWN0Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5kb2N1bWVudHMuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJodHRwczovL3Rlc3QuYmNyZWdpc3RyeS5jYS9idXNpbmVzcyIsImh0dHBzOi8vZXdpbGxzLWRldi52cy5nb3YuYmMuY2EvZS9ld2lsbHMvcGF5bWVudC1wcm9jZXNzIiwiaHR0cHM6Ly90ZXN0LmJ1c2luZXNzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0LmFubnVhbHJlcG9ydC5idXNpbmVzcy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vZXNyYS1iMTgzYTUtZGV2LWZyb250ZW5kLmFwcHMuc2lsdmVyLmRldm9wcy5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3RhcHBzLm5ycy5nb3YuYmMuY2EvYmNyaHAiLCJodHRwczovL2xvY2Fob3N0OjUwMDEiLCJodHRwczovL3Rlc3QuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QubmFtZXMuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuYnVzaW5lc3MtcmVnaXN0cnktZGFzaGJvYXJkLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly9zdGFnaW5nLnd3dy5ldGF4Lmdvdi5iYy5jYS9idHMiLCJodHRwczovL3Rlc3RhcHBzLm5ycy5nb3YuYmMuY2EvaW50L2JjcmhwIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJtYW5hZ2VfYnVzaW5lc3MiLCJuYW1lc19hcHByb3ZlciIsIm5hbWVzX3ZpZXdlciIsImFkbWluX2VkaXQiLCJmYXNfZWRpdCIsImZhc192aWV3IiwiYWRtaW5fdmlldyIsInZpZXciLCJzZWFyY2giLCJtYW5hZ2VfYWNjb3VudHMiLCJtaHJfc3RhZmYiLCJjcmVhdGVfY3JlZGl0cyIsIm9mZmxpbmVfYWNjZXNzIiwiYmNvbF9zdGFmZl9hZG1pbiIsInN1c3BlbmRfYWNjb3VudHMiLCJ1bWFfYXV0aG9yaXphdGlvbiIsIm1ha2VfcGF5bWVudCIsImZhc19saW5rIiwiZGVmYXVsdC1yb2xlcy1iY3JlZ2lzdHJ5IiwibWhyX3RyYW5zZmVyX3NhbGUiLCJuYW1lc19lZGl0b3IiLCJ2aWV3X2FjY291bnRzIiwiZWRpdCIsIm1ocl9wYXltZW50IiwibWhyX3N0YWZmX2FjdGl2aXRpZXMiLCJmYXNfcmVwb3J0cyIsIm1hbmFnZV9lZnQiLCJmYXNfdHJhbnNhY3Rpb24iLCJzdGFmZiIsIm1ocl9yZWdpc3RlciIsImZhc19zZWFyY2giLCJlZnRfcmVmdW5kX2FwcHJvdmVyIiwiaGVscGRlc2siLCJmYXNfY3JlYXRlIiwiZmFzX3JlZnVuZCIsIm1ocl90cmFuc3BvcnQiLCJtaHJfdHJhbnNmZXJfZGVhdGgiLCJmYXNfdXNlciIsInBwcl9zdGFmZiIsInBwciIsImNyZWF0ZV9hY2NvdW50cyIsIm1ociIsIm1ocl9leGVtcHRpb25fbm9uX3JlcyIsInZpZXdfYWxsX3RyYW5zYWN0aW9ucyIsIm1ocl9leGVtcHRpb25fcmVzIiwibmFtZXNfbWFuYWdlciIsImVmdF9yZWZ1bmQiXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctZXZlbnRzIiwibWFuYWdlLXVzZXJzIiwidmlldy11c2VycyIsInF1ZXJ5LWdyb3VwcyIsInF1ZXJ5LXVzZXJzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgZW1haWwgcHJvZmlsZSIsImZpcnN0bmFtZSI6IkFuaXNoIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJyb2xlcyI6WyJtYW5hZ2VfYnVzaW5lc3MiLCJuYW1lc19hcHByb3ZlciIsIm5hbWVzX3ZpZXdlciIsImFkbWluX2VkaXQiLCJmYXNfZWRpdCIsImZhc192aWV3IiwiYWRtaW5fdmlldyIsInZpZXciLCJzZWFyY2giLCJtYW5hZ2VfYWNjb3VudHMiLCJtaHJfc3RhZmYiLCJjcmVhdGVfY3JlZGl0cyIsIm9mZmxpbmVfYWNjZXNzIiwiYmNvbF9zdGFmZl9hZG1pbiIsInN1c3BlbmRfYWNjb3VudHMiLCJ1bWFfYXV0aG9yaXphdGlvbiIsIm1ha2VfcGF5bWVudCIsImZhc19saW5rIiwiZGVmYXVsdC1yb2xlcy1iY3JlZ2lzdHJ5IiwibWhyX3RyYW5zZmVyX3NhbGUiLCJuYW1lc19lZGl0b3IiLCJ2aWV3X2FjY291bnRzIiwiZWRpdCIsIm1ocl9wYXltZW50IiwibWhyX3N0YWZmX2FjdGl2aXRpZXMiLCJmYXNfcmVwb3J0cyIsIm1hbmFnZV9lZnQiLCJmYXNfdHJhbnNhY3Rpb24iLCJzdGFmZiIsIm1ocl9yZWdpc3RlciIsImZhc19zZWFyY2giLCJlZnRfcmVmdW5kX2FwcHJvdmVyIiwiaGVscGRlc2siLCJmYXNfY3JlYXRlIiwiZmFzX3JlZnVuZCIsIm1ocl90cmFuc3BvcnQiLCJtaHJfdHJhbnNmZXJfZGVhdGgiLCJmYXNfdXNlciIsInBwcl9zdGFmZiIsInBwciIsImNyZWF0ZV9hY2NvdW50cyIsIm1ociIsIm1ocl9leGVtcHRpb25fbm9uX3JlcyIsInZpZXdfYWxsX3RyYW5zYWN0aW9ucyIsIm1ocl9leGVtcHRpb25fcmVzIiwibmFtZXNfbWFuYWdlciIsImVmdF9yZWZ1bmQiXSwibmFtZSI6IkJhdHJhLCBBbmlzaCBDSVRaOkVYIiwiaWRwX3VzZXJpZCI6IjAxMENFNUFBMDE3NjRCQTNBRTBEMEY3RDU0REYyNkFEIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiaWRpclxcYW5iYXRyYSIsImdpdmVuX25hbWUiOiJBbmlzaCIsImZhbWlseV9uYW1lIjoiQmF0cmEiLCJlbWFpbCI6ImFuaXNoLmJhdHJhQGdvdi5iYy5jYSIsImxvZ2luU291cmNlIjoiSURJUiIsImxhc3RuYW1lIjoiQmF0cmEiLCJ1c2VybmFtZSI6ImlkaXJcXGFuYmF0cmEifQ.KXuk6HvONoV4AgY0IhyPwfmIyj7i9CeiNHTDf97UmIZv46b-_RGm0Q83ZmoPCDaJXMpr7EpOs3AX8lB4cGrEV6d5AkjtN3R4gefxO8Y0esazEm99PBCAxDT-LKlxVzJxE9pPXIeEGnHa3pmuIawzStrJE-roew-OyD7GiDxSUf-qfWQAO06pRVp_TiPZvPsrliUgxIHNIh_izTBWmKObP4yEvjbDwVentLSJsRObhjDjw_jeN5DoBN7u-kf5l8_WpfZqIWgKvzj-ILlEltn9lIa33xL_44Zb-P-OY9dSHEB8HPE9AoSyT2uB0BCV_DHm99fP8w1a-W4yBJlJStoupQ';   // optional: verifies the account override is set as STEP says before testing
const GOVN_ACCOUNT_ID = '3179';

const PAY_URL = __ENV.PAY_BASE_URL || ENV.payBaseUrl;
const TOKEN   = BCEID_TOKEN || __ENV.BCEID_TOKEN;
const STAFF   = IDIR_TOKEN  || __ENV.IDIR_TOKEN;
const APIKEY  = __ENV.API_KEY || ENV.apiKey;
const ACCOUNT = __ENV.GOVN_ACCOUNT_ID || GOVN_ACCOUNT_ID;

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
    'setup: BCEID_TOKEN present': () => !!TOKEN,
    'setup: apiKey present':      () => !!APIKEY,
    'setup: payBaseUrl present':  () => !!PAY_URL,
  });
  if (!ok) return;
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
    [`reports/govn-${STEP_NAME}.html`]: htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}