/**
 * Supabase startup validation
 * Runs once when app initializes to ensure credentials are present
 */

export async function validateSupabaseAtStartup() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const missing = [];
    if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    if (!serviceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

    if (missing.length > 0) {
      const msg = `Supabase credentials missing at startup: ${missing.join(', ')}. Check .env.local`;
      console.error('[STARTUP]', msg);
      throw new Error(msg);
    }

    console.log('[STARTUP] Supabase credentials validated ✓');
    return true;
  } catch (error: any) {
    // In production, this will cause the app to fail to start
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    // In dev, log the warning but allow startup
    console.warn('[STARTUP] Supabase validation warning:', error?.message);
    return false;
  }
}
