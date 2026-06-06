import { createClient } from '@supabase/supabase-js';
import { validateSupabaseClient, maskSecret } from './env';

let _supabase: ReturnType<typeof createClient<any, any, any>> | null = null;

function getSupabaseClient() {
  if (!_supabase) {
    const { url, anon } = validateSupabaseClient();
    _supabase = createClient(url, anon);
  }
  return _supabase;
}

export const supabase = new Proxy({} as any, {
  get(_, prop) {
    return (getSupabaseClient() as any)[prop];
  },
  apply(_, thisArg, args) {
    return (getSupabaseClient() as any).apply(thisArg, args);
  },
  construct(_, args) {
    return new (getSupabaseClient() as any)(...args);
  },
});