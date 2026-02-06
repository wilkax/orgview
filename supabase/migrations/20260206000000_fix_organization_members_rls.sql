-- Fix RLS policy for organizations table
-- The "Organization members can view their organizations" policy had a bug
-- where it was comparing om.organization_id = om.id instead of om.organization_id = organizations.id

-- Drop the broken policy
DROP POLICY IF EXISTS "Organization members can view their organizations" ON organizations;

-- Create the corrected policy
CREATE POLICY "Organization members can view their organizations"
ON organizations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.organization_id = organizations.id
    AND om.user_id = auth.uid()
  )
);

-- Also fix the update policy which has the same bug
DROP POLICY IF EXISTS "Organization admins can update their organizations" ON organizations;

CREATE POLICY "Organization admins can update their organizations"
ON organizations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.organization_id = organizations.id
    AND om.user_id = auth.uid()
    AND om.role = 'admin'
  )
);

