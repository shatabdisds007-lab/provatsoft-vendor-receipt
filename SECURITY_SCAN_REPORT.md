# Security Scan Report

Date: 2026-06-03

## Scope

- Scanned repository source excluding generated dependency/build directories: `node_modules/`, `.next/`.
- Checked for required secret names: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `RESEND_API_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `.env.local`, `.env`.
- Verified Git ignore behavior for secret and generated files.
- Ran npm dependency audit after dependency remediation.

## Results

- No hard-coded secret assignments were found in source-controlled candidates.
- `.env.local` exists locally and is ignored by Git.
- `.env` and `.env.*` are ignored, while `.env.example` remains allowed for safe placeholders.
- Source files reference environment variable names where expected for runtime configuration.
- Documentation contains placeholder environment variable names only.
- `npm audit` result: `found 0 vulnerabilities`.

## Ignore Verification

Confirmed ignored by `.gitignore`:

- `.env`
- `.env.local`
- `node_modules/`
- `.next/`
- `tsconfig.tsbuildinfo`
- `debug_*.js`
- `tmp_*`
- `test_*.pdf`
- `test_e2e_output/`

## Notes

- Real production credentials must remain in deployment provider secrets or local ignored env files.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is intentionally public at runtime, but it is still excluded from commits when stored in local env files.
