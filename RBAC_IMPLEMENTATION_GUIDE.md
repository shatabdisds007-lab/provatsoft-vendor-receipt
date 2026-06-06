# Role-Based Authentication System Implementation Guide

## Overview
A complete Role-Based Access Control (RBAC) system has been implemented for your Next.js SaaS project. This system provides:

- **Profiles Table**: Extended user data with role information
- **Role Types**: `admin` and `vendor` roles
- **Authentication**: Supabase Auth with email/password login
- **Authorization**: Middleware-based role checking
- **Admin Dashboard**: Complete admin interface with user management, receipt monitoring, and email logs

---

## 🚀 Quick Start

### 1. Deploy Supabase Changes

Run the SQL migration in your Supabase project:

```bash
# Copy and run this in Supabase SQL Editor
# File: supabase/profiles.sql
```

This creates:
- `profiles` table linked to `auth.users`
- RLS (Row Level Security) policies
- Auto-trigger for profile creation on user signup
- Helper functions for role checking

### 2. Update Environment (Optional)

If you want admin override support in development:

```env
# .env.local
ADMIN_USER_ID=your-admin-user-id  # UUID of admin user
```

### 3. Test the System

1. Navigate to `http://localhost:3000/login`
2. Sign in with your Supabase credentials
3. The app will redirect based on role:
   - `admin` → `/dashboard/admin`
   - `vendor` → `/dashboard/vendor`

---

## 📁 File Structure

### New Files Created

```
app/
├── login/
│   └── page.tsx                    # Login page with email/password auth
├── unauthorized/
│   └── page.tsx                    # 403 Access Denied page
├── api/admin/
│   ├── users/route.ts              # Admin user management API
│   ├── receipts/route.ts           # Admin receipts API
│   └── email-logs/route.ts         # Admin email logs API
└── dashboard/admin/
    ├── layout.tsx                   # Admin layout with auth check
    ├── page.tsx                     # Admin dashboard overview
    ├── users/page.tsx               # Users management page
    ├── receipts/page.tsx            # Receipts monitoring page
    └── email-logs/page.tsx          # Email logs page

src/
├── types/
│   └── auth.ts                      # Auth-related TypeScript types
├── lib/
│   ├── auth.ts                      # Updated with role-fetching functions
│   └── roleValidator.ts             # Server-side role validation helpers
└── middleware.ts                    # Updated with role-based routing

supabase/
└── profiles.sql                     # Profiles table + RLS setup

```

---

## 🔐 Security Architecture

### Server-Side Validation Only
- **All role checks happen on the server** using `auth.ts` functions
- Client-side role info is never trusted
- Middleware protects all dashboard routes
- API routes verify roles before processing

### RLS (Row Level Security)
The `profiles` table has RLS policies:
- Users can read their own profile
- Users can read all profiles (for listings)
- Only admins can update user roles
- Prevents unauthorized role escalation

### Role Fetching
Roles are fetched from the `profiles` table in real-time:
```typescript
// src/lib/auth.ts
export async function getUserRole(request: NextRequest): Promise<UserRole | null>
export async function getServerUserProfile(request: NextRequest): Promise<AuthUser | null>
export async function isAdmin(request: NextRequest): Promise<boolean>
```

---

## 🔑 Key Functions

### Authentication Functions

#### `getServerUser(request)`
Extracts authenticated user from JWT token or cookies

#### `getServerUserProfile(request)`
Fetches user with role from profiles table
```typescript
const profile = await getServerUserProfile(request);
if (profile?.role === 'admin') { /* ... */ }
```

#### `getUserRole(request)`
Gets user role only
```typescript
const role = await getUserRole(request);
if (role === 'admin') { /* ... */ }
```

#### `isAdmin(request)`
Checks if user is admin
```typescript
const isAdminUser = await isAdmin(request);
if (!isAdminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
```

### Role Validation Functions

#### `validateUserRole(request, requiredRole)`
Validates user has specific role

#### `validateUserRoles(request, allowedRoles)`
Validates user has one of allowed roles (admin always allowed)

#### `assertUserRole(request, requiredRole)`
Throws error if user doesn't have required role

#### `assertAdminRole(request)`
Throws error if user is not admin

---

## 🛣️ Routing & Middleware

### Public Routes
- `/` - Home page
- `/login` - Login page
- `/pricing` - Pricing page (if exists)
- `/templates` - Templates page (if exists)
- `/api/health/*` - Health checks
- `/api/templates/*` - Template endpoints
- `/api/email/webhook` - Email webhooks

### Protected Routes (Require Authentication)
- `/dashboard/*` - Base dashboard

### Role-Based Routes
- `/dashboard/admin/*` - Admin only (redirects to unauthorized if not admin)
- `/dashboard/vendor/*` - Vendor or Admin

### Unauthorized
- `/unauthorized` - Shown when user lacks required role

---

## 👥 Admin Features

### 1. Users Management (`/dashboard/admin/users`)
- View all users with their roles
- Change user roles (vendor ↔ admin)
- See user creation dates
- Expandable cards with role change buttons

### 2. Receipts Monitoring (`/dashboard/admin/receipts`)
- View all receipts from all vendors
- Filter by status (All, Draft, Finalized)
- See receipt details and company information
- Track vendor information
- Monitor receipt amounts and currencies

### 3. Email Logs (`/dashboard/admin/email-logs`)
- Monitor email delivery status
- Filter by status (All, Pending, Processing, Sent, Failed, Retrying)
- View error messages for failed emails
- See retry schedules
- Download attached PDFs
- Real-time statistics

### 4. Admin Dashboard Overview
- Quick stats: Total Users, Total Receipts, Pending Emails, Admin Count
- Navigation cards to management sections
- System metrics panel
- Subscription management

---

## 🧪 API Endpoints (Admin Only)

All admin endpoints require admin role and return 403 Forbidden otherwise.

### GET `/api/admin/users`
Fetch all user profiles
```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:3000/api/admin/users
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "vendor"
    }
  ],
  "count": 10
}
```

### PUT `/api/admin/users`
Update user role
```bash
curl -X PUT -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetUserId": "uuid", "newRole": "admin"}' \
  http://localhost:3000/api/admin/users
```

### GET `/api/admin/receipts`
Fetch all receipts with optional filtering
```bash
# All receipts
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:3000/api/admin/receipts

# Filter by status
curl -H "Authorization: Bearer $JWT_TOKEN" \
  "http://localhost:3000/api/admin/receipts?status=draft&limit=50"
```

### GET `/api/admin/email-logs`
Fetch email queue logs with optional filtering
```bash
# All emails
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:3000/api/admin/email-logs

# Filter by status
curl -H "Authorization: Bearer $JWT_TOKEN" \
  "http://localhost:3000/api/admin/email-logs?status=failed&limit=50"
```

---

## 💻 Development Mode

For local testing without Supabase configured, you can use dev headers:

```javascript
// Set these headers in API calls during development
headers: {
  'X-Dev-Test-User': 'enabled',          // Enable dev mode
  'X-Dev-User-Id': 'dev-user-123',       // Custom user ID
  'X-Dev-User-Role': 'admin',            // Set role (admin or vendor)
}
```

---

## 🚀 Deployment Checklist

### Before Deploying to Production

- [ ] Run Supabase migration (`supabase/profiles.sql`) on production database
- [ ] Verify RLS policies are enabled on `profiles` table
- [ ] Test login flow with real credentials
- [ ] Verify admin user can access `/dashboard/admin`
- [ ] Verify vendor user can access `/dashboard/vendor` but not admin
- [ ] Test unauthorized redirect for non-admin accessing admin routes
- [ ] Configure `ADMIN_USER_ID` env var if using env-based admin override
- [ ] Review RLS policies for your use case
- [ ] Enable Supabase Auth email verification (recommended)
- [ ] Configure email templates for auth messages
- [ ] Set up role-based access for other tables (if needed)

### Production Security Checklist

- [ ] Never use `X-Dev-*` headers in production
- [ ] Ensure JWT secrets are properly configured in Supabase
- [ ] Enable password strength requirements
- [ ] Configure Supabase access token expiration
- [ ] Monitor admin API endpoints for unusual access patterns
- [ ] Regularly audit user roles in production
- [ ] Set up alerts for failed authentication attempts
- [ ] Implement rate limiting on login endpoint

---

## 📝 TypeScript Types

New types in `src/types/auth.ts`:

```typescript
type UserRole = 'admin' | 'vendor'

interface UserProfile {
  id: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

interface AuthUser {
  id: string
  email: string
  role: UserRole
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
}
```

---

## 🔄 User Flow Diagrams

### Authentication Flow
```
User visits /login
        ↓
Email/Password input
        ↓
Supabase Auth validation
        ↓
Profile fetched from DB
        ↓
Role checked
        ↓
Redirect based on role
    ├→ admin → /dashboard/admin
    └→ vendor → /dashboard/vendor
```

### Authorization Flow
```
User accesses /dashboard/admin
        ↓
Middleware checks auth
        ↓
If not authenticated → /login
        ↓
Fetch user role from profiles table
        ↓
If role ≠ admin → /unauthorized
        ↓
Allow access
```

---

## 🐛 Troubleshooting

### Users Can't Log In
- **Check**: Supabase Auth is properly configured
- **Check**: User exists in `auth.users` table
- **Check**: Profile record exists in `profiles` table
- **Solution**: Run Supabase migration to ensure trigger is working

### Role Changes Not Taking Effect
- **Check**: User is fetching profile on each request (not caching role)
- **Check**: Database permissions allow reading `profiles` table
- **Solution**: Clear browser cache and re-login

### Admin Endpoints Return 403
- **Check**: User role in `profiles` table is actually 'admin'
- **Check**: JWT token is valid and not expired
- **Solution**: Verify user role with: `SELECT * FROM profiles WHERE email='user@email.com'`

### Middleware Not Protecting Routes
- **Check**: Middleware config includes `/dashboard/:path*`
- **Check**: Middleware file is in project root
- **Solution**: Restart dev server after middleware changes

---

## 🔗 Integration with Existing Features

### Vendor Dashboard
The vendor dashboard remains **completely unchanged**:
- All existing vendor features work as before
- Vendors still see their receipts, templates, settings
- Vendors cannot access admin features

### Receipt Creation
- Receipts created with vendor ID still work
- Admin can view all receipts across all vendors
- Vendor can only see their own receipts

### Email System
- Email logs visible to admin for monitoring
- Vendor emails continue to work as before
- Email tracking improved with admin visibility

---

## 📚 Next Steps

1. **Deploy Supabase Migration**: Run `supabase/profiles.sql`
2. **Test Login**: Use test credentials to verify flow
3. **Create Test Admin**: Update a user's role to `admin` via admin dashboard
4. **Monitor**: Check email logs and receipts in admin dashboard
5. **Integrate**: Connect other tables to admin dashboard as needed
6. **Customize**: Modify admin UI to match your branding

---

## 🆘 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review the Security Architecture section
3. Verify Supabase profile table has correct schema
4. Check browser console for errors
5. Review server logs for auth failures

---

## ✅ Implementation Complete

All requirements have been implemented:

- ✅ Profiles table integration with Supabase
- ✅ Post-login role-based redirects
- ✅ Middleware role protection
- ✅ Login page with Supabase Auth
- ✅ Admin dashboard with user management
- ✅ Admin receipts view
- ✅ Admin email logs view
- ✅ Vendor dashboard remains unchanged
- ✅ TypeScript types for UserRole and auth
- ✅ Server-side role validation only
- ✅ RLS rules compatible with admin access
