# Quick Reference Guide

## Common SQL Patterns

### Check if User is Organization Member
```sql
-- In RLS policy
using (
    organization_id in (select public.get_user_organizations())
)
```

### Check if User Has Specific Role
```sql
-- In RLS policy (owners and admins only)
using (
    public.has_organization_role(
        organization_id, 
        array['owner'::organization_role, 'admin'::organization_role]
    )
)
```

### Get Organization from Related Table
```sql
-- Helper function pattern
create or replace function public.get_questionnaire_organization(questionnaire_id uuid)
returns uuid
language sql
security definer
stable
as $$
    select organization_id from public.questionnaires where id = questionnaire_id
$$;

-- Use in RLS policy
using (
    public.get_questionnaire_organization(questionnaire_id) in (
        select public.get_user_organizations()
    )
)
```

## Common TypeScript Patterns

### Get Current User's Organizations
```typescript
const { data: organizations } = await supabase
    .from('organizations')
    .select(`
        *,
        organization_memberships!inner(role)
    `);
```

### Get Organization Members
```typescript
const { data: members } = await supabase
    .from('organization_memberships')
    .select(`
        *,
        user:auth.users(id, email, raw_user_meta_data)
    `)
    .eq('organization_id', orgId);
```

### Create Questionnaire
```typescript
const { data, error } = await supabase
    .from('questionnaires')
    .insert({
        organization_id: currentOrg.id,
        title: 'My Questionnaire',
        description: 'Description',
        created_by: user.id,
    })
    .select()
    .single();
```

### Get Questionnaires with Questions
```typescript
const { data } = await supabase
    .from('questionnaires')
    .select(`
        *,
        questions(*)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });
```

### Create Submission with Answers
```typescript
// 1. Create submission
const { data: submission } = await supabase
    .from('submissions')
    .insert({
        questionnaire_id: questionnaireId,
        organization_id: orgId,
        submitted_by: user.id,
        status: 'in_progress',
    })
    .select()
    .single();

// 2. Insert answers
const answers = questions.map(q => ({
    submission_id: submission.id,
    question_id: q.id,
    value: formData[q.id],
}));

await supabase.from('answers').insert(answers);

// 3. Mark as completed
await supabase
    .from('submissions')
    .update({ 
        status: 'completed',
        submitted_at: new Date().toISOString(),
    })
    .eq('id', submission.id);
```

## Common React Patterns

### Use Organization Context
```typescript
import { useGlobal } from '@/lib/context/GlobalContext';

function MyComponent() {
    const { currentOrganization, organizations } = useGlobal();
    
    if (!currentOrganization) {
        return <div>Please select an organization</div>;
    }
    
    // Use currentOrganization.id in queries
}
```

### Check User Role
```typescript
function MyComponent() {
    const { currentOrganization } = useGlobal();
    
    const isAdmin = currentOrganization?.role === 'owner' || 
                    currentOrganization?.role === 'admin';
    
    return (
        <div>
            {isAdmin && <AdminPanel />}
        </div>
    );
}
```

### Organization Switcher in Layout
```tsx
import { OrganizationSwitcher } from '@/components/OrganizationSwitcher';

export default function Layout({ children }) {
    return (
        <div>
            <nav>
                <OrganizationSwitcher />
            </nav>
            <main>{children}</main>
        </div>
    );
}
```

## Testing Patterns

### Test RLS Isolation
```sql
-- As User A
select * from questionnaires;  -- Should see only Org A's questionnaires

-- Try to access Org B's questionnaire directly
select * from questionnaires where id = '<org-b-questionnaire-id>';
-- Should return empty result

-- Try to insert into Org B
insert into questionnaires (organization_id, title)
values ('<org-b-id>', 'Hacked');
-- Should fail with RLS violation
```

### Test Role Permissions
```typescript
// Test as member (should fail)
const { error } = await supabase
    .from('organization_memberships')
    .insert({
        organization_id: orgId,
        user_id: newUserId,
        role: 'member',
    });

expect(error).toBeTruthy(); // Members can't add members

// Test as admin (should succeed)
// ... switch to admin user
const { error: adminError } = await supabase
    .from('organization_memberships')
    .insert({
        organization_id: orgId,
        user_id: newUserId,
        role: 'member',
    });

expect(adminError).toBeFalsy(); // Admins can add members
```

## Migration Patterns

### Create Table with RLS
```sql
-- 1. Create table
create table "public"."my_table" (
    "id" uuid primary key default gen_random_uuid(),
    "organization_id" uuid not null references public.organizations(id) on delete cascade,
    "name" text not null,
    "created_at" timestamp with time zone not null default now()
);

-- 2. Enable RLS
alter table "public"."my_table" enable row level security;

-- 3. Create indexes
create index my_table_org_idx on public.my_table using btree (organization_id);

-- 4. Create policies
create policy "Users can view org data"
on "public"."my_table"
for select
to authenticated
using (
    authenticative.is_user_authenticated() 
    and organization_id in (select public.get_user_organizations())
);
```

### Add Organization to New Table
```sql
-- 1. Add column (required from start for new projects)
alter table "public"."new_table"
    add column "organization_id" uuid not null references public.organizations(id) on delete cascade;

-- 2. Create index
create index new_table_org_idx on public.new_table using btree (organization_id);

-- 3. Create RLS policies
create policy "org_policy"
on "public"."new_table"
for all
to authenticated
using (
    authenticative.is_user_authenticated()
    and organization_id in (select public.get_user_organizations())
);
```

## Troubleshooting

### RLS Policy Not Working
```sql
-- Check if RLS is enabled
select tablename, rowsecurity 
from pg_tables 
where schemaname = 'public' and tablename = 'your_table';

-- List all policies
select * from pg_policies where tablename = 'your_table';

-- Test policy as specific user
set local role authenticated;
set local request.jwt.claims.sub to '<user-id>';
select * from your_table;
```

### Performance Issues
```sql
-- Check if indexes exist
select * from pg_indexes where tablename = 'your_table';

-- Analyze query plan
explain analyze select * from questionnaires where organization_id = '<org-id>';

-- Create missing indexes
create index if not exists idx_name on table_name using btree (column_name);
```

### User Can't See Data
1. Check if user is member of organization
2. Check if RLS policy exists for SELECT
3. Check if `authenticative.is_user_authenticated()` returns true
4. Check if organization_id is correct
5. Verify user's session is valid

## Useful Supabase CLI Commands

```bash
# Create new migration
supabase migration new migration_name

# Reset local database
supabase db reset

# Push migrations to remote
supabase db push

# Generate TypeScript types
supabase gen types typescript --project-id <id> > types.ts

# View logs
supabase functions logs

# Link to project
supabase link --project-ref <project-ref>
```

