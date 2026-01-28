-- Phase 5: Organization Invitation System

-- Organization invitations table
create table "public"."organization_invitations" (
    "id" uuid primary key default gen_random_uuid(),
    "organization_id" uuid not null references public.organizations(id) on delete cascade,
    "email" text not null,
    "role" organization_role not null default 'member',
    "invited_by" uuid references auth.users(id) on delete set null,
    "token" text unique not null default encode(gen_random_bytes(32), 'hex'),
    "expires_at" timestamp with time zone not null default (now() + interval '7 days'),
    "accepted_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now()
);

alter table "public"."organization_invitations" enable row level security;
create index org_invitations_token_idx on public.organization_invitations using btree (token);
create index org_invitations_email_idx on public.organization_invitations using btree (email);
create index org_invitations_org_idx on public.organization_invitations using btree (organization_id);

-- RLS Policies for invitations

-- Admins can view invitations for their organization
create policy "Admins can view org invitations"
on "public"."organization_invitations"
for select
to authenticated
using (
    authenticative.is_user_authenticated() 
    and public.has_organization_role(organization_id, array['owner'::organization_role, 'admin'::organization_role])
);

-- Admins can create invitations
create policy "Admins can create invitations"
on "public"."organization_invitations"
for insert
to authenticated
with check (
    authenticative.is_user_authenticated() 
    and public.has_organization_role(organization_id, array['owner'::organization_role, 'admin'::organization_role])
);

-- Admins can delete invitations
create policy "Admins can delete invitations"
on "public"."organization_invitations"
for delete
to authenticated
using (
    authenticative.is_user_authenticated() 
    and public.has_organization_role(organization_id, array['owner'::organization_role, 'admin'::organization_role])
);

-- Function to accept invitation
create or replace function public.accept_invitation(invitation_token text)
returns jsonb
language plpgsql
security definer
as $$
declare
    invitation record;
    result jsonb;
begin
    -- Get invitation
    select * into invitation
    from public.organization_invitations
    where token = invitation_token
    and accepted_at is null
    and expires_at > now();
    
    if not found then
        return jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
    end if;
    
    -- Add user to organization
    insert into public.organization_memberships (organization_id, user_id, role)
    values (invitation.organization_id, auth.uid(), invitation.role)
    on conflict (organization_id, user_id) do nothing;
    
    -- Mark invitation as accepted
    update public.organization_invitations
    set accepted_at = now()
    where id = invitation.id;
    
    return jsonb_build_object('success', true, 'organization_id', invitation.organization_id);
end;
$$;

