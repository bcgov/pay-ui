# K6 Load Testing Framework


---

## 📁 Project Structure

```
k6-load-tests/
├── tests/
│   └── fees-test.js       # Test: fetches auth token → calls fees API
├── config/
│   ├── options.js         # Load settings: virtual users, duration, thresholds
│   └── env.js             # Environment config: URLs, credentials, API keys
├── reports/
│   └── summary.html       # Auto-generated HTML report after each run
└── README.md              # You are here
```

---

## ⚙️ Prerequisites

- [K6](https://k6.io/docs/getting-started/installation/) installed on your machine

**Verify installation:**
```bash
k6 version
```

---

## 🚀 How to Run

### Run against default environment (dev):
```bash
k6 run tests/fees-test.js
```

### Run against a specific environment:
```bash
k6 run -e ENV=dev   tests/fees-test.js
k6 run -e ENV=test  tests/fees-test.js
k6 run -e ENV=prod  tests/fees-test.js
```

---

## 🧪 What the Test Does

**File:** `tests/fees-test.js`

Each virtual user runs this flow repeatedly for the test duration:

```
1. POST /token      →  sends client_id + client_secret  →  receives access_token
2. GET  /fees       →  sends Bearer token + x-apikey    →  receives fee data
3. sleep(1s)        →  simulates real user think time
```

**Checks (assertions) on every iteration:**
| Check | What it validates |
|-------|------------------|
| `token: status is 200` | Auth server responded successfully |
| `token: access_token present` | Response actually contains a token |
| `fees: status is 200` | Fees API responded successfully |
| `fees: body not empty` | Fees response has data |

---

## 🔧 Configuration

### Load Settings — `config/options.js`

Controls how many users run and for how long:

```javascript
export const options = {
  stages: [
    { duration: '10s', target: 5 },  // ramp up   → 0 to 5 users over 10s
    { duration: '20s', target: 5 },  // hold       → 5 users for 20s
    { duration: '10s', target: 0 },  // ramp down  → 5 to 0 users over 10s
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],    // ❌ fail test if error rate > 1%
    http_req_duration: ['p(95)<15000'],  // ❌ fail test if 95% requests > 15s
  },
};
```

**To increase load** — change `target` values:
```javascript
{ duration: '10s', target: 20 }  // ramp up to 20 users instead of 5
```

---

### Environment Config — `config/env.js`

All URLs and credentials per environment in one place:

```javascript
const environments = {
  dev:  { tokenUrl: '...', feesUrl: '...', apiKey: '...', clientId: '...', clientSecret: '...' },
  test: { tokenUrl: '...', feesUrl: '...', apiKey: '...', clientId: '...', clientSecret: '...' },
  prod: { tokenUrl: '...', feesUrl: '...', apiKey: '...', clientId: '...', clientSecret: '...' },
};
```

> ⚠️ Never hardcode credentials directly in test files. Always add them here.

---

## 📊 Reports

After every run, an HTML report is auto-generated at:
```
reports/summary.html
```

Open it in any browser. It contains 3 tabs:

| Tab | What's inside |
|-----|--------------|
| **HTTP Metrics** | Response times (avg, min, max, p95), error rates |
| **Test Run Details** | Total iterations, requests, virtual users, data sent/received |
| **Checks & Groups** | Pass/fail count for every assertion |

### Key metrics to look at:

| Metric | What it means | Good value |
|--------|--------------|------------|
| `http_req_duration avg` | Average response time | < 1000ms |
| `http_req_duration p(95)` | 95% of requests under this time | < your threshold |
| `http_req_failed` | % of failed HTTP requests | 0.00% |
| `checks_succeeded` | % of assertions that passed | 100% |
| `iteration_duration` | Time for one full flow (token + fees + sleep) | expected = API time + sleep |

---

## 🧮 Understanding the Numbers

```
Total Requests   = iterations × 2         (1 token call + 1 fees call per iteration)
Total Checks     = iterations × 4         (4 assertions per iteration)
iteration_duration = API response time + sleep time
```

**Example:**
```
81 iterations × 2 calls   = 162 total requests
81 iterations × 4 checks  = 324 total checks
~314ms API time + 1000ms sleep = ~1314ms iteration duration
```

---

## 💤 Think Time

`sleep(1)` at the end of each iteration adds a 1 second pause between loops.

| | Without sleep | With sleep(1) |
|-|--------------|---------------|
| Behaviour | Hammers API as fast as possible | Simulates real user pace |
| Iterations (40s, 5 VUs) | ~495 | ~81 |
| Best for | Stress testing max capacity | Realistic load simulation |

---

## 🌍 Multi-Environment Support

Pass the `ENV` variable at runtime — no code changes needed:

```bash
k6 run -e ENV=test tests/fees-test.js
```

Terminal will confirm:
```
INFO[0000] 🌍 Running against environment: TEST
```

If you pass an invalid environment name:
```
ERRO[0000] ❌ Unknown environment: "staging". Valid options: dev, test, prod
```

---

## ➕ Adding a New Test

1. Create a new file under `tests/` e.g. `tests/payments-test.js`
2. Import shared config:
```javascript
import { ENV }     from '../config/env.js';
export { options } from '../config/options.js';
```
3. Write your API calls using `http.get` / `http.post`
4. Add `check()` assertions
5. Add `sleep(1)` at the end
6. Add `handleSummary` for HTML report
7. Run: `k6 run tests/payments-test.js`

---

## 🏃 Quick Reference

```bash
# Basic run
k6 run tests/fees-test.js

# Run against specific env
k6 run -e ENV=test tests/fees-test.js

# Run with more users (override options inline)
k6 run --vus 10 --duration 30s tests/fees-test.js

# View report
open reports/summary.html        # Mac
start reports/summary.html       # Windows
```

---

## 📦 Tech Stack

| Tool | Purpose |
|------|---------|
| [K6](https://k6.io/) | Load testing engine |
| [k6-reporter](https://github.com/benc-uk/k6-reporter) | HTML report generation |
| [k6-summary](https://jslib.k6.io/) | Terminal summary formatting |

---
