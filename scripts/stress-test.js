#!/usr/bin/env node

/**
 * Stress Test Script for SourceTrack
 * Tests all major routes and API endpoints
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TESTS_RUN = [];
const TESTS_PASSED = [];
const TESTS_FAILED = [];

// Test configuration
const tests = [
  // Public routes
  { name: 'Login Page', path: '/login', expectedStatus: 200 },
  { name: 'Register Page', path: '/register', expectedStatus: 200 },

  // Dashboard routes (will redirect if not authenticated)
  { name: 'Dashboard', path: '/dashboard', expectedStatus: [200, 302, 307] },
  { name: 'Factories List', path: '/factories', expectedStatus: [200, 302, 307] },
  { name: 'Orders List', path: '/orders', expectedStatus: [200, 302, 307] },
  { name: 'Team Page', path: '/team', expectedStatus: [200, 302, 307] },

  // API endpoints (will return 401 or redirect if not authenticated)
  { name: 'Dashboard Stats API', path: '/api/dashboard/stats', expectedStatus: [200, 307, 401] },
  { name: 'Dashboard Trends API', path: '/api/dashboard/trends', expectedStatus: [200, 307, 401] },
  { name: 'Dashboard Status API', path: '/api/dashboard/status-breakdown', expectedStatus: [200, 307, 401] },
  { name: 'Dashboard Factory Stats API', path: '/api/dashboard/factory-stats', expectedStatus: [200, 307, 401] },
  { name: 'Dashboard Activity API', path: '/api/dashboard/recent-activity', expectedStatus: [200, 307, 401] },
  { name: 'Team API', path: '/api/team', expectedStatus: [200, 307, 401] },
  { name: 'Factories API', path: '/api/factories', expectedStatus: [200, 307, 401] },
  { name: 'Orders API', path: '/api/orders', expectedStatus: [200, 307, 401] },

  // Exchange Rates
  { name: 'Exchange Rates API', path: '/api/dashboard/exchange-rates', expectedStatus: [200, 307, 401] },
  { name: 'Factory Locations API', path: '/api/dashboard/factory-locations', expectedStatus: [200, 307, 401] },

  // Product Portfolio
  { name: 'Product Portfolio API', path: '/api/dashboard/product-portfolio', expectedStatus: [200, 307, 401] },

  // Reorder Suggestions
  { name: 'Reorder Suggestions API', path: '/api/dashboard/reorder-suggestions', expectedStatus: [200, 307, 401] },

  // Geocoding APIs
  { name: 'Geocode All API', path: '/api/factories/geocode-all', expectedStatus: [200, 307, 401, 405] },

  // Alert System (Tasks 5.1–5.5)
  { name: 'Alerts Page', path: '/alerts', expectedStatus: [200, 302, 307] },
  { name: 'Alerts List API', path: '/api/alerts', expectedStatus: [200, 307, 401] },
  { name: 'Alerts Unread Count API', path: '/api/alerts/unread-count', expectedStatus: [200, 307, 401] },

  // Invitation System (Task 3.5)
  { name: 'Invitations API (list)', path: '/api/invitations', expectedStatus: [200, 307, 401] },
  { name: 'Invite Token Validate', path: '/api/invitations/invalid-token-test', expectedStatus: [400, 404] },
  { name: 'Invite Accept Page', path: '/invite/test-token', expectedStatus: [200] },

  // Messaging System
  { name: 'Messages Page', path: '/messages', expectedStatus: [200, 302, 307] },
  { name: 'Conversations API', path: '/api/conversations', expectedStatus: [200, 307, 401] },
  { name: 'Conversations Filter (DIRECT)', path: '/api/conversations?type=DIRECT', expectedStatus: [200, 307, 401] },
  { name: 'Conversations Filter (FACTORY)', path: '/api/conversations?type=FACTORY', expectedStatus: [200, 307, 401] },
  { name: 'Conversations Filter (SUPPORT)', path: '/api/conversations?type=SUPPORT', expectedStatus: [200, 307, 401] },
  { name: 'Conversations Search', path: '/api/conversations?search=test', expectedStatus: [200, 307, 401] },
  { name: 'Unread Count API', path: '/api/conversations/unread-count', expectedStatus: [200, 307, 401] },
  { name: 'Global Message Search', path: '/api/messages/search?q=test', expectedStatus: [200, 307, 400, 401] },
  { name: 'Global Search (short query)', path: '/api/messages/search?q=a', expectedStatus: [400, 307, 401] },

  // Presence System
  { name: 'Presence API', path: '/api/presence?userIds=test', expectedStatus: [200, 307, 401] },
  { name: 'Presence Manual Override', path: '/api/presence/manual', expectedStatus: [307, 401, 405] },

  // Profile
  { name: 'Profile Stats API', path: '/api/user/profile-stats', expectedStatus: [200, 307, 401] },
  { name: 'Profile Update API', path: '/api/user/profile', expectedStatus: [307, 401, 405] },

  // Notification Settings
  { name: 'Settings Page', path: '/settings', expectedStatus: [200, 302, 307] },
  { name: 'Notification Prefs API', path: '/api/settings/notifications', expectedStatus: [200, 307, 401] },

  // Carrier Tracking
  { name: 'Shipments In Transit API', path: '/api/dashboard/shipments-in-transit', expectedStatus: [200, 307, 401] },
];

/**
 * Make HTTP request
 */
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;

    http.get(url, { timeout: 5000 }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 200), // First 200 chars
        });
      });
    }).on('error', (err) => {
      reject(err);
    }).on('timeout', () => {
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Run a single test
 */
async function runTest(test) {
  const startTime = Date.now();

  try {
    const result = await makeRequest(test.path);
    const duration = Date.now() - startTime;

    const expectedStatuses = Array.isArray(test.expectedStatus)
      ? test.expectedStatus
      : [test.expectedStatus];

    const passed = expectedStatuses.includes(result.status);

    const testResult = {
      name: test.name,
      path: test.path,
      status: result.status,
      expectedStatus: test.expectedStatus,
      duration: `${duration}ms`,
      passed,
    };

    TESTS_RUN.push(testResult);

    if (passed) {
      TESTS_PASSED.push(testResult);
      console.log(`✅ ${test.name.padEnd(30)} | ${result.status} | ${duration}ms`);
    } else {
      TESTS_FAILED.push(testResult);
      console.log(`❌ ${test.name.padEnd(30)} | ${result.status} (expected ${test.expectedStatus}) | ${duration}ms`);
    }

    return testResult;
  } catch (error) {
    const duration = Date.now() - startTime;

    const testResult = {
      name: test.name,
      path: test.path,
      error: error.message,
      duration: `${duration}ms`,
      passed: false,
    };

    TESTS_RUN.push(testResult);
    TESTS_FAILED.push(testResult);

    console.log(`❌ ${test.name.padEnd(30)} | ERROR: ${error.message}`);

    return testResult;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SOURCETRACK STRESS TEST');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Testing: ${BASE_URL}`);
  console.log(`Total tests: ${tests.length}\n`);
  console.log('───────────────────────────────────────────────────────────');

  const startTime = Date.now();

  // Run tests sequentially
  for (const test of tests) {
    await runTest(test);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const totalDuration = Date.now() - startTime;

  // Print summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Total tests:     ${TESTS_RUN.length}`);
  console.log(`✅ Passed:       ${TESTS_PASSED.length}`);
  console.log(`❌ Failed:       ${TESTS_FAILED.length}`);
  console.log(`⏱️  Total time:   ${totalDuration}ms`);
  console.log(`📊 Success rate: ${Math.round((TESTS_PASSED.length / TESTS_RUN.length) * 100)}%`);

  if (TESTS_FAILED.length > 0) {
    console.log('\n───────────────────────────────────────────────────────────');
    console.log('  FAILED TESTS:');
    console.log('───────────────────────────────────────────────────────────\n');
    TESTS_FAILED.forEach(test => {
      console.log(`  ❌ ${test.name}`);
      console.log(`     Path: ${test.path}`);
      if (test.error) {
        console.log(`     Error: ${test.error}`);
      } else {
        console.log(`     Got: ${test.status}, Expected: ${test.expectedStatus}`);
      }
      console.log('');
    });
  }

  console.log('═══════════════════════════════════════════════════════════\n');

  // Exit with appropriate code
  process.exit(TESTS_FAILED.length > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
