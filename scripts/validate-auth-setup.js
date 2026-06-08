#!/usr/bin/env node

/**
 * Supabase Authentication Setup Validator
 * 
 * This script validates that your Supabase project is properly configured
 * for authentication and RBAC.
 * 
 * Usage:
 *   node scripts/validate-auth-setup.js
 *   or
 *   npm run validate:auth
 * 
 * Exit codes:
 *   0: All checks passed
 *   1: One or more checks failed
 */

const fs = require('fs');
const path = require('path');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n');
  log(`${'='.repeat(60)}`, 'blue');
  log(title, 'bold');
  log(`${'='.repeat(60)}`, 'blue');
}

function logCheck(name, passed, message = '') {
  const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
  const msg = message ? ` - ${message}` : '';
  console.log(`${status} ${name}${msg}`);
  return passed;
}

// Main validation logic
async function validate() {
  let allPassed = true;
  
  logSection('🔐 Authentication Setup Validator');

  // Check 1: Environment Variables
  logSection('1. Environment Variables');
  const envFile = path.join(process.cwd(), '.env.local');
  const envExists = fs.existsSync(envFile);
  
  if (!logCheck('`.env.local` file exists', envExists)) {
    log('  Create .env.local by copying .env.example and filling in your Supabase credentials', 'yellow');
    allPassed = false;
  } else {
    const envContent = fs.readFileSync(envFile, 'utf-8');
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_JWT_SECRET',
    ];

    for (const varName of requiredVars) {
      const hasVar = envContent.includes(varName);
      const isSet = hasVar && !envContent.match(new RegExp(`${varName}=your_`));
      logCheck(`  ${varName} is set`, isSet);
      if (!isSet) allPassed = false;
    }
  }

  // Check 2: Environment Variable Format
  logSection('2. Environment Variable Format');
  if (envExists) {
    const envContent = fs.readFileSync(envFile, 'utf-8');
    const lines = envContent.split('\n');
    const badFormat = lines.filter(line => 
      line.trim() && 
      !line.trim().startsWith('#') && 
      line.includes('=') &&
      (line.includes('="') || line.includes("='"))
    );

    if (badFormat.length > 0) {
      logCheck('Environment variables have correct format (no quotes)', false, 'Remove quotes from variable values');
      log('  Variables should be: KEY=value (not KEY="value")', 'yellow');
      allPassed = false;
    } else {
      logCheck('Environment variables have correct format', true);
    }
  }

  // Check 3: Node Modules
  logSection('3. Dependencies');
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  
  const hasPackageJson = fs.existsSync(packageJsonPath);
  logCheck('`package.json` exists', hasPackageJson);
  
  const hasNodeModules = fs.existsSync(nodeModulesPath);
  if (!logCheck('`node_modules` exists', hasNodeModules, 'Run: npm install')) {
    allPassed = false;
  }

  // Check 4: Source Files
  logSection('4. Source Files');
  const requiredFiles = [
    'app/login/page.tsx',
    'middleware.ts',
    'src/lib/auth.ts',
    'src/lib/supabaseClient.ts',
    'src/lib/supabaseAdminClient.ts',
    'src/types/auth.ts',
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    const exists = fs.existsSync(filePath);
    logCheck(`  ${file}`, exists);
    if (!exists) allPassed = false;
  }

  // Check 5: Database Scripts
  logSection('5. Database Setup Scripts');
  const dbFiles = [
    'supabase/profiles.sql',
    'supabase/production-schema-complete.sql',
  ];

  for (const file of dbFiles) {
    const filePath = path.join(process.cwd(), file);
    const exists = fs.existsSync(filePath);
    logCheck(`  ${file}`, exists);
    if (!exists) allPassed = false;
  }

  // Check 6: Next.js Build
  logSection('6. Next.js Build');
  const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
  logCheck('`next.config.mjs` exists', fs.existsSync(nextConfigPath));
  
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
  logCheck('`tsconfig.json` exists', fs.existsSync(tsconfigPath));

  // Summary
  logSection('Summary');
  
  if (allPassed) {
    log('✓ All checks passed!', 'green');
    log('', 'green');
    log('Next steps:', 'bold');
    log('1. Run database setup in Supabase SQL Editor');
    log('   - Copy: supabase/profiles.sql');
    log('   - Paste into Supabase SQL Editor and run', 'yellow');
    log('');
    log('2. Create test users in Supabase');
    log('   - Go to Authentication → Users');
    log('   - Create test vendor and admin users', 'yellow');
    log('');
    log('3. Update test users\' roles');
    log('   - In Supabase SQL Editor:');
    log('   - UPDATE profiles SET role = \'admin\' WHERE email = \'admin@example.com\'', 'yellow');
    log('');
    log('4. Start dev server');
    log('   - npm run dev', 'yellow');
    log('   - Visit http://localhost:3000/login', 'yellow');
    log('');
    return 0;
  } else {
    log('✗ Some checks failed', 'red');
    log('', 'red');
    log('Please fix the issues above and run the validator again', 'yellow');
    log('For detailed help, see: AUTH_SETUP_GUIDE.md', 'yellow');
    return 1;
  }
}

// Run validator
validate()
  .then(code => process.exit(code))
  .catch(err => {
    log(`Error: ${err.message}`, 'red');
    process.exit(1);
  });
