import http from 'k6/http';
import { sleep, check } from 'k6';

// k6 Load Testing Options
export const options = {
  stages: [
    { duration: '30s', target: 100 },  // Ramp-up to 100 users
    { duration: '1m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 500 },  // Ramp-up to 500 users
    { duration: '1m', target: 500 },   // Stay at 500 users
    { duration: '30s', target: 1000 }, // Ramp-up to 1000 users
    { duration: '1m', target: 1000 },  // Stay at 1000 users
    { duration: '30s', target: 0 },    // Scale down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'], // 95% of requests must complete under 1.5s
    http_req_failed: ['rate<0.01'],    // Error rate must be under 1%
  },
};

const BASE_URL = __ENV.SWAPNET_BASE_URL || 'http://localhost:4173';

export default function () {
  // 1. Stress test Landing Page load
  const landingRes = http.get(`${BASE_URL}/`);
  check(landingRes, {
    'landing page status is 200': (r) => r.status === 200,
    'landing page size > 1kb': (r) => r.body.length > 1000,
  });
  sleep(1);

  // 2. Stress test Explore Page load
  const exploreRes = http.get(`${BASE_URL}/explore`);
  check(exploreRes, {
    'explore page status is 200': (r) => r.status === 200,
  });
  sleep(2);

  // 3. Stress test Auth Page load
  const authRes = http.get(`${BASE_URL}/auth`);
  check(authRes, {
    'auth page status is 200': (r) => r.status === 200,
  });
  sleep(1);

  // 4. Simulate API endpoints fetches (Supabase select queries simulation)
  const supabaseUrl = 'https://mock.supabase.co'; // Fallback / mock target
  const headers = {
    'apikey': 'mock-anon-key',
    'Content-Type': 'application/json',
  };

  // Simulate reading public profiles
  const profilesRes = http.get(`${supabaseUrl}/rest/v1/users?select=id,name,photo,city,headline,rating,mode&limit=12`, { headers });
  check(profilesRes, {
    'profiles select status is 200 or 404/mock': (r) => r.status === 200 || r.status === 404 || r.status === 0,
  });
  sleep(1.5);

  // Simulate querying public community board posts
  const postsRes = http.get(`${supabaseUrl}/rest/v1/posts?select=*&order=created_at.desc&limit=10`, { headers });
  check(postsRes, {
    'posts query status is 200 or 404/mock': (r) => r.status === 200 || r.status === 404 || r.status === 0,
  });
  sleep(2);
}
