import { NextRequest, NextResponse } from 'next/server';
import { isAdminUser } from '@/lib/auth';
import { exportPlatformData } from '@/lib/dataExporter';
import { withApiErrorHandler } from '@/lib/apiRouteWrapper';

async function handler(request: NextRequest) {
  const isAdmin = await isAdminUser(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await exportPlatformData();
  return NextResponse.json({ data });
}

export const GET = withApiErrorHandler(handler, '/api/admin/export-data');
