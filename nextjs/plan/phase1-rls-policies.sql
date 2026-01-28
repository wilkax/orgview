-- Phase 1: RLS Policies for Organization Tables

-- Organizations: Users can only see organizations they belong to
create policy "Users can view their organizations"
on "public"."organizations"
for select
to authenticated
using (
    authenticative.is_user_authenticated() 
    and id in (select public.get_user_organizations())
);

-- Organizations: Only owners can update organization details
create policy "Owners can update organizations"
on "public"."organizations"
for update
to authenticated
using (
    authenticative.is_user_authenticated() 
    and public.has_organization_role(id, array['owner'::organization_role])
);

-- Organizations: Only owners can delete organizations
create policy "Owners can delete organizations"
on "public"."organizations"
for delete
to authenticated
using (
    authenticative.is_user_authenticated() 
    and public.has_organization_role(id, array['owner'::organization_role])
);

-- Organization Memberships: Users can view memberships of their organizations
create policy "Users can view organization memberships"
on "public"."organization_memberships"
for select
to authenticated
using (
    authenticative.is_user_authenticated() 
    and organization_id in (select public.get_user_organizations())
);

-- Organization Memberships: Owners and admins can manage memberships
create policy "Admins can manage memberships"
on "public"."organization_memberships"
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

