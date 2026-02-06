-- Fix RLS policies for organizations table (corrected join condition)

DROP POLICY IF EXISTS "Organization members can view their organizations" ON organizations;
CREATE POLICY "Organization members can view their organizations" ON organizations FOR SELECT
USING (EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = organizations.id AND om.user_id = auth.uid()));

DROP POLICY IF EXISTS "Organization admins can update their organizations" ON organizations;
CREATE POLICY "Organization admins can update their organizations" ON organizations FOR UPDATE
USING (EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = organizations.id AND om.user_id = auth.uid() AND om.role = 'admin'));

