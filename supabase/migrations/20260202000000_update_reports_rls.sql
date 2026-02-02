-- Update RLS policies for organization_reports to allow both org admins and auditors
-- to create/update reports (roles: 'admin', 'auditor')

-- Drop existing policies
DROP POLICY IF EXISTS "Org admins can create reports" ON organization_reports;
DROP POLICY IF EXISTS "Org members can create reports" ON organization_reports;
DROP POLICY IF EXISTS "Org admins can update reports" ON organization_reports;
DROP POLICY IF EXISTS "Org members can update reports" ON organization_reports;
DROP POLICY IF EXISTS "Org admins can delete reports" ON organization_reports;

-- RLS Policy: Org admins and auditors can insert reports
CREATE POLICY "Org members can create reports"
  ON organization_reports
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_reports.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('admin', 'auditor')
    )
  );

-- RLS Policy: Org admins and auditors can update reports
CREATE POLICY "Org members can update reports"
  ON organization_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_reports.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('admin', 'auditor')
    )
  );

-- RLS Policy: Only org admins can delete reports
CREATE POLICY "Org admins can delete reports"
  ON organization_reports
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_reports.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

