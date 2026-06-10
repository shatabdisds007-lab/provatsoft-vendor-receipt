import { jwtVerify } from 'jose';

function normalizeIssuer(issuer: string): string {
  const trimmed = issuer.replace(/\/$/, '');
  if (trimmed.endsWith('/auth/v1')) {
    return trimmed;
  }
  return `${trimmed}/auth/v1`;
}

function getJwtConfig() {
  const secret = process.env.SUPABASE_JWT_SECRET;
  const rawIssuer = process.env.SUPABASE_JWT_ISSUER || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const issuer = rawIssuer ? normalizeIssuer(rawIssuer) : '';
  const audience = process.env.SUPABASE_JWT_AUD || 'authenticated';

  if (!secret) {
    throw new Error('SUPABASE_JWT_SECRET environment variable is required for JWT validation.');
  }

  if (!issuer) {
    throw new Error('SUPABASE_JWT_ISSUER or NEXT_PUBLIC_SUPABASE_URL environment variable is required for JWT validation.');
  }

  return { secret, issuer, audience };
}

export async function validateJwtToken(token: string) {
  const { secret, issuer, audience } = getJwtConfig();
  const key = new TextEncoder().encode(secret);
  const result = await jwtVerify(token, key, { issuer, audience });
  return result.payload;
}
