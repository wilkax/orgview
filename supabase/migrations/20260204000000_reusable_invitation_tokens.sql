-- Make invitation tokens reusable for multiple participants
-- This migration allows one invitation link to be shared with multiple people

-- Make participant_id nullable for shared tokens
ALTER TABLE participant_access_tokens
ALTER COLUMN participant_id DROP NOT NULL;

-- Add a column to distinguish between shared and individual tokens
ALTER TABLE participant_access_tokens
ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT false;

-- Create or replace the validate_participant_token function
-- This function validates tokens and returns questionnaire/organization info
-- For shared tokens, it doesn't return a participant_id
CREATE OR REPLACE FUNCTION validate_participant_token(token_value text)
RETURNS TABLE (
  is_valid boolean,
  participant_id uuid,
  questionnaire_id uuid,
  organization_id uuid,
  is_shared boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN pat.token IS NOT NULL 
        AND (pat.expires_at IS NULL OR pat.expires_at > now())
      THEN true
      ELSE false
    END as is_valid,
    pat.participant_id,
    pat.questionnaire_id,
    q.organization_id,
    pat.is_shared
  FROM participant_access_tokens pat
  LEFT JOIN questionnaires q ON q.id = pat.questionnaire_id
  WHERE pat.token = token_value
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION validate_participant_token(text) TO anon, authenticated;

-- Add comment
COMMENT ON COLUMN participant_access_tokens.is_shared IS 'If true, this token can be used by multiple participants. If false, it is tied to a specific participant_id.';
COMMENT ON FUNCTION validate_participant_token(text) IS 'Validates a participant access token and returns questionnaire/organization info. For shared tokens, participant_id will be null.';

