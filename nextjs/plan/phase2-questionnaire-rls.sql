-- Phase 2: RLS Policies for Questionnaire Tables

-- Helper function to get organization from questionnaire
create or replace function public.get_questionnaire_organization(questionnaire_id uuid)
returns uuid
language sql
security definer
stable
as $$
    select organization_id from public.questionnaires where id = questionnaire_id
$$;

-- Helper function to get organization from submission
create or replace function public.get_submission_organization(submission_id uuid)
returns uuid
language sql
security definer
stable
as $$
    select organization_id from public.submissions where id = submission_id
$$;

-- Questionnaires: Users can view questionnaires from their organizations
create policy "Users can view org questionnaires"
on "public"."questionnaires"
for select
to authenticated
using (
    authenticative.is_user_authenticated() 
    and organization_id in (select public.get_user_organizations())
);

-- Questionnaires: Admins and owners can create/update/delete
create policy "Admins can manage questionnaires"
on "public"."questionnaires"
for all
to authenticated
using (
    authenticative.is_user_authenticated() 
    and public.has_organization_role(organization_id, array['owner'::organization_role, 'admin'::organization_role])
)
with check (
    authenticative.is_user_authenticated() 
    and public.has_organization_role(organization_id, array['owner'::organization_role, 'admin'::organization_role])
);

-- Questions: Same org-based access as questionnaires
create policy "Users can view questions"
on "public"."questions"
for select
to authenticated
using (
    authenticative.is_user_authenticated() 
    and public.get_questionnaire_organization(questionnaire_id) in (select public.get_user_organizations())
);

create policy "Admins can manage questions"
on "public"."questions"
for all
to authenticated
using (
    authenticative.is_user_authenticated() 
    and public.has_organization_role(
        public.get_questionnaire_organization(questionnaire_id), 
        array['owner'::organization_role, 'admin'::organization_role]
    )
)
with check (
    authenticative.is_user_authenticated() 
    and public.has_organization_role(
        public.get_questionnaire_organization(questionnaire_id), 
        array['owner'::organization_role, 'admin'::organization_role]
    )
);

-- Submissions: Org members can view all submissions, users can create their own
create policy "Users can view org submissions"
on "public"."submissions"
for select
to authenticated
using (
    authenticative.is_user_authenticated() 
    and organization_id in (select public.get_user_organizations())
);

create policy "Users can create submissions"
on "public"."submissions"
for insert
to authenticated
with check (
    authenticative.is_user_authenticated() 
    and organization_id in (select public.get_user_organizations())
    and (submitted_by = auth.uid() or submitted_by is null)
);

create policy "Users can update own submissions"
on "public"."submissions"
for update
to authenticated
using (
    authenticative.is_user_authenticated() 
    and submitted_by = auth.uid()
);

-- Answers: Access based on submission access
create policy "Users can view answers"
on "public"."answers"
for select
to authenticated
using (
    authenticative.is_user_authenticated() 
    and public.get_submission_organization(submission_id) in (select public.get_user_organizations())
);

create policy "Users can manage own answers"
on "public"."answers"
for all
to authenticated
using (
    authenticative.is_user_authenticated() 
    and exists(
        select 1 from public.submissions 
        where id = submission_id 
        and submitted_by = auth.uid()
    )
)
with check (
    authenticative.is_user_authenticated() 
    and exists(
        select 1 from public.submissions 
        where id = submission_id 
        and submitted_by = auth.uid()
    )
);

