-- Remove old pre-generated reporting system
-- This migration removes the organization_reports table and related infrastructure
-- as we're moving to a dynamic, on-demand reporting system with PowerPoint export

-- Drop all RLS policies first
DROP POLICY IF EXISTS "Users can view organization reports" ON organization_reports;
DROP POLICY IF EXISTS "Org members can create reports" ON organization_reports;
DROP POLICY IF EXISTS "Org members can update reports" ON organization_reports;
DROP POLICY IF EXISTS "Org admins can delete reports" ON organization_reports;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_organization_reports_updated_at ON organization_reports;

-- Drop functions
DROP FUNCTION IF EXISTS update_organization_reports_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_organization_reports_org_questionnaire;
DROP INDEX IF EXISTS idx_organization_reports_generated_at;
DROP INDEX IF EXISTS idx_organization_reports_status;
DROP INDEX IF EXISTS idx_organization_reports_questionnaire_id;
DROP INDEX IF EXISTS idx_organization_reports_template_id;
DROP INDEX IF EXISTS idx_organization_reports_org_id;

-- Drop table
DROP TABLE IF EXISTS organization_reports;

-- Drop enum type
DROP TYPE IF EXISTS report_status;

-- Note: We're keeping approach_report_templates table as it may still be useful
-- for storing visualization configurations, but we'll repurpose it for the new system

