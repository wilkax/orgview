-- Phase 3: Update Storage Policies for Organizations

-- Create organization-based storage bucket (optional, for org-shared files)
insert into storage.buckets (id, name, public) 
values ('org-files', 'org-files', false)
on conflict (id) do nothing;

-- Storage policy for organization files
create policy "Org members can access org files"
on "storage"."objects"
for all
to public
using (
    bucket_id = 'org-files' 
    and authenticative.is_user_authenticated() 
    and (
        -- Extract org_id from path like: {org_id}/{...}
        (string_to_array(name, '/'))[1]::uuid in (select public.get_user_organizations())
    )
)
with check (
    bucket_id = 'org-files' 
    and authenticative.is_user_authenticated() 
    and (
        (string_to_array(name, '/'))[1]::uuid in (select public.get_user_organizations())
    )
);

