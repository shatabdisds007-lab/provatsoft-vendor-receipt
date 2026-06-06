import { NextRequest, NextResponse } from 'next/server';
import { getServerUserProfile, getServerUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';

/**
 * GET /api/admin/users
 * Retrieve all user profiles (admin only)
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

    // Fetch all profiles
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: profiles,
      count: profiles?.length || 0,
    });
  } catch (err) {
    console.error('Error in GET /api/admin/users:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/users/:userId
 * Update a user's role (admin only)
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { targetUserId, newRole } = body;

    if (!targetUserId || !newRole) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['admin', 'vendor'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Update profile
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ role: newRole })
      .eq('id', targetUserId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'User role updated successfully',
    });
  } catch (err) {
    console.error('Error in PUT /api/admin/users:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
