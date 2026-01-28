-- Phase 2: Questionnaire Schema Design

-- Questionnaire templates (the questionnaire structure)
create table "public"."questionnaires" (
    "id" uuid primary key default gen_random_uuid(),
    "organization_id" uuid not null references public.organizations(id) on delete cascade,
    "title" text not null,
    "description" text,
    "status" text not null default 'draft' check (status in ('draft', 'published', 'archived')),
    "settings" jsonb default '{}',
    "created_by" uuid references auth.users(id) on delete set null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);

alter table "public"."questionnaires" enable row level security;
create index questionnaires_org_idx on public.questionnaires using btree (organization_id);
create index questionnaires_status_idx on public.questionnaires using btree (status);

-- Questions within questionnaires
create table "public"."questions" (
    "id" uuid primary key default gen_random_uuid(),
    "questionnaire_id" uuid not null references public.questionnaires(id) on delete cascade,
    "type" text not null check (type in ('text', 'textarea', 'radio', 'checkbox', 'scale', 'date', 'number')),
    "title" text not null,
    "description" text,
    "options" jsonb, -- For radio/checkbox questions
    "required" boolean not null default false,
    "order_index" integer not null default 0,
    "settings" jsonb default '{}',
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);

alter table "public"."questions" enable row level security;
create index questions_questionnaire_idx on public.questions using btree (questionnaire_id);
create index questions_order_idx on public.questions using btree (questionnaire_id, order_index);

-- Questionnaire submissions (responses)
create table "public"."submissions" (
    "id" uuid primary key default gen_random_uuid(),
    "questionnaire_id" uuid not null references public.questionnaires(id) on delete cascade,
    "organization_id" uuid not null references public.organizations(id) on delete cascade,
    "submitted_by" uuid references auth.users(id) on delete set null,
    "status" text not null default 'in_progress' check (status in ('in_progress', 'completed')),
    "submitted_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);

alter table "public"."submissions" enable row level security;
create index submissions_org_idx on public.submissions using btree (organization_id);
create index submissions_questionnaire_idx on public.submissions using btree (questionnaire_id);
create index submissions_user_idx on public.submissions using btree (submitted_by);
create index submissions_status_idx on public.submissions using btree (status);

-- Individual answers
create table "public"."answers" (
    "id" uuid primary key default gen_random_uuid(),
    "submission_id" uuid not null references public.submissions(id) on delete cascade,
    "question_id" uuid not null references public.questions(id) on delete cascade,
    "value" jsonb not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    unique(submission_id, question_id)
);

alter table "public"."answers" enable row level security;
create index answers_submission_idx on public.answers using btree (submission_id);
create index answers_question_idx on public.answers using btree (question_id);

