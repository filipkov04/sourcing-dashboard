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

  // Invitation System (Task 3.5)
  { name: 'Invitations API (list)', path: '/api/invitations', expectedStatus: [200, 307, 401] },
  { name: 'Invite Token Validate', path: '/api/invitations/invalid-token-test', expectedStatus: [400, 404] },
  { name: 'Invite Accept Page', path: '/invite/test-token', expectedStatus: [200] },
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
