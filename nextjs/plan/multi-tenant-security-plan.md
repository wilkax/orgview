# Multi-Tenant Data Isolation Plan for OrgView

## Current State Analysis

### Existing Database Schema
The current database has minimal tables:
- **`todo_list`** - A simple task/todo table with user-level ownership (`owner` → `auth.users.id`)
- **`storage.objects`** - File storage with user-level access

### Existing RLS Policies
Current RLS is **user-based, NOT organization-based**:
- `todo_list`: Policy allows users to access only their own data (`owner = auth.uid()`)
- Storage: Files are organized by user ID in folder paths (`^{user_id}/`)

### Current Authentication
- Supabase Auth with email/password and OAuth (GitHub, Google)
- MFA support via TOTP
- Custom `authenticative.is_user_authenticated()` helper function for AAL2 verification

### Multi-Tenancy Gaps Identified
1. **No organization/company tables exist** - Users are not associated with any organization
2. **No questionnaire schema exists** - The platform description mentions questionnaires, but no tables exist yet
3. **RLS policies are user-scoped** - No organization-level isolation
4. **No organization context in application** - `GlobalContext` only tracks user, not organization
5. **No role-based access control** - No admin/member/viewer distinction within organizations

---

## Comprehensive Implementation Plan

### Phase 1: Core Organization Infrastructure

#### Task 1.1: Create Organizations Table
Create the foundational organization/company table.

**Migration file:** `supabase/migrations/YYYYMMDDHHMMSS_organizations.sql`

```sql
-- Create organizations table
create table "public"."organizations" (
    "id" uuid primary key default gen_random_uuid(),
    "name" text not null,
    "slug" text unique not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "settings" jsonb default '{}',
    "is_active" boolean not null default true
);

-- Enable RLS
alter table "public"."organizations" enable row level security;

-- Create index on slug for fast lookups
create index organizations_slug_idx on public.organizations using btree (slug);
```

#### Task 1.2: Create Organization Memberships Table
Link users to organizations with roles.

```sql
-- Create organization membership roles enum
create type "public"."organization_role" as enum ('owner', 'admin', 'member', 'viewer');

-- Create organization memberships table
create table "public"."organization_memberships" (
    "id" uuid primary key default gen_random_uuid(),
    "organization_id" uuid not null references public.organizations(id) on delete cascade,
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "role" organization_role not null default 'member',
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    unique(organization_id, user_id)
);

-- Enable RLS
alter table "public"."organization_memberships" enable row level security;

-- Create indexes
create index org_memberships_org_id_idx on public.organization_memberships using btree (organization_id);
create index org_memberships_user_id_idx on public.organization_memberships using btree (user_id);
```

#### Task 1.3: Create Helper Functions for RLS
Create PostgreSQL functions to simplify RLS policies.

See: `phase1-rls-helpers.sql`

#### Task 1.4: Create RLS Policies for Organization Tables

See: `phase1-rls-policies.sql`

---

### Phase 2: Questionnaire Schema Design

#### Task 2.1: Create Questionnaire Tables

See: `phase2-questionnaire-schema.sql`

#### Task 2.2: Create RLS Policies for Questionnaire Tables

See: `phase2-questionnaire-rls.sql`

---

### Phase 3: Storage Policies for Organizations

#### Task 3.1: Update Storage Policies for Organizations

See: `phase3-storage-policies.sql`

---

### Phase 4: Application-Level Changes

#### Task 4.1: Update TypeScript Database Types
Update `nextjs/src/lib/types.ts` and `supabase-expo-template/lib/types.ts` to include new tables.

**Required type additions:**
- `organizations` table type
- `organization_memberships` table type with `organization_role` enum
- `questionnaires` table type
- `questions` table type
- `submissions` table type
- `answers` table type

#### Task 4.2: Update GlobalContext for Organization Context

See: `phase4-global-context.tsx`

#### Task 4.3: Create Organization Switching Component

See: `phase4-organization-switcher.tsx`

#### Task 4.4: Update Mobile App Context

**File:** `supabase-expo-template/lib/context/` (create if needed)
- Mirror the Next.js GlobalContext for organization awareness
- Use AsyncStorage to persist current organization selection

#### Task 4.5: Create Supabase Client Helpers

See: `phase4-supabase-helpers.ts`

---

### Phase 5: User Onboarding & Organization Creation

#### Task 5.1: Create Organization on First Login (Optional)

See: `phase5-auto-create-org.sql`

#### Task 5.2: Create Organization Invitation System

See: `phase5-invitations.sql`

---

---

## Note: No Data Migration Required

This is a fresh project with no existing data, so Phase 6 (Data Migration) is not needed.

