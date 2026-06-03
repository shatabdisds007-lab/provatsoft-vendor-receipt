import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let _supabaseAdmin: ReturnType<typeof createClient<any, any, any>> | null = null;

function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase service role environment variables are required.');
    }
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    });
  }
  return _supabaseAdmin;
}

export const supabaseAdmin = new Proxy({} as any, {
  get(_, prop) {
    return (getSupabaseAdmin() as any)[prop];
  },
  apply(_, thisArg, args) {
    return (getSupabaseAdmin() as any).apply(thisArg, args);
  },
  construct(_, args) {
    return new (getSupabaseAdmin() as any)(...args);
  },
});
