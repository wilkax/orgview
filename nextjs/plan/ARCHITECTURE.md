# Multi-Tenant Architecture Diagram

## Database Schema Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         ORGANIZATIONS                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ organizations                                             │   │
│  │ - id (PK)                                                 │   │
│  │ - name                                                    │   │
│  │ - slug (unique)                                           │   │
│  │ - settings (jsonb)                                        │   │
│  │ - is_active                                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              │ 1:N                               │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ organization_memberships                                  │   │
│  │ - id (PK)                                                 │   │
│  │ - organization_id (FK → organizations)                    │   │
│  │ - user_id (FK → auth.users)                               │   │
│  │ - role (owner|admin|member|viewer)                        │   │
│  │ - UNIQUE(organization_id, user_id)                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        QUESTIONNAIRES                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ questionnaires                                            │   │
│  │ - id (PK)                                                 │   │
│  │ - organization_id (FK → organizations) ◄─── TENANT KEY   │   │
│  │ - title                                                   │   │
│  │ - description                                             │   │
│  │ - status (draft|published|archived)                       │   │
│  │ - created_by (FK → auth.users)                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              │ 1:N                               │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ questions                                                 │   │
│  │ - id (PK)                                                 │   │
│  │ - questionnaire_id (FK → questionnaires)                  │   │
│  │ - type (text|radio|checkbox|scale|...)                    │   │
│  │ - title                                                   │   │
│  │ - options (jsonb)                                         │   │
│  │ - required (boolean)                                      │   │
│  │ - order_index                                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         SUBMISSIONS                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ submissions                                               │   │
│  │ - id (PK)                                                 │   │
│  │ - questionnaire_id (FK → questionnaires)                  │   │
│  │ - organization_id (FK → organizations) ◄─── TENANT KEY   │   │
│  │ - submitted_by (FK → auth.users)                          │   │
│  │ - status (in_progress|completed)                          │   │
│  │ - submitted_at                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              │ 1:N                               │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ answers                                                   │   │
│  │ - id (PK)                                                 │   │
│  │ - submission_id (FK → submissions)                        │   │
│  │ - question_id (FK → questions)                            │   │
│  │ - value (jsonb)                                           │   │
│  │ - UNIQUE(submission_id, question_id)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         INVITATIONS                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ organization_invitations                                  │   │
│  │ - id (PK)                                                 │   │
│  │ - organization_id (FK → organizations)                    │   │
│  │ - email                                                   │   │
│  │ - role (owner|admin|member|viewer)                        │   │
│  │ - token (unique)                                          │   │
│  │ - expires_at                                              │   │
│  │ - accepted_at                                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### User Authentication & Organization Access

```
┌─────────┐
│  User   │
│ Login   │
└────┬────┘
     │
     ▼
┌─────────────────────┐
│ Supabase Auth       │
│ auth.uid()          │
└────┬────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│ get_user_organizations()                │
│ Returns: [org_id_1, org_id_2, ...]      │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│ User selects current organization       │
│ Stored in: localStorage/AsyncStorage    │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│ All queries filtered by organization_id │
│ RLS enforces at database level          │
└─────────────────────────────────────────┘
```

### Questionnaire Submission Flow

```
1. User views questionnaire
   ↓
2. RLS checks: user in questionnaire's organization?
   ↓
3. User fills out form
   ↓
4. Create submission (status: in_progress)
   ↓
5. Insert answers for each question
   ↓
6. Update submission (status: completed)
   ↓
7. RLS ensures submission belongs to user's org
```

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                     │
│  - UI restrictions (hide buttons, etc.)                  │
│  - Client-side validation                                │
│  - UX improvements                                       │
└────────────────────┬────────────────────────────────────┘
                     │ NOT TRUSTED FOR SECURITY
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    API/SERVER LAYER                      │
│  - Verify user authentication                            │
│  - Check organization membership                         │
│  - Validate input data                                   │
└────────────────────┬────────────────────────────────────┘
                     │ ADDITIONAL SECURITY
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   DATABASE LAYER (RLS)                   │
│  - PRIMARY SECURITY ENFORCEMENT                          │
│  - Cannot be bypassed                                    │
│  - Uses auth.uid() for user identification               │
│  - Filters all queries automatically                     │
└─────────────────────────────────────────────────────────┘
```

## RLS Policy Flow

### Example: Viewing Questionnaires

```
User Query:
  SELECT * FROM questionnaires;

         ↓

RLS Policy Applied:
  WHERE organization_id IN (
    SELECT get_user_organizations()
  )

         ↓

Actual Query Executed:
  SELECT * FROM questionnaires
  WHERE organization_id IN (
    SELECT organization_id 
    FROM organization_memberships 
    WHERE user_id = auth.uid()
  )

         ↓

Result:
  Only questionnaires from user's organizations
```

## Role-Based Access Control

```
┌──────────┬──────────┬─────────────┬────────────────┬────────────┐
│   Role   │ View Org │ Create/Edit │ Manage Members │ Delete Org │
├──────────┼──────────┼─────────────┼────────────────┼────────────┤
│  Owner   │    ✅    │      ✅     │       ✅       │     ✅     │
│  Admin   │    ✅    │      ✅     │       ✅       │     ❌     │
│  Member  │    ✅    │      ✅     │       ❌       │     ❌     │
│  Viewer  │    ✅    │      ❌     │       ❌       │     ❌     │
└──────────┴──────────┴─────────────┴────────────────┴────────────┘
```

## Multi-Organization User Example

```
User: john@example.com
├── Organization A (role: owner)
│   ├── Questionnaire 1
│   ├── Questionnaire 2
│   └── 5 members
│
└── Organization B (role: member)
    ├── Questionnaire 3
    └── 10 members

When John switches to Organization A:
  - Sees Questionnaires 1 & 2
  - Can manage members (owner role)
  - Can create/edit questionnaires

When John switches to Organization B:
  - Sees Questionnaire 3
  - Cannot manage members (member role)
  - Can create/edit questionnaires
```

## Storage Architecture

```
Bucket: org-files
├── {org-id-1}/
│   ├── file1.pdf
│   └── file2.jpg
│
└── {org-id-2}/
    ├── file3.pdf
    └── file4.jpg

RLS Policy:
  - Extract org_id from path
  - Check if user is member of that org
  - Allow/deny access
```

## Key Design Decisions

1. **Organization ID on every tenant table** - Enables efficient RLS
2. **Helper functions** - Simplify RLS policies and improve performance
3. **Indexed foreign keys** - Ensure RLS policies are fast
4. **Security definer functions** - Allow complex checks without exposing internals
5. **Cascade deletes** - Automatically clean up when organization is deleted
6. **JSONB for flexibility** - Settings, options, and values can evolve
7. **Unique constraints** - Prevent duplicate memberships and answers

