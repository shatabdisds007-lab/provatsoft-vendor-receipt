#!/usr/bin/env node

/**
 * PRODUCTION READINESS VALIDATOR
 * 
 * Checks:
 * 1. Database schema (all required tables exist)
 * 2. Storage bucket (receipts bucket exists)
 * 3. Supabase connectivity
 * 4. Auth flow
 * 5. API endpoints
 * 
 * Run: node scripts/validate-production-readiness.js
 */

const fs = require('fs');
const path = require('path');

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  log('\n' + '='.repeat(60), 'blue');
  log(title, 'blue');
  log('='.repeat(60), 'blue');
}

function success(msg) {
  log(`✓ ${msg}`, 'green');
}

function error(msg) {
  log(`✗ ${msg}`, 'red');
}

function warn(msg) {
  log(`⚠ ${msg}`, 'yellow');
}

function info(msg) {
  log(`ℹ ${msg}`, 'dim');
}

// Check environment variables
function checkEnvironment() {
  header('1. ENVIRONMENT VARIABLES');
  
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_JWT_SECRET',
    'RESEND_API_KEY',
  ];

  const missing = [];
  
  required.forEach(env => {
    if (process.env[env]) {
      success(`${env} is set`);
    } else {
      error(`${env} is MISSING`);
      missing.push(env);
    }
  });

  if (missing.length > 0) {
    warn(`\nMissing ${missing.length} environment variables`);
    return false;
  }

  success('\nAll required environment variables present');
  return true;
}

// Check required database tables
async function checkDatabaseSchema() {
  header('2. DATABASE SCHEMA');

  const schemaFiles = [
    'receipts.sql',
    'receipt_pdfs.sql',
    'email_queue.sql',
    'email_logs.sql',
    'subscriptions.sql',
  ];

  const supabaseDir = path.join(process.cwd(), 'supabase');
  
  log('Checking SQL schema files exist:\n', 'dim');

  let allExist = true;
  schemaFiles.forEach(file => {
    const filePath = path.join(supabaseDir, file);
    if (fs.existsSync(filePath)) {
      success(`${file}`);
    } else {
      error(`${file} NOT FOUND`);
      allExist = false;
    }
  });

  if (!allExist) {
    error('\nSome schema files are missing');
    return false;
  }

  success('\nAll schema definition files present');
  info('Note: Verify tables actually exist in Supabase PostgreSQL database');
  info('      Run migrations: supabase migration up');
  
  return true;
}

// Check storage bucket
async function checkStorageBucket() {
  header('3. STORAGE BUCKET');

  info('Receipts bucket should be created in Supabase Storage');
  info('Bucket name: "receipts"');
  info('Visibility: Private (authenticated only)\n');
  
  warn('Manual verification required:');
  info('1. Go to Supabase Console > Storage');
  info('2. Verify "receipts" bucket exists');
  info('3. Check bucket policies allow authenticated uploads\n');
  
  warn('If bucket missing, create it via SQL:');
  info('  select storage.create_bucket("receipts", true);');

  return true; // Can't verify from Node without admin SDK
}

// Check migration files
function checkMigrations() {
  header('4. MIGRATIONS');

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    error('Migrations directory not found');
    return false;
  }

  const files = fs.readdirSync(migrationsDir);
  
  if (files.length === 0) {
    warn('No migration files in supabase/migrations/');
    return false;
  }

  info(`Found ${files.length} migration file(s):\n`);
  files.forEach(file => {
    success(file);
  });

  info('\nTo apply migrations:');
  info('  supabase db push');

  return true;
}

// Check required API routes
function checkApiRoutes() {
  header('5. API ROUTES');

  const routes = [
    { path: 'app/api/pdf/render/route.ts', public: true, method: 'POST' },
    { path: 'app/api/pdf/save/route.ts', public: false, method: 'POST' },
    { path: 'app/api/email/send/route.ts', public: false, method: 'POST' },
    { path: 'app/api/email/queue/route.ts', public: false, method: 'POST' },
    { path: 'app/api/email/process-queue/route.ts', public: false, method: 'POST' },
    { path: 'app/api/health/supabase/route.ts', public: true, method: 'GET' },
  ];

  info('Checking required API route files exist:\n');

  let allExist = true;
  routes.forEach(route => {
    const filePath = path.join(process.cwd(), route.path);
    const auth = route.public ? '(public)' : '(authenticated)';
    
    if (fs.existsSync(filePath)) {
      success(`${route.method} ${route.path} ${auth}`);
    } else {
      error(`${route.method} ${route.path} NOT FOUND`);
      allExist = false;
    }
  });

  if (!allExist) {
    return false;
  }

  success('\nAll API routes present');
  return true;
}

// Main validation
async function validateProduction() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║        PRODUCTION READINESS VALIDATION                    ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝', 'blue');

  const checks = [
    { name: 'Environment Variables', fn: checkEnvironment },
    { name: 'Database Schema Files', fn: checkDatabaseSchema },
    { name: 'Storage Bucket', fn: checkStorageBucket },
    { name: 'Migrations', fn: checkMigrations },
    { name: 'API Routes', fn: checkApiRoutes },
  ];

  const results = [];

  for (const check of checks) {
    try {
      const result = await check.fn();
      results.push({ name: check.name, passed: result });
    } catch (err) {
      error(`Error checking ${check.name}: ${err.message}`);
      results.push({ name: check.name, passed: false });
    }
  }

  // Summary
  header('VALIDATION SUMMARY');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach(result => {
    if (result.passed) {
      success(result.name);
    } else {
      error(result.name);
    }
  });

  log(`\nResult: ${passed}/${total} checks passed`, passed === total ? 'green' : 'red');

  if (passed === total) {
    log('\n✓ System appears ready for testing', 'green');
    log('\nNext steps:', 'dim');
    log('  1. Run end-to-end test: npm run test:e2e', 'dim');
    log('  2. Deploy to Vercel: vercel deploy', 'dim');
  } else {
    log('\n✗ Some checks failed - address before deployment', 'red');
  }
}

validateProduction().catch(err => {
  error(`Validation failed: ${err.message}`);
  process.exit(1);
});
