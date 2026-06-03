import { NextRequest, NextResponse } from 'next/server';
import { getCachedTemplates } from '@/lib/templateCache';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const featured = url.searchParams.get('featured');

    console.log('[api/templates/list] Fetching templates, category filter:', category, 'featured:', featured);
    
    const templates = await getCachedTemplates();
    console.log('[api/templates/list] Got', templates.length, 'templates from cache');
    console.log('[api/templates/list] Template categories:', templates.map((template) => template.category).join(', '));
    
    const filtered = templates.filter((template) => {
      if (category && template.category !== category) return false;
      if (featured === 'true' && !template.featured) return false;
      return true;
    });

    console.log('[api/templates/list] Returning', filtered.length, 'filtered templates');
    return NextResponse.json({ templates: filtered });
  } catch (err: any) {
    console.error('[api/templates/list] Error:', err.message);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
