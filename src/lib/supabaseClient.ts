import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let _supabase: ReturnType<typeof createClient<any, any, any>> | null = null;

function getSupabaseClient() {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase environment variables are required.');
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
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