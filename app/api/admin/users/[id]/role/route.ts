/**
 * PHASE 9: ROLE MANAGEMENT ENDPOINT
 * PATCH /api/admin/users/[id]/role
 *
 * Admin-only endpoint to change user roles
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, ForbiddenError, UnauthorizedError } from '@/lib/auth/requireRole';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteParams): Promise<NextResponse> {
  try {
    // Verify requester is admin
    const adminProfile = await requireAdmin(request);

    const { id: targetUserId } = await context.params;
    const body = await request.json();
    const { role } = body;

    // Validate role
    if (!role || !['vendor', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "vendor" or "admin"' },
        { status: 400 }
      );
    }

    // Prevent self-demotion (optional but recommended)
    if (targetUserId === adminProfile.id && role !== 'admin') {
      return NextResponse.json(
        { error: 'Cannot remove admin role from yourself' },
        { status: 400 }
      );
    }

    // Update user role in profiles table
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', targetUserId)
      .select()
      .single();

    if (error) {
      console.error('[PATCH /api/admin/users/[id]/role] Error:', error);
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }

    // Audit log (optional)
    console.log(
      `[AUDIT] Admin ${adminProfile.email} changed role of ${data.email} to ${role}`
    );

    return NextResponse.json({
      success: true,
      message: `User role updated to "${role}"`,
      data: {
        id: data.id,
        email: data.email,
        role: data.role,
      },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.error('[PATCH /api/admin/users/[id]/role] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
