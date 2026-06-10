import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';

/**
 * Development-only helper to confirm a user's email without waiting for the confirmation link.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { userId, email } = (await request.json()) as { userId?: string; email?: string };
    let targetUserId = userId;

    if (!targetUserId && email) {
      const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (listError) {
        return NextResponse.json({ error: listError.message }, { status: 500 });
      }
      targetUserId = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())?.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'userId or email is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
      email_confirm: true,
    });

    if (error) {
      console.error('[dev-confirm] Failed to confirm user:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to confirm user';
    console.error('[dev-confirm] Unexpected error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
