-- Update RLS policies for organization_reports to allow global admins (system_admin) full access

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view organization reports" ON organization_reports;

-- RLS Policy: System admins and org members can view reports
CREATE POLICY "Users can view organization reports"
  ON organization_reports
  FOR SELECT
  USING (
    -- System admins (global admins) can see everything
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'system_admin'
    )
    OR
    -- Org members can see their organization's reports
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_reports.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Update INSERT policy to allow system admins
DROP POLICY IF EXISTS "Org members can create reports" ON organization_reports;

CREATE POLICY "Org members can create reports"
  ON organization_reports
  FOR INSERT
  WITH CHECK (
    -- System admins can create reports for any organization
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'system_admin'
    )
    OR
    -- Org admins and auditors can create reports for their organization
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_reports.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('admin', 'auditor')
    )
  );

-- Update UPDATE policy to allow system admins
DROP POLICY IF EXISTS "Org members can update reports" ON organization_reports;

CREATE POLICY "Org members can update reports"
  ON organization_reports
  FOR UPDATE
  USING (
    -- System admins can update any report
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'system_admin'
    )
    OR
    -- Org admins and auditors can update their organization's reports
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_reports.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('admin', 'auditor')
    )
  );

-- Update DELETE policy to allow system admins
DROP POLICY IF EXISTS "Org admins can delete reports" ON organization_reports;

CREATE POLICY "Org admins can delete reports"
  ON organization_reports
  FOR DELETE
  USING (
    -- System admins can delete any report
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'system_admin'
    )
    OR
    -- Org admins can delete their organization's reports
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_reports.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

