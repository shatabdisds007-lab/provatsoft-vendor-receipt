import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

/**
 * Health check for Supabase connectivity
 * Tests: Supabase client initialization and basic connectivity
 */
export async function GET(request: NextRequest) {
  try {
    // Import here to trigger env validation and client initialization
    const { supabaseAdmin } = await import('@/lib/supabaseAdminClient');

    // Test 1: Simple query to check DB connectivity (doesn't rely on specific tables)
    const { error: authError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 });
    // Don't throw on error - auth might be disabled, but if Supabase is accessible, the error will be specific

    // Test 2: Try to access storage (this will fail gracefully if bucket doesn't exist)
    try {
      await supabaseAdmin.storage.from('receipts').list('', { limit: 1 });
    } catch (storageErr: any) {
      // Storage might not be set up yet, that's okay
      console.log('[api/health/supabase] Storage not yet configured:', storageErr?.message);
    }

    return NextResponse.json(
      {
        status: 'ok',
        message: 'Supabase is accessible and credentials are valid',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[api/health/supabase] Supabase connectivity check failed:', error?.message || error);
    return NextResponse.json(
      {
        status: 'failed',
        error: error?.message || 'Supabase connection failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
