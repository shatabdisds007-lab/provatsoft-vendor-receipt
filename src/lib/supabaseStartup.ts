/**
 * Optional Supabase startup diagnostic.
 *
 * Keep this non-fatal: Next.js imports shared modules while prerendering static
 * pages, including _not-found, and deployment builds must not crash just
 * because runtime secrets are absent from the build environment.
 */
export async function validateSupabaseAtStartup() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing = [];
  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!serviceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missing.length > 0) {
    console.warn(
      `[STARTUP] Supabase credentials missing: ${missing.join(', ')}. ` +
        'Configure them in Vercel Project Settings for Supabase-backed routes.'
    );
    return false;
  }

  console.log('[STARTUP] Supabase credentials validated');
  return true;
}
