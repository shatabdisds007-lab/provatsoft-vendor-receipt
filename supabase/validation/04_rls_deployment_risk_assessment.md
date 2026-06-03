-- File: 04_rls_deployment_risk_assessment.md
-- Purpose: Comprehensive risk assessment for RLS deployment to staging/production.

# RLS Deployment Risk Assessment Report

**Migration Version**: 2026-06-02_rls_vendor_tables.sql  
**Prepared Date**: [TODAY]  
**Environment Target**: Staging (first), then Production  
**Risk Level**: MEDIUM (manageable with proper testing and rollback)  

---

## Executive Summary

This report identifies potential risks associated with deploying Row-Level Security (RLS) policies to 6 core tables in the Supabase PostgreSQL database. The RLS implementation enforces vendor multi-tenancy and admin access controls, which is a **critical security feature** but introduces operational complexity.

**Key Findings**:
- **9 identified risks** (2 critical, 4 high, 3 medium)
- **5 remediation strategies** across data, deployment, and monitoring
- **Estimated deployment time**: 1-2 hours (including validation and testing)
- **Rollback complexity**: Low (policies can be dropped quickly)
- **Production readiness**: Conditional (requires staging validation first)

---

## Risk Summary Matrix

| Risk ID | Risk Category | Severity | Likelihood | Impact | Mitigation |
|---------|---------------|----------|------------|--------|-----------|
| R1 | Data Quality | CRITICAL | High | Migration Failure | Validation queries (01_data_validation_queries.sql) |
| R2 | Admin Auth | CRITICAL | Medium | Complete App Lockout | Verify admin JWT claims before deployment |
| R3 | Query Performance | HIGH | Medium | 10-50ms latency increase | Index optimization; monitor slow queries |
| R4 | Lock Contention | HIGH | Medium | Brief read/write stalls | Deploy during low-traffic window |
| R5 | Application Code | HIGH | Low | Unexpected permission errors | Run full integration test suite |
| R6 | Cross-Table FK | HIGH | Low | Orphaned record violations | RLS policies validate FK relationships |
| R7 | Data Migration | MEDIUM | Low | Legacy data inaccessible | Remediate during pre-deployment validation |
| R8 | JWT Token Validation | MEDIUM | Medium | Silent auth failures | Enhanced logging on token validation |
| R9 | Monitoring Blindness | MEDIUM | Medium | Undetected RLS failures | Set up RLS-specific error alerts |

---

## Detailed Risk Analysis

### CRITICAL RISKS

#### Risk R1: Data Quality Issues - Missing Ownership Fields

**Description**: If existing data has NULL vendor_id or user_id values, RLS policies will silently hide those records or block INSERTs.

**Evidence**:
- RLS policies check: `vendor_id::text = auth.uid()`
- If vendor_id = NULL, this predicate is UNKNOWN (treated as false)
- Records will become inaccessible even to admins (unless admin bypass is working)

**Scenarios**:
1. **Legacy email_logs with NULL vendor_id**: If email logs were created before vendor_id tracking, they will be invisible after RLS
2. **Orphaned receipt_pdfs with NULL receipt_id**: Policies check if receipt ownership matches; NULL breaks the check
3. **Duplicate receipt_number across vendors**: If unique constraint is missing, one vendor may see another's receipt by accident

**Impact**:
- Data loss appearance (though data still exists, just inaccessible)
- Application crashes if code assumes data is accessible
- RLS audit failures during verification testing

**Likelihood**: HIGH (depends on data migration history)

**Mitigation**:
1. **Pre-Deployment**: Run all queries from `01_data_validation_queries.sql` and FIX any issues
   - For NULL vendor_id: assign to known user or DELETE
   - For NULL receipt_id: DELETE orphaned PDFs
   - For duplicates: rename receipt_number with vendor prefix
2. **Query**: Check all 6 tables for NULL ownership fields
3. **Action**: Remediate in staging first, never go to production without 0 validation errors

---

#### Risk R2: Admin Authentication Bypass Broken

**Description**: Admin policies rely on JWT claims (`role = 'admin'`) being set correctly. If broken, admins can't access any data.

**Evidence**:
- Admin policy: `CREATE POLICY ... USING ( (current_setting('request.jwt.claims'::text)::jsonb->>'role') = 'admin' )`
- If JWT token doesn't include `role` claim → expression evaluates to false
- Admin can't bypass RLS and gets locked out

**Scenarios**:
1. **Supabase Auth configuration mismatch**: App generates JWT without role claim
2. **Admin user missing JWT configuration**: User metadata doesn't include role
3. **Token caching issue**: Old JWT token without role claim being reused
4. **Service role key used for app auth**: Service role key doesn't go through RLS, only user auth does

**Impact**:
- Complete application lockout for admin users
- Cannot access any data (receipts, PDFs, logs)
- Cannot run migrations or admin operations
- Business-critical operations blocked

**Likelihood**: MEDIUM (requires improper JWT configuration)

**Mitigation**:
1. **Pre-Deployment**: 
   - Verify JWT claims in Supabase JWT Generator or via `SELECT current_setting('request.jwt.claims'::text)`
   - Confirm admin users have `role = 'admin'` in JWT payload
   - Document JWT generation logic
2. **Deployment Testing**: 
   - Test admin token explicitly against RLS queries (Test 1.3 in verification queries)
   - Try SELECT, INSERT, UPDATE, DELETE as admin
3. **Rollback Readiness**: 
   - If admin lockout occurs, immediately DROP policies
   - Restore admin access via `supabaseAdmin` client (service role key always bypasses RLS)

---

### HIGH RISKS

#### Risk R3: Query Performance Degradation

**Description**: RLS policies add JOINs and predicates to every query, potentially slowing down responses.

**Evidence**:
- **receipt_pdfs policies**: Check `SELECT r.vendor_id FROM receipts r WHERE r.id = <receipt_id>`
- This JOIN happens on EVERY row returned from receipt_pdfs queries
- Large result sets (1000s of PDFs) may see cumulative latency

**Example Overhead**:
```sql
-- Without RLS: Direct SELECT
SELECT * FROM receipt_pdfs WHERE vendor_id = 'vendor-a';  -- ~1ms

-- With RLS: Policy adds predicate
SELECT * FROM receipt_pdfs WHERE vendor_id = 'vendor-a' 
AND (receipts.vendor_id = auth.uid());  -- ~5-10ms (JOIN + predicate)
```

**Scenarios**:
1. **Large receipt_pdfs queries**: Get all PDFs for a vendor (1000+ records)
2. **Email queue processing**: Process 500+ pending emails in batch
3. **Admin dashboards**: Fetch all receipts across all vendors (full table scan + RLS checks)

**Impact**:
- User-facing endpoints may see 20-50ms slowdown
- Email queue processing takes longer (affects delivery SLA)
- Admin dashboards may timeout on large datasets
- N+1 query problem: each JOIN adds latency

**Likelihood**: MEDIUM (depends on data volume and query patterns)

**Mitigation**:
1. **Index Optimization**: Add indexes on foreign key columns before RLS
   ```sql
   CREATE INDEX IF NOT EXISTS idx_receipt_pdfs_receipt_id ON receipt_pdfs(receipt_id);
   CREATE INDEX IF NOT EXISTS idx_email_logs_receipt_id ON email_logs(receipt_id);
   ```
2. **Performance Testing**: 
   - Benchmark key queries pre- and post-RLS
   - Monitor Supabase Logs > Slow Queries for > 100ms queries
3. **Query Optimization**: Rewrite app queries to avoid N+1 patterns
4. **Caching**: Cache frequently accessed data (templates, subscriptions) to reduce RLS overhead

---

#### Risk R4: Lock Contention During Migration

**Description**: Enabling RLS on large tables may lock table briefly, blocking concurrent writes.

**Evidence**:
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` acquires exclusive lock
- During lock, all INSERT/UPDATE/DELETE operations queue and block
- For large tables (email_logs, email_queue), this may cause 30-60 second stall

**Scenarios**:
1. **email_logs table**: If millions of rows, `ALTER TABLE ... ENABLE RLS` may lock for 30+ seconds
2. **email_queue with pending entries**: Queue processing blocked during migration
3. **Concurrent API requests**: Requests to `/api/receipts` queue behind the lock

**Impact**:
- API timeouts during migration window (30-60s blocking period)
- Email queue processing pauses (delayed email delivery)
- User-facing operations blocked briefly
- May trigger cascade failures if code retries aggressively

**Likelihood**: MEDIUM (depends on table size and server load)

**Mitigation**:
1. **Maintenance Window**: Deploy during low-traffic period (2-4 AM in user timezone)
2. **Pre-Notification**: Warn users 24 hours in advance
3. **Lock Monitoring**: Monitor table locks during migration
4. **Staged Deployment**: Apply migrations table-by-table (not all at once)
   - Suggested order: rate_limits → system_error_logs → email_queue → email_logs → receipt_pdfs → receipts
5. **Rollback Speed**: Keep rollback time < 5 min (just DROP policies)

---

#### Risk R5: Application Code Incompatibilities

**Description**: Existing app code may not properly handle RLS permission denied errors.

**Evidence**:
- If app code tries to write cross-vendor data (e.g., `INSERT with vendor_id != auth.uid()`), RLS silently blocks it
- App expects 1 row inserted, gets 0 rows (permission denied)
- Error handling code may not recognize permission denied as distinct error

**Scenarios**:
1. **Email service**: Tries to log email for wrong vendor → fails silently
2. **Admin bulk operations**: Tries to update records for all vendors → partial updates
3. **PDF linking**: Tries to assign PDF to wrong receipt → fails without error feedback

**Impact**:
- Silent failures (app thinks operation succeeded, but didn't)
- Data inconsistency (partial writes)
- User confusion (receipts sent but marked as pending)
- Difficult to debug (need to check Supabase error logs)

**Likelihood**: LOW (if code already enforces ownership checks)

**Mitigation**:
1. **Code Audit**: Review all API routes for explicit vendor_id checks
   - Files to review: `app/api/**`, `src/services/**`, `src/lib/**`
   - Ensure code sets vendor_id from auth context, not request body
2. **Integration Testing**: Run full test suite against staging with RLS
   - Test data isolation (vendor A can't see vendor B data)
   - Test admin access (admin can see all data)
   - Test error cases (permission denied scenarios)
3. **Error Handling**: Catch and log permission denied errors specifically
   - Add middleware to log RLS violations
   - Alert on permission denied errors in production

---

#### Risk R6: Cross-Table Foreign Key Validation

**Description**: Policies check ownership across tables (e.g., receipt_pdfs checks receipts.vendor_id). If relationships are broken, RLS may block valid operations.

**Evidence**:
- receipt_pdfs policy: `SELECT r.vendor_id FROM receipts r WHERE r.id = <receipt_id>`
- If receipt_id doesn't exist in receipts table, policy returns no rows → access denied
- This is intentional (prevents orphaned PDFs), but strict

**Scenarios**:
1. **Orphaned receipt_pdfs**: PDF exists but receipt was deleted → PDF becomes inaccessible
2. **Concurrent deletion**: Receipt deleted while PDF is being queried → permission denied error
3. **Data migration**: If data was loaded out-of-order, FKs may be broken

**Impact**:
- Orphaned data becomes inaccessible (data loss appearance)
- Orphaned records cannot be cleaned up (permission denied on DELETE)
- RLS verification tests may fail if test data has broken FKs

**Likelihood**: LOW (if FK constraints are enforced in schema)

**Mitigation**:
1. **Data Validation**: Run queries from `01_data_validation_queries.sql` to find orphaned records
   - Query 2.3 checks receipt_pdfs with invalid receipt_id
   - Delete orphaned records before deploying RLS
2. **FK Constraints**: Ensure database schema has FK constraints with CASCADE delete
   - Current schema should have: `receipt_pdfs.receipt_id` FK to `receipts.id` with ON DELETE CASCADE
3. **Post-Migration**: Monitor for orphaned records and clean up

---

### MEDIUM RISKS

#### Risk R7: Legacy Data Migration

**Description**: Existing data may have inconsistent vendor_id assignments or missing values.

**Evidence**:
- If data was migrated from old system, vendor_id may not be set
- Bulk-loaded data might have NULL values that were acceptable before RLS

**Scenarios**:
1. **Pre-launch data**: Test data created before vendor_id tracking existed
2. **Manual DB updates**: DBA updates bypassed vendor_id constraints
3. **External data imports**: Third-party data doesn't have vendor_id

**Impact**:
- Records become inaccessible after RLS (silently hidden)
- Vendor cannot access their own "legacy" data
- Support team cannot help (data is locked by RLS)
- May need to disable RLS to migrate data, then re-enable

**Likelihood**: LOW (if data schema is already consistent)

**Mitigation**:
1. **Pre-Deployment Audit**: Run validation queries (01_data_validation_queries.sql)
2. **Data Cleanup**: Assign NULL vendor_ids to appropriate users
3. **Bulk Update**: If needed, use UPDATE statements to fix data
4. **Documentation**: Document which data was migrated and how ownership was assigned

---

#### Risk R8: JWT Token Validation Issues

**Description**: If JWT token validation is broken in app, auth context won't be set correctly in RLS policies.

**Evidence**:
- RLS policies rely on `current_setting('request.jwt.claims'::text)` being set by Supabase
- If app doesn't send valid JWT to Supabase client, auth context is empty
- RLS predicates may get unexpected NULL values

**Scenarios**:
1. **Expired JWT**: App uses old cached JWT token
2. **Invalid signature**: JWT token tampered with
3. **Missing audience claim**: JWT missing required `aud` claim
4. **Silent token failure**: App doesn't validate JWT before passing to Supabase

**Impact**:
- RLS predicates evaluate to false (access denied)
- Users get permission denied errors even though they own the data
- Silent failures (app thinks user is authenticated, RLS disagrees)

**Likelihood**: MEDIUM (depends on JWT validation in app)

**Mitigation**:
1. **Token Validation**: Review JWT validation in `src/lib/auth.ts`
   - Verify `validateJwtToken()` checks signature, expiration, audience
   - Confirm app passes valid token to Supabase client
2. **Logging**: Add debug logging around JWT claims setting
3. **Testing**: Test with expired, invalid, and missing JWT tokens
4. **Monitoring**: Alert on JWT validation failures in production

---

#### Risk R9: Monitoring and Observability Blindness

**Description**: May not have visibility into RLS-related errors until users report issues.

**Evidence**:
- Permission denied errors are silently caught by Supabase client
- No built-in alerting for RLS violations in default setup
- Admin dashboard may not show RLS-specific metrics

**Scenarios**:
1. **Silent failures**: Operation fails due to RLS, app logs "OK" response
2. **User confusion**: User can't see data they own, support has no error context
3. **Admin unaware**: Admin doesn't know RLS policies are blocking operations
4. **Delayed detection**: Issue goes unnoticed for hours or days

**Impact**:
- Difficult to debug RLS issues (no error context)
- User support tickets without actionable info
- RLS problems cascade before team is aware
- Post-mortem is difficult (insufficient logs)

**Likelihood**: MEDIUM (depends on logging setup)

**Mitigation**:
1. **Error Logging**: Enhanced error logging for permission denied scenarios
   - Log all 403 Forbidden responses with RLS context
   - Log JWT claims and user context
2. **Monitoring Dashboard**: Create dashboard to track RLS violations
   - Query: `SELECT error_type, COUNT(*) FROM system_error_logs WHERE error_type LIKE '%permission%' GROUP BY error_type`
   - Alert if permission denied errors spike > 5/min
3. **Alerting**: Set up alerts for:
   - Permission denied errors
   - Admin token validation failures
   - RLS query performance degradation (queries > 100ms)
4. **Testing**: Regular smoke tests to verify RLS is working (daily)

---

## Migration Order & Sequencing

**Recommended deployment order** (to minimize lock contention):

1. **rate_limits** (smallest table) → minimal lock time
2. **system_error_logs** → no FK dependencies
3. **email_queue** → before email_logs (FK dependency)
4. **email_logs** → before receipts (FK dependency)
5. **receipt_pdfs** → before receipts (FK dependency)
6. **receipts** (largest table) → last (most lock impact)

**Rollback order** (reverse order):
- Drop policies for receipts first (releases locks fastest)
- Then drop for smaller tables

---

## Data Preparation Checklist

Before deploying migrations, ensure:

- [ ] **Run all validation queries** from `01_data_validation_queries.sql` in staging
- [ ] **Zero orphaned records** (all queries return 0 rows)
- [ ] **All vendor_id fields populated** (no NULLs in receipt tables)
- [ ] **All user_id fields populated** (no NULLs in queue/limits tables)
- [ ] **Duplicate receipt_numbers fixed** (unique constraint enforced)
- [ ] **Invalid status values fixed** (only 'draft' or 'finalized')
- [ ] **Foreign keys are valid** (all receipt_id and pdf_id references exist)
- [ ] **Backup created** (database backup from Supabase)
- [ ] **Backup tested** (confirm restore works)

---

## Deployment Recommendations

### Staging Deployment

1. **Prerequisites**:
   - Complete data validation (see above checklist)
   - Backup staging database
   - Schedule 2-hour maintenance window

2. **Execution**:
   - Deploy migrations table-by-table (use suggested order above)
   - Run verification tests after each table's RLS is enabled
   - If any test fails, immediately roll back that table

3. **Post-Deployment**:
   - Run full integration test suite
   - Smoke test all API endpoints
   - Monitor logs for RLS errors (24 hours)
   - Document all results and any issues

4. **Sign-Off**:
   - Require explicit sign-off from platform lead + security team
   - Document any deviations from checklist
   - Archive test results and logs

### Production Deployment

1. **Prerequisites**:
   - Staging deployment completed and verified for 48+ hours
   - No RLS-related errors in staging logs
   - All verification tests passed
   - Full integration test suite passed

2. **Additional Steps**:
   - Notify all vendors 24 hours in advance
   - Have rollback procedure ready (estimated 5 min to complete)
   - Have on-call support team ready during deployment
   - Deploy during lowest-traffic period

3. **Monitoring**:
   - Monitor error logs in real-time during deployment
   - Have alerting set up for RLS violations
   - Check health metrics (latency, error rate) every 5 min for 1 hour

---

## Rollback Procedure

If RLS deployment causes critical issues:

1. **Decision Trigger**: App can't serve 95% of requests due to permission denied errors
2. **Decision Time**: < 30 minutes to decide
3. **Rollback Steps**:
   - Stop app (deploy older version or kill servers)
   - Drop all RLS policies (run DOWN section from migration)
   - Disable RLS on all tables
   - Restart app with service role key (bypasses RLS)
4. **Estimated Time**: 5-10 minutes total
5. **Validation**: Confirm app is serving requests normally
6. **Investigation**: Post-mortem on what went wrong

---

## Success Criteria

RLS deployment is considered successful if:

- [ ] **All validation queries return 0 errors** (no orphaned/invalid data)
- [ ] **All RLS verification tests pass** (vendor isolation confirmed)
- [ ] **Admin can access all data** (admin bypass working)
- [ ] **Vendors see only own data** (cross-vendor access blocked)
- [ ] **No permission denied errors in app logs** (policy logic correct)
- [ ] **API latency < 100ms p99** (performance acceptable)
- [ ] **Email queue processing latency < 5 sec** (queue not stalled)
- [ ] **Integration test suite passes 100%** (no compatibility issues)
- [ ] **24-hour monitoring shows < 1% error rate** (system stable)

---

## Contingency & Recovery

If data corruption occurs:

1. **Backup Restore**: Restore from database backup created before migration
   - Location: Supabase Dashboard > Backups
   - Estimated restore time: 10-20 minutes
2. **Partial Data Recovery**: If only specific rows are corrupted
   - Restore from backup to recovery database
   - Manually copy corrected rows back to production
3. **Data Validation Post-Recovery**: Run validation queries again to ensure integrity

---

## Sign-Off & Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Platform Lead | __________ | __________ | __________ |
| Security Lead | __________ | __________ | __________ |
| DBA/Ops | __________ | __________ | __________ |
| Product Owner | __________ | __________ | __________ |

---

## Appendix: Related Documents

- Migration files: `supabase/migrations/2026-06-02_rls_*.sql`
- Data validation queries: `supabase/validation/01_data_validation_queries.sql`
- RLS verification queries: `supabase/validation/02_rls_verification_queries.sql`
- Deployment checklist: `supabase/validation/03_staging_deployment_checklist.sql`
- Database schema: `supabase/*.sql` (8 schema files)

---

**Report Completed**: [TODAY]  
**Review Date**: [SCHEDULED]  
**Next Review**: After staging deployment (within 1 week)
