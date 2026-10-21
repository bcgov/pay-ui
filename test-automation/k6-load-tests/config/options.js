export const options = {
  stages: [
    { duration: '5s', target: 1 },   // ramp up to 1 user over 10s
    // { duration: '20s', target: 1 },   // hold 1 user for 20s
    // { duration: '10s', target: 0 },   // ramp down to 0
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],   // fail if error rate exceeds 1%
    http_req_duration: ['p(95)<15000'], // fail if 95% requests exceed 15s (adjusted for dev env)
  },
};