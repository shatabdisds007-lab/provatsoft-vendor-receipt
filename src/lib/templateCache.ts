import { supabase } from '@/lib/supabaseClient';
import { receiptTemplates } from '@/data/templates';

let cachedTemplates: any[] = [];
let cacheExpiresAt = 0;

export async function getCachedTemplates(): Promise<any[]> {
  const now = Date.now();
  if (cachedTemplates.length > 0 && now < cacheExpiresAt) {
    console.log('[templateCache] Returning cached templates:', cachedTemplates.length);
    return cachedTemplates;
  }

  try {
    console.log('[templateCache] Fetching templates from Supabase...');
    const { data, error } = await supabase.from('templates').select('id,name,slug,category,thumbnail,active,featured,metadata,created_at');
    
    if (error) {
      console.warn('[templateCache] Supabase error:', error.message);
      throw error;
    }

    console.log('[templateCache] Supabase returned:', data?.length || 0, 'templates');
    cachedTemplates = data || [];
    cacheExpiresAt = now + 30_000;
    return cachedTemplates;
  } catch (err: any) {
    console.log('[templateCache] Supabase failed, using static templates fallback');
    console.error('[templateCache] Error details:', err.message);
    
    // Fallback to static templates when Supabase is unavailable
    const staticTemplates = receiptTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.id, // Use id as slug
      category: t.category.charAt(0).toUpperCase() + t.category.slice(1), // Capitalize category
      thumbnail: null,
      active: t.enabled,
      featured: false,
      metadata: { description: t.description },
      created_at: new Date().toISOString(),
    }));

    console.log('[templateCache] Returning', staticTemplates.length, 'static templates');
    cachedTemplates = staticTemplates;
    cacheExpiresAt = now + 30_000;
    return staticTemplates;
  }
}
