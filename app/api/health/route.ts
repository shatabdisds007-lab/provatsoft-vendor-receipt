import { NextResponse } from 'next/server';
import { checkPlatformHealth } from '@/lib/healthChecker';
import { withApiErrorHandler } from '@/lib/apiRouteWrapper';

async function handler(request: Request) {
  const { services, latency } = await checkPlatformHealth();
  const healthyCount = Object.values(services).filter(Boolean).length;
  const status = healthyCount === 3 ? 'healthy' : healthyCount > 0 ? 'degraded' : 'down';

  return NextResponse.json({
    status,
    services,
    latency,
  });
}

export const GET = withApiErrorHandler(handler, '/api/health');
