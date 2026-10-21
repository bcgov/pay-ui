import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { htmlReport } from '../libs/k6-reporter.js';
import { textSummary } from '../libs/k6-summary.js';
export { options } from '../config/options.js';
import { ENV } from '../config/env.js';

// PAY-API #35025 — Scenario 1: Staff filings (IDIR, staff role)
// Staff: service fee is ALWAYS 0. Filing / priority / future-effective fees depend on
// configuration and the waiveFees parameter.
//
//   Suite 1  waiveFees=true            → everything 0, waivedFees = configured filing fee
//   Suite 2  no waiveFees (omitted)    → filing fee = configured, service fee 0
//   Suite 3  waiveFees=false           → filing fee = configured, service fee 0
//   Suite 4  priority + futureEffective, with and without waiver
//   Suite 5  NON-STAFF user sends waiveFees=true (exploratory — skipped if no PUBLIC_TOKEN)

// filingFee = configured filing fee. configuredServiceFee is informational: staff must get 0 regardless.
const FILING_CODES = [
  { code: 'OLAARTOQ_A', filingFee: 0    },
  { code: 'OLAARTAQ_A', filingFee: 0    },
  { code: 'OLAARTIQ_A', filingFee: 0,    configuredServiceFee: 1.50 },
  { code: 'OLAARTOQ_T', filingFee: 0    },
  { code: 'OLAARTAQ_T', filingFee: 0    },
  { code: 'OLAARTIQ_T', filingFee: 1,    configuredServiceFee: 1.50 },
  { code: 'OLAARTOQ_N', filingFee: 2    },
  { code: 'OLAARTAQ_N', filingFee: 4    },
  { code: 'OLAARTIQ_N', filingFee: 15,   configuredServiceFee: 1.00 },
  { code: 'OLAARTOQ_H', filingFee: 2    },
  { code: 'OLAARTAQ_H', filingFee: 1.83 },
  { code: 'OLAARTIQ_H', filingFee: 15,   configuredServiceFee: 1.00 },
];

const CORP_TYPE = 'BCA';

// ── Suite 4 config: set these to match what you configure in the Fee Admin portal ──
const PRIORITY_CODE       = 'OLAARTIQ_N';
const PRIORITY_FILING_FEE = 15;
const PRIORITY_FEE        = 0;   // ← set after configuring priority fee in portal
const FUTURE_EFF_FEE      = 0;   // ← set after configuring future effective fee in portal

// ── Credentials: paste values here, or leave empty to use -e flags / config/env.js ──
// Do NOT commit real values.
const IDIR_TOKEN        = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI1MFhzaDlCbVJ6VWJ3Q2lDdnJ3a3hITGI4dEpYNkFFdWRmR3Y0c1NVNURNIn0.eyJleHAiOjE3OTA2MjA3MDUsImlhdCI6MTc5MDYxODkwNSwiYXV0aF90aW1lIjoxNzkwNjE0NzA0LCJqdGkiOiJvbnJ0cnQ6NDQ2NzVhZTUtYzIzMi03MDg1LTVmMTAtYjIwMDUzNzg4MTk3IiwiaXNzIjoiaHR0cHM6Ly90ZXN0LmxvZ2lucHJveHkuZ292LmJjLmNhL2F1dGgvcmVhbG1zL2JjcmVnaXN0cnkiLCJhdWQiOlsiZW50aXR5LXNlcnZpY2VzIiwiTmFtZVgtVGVzdCIsInBwci1zZXJ2aWNlcyIsImFjY291bnQtc2VydmljZXMiLCJuYW1lLXJlcXVlc3RzLXdlYiIsInJlYWxtLW1hbmFnZW1lbnQiLCJhY2NvdW50Il0sInN1YiI6IjdiNjUxZjg2LWExZjctNDE2Yi04NGExLTg2YjQ5ZjM1MjQwZSIsInR5cCI6IkJlYXJlciIsImF6cCI6ImNvbm5lY3Qtd2ViIiwic2lkIjoiQ1FwQVg1cmJBbGpBbFZ1cWlucjVNUHZaIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHBzOi8vdGVzdC5jcmVhdGUuYnVzaW5lc3MuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuYWNjb3VudC5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdGFwcHMubnJzLmdvdi5iYy5jYS9iYy1mb3NzaWwtbWFuYWdlbWVudCIsImh0dHBzOi8vdGVzdC5leGFtaW5lci1kYXNoYm9hcmQuc2hvcnR0ZXJtcmVudGFsLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5qdXN0aWNlLmdvdi5iYy5jYS9jc28iLCJodHRwczovL2V3aWxscy1kZXYudnMuZ292LmJjLmNhOjQ0MyIsImh0dHBzOi8vdGVzdC5kaXJlY3RvcnNlYXJjaC5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vZGV2Lmh1Yi5jb25uZWN0Lmdvdi5iYy5jYSIsImh0dHBzOi8vZGV2Lmp1c3RpY2UuZ292LmJjLmNhL2NzbyIsImh0dHBzOi8vdGVzdC5idXNpbmVzcy5yZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuZWRpdC5idXNpbmVzcy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHA6Ly8xMjcuMC4wLjE6NzEwMSIsImh0dHBzOi8vdGVzdC5wbGF0Zm9ybS5zaG9ydHRlcm1yZW50YWwucmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0LmV4YW1pbmVyLnNob3J0dGVybXJlbnRhbC5yZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuYmNyZWdpc3RyeS5jYSIsImh0dHBzOi8vZXdpbGxzLXVhdC52cy5nb3YuYmMuY2E6NDQzIiwiaHR0cHM6Ly90ZXN0YXBwcy5ucnMuZ292LmJjLmNhL2JjYXAiLCJodHRwczovL2V3aWxscy1kZXYudnMuZ292LmJjLmNhIiwiaHR0cHM6Ly9kb2N1bWVudHMtdWktdGVzdC53ZWJhcHAiLCJodHRwczovL2JjcmVnaXN0cnktYWNjb3VudC1kZXYtLXByLXRlc3QtMzM3Ni0zajN5bGFkcC53ZWIuYXBwIiwiaHR0cHM6Ly9ld2lsbHMtdWF0LnZzLmdvdi5iYy5jYS9lL2V3aWxscy9wYXltZW50LXByb2Nlc3MiLCJodHRwczovL3Rlc3QuYXNzZXRzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cDovL2V3aWxscy11YXQudnMuZ292LmJjLmNhL2UvZXdpbGxzL3BheW1lbnQtcHJvY2VzcyIsImh0dHBzOi8vYmNhcmVwb3J0c2Rldi5iY2Fzc2Vzc21lbnQuY2EiLCJodHRwczovL3N0YWdpbmcud3d3LmV0YXguZ292LmJjLmNhIiwiaHR0cDovL2xvY2FsaG9zdDo4MDg4IiwiaHR0cHM6Ly90ZXN0LnBlb3BsZS5idXNpbmVzcy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vZXdpbGxzLXVhdC52cy5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3RhcHBzLm5ycy5nb3YuYmMuY2EvaW50L2JjLWZvc3NpbC1tYW5hZ2VtZW50IiwiaHR0cHM6Ly90ZXN0LnN0cmF0YWhvdGVsLnNob3J0dGVybXJlbnRhbC5yZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL2Jjcm9zd2ViLXRlc3QuYmNhc3Nlc3NtZW50LmNhOjU0NTc5IiwiaHR0cDovL2xvY2FsaG9zdDo4MDgwIiwiaHR0cDovL2xvY2FsaG9zdDo4MDgxIiwiaHR0cHM6Ly9zZWFyY2gtd2ViLXRlc3QuYXBwcy5zaWx2ZXIuZGV2b3BzLmdvdi5iYy5jYSIsImh0dHBzOi8vc2hvd2Nhc2UtY29ubmVjdC1kZXYud2ViLmFwcCIsImh0dHBzOi8vdGVzdC5ob3N0LnNob3J0dGVybXJlbnRhbC5yZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwOi8vZXdpbGxzLWRldi52cy5nb3YuYmMuY2EvZS9ld2lsbHMvcGF5bWVudC1wcm9jZXNzIiwiaHR0cHM6Ly90ZXN0LmJjcmVnaXN0cnkuY2EvZGlyZWN0b3JzZWFyY2giLCJodHRwczovL3Rlc3Quc2VhcmNoLmJ1c2luZXNzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0Lmh1Yi5jb25uZWN0Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5kb2N1bWVudHMuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJodHRwczovL3Rlc3QuYmNyZWdpc3RyeS5jYS9idXNpbmVzcyIsImh0dHBzOi8vZXdpbGxzLWRldi52cy5nb3YuYmMuY2EvZS9ld2lsbHMvcGF5bWVudC1wcm9jZXNzIiwiaHR0cHM6Ly90ZXN0LmJ1c2luZXNzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0LmFubnVhbHJlcG9ydC5idXNpbmVzcy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vZXNyYS1iMTgzYTUtZGV2LWZyb250ZW5kLmFwcHMuc2lsdmVyLmRldm9wcy5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3RhcHBzLm5ycy5nb3YuYmMuY2EvYmNyaHAiLCJodHRwczovL2xvY2Fob3N0OjUwMDEiLCJodHRwczovL3Rlc3QuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QubmFtZXMuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuYnVzaW5lc3MtcmVnaXN0cnktZGFzaGJvYXJkLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly9zdGFnaW5nLnd3dy5ldGF4Lmdvdi5iYy5jYS9idHMiLCJodHRwczovL3Rlc3RhcHBzLm5ycy5nb3YuYmMuY2EvaW50L2JjcmhwIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJtYW5hZ2VfYnVzaW5lc3MiLCJuYW1lc19hcHByb3ZlciIsIm5hbWVzX3ZpZXdlciIsImFkbWluX2VkaXQiLCJmYXNfZWRpdCIsImZhc192aWV3IiwiYWRtaW5fdmlldyIsInZpZXciLCJzZWFyY2giLCJtYW5hZ2VfYWNjb3VudHMiLCJtaHJfc3RhZmYiLCJjcmVhdGVfY3JlZGl0cyIsIm9mZmxpbmVfYWNjZXNzIiwiYmNvbF9zdGFmZl9hZG1pbiIsInN1c3BlbmRfYWNjb3VudHMiLCJ1bWFfYXV0aG9yaXphdGlvbiIsIm1ha2VfcGF5bWVudCIsImZhc19saW5rIiwiZGVmYXVsdC1yb2xlcy1iY3JlZ2lzdHJ5IiwibWhyX3RyYW5zZmVyX3NhbGUiLCJuYW1lc19lZGl0b3IiLCJ2aWV3X2FjY291bnRzIiwiZWRpdCIsIm1ocl9wYXltZW50IiwibWhyX3N0YWZmX2FjdGl2aXRpZXMiLCJmYXNfcmVwb3J0cyIsIm1hbmFnZV9lZnQiLCJmYXNfdHJhbnNhY3Rpb24iLCJzdGFmZiIsIm1ocl9yZWdpc3RlciIsImZhc19zZWFyY2giLCJlZnRfcmVmdW5kX2FwcHJvdmVyIiwiaGVscGRlc2siLCJmYXNfY3JlYXRlIiwiZmFzX3JlZnVuZCIsIm1ocl90cmFuc3BvcnQiLCJtaHJfdHJhbnNmZXJfZGVhdGgiLCJmYXNfdXNlciIsInBwcl9zdGFmZiIsInBwciIsImNyZWF0ZV9hY2NvdW50cyIsIm1ociIsIm1ocl9leGVtcHRpb25fbm9uX3JlcyIsInZpZXdfYWxsX3RyYW5zYWN0aW9ucyIsIm1ocl9leGVtcHRpb25fcmVzIiwibmFtZXNfbWFuYWdlciIsImVmdF9yZWZ1bmQiXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctZXZlbnRzIiwibWFuYWdlLXVzZXJzIiwidmlldy11c2VycyIsInF1ZXJ5LWdyb3VwcyIsInF1ZXJ5LXVzZXJzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgZW1haWwgcHJvZmlsZSIsImZpcnN0bmFtZSI6IkFuaXNoIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJyb2xlcyI6WyJtYW5hZ2VfYnVzaW5lc3MiLCJuYW1lc19hcHByb3ZlciIsIm5hbWVzX3ZpZXdlciIsImFkbWluX2VkaXQiLCJmYXNfZWRpdCIsImZhc192aWV3IiwiYWRtaW5fdmlldyIsInZpZXciLCJzZWFyY2giLCJtYW5hZ2VfYWNjb3VudHMiLCJtaHJfc3RhZmYiLCJjcmVhdGVfY3JlZGl0cyIsIm9mZmxpbmVfYWNjZXNzIiwiYmNvbF9zdGFmZl9hZG1pbiIsInN1c3BlbmRfYWNjb3VudHMiLCJ1bWFfYXV0aG9yaXphdGlvbiIsIm1ha2VfcGF5bWVudCIsImZhc19saW5rIiwiZGVmYXVsdC1yb2xlcy1iY3JlZ2lzdHJ5IiwibWhyX3RyYW5zZmVyX3NhbGUiLCJuYW1lc19lZGl0b3IiLCJ2aWV3X2FjY291bnRzIiwiZWRpdCIsIm1ocl9wYXltZW50IiwibWhyX3N0YWZmX2FjdGl2aXRpZXMiLCJmYXNfcmVwb3J0cyIsIm1hbmFnZV9lZnQiLCJmYXNfdHJhbnNhY3Rpb24iLCJzdGFmZiIsIm1ocl9yZWdpc3RlciIsImZhc19zZWFyY2giLCJlZnRfcmVmdW5kX2FwcHJvdmVyIiwiaGVscGRlc2siLCJmYXNfY3JlYXRlIiwiZmFzX3JlZnVuZCIsIm1ocl90cmFuc3BvcnQiLCJtaHJfdHJhbnNmZXJfZGVhdGgiLCJmYXNfdXNlciIsInBwcl9zdGFmZiIsInBwciIsImNyZWF0ZV9hY2NvdW50cyIsIm1ociIsIm1ocl9leGVtcHRpb25fbm9uX3JlcyIsInZpZXdfYWxsX3RyYW5zYWN0aW9ucyIsIm1ocl9leGVtcHRpb25fcmVzIiwibmFtZXNfbWFuYWdlciIsImVmdF9yZWZ1bmQiXSwibmFtZSI6IkJhdHJhLCBBbmlzaCBDSVRaOkVYIiwiaWRwX3VzZXJpZCI6IjAxMENFNUFBMDE3NjRCQTNBRTBEMEY3RDU0REYyNkFEIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiaWRpclxcYW5iYXRyYSIsImdpdmVuX25hbWUiOiJBbmlzaCIsImZhbWlseV9uYW1lIjoiQmF0cmEiLCJlbWFpbCI6ImFuaXNoLmJhdHJhQGdvdi5iYy5jYSIsImxvZ2luU291cmNlIjoiSURJUiIsImxhc3RuYW1lIjoiQmF0cmEiLCJ1c2VybmFtZSI6ImlkaXJcXGFuYmF0cmEifQ.YAGBleY1VS5Daoy1ytRxzM6V6gFch-MYfPetk4EGaGZspxlFxwNZwNa54rtWC1SFPRp7erbA3s_V-hFvMt1aVTZtDsx9VgbnpTHGimo28mFc8FJSpuC9FE9uVusHW_ZAEknfIVlNW_RYy93pZ0HTqKRCvtFwTVxCjHfOjWuFaQWe2eKm-DnPjOmjGOVpIrJvxNtoCBJWhhV3ccA6K3ux47Qz8qMF7115h1rXaqxNv3DqOwudYYAq0IdImDNAXhbqWyzy7p46yMpydIrQbNAVXGPZ7qeiFfEMcCQH9__GXNLh9WzPXbsZJDTTpUlZ66JNtF-7X5buWkL863zNRT9mcg';   // staff token (without "Bearer ")
const PUBLIC_TOKEN      = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI1MFhzaDlCbVJ6VWJ3Q2lDdnJ3a3hITGI4dEpYNkFFdWRmR3Y0c1NVNURNIn0.eyJleHAiOjE3OTA2MjEwMDAsImlhdCI6MTc5MDYxOTIwMCwiYXV0aF90aW1lIjoxNzkwNjE5MTg3LCJqdGkiOiJvbnJ0cnQ6MjUwMWMxYjAtMzgwZi0zMDk2LTExNTItMzJiNDQ4ZGRmOTVmIiwiaXNzIjoiaHR0cHM6Ly90ZXN0LmxvZ2lucHJveHkuZ292LmJjLmNhL2F1dGgvcmVhbG1zL2JjcmVnaXN0cnkiLCJhdWQiOlsiZW50aXR5LXNlcnZpY2VzIiwiTmFtZVgtVGVzdCIsInBwci1zZXJ2aWNlcyIsImFjY291bnQtc2VydmljZXMiLCJuYW1lLXJlcXVlc3RzLXdlYiIsImFjY291bnQiXSwic3ViIjoiOGFkYTk1OTUtMzU0ZS00ZGY1LWI0NTMtZDE3MTgzOTllOTM5IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiY29ubmVjdC13ZWIiLCJzaWQiOiI0eDhBdkFZcVVMZnpOYlNuY0MyV3MwWHEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cHM6Ly90ZXN0LmNyZWF0ZS5idXNpbmVzcy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5hY2NvdW50LmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0YXBwcy5ucnMuZ292LmJjLmNhL2JjLWZvc3NpbC1tYW5hZ2VtZW50IiwiaHR0cHM6Ly90ZXN0LmV4YW1pbmVyLWRhc2hib2FyZC5zaG9ydHRlcm1yZW50YWwucmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0Lmp1c3RpY2UuZ292LmJjLmNhL2NzbyIsImh0dHBzOi8vZXdpbGxzLWRldi52cy5nb3YuYmMuY2E6NDQzIiwiaHR0cHM6Ly90ZXN0LmRpcmVjdG9yc2VhcmNoLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly9kZXYuaHViLmNvbm5lY3QuZ292LmJjLmNhIiwiaHR0cHM6Ly9kZXYuanVzdGljZS5nb3YuYmMuY2EvY3NvIiwiaHR0cHM6Ly90ZXN0LmJ1c2luZXNzLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5lZGl0LmJ1c2luZXNzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0LnBsYXRmb3JtLnNob3J0dGVybXJlbnRhbC5yZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwOi8vMTI3LjAuMC4xOjcxMDEiLCJodHRwczovL3Rlc3QuZXhhbWluZXIuc2hvcnR0ZXJtcmVudGFsLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5iY3JlZ2lzdHJ5LmNhIiwiaHR0cHM6Ly9ld2lsbHMtdWF0LnZzLmdvdi5iYy5jYTo0NDMiLCJodHRwczovL3Rlc3RhcHBzLm5ycy5nb3YuYmMuY2EvYmNhcCIsImh0dHBzOi8vZXdpbGxzLWRldi52cy5nb3YuYmMuY2EiLCJodHRwczovL2RvY3VtZW50cy11aS10ZXN0LndlYmFwcCIsImh0dHBzOi8vYmNyZWdpc3RyeS1hY2NvdW50LWRldi0tcHItdGVzdC0zMzc2LTNqM3lsYWRwLndlYi5hcHAiLCJodHRwczovL2V3aWxscy11YXQudnMuZ292LmJjLmNhL2UvZXdpbGxzL3BheW1lbnQtcHJvY2VzcyIsImh0dHBzOi8vdGVzdC5hc3NldHMuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwOi8vZXdpbGxzLXVhdC52cy5nb3YuYmMuY2EvZS9ld2lsbHMvcGF5bWVudC1wcm9jZXNzIiwiaHR0cHM6Ly9iY2FyZXBvcnRzZGV2LmJjYXNzZXNzbWVudC5jYSIsImh0dHBzOi8vc3RhZ2luZy53d3cuZXRheC5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QucGVvcGxlLmJ1c2luZXNzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cDovL2xvY2FsaG9zdDo4MDg4IiwiaHR0cHM6Ly9ld2lsbHMtdWF0LnZzLmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdGFwcHMubnJzLmdvdi5iYy5jYS9pbnQvYmMtZm9zc2lsLW1hbmFnZW1lbnQiLCJodHRwczovL3Rlc3Quc3RyYXRhaG90ZWwuc2hvcnR0ZXJtcmVudGFsLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vYmNyb3N3ZWItdGVzdC5iY2Fzc2Vzc21lbnQuY2E6NTQ1NzkiLCJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJodHRwOi8vbG9jYWxob3N0OjgwODEiLCJodHRwczovL3NlYXJjaC13ZWItdGVzdC5hcHBzLnNpbHZlci5kZXZvcHMuZ292LmJjLmNhIiwiaHR0cHM6Ly9zaG93Y2FzZS1jb25uZWN0LWRldi53ZWIuYXBwIiwiaHR0cHM6Ly90ZXN0Lmhvc3Quc2hvcnR0ZXJtcmVudGFsLnJlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHA6Ly9ld2lsbHMtZGV2LnZzLmdvdi5iYy5jYS9lL2V3aWxscy9wYXltZW50LXByb2Nlc3MiLCJodHRwczovL3Rlc3QuYmNyZWdpc3RyeS5jYS9kaXJlY3RvcnNlYXJjaCIsImh0dHBzOi8vdGVzdC5zZWFyY2guYnVzaW5lc3MuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuaHViLmNvbm5lY3QuZ292LmJjLmNhIiwiaHR0cHM6Ly90ZXN0LmRvY3VtZW50cy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMCIsImh0dHBzOi8vdGVzdC5iY3JlZ2lzdHJ5LmNhL2J1c2luZXNzIiwiaHR0cHM6Ly9ld2lsbHMtZGV2LnZzLmdvdi5iYy5jYS9lL2V3aWxscy9wYXltZW50LXByb2Nlc3MiLCJodHRwczovL3Rlc3QuYnVzaW5lc3MuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3Rlc3QuYW5udWFscmVwb3J0LmJ1c2luZXNzLmJjcmVnaXN0cnkuZ292LmJjLmNhIiwiaHR0cHM6Ly9lc3JhLWIxODNhNS1kZXYtZnJvbnRlbmQuYXBwcy5zaWx2ZXIuZGV2b3BzLmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdGFwcHMubnJzLmdvdi5iYy5jYS9iY3JocCIsImh0dHBzOi8vbG9jYWhvc3Q6NTAwMSIsImh0dHBzOi8vdGVzdC5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5uYW1lcy5iY3JlZ2lzdHJ5Lmdvdi5iYy5jYSIsImh0dHBzOi8vdGVzdC5idXNpbmVzcy1yZWdpc3RyeS1kYXNoYm9hcmQuYmNyZWdpc3RyeS5nb3YuYmMuY2EiLCJodHRwczovL3N0YWdpbmcud3d3LmV0YXguZ292LmJjLmNhL2J0cyIsImh0dHBzOi8vdGVzdGFwcHMubnJzLmdvdi5iYy5jYS9pbnQvYmNyaHAiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbInB1YmxpY191c2VyIiwibWhyX3BheW1lbnQiLCJlZGl0IiwibWhyX3RyYW5zcG9ydCIsIm1ocl90cmFuc2Zlcl9kZWF0aCIsInBwciIsImFjY291bnRfaG9sZGVyIiwibWhyIiwib2ZmbGluZV9hY2Nlc3MiLCJtaHJfZXhlbXB0aW9uX3JlcyIsInVtYV9hdXRob3JpemF0aW9uIiwiZGVmYXVsdC1yb2xlcy1iY3JlZ2lzdHJ5IiwibWhyX3RyYW5zZmVyX3NhbGUiXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgZW1haWwgcHJvZmlsZSIsImZpcnN0bmFtZSI6IkJDUkVHVEVTVCBEZWxwaGlhIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJyb2xlcyI6WyJwdWJsaWNfdXNlciIsIm1ocl9wYXltZW50IiwiZWRpdCIsIm1ocl90cmFuc3BvcnQiLCJtaHJfdHJhbnNmZXJfZGVhdGgiLCJwcHIiLCJhY2NvdW50X2hvbGRlciIsIm1ociIsIm9mZmxpbmVfYWNjZXNzIiwibWhyX2V4ZW1wdGlvbl9yZXMiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtYmNyZWdpc3RyeSIsIm1ocl90cmFuc2Zlcl9zYWxlIl0sIm5hbWUiOiJCQ1JFR1RFU1QgRGVscGhpYSBFSUdIVEVFTiIsImlkcF91c2VyaWQiOiJYNUxFVlZPVUdFTjU0R05WVFZDWUg3TlJFTFFDWVQ0VCIsInByZWZlcnJlZF91c2VybmFtZSI6ImJjc2MveDVsZXZ2b3VnZW41NGdudnR2Y3loN25yZWxxY3l0NHQiLCJnaXZlbl9uYW1lIjoiQkNSRUdURVNUIERlbHBoaWEiLCJmYW1pbHlfbmFtZSI6IkVJR0hURUVOIiwibG9naW5Tb3VyY2UiOiJCQ1NDIiwibGFzdG5hbWUiOiJFSUdIVEVFTiIsInVzZXJuYW1lIjoiYmNzYy94NWxldnZvdWdlbjU0Z252dHZjeWg3bnJlbHFjeXQ0dCJ9.gNL1AY51zeupwTxOxxc43v85jKit2JkqMVtxV-qZzO9oipmudI-5YDc0jp50GCDFCivRTbUqxwmcMYGiI3af3mVx-Br_uG2F07S4YAWcrgXUkF_ih-NcWWXDFv1ba4Wza217P9rKi46FiBJXyAgm-qVTM-PUaAq18znsl6fCfqtRl6zH3EsYTshhYza5a5NmA0pylCgtzMkZFuoZrvjiD04QptnPexSq-D1_958rjDH71gGiTI-CmxYqK_gzfBtdgCR59r9KPUCRHiDRfQKqspTM2qFNme076aXKhaoCYN9ig170xbYOo8dBK5JrKk0JDLRIzRbTlJlAEy_IZ_Mkrg';   // non-staff (BCSC/BCeID) token for Suite 5 — leave empty to skip
const PUBLIC_ACCOUNT_ID = '1230';   // non-staff user's account id for Suite 5
const API_KEY           = '7idNlLcwvjFcQOaAL5y4ZOG1OJEW0M4GFA27pP3iFUlmWwW3';
const ACCOUNT_ID        = '2198';
const BASE_URL          = '';   // optional override; leave empty to use config/env.js (selected by -e ENV=...)

const PAY_URL = __ENV.PAY_BASE_URL || BASE_URL || ENV.payBaseUrl;
const TOKEN   = IDIR_TOKEN || __ENV.IDIR_TOKEN;
const PTOKEN  = PUBLIC_TOKEN || __ENV.PUBLIC_TOKEN;
const PACCT   = PUBLIC_ACCOUNT_ID || __ENV.PUBLIC_ACCOUNT_ID;
const APIKEY  = API_KEY    || __ENV.API_KEY    || ENV.apiKey;
const ACCOUNT = ACCOUNT_ID || __ENV.ACCOUNT_ID || ENV.accountId;

// ── Helpers ─────────────────────────────────────────────────────
// Money-safe comparison. Missing field = fail. eqOrNull allows the API to omit a field that should be 0.
const eq       = (a, e) => typeof a === 'number' && Math.abs(a - e) < 0.001;
const eqOrNull = (a, e) => a == null ? e === 0 : eq(a, e);

function logIfError(label, res) {
  if (res.status < 200 || res.status >= 300) {
    console.error(`${label} → HTTP ${res.status}: ${String(res.body).slice(0, 300)}`);
  }
}

function headers(token, accountId) {
  return {
    'Authorization': `Bearer ${token}`,
    'x-apikey':      APIKEY,
    'Content-Type':  'application/json',
    'Account-Id':    accountId,
  };
}

function safeJson(res) {
  try { return res.json(); } catch (e) { return {}; }
}

// opts: { waive: true|false|undefined, priority: bool, futureEffective: bool }
function getFees(token, accountId, code, opts = {}) {
  const q = [];
  if (opts.waive !== undefined) q.push(`waiveFees=${opts.waive}`);
  if (opts.priority)            q.push('priority=true');
  if (opts.futureEffective)     q.push('futureEffective=true');
  const qs = q.length ? `?${q.join('&')}` : '';
  return http.get(`${PAY_URL}/fees/${CORP_TYPE}/${code}${qs}`,
    { headers: headers(token, accountId), tags: { name: 'GET /fees' } });
}

function postInvoice(token, accountId, code, opts = {}) {
  const ft = { filingTypeCode: code };
  if (opts.waive !== undefined) ft.waiveFees       = opts.waive;
  if (opts.priority)            ft.priority        = true;
  if (opts.futureEffective)     ft.futureEffective = true;
  const payload = JSON.stringify({
    businessInfo: { corpType: CORP_TYPE, businessIdentifier: 'BCA1234' },
    filingInfo:   { filingTypes: [ft] },
  });
  return http.post(`${PAY_URL}/payment-requests`, payload,
    { headers: headers(token, accountId), tags: { name: 'POST /payment-requests' } });
}

function getInvoice(token, accountId, id) {
  return http.get(`${PAY_URL}/payment-requests/${id}`,
    { headers: headers(token, accountId), tags: { name: 'GET /payment-requests/{id}' } });
}

// Runs fees → create invoice → read back, asserting the expected amounts.
// exp: { filing, priority, fe, waived }  — service fee and GST always expected 0 for staff.
function runStaffCase(label, code, opts, exp) {
  const total = exp.filing + (exp.priority || 0) + (exp.fe || 0);

  // 1. Fee calculation
  const feeRes = getFees(TOKEN, ACCOUNT, code, opts);
  logIfError(`${label} GET /fees`, feeRes);
  const fee = safeJson(feeRes);
  check(feeRes, {
    [`${label} fees: HTTP 200`]:                   (r) => r.status === 200,
    [`${label} fees: total = ${total}`]:           () => eq(fee.total, total),
    [`${label} fees: filingFees = ${exp.filing}`]: () => eq(fee.filingFees, exp.filing),
    [`${label} fees: serviceFees = 0`]:            () => eq(fee.serviceFees, 0),
    [`${label} fees: priorityFees = ${exp.priority || 0}`]:      () => eqOrNull(fee.priorityFees, exp.priority || 0),
    [`${label} fees: futureEffectiveFees = ${exp.fe || 0}`]:     () => eqOrNull(fee.futureEffectiveFees, exp.fe || 0),
    [`${label} fees: gst = 0`]:                    () => eqOrNull(fee.tax && fee.tax.gst, 0),
  });

  // 2. Invoice creation
  const postRes = postInvoice(TOKEN, ACCOUNT, code, opts);
  logIfError(`${label} POST /payment-requests`, postRes);
  const inv  = safeJson(postRes);
  const item = (inv.lineItems && inv.lineItems[0]) || {};
  const invChecks = {
    [`${label} invoice: HTTP 201`]:                   (r) => r.status === 201,
    [`${label} invoice: id present`]:                 () => inv.id !== undefined,
    [`${label} invoice: statusCode COMPLETED`]:       () => inv.statusCode === 'COMPLETED',
    [`${label} invoice: total = ${total}`]:           () => eq(inv.total, total),
    [`${label} invoice: serviceFees = 0`]:            () => eq(inv.serviceFees, 0),
    [`${label} invoice: filingFees = ${exp.filing}`]: () => eq(item.filingFees, exp.filing),
    [`${label} invoice: priorityFees = ${exp.priority || 0}`]:  () => eqOrNull(item.priorityFees, exp.priority || 0),
    [`${label} invoice: futureEffectiveFees = ${exp.fe || 0}`]: () => eqOrNull(item.futureEffectiveFees, exp.fe || 0),
    [`${label} invoice: gst = 0`]:                    () => eqOrNull(inv.gst, 0),
    [`${label} invoice: paymentMethod INTERNAL`]:     () => inv.paymentMethod === 'INTERNAL',
  };
  if (exp.waived !== undefined) {
    invChecks[`${label} invoice: waivedFees = ${exp.waived}`] = () => eqOrNull(item.waivedFees, exp.waived);
  }
  check(postRes, invChecks);
  if (!inv.id) return;

  // 3. Read-back
  const getRes = getInvoice(TOKEN, ACCOUNT, inv.id);
  logIfError(`${label} GET /payment-requests/${inv.id}`, getRes);
  const got     = safeJson(getRes);
  const gotItem = (got.lineItems && got.lineItems[0]) || {};
  check(getRes, {
    [`${label} GET: HTTP 200`]:                   (r) => r.status === 200,
    [`${label} GET: total = ${total}`]:           () => eq(got.total, total),
    [`${label} GET: serviceFees = 0`]:            () => eq(got.serviceFees, 0),
    [`${label} GET: filingFees = ${exp.filing}`]: () => eq(gotItem.filingFees, exp.filing),
  });
}

export default function () {
  const ok = check(null, {
    'setup: IDIR_TOKEN present': () => !!TOKEN,
    'setup: apiKey present':     () => !!APIKEY,
    'setup: accountId present':  () => !!ACCOUNT,
    'setup: payBaseUrl present': () => !!PAY_URL,
  });
  if (!ok) return;

  // ── Suite 1: waiveFees=true → all zero ────────────────────────
  group('Suite 1 - waiveFees=true', () => {
    for (const { code, filingFee } of FILING_CODES) {
      runStaffCase(`[S1 ${code}]`, code, { waive: true }, { filing: 0, waived: filingFee });
    }
  });

  // ── Suite 2: waiveFees omitted → configured filing fee, service 0 ──
  group('Suite 2 - waiveFees omitted', () => {
    for (const { code, filingFee } of FILING_CODES) {
      runStaffCase(`[S2 ${code}]`, code, {}, { filing: filingFee });
    }
  });

  // ── Suite 3: waiveFees=false → configured filing fee, service 0 ──
  group('Suite 3 - waiveFees=false', () => {
    for (const { code, filingFee } of FILING_CODES) {
      runStaffCase(`[S3 ${code}]`, code, { waive: false }, { filing: filingFee });
    }
  });

  // ── Suite 4: priority + future effective ──────────────────────
  group('Suite 4 - priority + futureEffective', () => {
    if (PRIORITY_FEE === 0 && FUTURE_EFF_FEE === 0) {
      console.warn('Suite 4: PRIORITY_FEE and FUTURE_EFF_FEE are 0 — configure them in the Fee Admin portal and update the constants for a meaningful test.');
    }
    const flags = { priority: true, futureEffective: true };
    runStaffCase(`[S4 ${PRIORITY_CODE} waive=true]`, PRIORITY_CODE,
      { ...flags, waive: true },  { filing: 0, priority: 0, fe: 0 });
    runStaffCase(`[S4 ${PRIORITY_CODE} waive=false]`, PRIORITY_CODE,
      { ...flags, waive: false }, { filing: PRIORITY_FILING_FEE, priority: PRIORITY_FEE, fe: FUTURE_EFF_FEE });
  });

  // ── Suite 5: non-staff sends waiveFees=true (exploratory) ─────
  // Pass = waiver NOT honoured: either rejected (4xx) or fees still charged.
  group('Suite 5 - non-staff waiveFees=true', () => {
    if (!PTOKEN || !PACCT) {
      console.warn('Suite 5 skipped: set PUBLIC_TOKEN and PUBLIC_ACCOUNT_ID to run it.');
      return;
    }
    const code = 'OLAARTIQ_T';   // filing 1.00 + service 1.50 configured

    const feeRes = getFees(PTOKEN, PACCT, code, { waive: true });
    const fee = safeJson(feeRes);
    console.log(`[S5] GET /fees waiveFees=true → HTTP ${feeRes.status}, total=${fee.total}, filing=${fee.filingFees}, service=${fee.serviceFees}`);
    check(feeRes, {
      '[S5] fees: waiver not honoured for non-staff': (r) =>
        (r.status >= 400 && r.status < 500) || (typeof fee.total === 'number' && fee.total > 0),
    });

    const postRes = postInvoice(PTOKEN, PACCT, code, { waive: true });
    const inv = safeJson(postRes);
    console.log(`[S5] POST /payment-requests waiveFees=true → HTTP ${postRes.status}, total=${inv.total}, service=${inv.serviceFees}, status=${inv.statusCode}, body=${String(postRes.body).slice(0, 200)}`);
    check(postRes, {
      '[S5] invoice: waiver not honoured for non-staff': (r) =>
        (r.status >= 400 && r.status < 500) || (typeof inv.total === 'number' && inv.total > 0),
    });
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}