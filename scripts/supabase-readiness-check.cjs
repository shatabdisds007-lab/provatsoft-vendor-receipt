const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
  'SUPABASE_JWT_ISSUER',
];

function isPlaceholder(value) {
  return !value || /your[_-]|your-project|placeholder|example\.com/i.test(value);
}

function mask(value) {
  if (!value) return 'missing';
  if (isPlaceholder(value)) return value;
  return value.length <= 12 ? '***' : `${value.slice(0, 8)}...${value.slice(-4)}`;
}

async function probe(label, fn) {
  try {
    const result = await Promise.race([
      fn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 7000)),
    ]);
    console.log(`${label}\t${result.ok ? 'PASS' : 'FAIL'}\t${result.reason || ''}`);
  } catch (error) {
    console.log(`${label}\tFAIL\t${error.message}`);
  }
}

console.log('ENV_AUDIT');
for (const key of required) {
  const value = process.env[key] || '';
  console.log(`${key}\t${isPlaceholder(value) ? 'PLACEHOLDER' : 'REAL_LOOKING'}\t${mask(value)}`);
}

console.log('READINESS');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (isPlaceholder(url) || isPlaceholder(serviceRoleKey)) {
  console.log('Database Connection\tFAIL\tSupabase URL/service role is placeholder');
  console.log('Storage Connection\tFAIL\tSupabase URL/service role is placeholder');
  console.log('Email Queue\tFAIL\tSupabase URL/service role is placeholder');
  console.log('PDF Save Flow\tFAIL\tRequires DB plus receipts storage bucket');
  console.log('Receipt History\tFAIL\tRequires receipts and receipt_pdfs tables');
  process.exit(0);
}

const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

(async () => {
  await probe('Database Connection', async () => {
    const { error } = await admin.from('subscriptions').select('id').limit(1);
    return { ok: !error, reason: error?.message };
  });

  await probe('Storage Connection', async () => {
    const { error } = await admin.storage.from('receipts').list('', { limit: 1 });
    return { ok: !error, reason: error?.message };
  });

  await probe('Email Queue', async () => {
    const { error } = await admin.from('email_queue').select('id').limit(1);
    return { ok: !error, reason: error?.message };
  });

  await probe('PDF Save Flow', async () => {
    const checks = await Promise.all([
      admin.from('receipts').select('id').limit(1),
      admin.from('receipt_pdfs').select('id').limit(1),
      admin.storage.from('receipts').list('', { limit: 1 }),
    ]);
    const failed = checks.find((check) => check.error);
    return { ok: !failed, reason: failed?.error?.message };
  });

  await probe('Receipt History', async () => {
    const checks = await Promise.all([
      admin.from('receipts').select('id, pdf_id').limit(1),
      admin.from('receipt_pdfs').select('id, pdf_url').limit(1),
    ]);
    const failed = checks.find((check) => check.error);
    return { ok: !failed, reason: failed?.error?.message };
  });
})();
