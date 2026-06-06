import { createClient } from '@supabase/supabase-js';
import { validateSupabaseAdmin } from './env';

let _supabaseAdmin: ReturnType<typeof createClient<any, any, any>> | null = null;

function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const { url, service } = validateSupabaseAdmin();
    _supabaseAdmin = createClient(url, service, {
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
