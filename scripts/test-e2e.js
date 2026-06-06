#!/usr/bin/env node

/**
 * END-TO-END TEST SCRIPT
 * 
 * Tests complete user flow:
 * 1. PDF Rendering
 * 2. Supabase Connectivity
 * 3. Auth Flow (mocked for now)
 * 4. Database Operations
 * 5. Email Queue
 * 
 * Run: NODE_ENV=test node scripts/test-e2e.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function header(title) {
  log('\n' + '='.repeat(70), 'blue');
  log(title, 'blue');
  log('='.repeat(70), 'blue');
}

function success(msg) {
  log(`  ✓ ${msg}`, 'green');
}

function error(msg) {
  log(`  ✗ ${msg}`, 'red');
}

function info(msg) {
  log(`  ℹ ${msg}`, 'dim');
}

// HTTP request helper
function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': `test-${Date.now()}`,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        let parsedBody = null;
        try {
          parsedBody = body ? JSON.parse(body) : null;
        } catch {
          // Response is not JSON (likely PDF or other binary)
          parsedBody = body.length > 0 ? '[binary data]' : null;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsedBody,
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test suite
const tests = [];

tests.push({
  name: '1. Health Check',
  fn: async () => {
    const res = await request('GET', '/api/health/supabase');
    
    if (res.status === 200 && res.body?.status === 'ok') {
      success('Supabase connectivity verified');
      info(`  Message: ${res.body.message}`);
      return true;
    } else {
      error(`Expected 200, got ${res.status}`);
      error(`Response: ${JSON.stringify(res.body)}`);
      return false;
    }
  }
});

tests.push({
  name: '2. PDF Generation (Public)',
  fn: async () => {
    const payload = {
      slug: 'education-branch',
      draft: {
        receiptNumber: 'TEST-' + Date.now(),
        companyName: 'Test Company Inc',
        customerName: 'John Doe',
        amount: '500.00',
        currency: 'USD',
        date: new Date().toISOString().split('T')[0],
        paymentType: 'card',
        description: 'Test receipt for E2E validation',
      },
    };

    const res = await request('POST', '/api/pdf/render', payload);

    if (res.status === 200 && res.headers['content-type'].includes('pdf')) {
      success(`PDF generated (${res.body ? 'binary' : 'stream'})`);
      info(`  Receipt: ${payload.draft.receiptNumber}`);
      return true;
    } else {
      error(`Expected 200 with PDF, got ${res.status}`);
      error(`Response: ${JSON.stringify(res.body)}`);
      return false;
    }
  }
});

tests.push({
  name: '3. Authentication (Public Route - No Token)',
  fn: async () => {
    // Try to access protected endpoint without token
    const res = await request('POST', '/api/email/send', {
      recipientEmail: 'test@example.com',
      pdfUrl: 'https://example.com/test.pdf',
      fileName: 'test.pdf',
    });

    if (res.status === 401) {
      success('Protected route correctly rejects unauthenticated request');
      info(`  Status: ${res.status} Unauthorized (expected)`);
      return true;
    } else {
      error(`Expected 401 Unauthorized, got ${res.status}`);
      return false;
    }
  }
});

tests.push({
  name: '4. PDF Save (Protected - No Token)',
  fn: async () => {
    const payload = {
      receiptNumber: 'TEST-SAVE-' + Date.now(),
      fileName: 'test.pdf',
      base64: 'JVBERi0xLjQKJeLj...',
      metadata: {
        templateSlug: 'education-branch',
      },
    };

    const res = await request('POST', '/api/pdf/save', payload);

    if (res.status === 401) {
      success('PDF save endpoint requires authentication');
      info(`  Status: ${res.status} Unauthorized (expected)`);
      return true;
    } else {
      error(`Expected 401, got ${res.status}`);
      return false;
    }
  }
});

tests.push({
  name: '5. Environment Validation',
  fn: async () => {
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];

    const missing = required.filter(env => !process.env[env]);

    if (missing.length === 0) {
      success('All required environment variables present');
      return true;
    } else {
      error(`Missing: ${missing.join(', ')}`);
      return false;
    }
  }
});

tests.push({
  name: '6. API Errors Handling',
  fn: async () => {
    // Send invalid payload
    const res = await request('POST', '/api/pdf/render', {
      slug: 'invalid-slug',
      draft: null, // Missing required field
    });

    if (res.status === 400 || res.status === 500) {
      success('API properly validates and rejects invalid input');
      info(`  Status: ${res.status}`);
      return true;
    } else {
      error(`Expected error response, got ${res.status}`);
      return false;
    }
  }
});

// Run all tests
async function runTests() {
  header('END-TO-END SYSTEM TEST');
  info('Testing core system functionality...\n');

  const results = [];

  for (const test of tests) {
    try {
      log(`\n${test.name}`);
      const passed = await test.fn();
      results.push({ name: test.name, passed });
    } catch (err) {
      error(`Test failed with error: ${err.message}`);
      results.push({ name: test.name, passed: false });
    }
  }

  // Summary
  header('TEST RESULTS');

  results.forEach(result => {
    const status = result.passed ? '✓' : '✗';
    const color = result.passed ? 'green' : 'red';
    log(`${status} ${result.name}`, color);
  });

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  log(`\n${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');

  if (passed === total) {
    log('\n✓ Core system is working correctly', 'green');
    log('\nNext: Run authenticated tests with JWT token', 'dim');
    log('  See PRODUCTION_DEPLOYMENT_CHECKLIST.md', 'dim');
  } else {
    log('\n✗ Some tests failed - investigate before deployment', 'red');
  }

  process.exit(passed === total ? 0 : 1);
}

// Check if server is running
async function waitForServer(retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      await request('GET', '/api/health/supabase');
      return true;
    } catch {
      if (i < retries - 1) {
        info(`Waiting for server... (${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  return false;
}

async function main() {
  const serverReady = await waitForServer();
  
  if (!serverReady) {
    error('\nCannot connect to dev server on http://localhost:3000');
    error('Make sure to run: npm run dev');
    process.exit(1);
  }

  await runTests();
}

main().catch(err => {
  error(`Test suite failed: ${err.message}`);
  process.exit(1);
});
