# Security Considerations for Multi-Tenant Architecture

## Core Security Principles

### 1. Row Level Security (RLS) is Primary
- **Never rely solely on application-level checks** - RLS is enforced at the database level
- **Always enable RLS** on all tables containing tenant-specific data
- **Test RLS policies thoroughly** - Verify that users cannot access other organizations' data
- **Use `auth.uid()`** in policies - Never trust client-supplied user IDs

### 2. Defense in Depth
- **Layer 1**: RLS policies at database level (primary security)
- **Layer 2**: Application-level checks in API routes
- **Layer 3**: UI-level restrictions (for UX, not security)

### 3. Principle of Least Privilege
- **Default to restrictive** - Start with no access, then grant specific permissions
- **Role-based access** - Use roles (owner, admin, member, viewer) to control permissions
- **Separate read and write** - Use different policies for SELECT vs INSERT/UPDATE/DELETE

---

## RLS Policy Best Practices

### Use Security Definer Functions Carefully
```sql
-- GOOD: Security definer for helper functions
create or replace function public.get_user_organizations()
returns setof uuid
language sql
security definer  -- Runs with elevated privileges
stable
as $$
    select organization_id 
    from public.organization_memberships 
    where user_id = auth.uid()  -- Still uses auth.uid() for security
$$;
```

**Why?** Security definer functions run with elevated privileges. Only use them for:
- Helper functions that need to read from tables the user might not have direct access to
- Functions that perform complex checks efficiently
- Always validate `auth.uid()` inside the function

### Always Use auth.uid()
```sql
-- GOOD: Uses auth.uid()
create policy "Users can view their organizations"
on "public"."organizations"
for select
using (id in (select public.get_user_organizations()));

-- BAD: Never trust client-supplied IDs
-- This would allow users to impersonate others
create policy "Bad policy"
on "public"."organizations"
for select
using (id = current_setting('app.user_org_id')::uuid);  -- VULNERABLE!
```

### Index Foreign Keys for Performance
```sql
-- GOOD: Index organization_id for fast RLS checks
create index questionnaires_org_idx 
on public.questionnaires using btree (organization_id);
```

**Why?** RLS policies run on every query. Without indexes, they can cause full table scans.

---

## Common Security Pitfalls

### 1. Forgetting to Enable RLS
```sql
-- ALWAYS do this for tenant-specific tables
alter table "public"."questionnaires" enable row level security;
```

### 2. Missing WITH CHECK Clause
```sql
-- GOOD: Prevents users from inserting data for other organizations
create policy "Users can create submissions"
on "public"."submissions"
for insert
with check (  -- Important!
    organization_id in (select public.get_user_organizations())
    and submitted_by = auth.uid()
);

-- BAD: Only checks on SELECT, not INSERT
create policy "Bad insert policy"
on "public"."submissions"
for insert
using (organization_id in (select public.get_user_organizations()));
```

### 3. Overly Permissive Policies
```sql
-- BAD: Allows any authenticated user to see all organizations
create policy "Too permissive"
on "public"."organizations"
for select
to authenticated
using (true);  -- VULNERABLE!

-- GOOD: Only shows organizations the user belongs to
create policy "Properly restricted"
on "public"."organizations"
for select
to authenticated
using (id in (select public.get_user_organizations()));
```

### 4. Not Testing Cross-Organization Access
**Always test:**
1. Create two organizations with different users
2. Try to access Organization B's data while logged in as Organization A's user
3. Verify the query returns no data or throws an error

---

## Data Isolation Verification

### Test Checklist
- [ ] User A cannot see User B's organizations
- [ ] User A cannot see questionnaires from Organization B
- [ ] User A cannot see submissions from Organization B
- [ ] User A cannot modify Organization B's data
- [ ] User A cannot invite users to Organization B
- [ ] Admins can only manage their own organization's members
- [ ] Viewers have read-only access to their organization

### SQL Test Queries
```sql
-- Test as User A (should return only User A's orgs)
select * from organizations;

-- Test as User A trying to access User B's org directly
select * from organizations where id = '<user-b-org-id>';  -- Should return nothing

-- Test submissions isolation
select * from submissions;  -- Should only show User A's org submissions
```

---

## Authentication & Authorization

### Multi-Factor Authentication (MFA)
- **Enforce MFA** for organization owners and admins
- **Use AAL2** (Authenticator Assurance Level 2) for sensitive operations
- **Check MFA status** using `authenticative.is_user_authenticated()`

### Session Management
- **Short session timeouts** for sensitive operations
- **Refresh tokens** properly
- **Invalidate sessions** on role changes

### API Security
```typescript
// GOOD: Always verify organization membership in API routes
export async function POST(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        return new Response('Unauthorized', { status: 401 });
    }
    
    const { organization_id } = await request.json();
    
    // Verify user is member of organization
    const { data: membership } = await supabase
        .from('organization_memberships')
        .select('role')
        .eq('organization_id', organization_id)
        .eq('user_id', user.id)
        .single();
    
    if (!membership) {
        return new Response('Forbidden', { status: 403 });
    }
    
    // Proceed with operation...
}
```

---

## Audit Logging

### Track Important Actions
```sql
-- Add audit columns to sensitive tables
alter table "public"."organizations"
    add column "updated_by" uuid references auth.users(id);

-- Create audit log table
create table "public"."audit_logs" (
    "id" uuid primary key default gen_random_uuid(),
    "organization_id" uuid references public.organizations(id),
    "user_id" uuid references auth.users(id),
    "action" text not null,
    "table_name" text not null,
    "record_id" uuid,
    "changes" jsonb,
    "created_at" timestamp with time zone not null default now()
);
```

---

## Storage Security

### Organization-Scoped File Storage
```sql
-- Files must be stored in organization-specific paths
-- Path format: {organization_id}/{file_name}

create policy "Org members can access org files"
on "storage"."objects"
for all
using (
    bucket_id = 'org-files' 
    and (string_to_array(name, '/'))[1]::uuid in (
        select public.get_user_organizations()
    )
);
```

---

## Monitoring & Alerts

### Set Up Alerts For:
- Failed RLS policy checks (potential attack)
- Unusual number of organization switches
- Failed authentication attempts
- Privilege escalation attempts
- Mass data exports

### Regular Security Audits
- Review RLS policies quarterly
- Check for new tables without RLS
- Verify indexes are in place
- Review user roles and permissions
- Test with penetration testing tools

---

## Compliance Considerations

### GDPR / Data Privacy
- **Data isolation** ensures compliance with data residency requirements
- **Right to deletion** - Cascade deletes when organization is deleted
- **Data export** - Provide organization-scoped data export functionality
- **Audit trails** - Log all data access and modifications

### SOC 2 / ISO 27001
- **Access controls** - Role-based access with RLS
- **Encryption** - Data encrypted at rest and in transit (Supabase default)
- **Audit logging** - Track all sensitive operations
- **Incident response** - Monitor for security events

