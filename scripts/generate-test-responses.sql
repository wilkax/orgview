-- Generate 10 test responses to the Laloux questionnaire
-- First, get the questionnaire ID and participant IDs

-- Create 10 test participants for Testkunde 2 organization
DO $$
DECLARE
  org_id uuid;
  questionnaire_id uuid;
  participant_id uuid;
  token_value text;
  i integer;
  
  -- Response patterns (representing different organizational maturity levels)
  response_patterns jsonb[] := ARRAY[
    -- Pattern 1: Very Teal organization (high scores across all dimensions)
    '{"q1": 5, "q2": 5, "q3": 4, "q4": 5, "q5": 5, "q6": 5, "q7": 4, "q8": 5, "q9": 5, "q10": 4, "q11": 5, "q12": 5, "q13": 4, "q14": 5, "q15": 5}'::jsonb,
    
    -- Pattern 2: Moderately Teal (good scores, some areas for improvement)
    '{"q1": 4, "q2": 4, "q3": 3, "q4": 4, "q5": 4, "q6": 4, "q7": 3, "q8": 4, "q9": 4, "q10": 3, "q11": 4, "q12": 4, "q13": 3, "q14": 4, "q15": 4}'::jsonb,
    
    -- Pattern 3: Traditional organization (low scores)
    '{"q1": 2, "q2": 2, "q3": 2, "q4": 2, "q5": 2, "q6": 2, "q7": 2, "q8": 2, "q9": 2, "q10": 2, "q11": 2, "q12": 2, "q13": 2, "q14": 2, "q15": 2}'::jsonb,
    
    -- Pattern 4: Strong in Self-Management, weak in others
    '{"q1": 5, "q2": 5, "q3": 4, "q4": 5, "q5": 5, "q6": 2, "q7": 2, "q8": 3, "q9": 2, "q10": 2, "q11": 3, "q12": 2, "q13": 2, "q14": 3, "q15": 2}'::jsonb,
    
    -- Pattern 5: Strong in Wholeness, weak in others
    '{"q1": 2, "q2": 3, "q3": 2, "q4": 2, "q5": 3, "q6": 5, "q7": 5, "q8": 4, "q9": 5, "q10": 5, "q11": 2, "q12": 3, "q13": 2, "q14": 2, "q15": 3}'::jsonb,
    
    -- Pattern 6: Strong in Evolutionary Purpose, weak in others
    '{"q1": 2, "q2": 2, "q3": 3, "q4": 2, "q5": 2, "q6": 3, "q7": 2, "q8": 2, "q9": 3, "q10": 2, "q11": 5, "q12": 5, "q13": 4, "q14": 5, "q15": 5}'::jsonb,
    
    -- Pattern 7: Mixed/Transitioning organization
    '{"q1": 3, "q2": 4, "q3": 3, "q4": 3, "q5": 4, "q6": 3, "q7": 4, "q8": 3, "q9": 3, "q10": 4, "q11": 3, "q12": 4, "q13": 3, "q14": 3, "q15": 4}'::jsonb,
    
    -- Pattern 8: Highly Teal with some challenges
    '{"q1": 5, "q2": 4, "q3": 5, "q4": 5, "q5": 4, "q6": 5, "q7": 4, "q8": 5, "q9": 4, "q10": 5, "q11": 5, "q12": 4, "q13": 5, "q14": 4, "q15": 5}'::jsonb,
    
    -- Pattern 9: Early stage Teal journey
    '{"q1": 3, "q2": 3, "q3": 2, "q4": 3, "q5": 3, "q6": 3, "q7": 3, "q8": 2, "q9": 3, "q10": 3, "q11": 3, "q12": 3, "q13": 2, "q14": 3, "q15": 3}'::jsonb,
    
    -- Pattern 10: Balanced moderate scores
    '{"q1": 4, "q2": 3, "q3": 4, "q4": 3, "q5": 4, "q6": 4, "q7": 3, "q8": 4, "q9": 3, "q10": 4, "q11": 4, "q12": 3, "q13": 4, "q14": 3, "q15": 4}'::jsonb
  ];
  
  participant_names text[] := ARRAY[
    'Sarah Johnson',
    'Michael Chen',
    'Emma Williams',
    'David Martinez',
    'Lisa Anderson',
    'James Taylor',
    'Maria Garcia',
    'Robert Brown',
    'Jennifer Davis',
    'Christopher Wilson'
  ];
  
  participant_emails text[] := ARRAY[
    'sarah.johnson@testkunde2.com',
    'michael.chen@testkunde2.com',
    'emma.williams@testkunde2.com',
    'david.martinez@testkunde2.com',
    'lisa.anderson@testkunde2.com',
    'james.taylor@testkunde2.com',
    'maria.garcia@testkunde2.com',
    'robert.brown@testkunde2.com',
    'jennifer.davis@testkunde2.com',
    'christopher.wilson@testkunde2.com'
  ];

BEGIN
  -- Get organization ID for Testkunde 2
  SELECT id INTO org_id FROM organizations WHERE name = 'Testkunde 2' LIMIT 1;
  
  -- Get the active questionnaire ID
  SELECT id INTO questionnaire_id FROM questionnaires 
  WHERE organization_id = org_id 
  AND status = 'active' 
  LIMIT 1;
  
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Organization "Testkunde 2" not found';
  END IF;
  
  IF questionnaire_id IS NULL THEN
    RAISE EXCEPTION 'No active questionnaire found for Testkunde 2';
  END IF;
  
  -- Generate 10 participants and responses
  FOR i IN 1..10 LOOP
    -- Create participant
    INSERT INTO participants (organization_id, email, name)
    VALUES (org_id, participant_emails[i], participant_names[i])
    RETURNING id INTO participant_id;
    
    -- Generate access token
    token_value := encode(gen_random_bytes(32), 'hex');
    
    -- Create access token
    INSERT INTO participant_access_tokens (participant_id, questionnaire_id, token, expires_at)
    VALUES (participant_id, questionnaire_id, token_value, NOW() + INTERVAL '30 days');
    
    -- Create response
    INSERT INTO questionnaire_responses (questionnaire_id, participant_id, answers, submitted_at)
    VALUES (questionnaire_id, participant_id, response_patterns[i], NOW() - (INTERVAL '1 day' * (10 - i)));
    
    RAISE NOTICE 'Created participant % with response pattern %', participant_names[i], i;
  END LOOP;
  
  RAISE NOTICE 'Successfully created 10 test participants and responses';
END $$;

