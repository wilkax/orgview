-- Add i18n support for questionnaires
-- This migration adds language support to questionnaires and templates

-- Add language field to questionnaires table
ALTER TABLE questionnaires
ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en',
ADD COLUMN IF NOT EXISTS available_languages text[] NOT NULL DEFAULT ARRAY['en'];

-- Add language field to approach_questionnaires table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'approach_questionnaires') THEN
    ALTER TABLE approach_questionnaires
    ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';
  END IF;
END $$;

-- Create questionnaire_translations table for multi-language questionnaire content
CREATE TABLE IF NOT EXISTS questionnaire_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
  language text NOT NULL,
  title text NOT NULL,
  description text,
  schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(questionnaire_id, language)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_questionnaire_translations_questionnaire_id 
ON questionnaire_translations(questionnaire_id);

CREATE INDEX IF NOT EXISTS idx_questionnaire_translations_language 
ON questionnaire_translations(language);

-- Enable RLS on questionnaire_translations
ALTER TABLE questionnaire_translations ENABLE ROW LEVEL SECURITY;

-- RLS policies for questionnaire_translations
-- Users can view translations for questionnaires they have access to
CREATE POLICY "Users can view questionnaire translations"
ON questionnaire_translations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM questionnaires q
    WHERE q.id = questionnaire_translations.questionnaire_id
  )
);

-- Org members can create translations
CREATE POLICY "Org members can create questionnaire translations"
ON questionnaire_translations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM questionnaires q
    JOIN organization_members om ON om.organization_id = q.organization_id
    WHERE q.id = questionnaire_translations.questionnaire_id
    AND om.user_id = auth.uid()
  )
);

-- Org members can update translations
CREATE POLICY "Org members can update questionnaire translations"
ON questionnaire_translations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM questionnaires q
    JOIN organization_members om ON om.organization_id = q.organization_id
    WHERE q.id = questionnaire_translations.questionnaire_id
    AND om.user_id = auth.uid()
  )
);

-- Org admins can delete translations
CREATE POLICY "Org admins can delete questionnaire translations"
ON questionnaire_translations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM questionnaires q
    JOIN organization_members om ON om.organization_id = q.organization_id
    WHERE q.id = questionnaire_translations.questionnaire_id
    AND om.user_id = auth.uid()
    AND om.role = 'admin'
  )
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_questionnaire_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_questionnaire_translations_updated_at
BEFORE UPDATE ON questionnaire_translations
FOR EACH ROW
EXECUTE FUNCTION update_questionnaire_translations_updated_at();

-- Grant permissions
GRANT SELECT ON questionnaire_translations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON questionnaire_translations TO authenticated;

-- Add comment
COMMENT ON TABLE questionnaire_translations IS 'Stores translations for questionnaires in different languages';
COMMENT ON COLUMN questionnaires.language IS 'Primary language of the questionnaire';
COMMENT ON COLUMN questionnaires.available_languages IS 'Array of available language codes for this questionnaire';

