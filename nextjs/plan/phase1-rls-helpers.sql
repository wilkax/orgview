-- Phase 1: RLS Helper Functions
-- These functions simplify RLS policies and improve performance

-- Function to get user's organizations
create or replace function public.get_user_organizations()
returns setof uuid
language sql
security definer
stable
as $$
    select organization_id 
    from public.organization_memberships 
    where user_id = auth.uid()
$$;

-- Function to check if user is member of organization
create or replace function public.is_organization_member(org_id uuid)
returns boolean
language sql
security definer
stable
as $$
    select exists(
        select 1 from public.organization_memberships 
        where organization_id = org_id 
        and user_id = auth.uid()
    )
$$;

-- Function to check if user has specific role in organization
create or replace function public.has_organization_role(org_id uuid, required_roles organization_role[])
returns boolean
language sql
security definer
stable
as $$
    select exists(
        select 1 from public.organization_memberships 
        where organization_id = org_id 
        and user_id = auth.uid()
        and role = any(required_roles)
    )
$$;

-- Function to get user's role in organization
create or replace function public.get_user_organization_role(org_id uuid)
returns organization_role
language sql
security definer
stable
as $$
    select role from public.organization_memberships 
    where organization_id = org_id 
    and user_id = auth.uid()
$$;

