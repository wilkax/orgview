-- Phase 5: Auto-create Organization on User Signup

-- Function to create default organization on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
    new_org_id uuid;
begin
    -- Create a personal organization for the new user
    insert into public.organizations (name, slug)
    values (
        coalesce(new.raw_user_meta_data->>'name', new.email) || '''s Organization',
        'org-' || new.id::text
    )
    returning id into new_org_id;
    
    -- Add user as owner of the organization
    insert into public.organization_memberships (organization_id, user_id, role)
    values (new_org_id, new.id, 'owner');
    
    return new;
end;
$$;

-- Trigger on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

