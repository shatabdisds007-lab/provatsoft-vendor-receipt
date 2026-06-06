import { NextRequest, NextResponse } from 'next/server';
import { getServerUserProfile, getServerUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';

/**
 * GET /api/admin/receipts
 * Retrieve all receipts (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getServerUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin
    const userProfile = await getServerUserProfile(request);
    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') || '100';

    let query = supabaseAdmin.from('receipts').select('*').order('created_at', { ascending: false }).limit(parseInt(limit));

    if (status && ['draft', 'finalized'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data: receipts, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: receipts,
      count: receipts?.length || 0,
    });
  } catch (err) {
    console.error('Error in GET /api/admin/receipts:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
