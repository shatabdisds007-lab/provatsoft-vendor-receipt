import { NextRequest, NextResponse } from 'next/server';
import { getServerUserProfile, getServerUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';

/**
 * GET /api/admin/email-logs
 * Retrieve email queue logs (admin only)
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

    let query = supabaseAdmin
      .from('email_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (status && ['pending', 'processing', 'sent', 'failed', 'retrying'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data: emails, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch email logs' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: emails,
      count: emails?.length || 0,
    });
  } catch (err) {
    console.error('Error in GET /api/admin/email-logs:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
