import { createClient } from '@supabase/supabase-js';
import { maskSecret } from './env';

let _supabase: ReturnType<typeof createClient<any, any, any>> | null = null;

function getSupabaseClient() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !anon) {
      console.error('[SupabaseClient] Missing credentials:', {
        url: !!url,
        anon: !!anon,
      });
      throw new Error('Supabase credentials not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    
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