// Minimal Supabase client validation
export function validateSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(`Missing Supabase client credentials: ${!url ? 'NEXT_PUBLIC_SUPABASE_URL' : ''} ${!anon ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : ''}`.trim());
  }
  return { url, anon };
}

// Server-only Supabase admin validation
export function validateSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) {
    throw new Error(`Missing Supabase admin credentials: ${!url ? 'NEXT_PUBLIC_SUPABASE_URL' : ''} ${!service ? 'SUPABASE_SERVICE_ROLE_KEY' : ''}`.trim());
  }
  return { url, service };
}

export function maskSecret(s: string | undefined) {
  if (!s) return s;
  if (s.length <= 8) return '******';
  return s.slice(0, 4) + '...' + s.slice(-4);
}
