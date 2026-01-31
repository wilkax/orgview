import { Database, Json } from '@/lib/types'
import { SupabaseClient } from '@supabase/supabase-js'

export interface ParticipantTokenInfo {
  isValid: boolean
  participantId: string | null
  questionnaireId: string | null
  organizationId: string | null
}

/**
 * Validate a participant access token
 */
export async function validateParticipantToken(
  supabase: SupabaseClient<Database>,
  token: string
): Promise<ParticipantTokenInfo> {
  const { data, error } = await supabase.rpc('validate_participant_token', {
    token_value: token,
  })

  if (error || !data || data.length === 0) {
    return {
      isValid: false,
      participantId: null,
      questionnaireId: null,
      organizationId: null,
    }
  }

  const tokenData = data[0]

  return {
    isValid: tokenData.is_valid,
    participantId: tokenData.participant_id,
    questionnaireId: tokenData.questionnaire_id,
    organizationId: tokenData.organization_id,
  }
}

/**
 * Mark a participant token as used
 */
export async function markTokenAsUsed(
  supabase: SupabaseClient<Database>,
  token: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('mark_token_used', {
    token_value: token,
  })

  if (error) {
    console.error('Error marking token as used:', error)
    return false
  }

  return data || false
}

/**
 * Get participant information by token
 */
export async function getParticipantByToken(
  supabase: SupabaseClient<Database>,
  token: string
) {
  // First validate the token
  const tokenInfo = await validateParticipantToken(supabase, token)

  if (!tokenInfo.isValid || !tokenInfo.participantId) {
    return null
  }

  // Get participant details
  const { data: participant, error } = await supabase
    .from('participants')
    .select('*')
    .eq('id', tokenInfo.participantId)
    .single()

  if (error) {
    console.error('Error fetching participant:', error)
    return null
  }

  return participant
}

/**
 * Get questionnaire for a participant token
 */
export async function getQuestionnaireByToken(
  supabase: SupabaseClient<Database>,
  token: string
) {
  // First validate the token
  const tokenInfo = await validateParticipantToken(supabase, token)

  if (!tokenInfo.isValid || !tokenInfo.questionnaireId) {
    return null
  }

  // Get questionnaire details
  const { data: questionnaire, error } = await supabase
    .from('questionnaires')
    .select('*')
    .eq('id', tokenInfo.questionnaireId)
    .single()

  if (error) {
    console.error('Error fetching questionnaire:', error)
    return null
  }

  return questionnaire
}

/**
 * Submit or update a questionnaire response
 */
export async function submitQuestionnaireResponse(
  supabase: SupabaseClient<Database>,
  token: string,
  answers: Json
) {
  const tokenInfo = await validateParticipantToken(supabase, token)

  if (!tokenInfo.isValid || !tokenInfo.participantId || !tokenInfo.questionnaireId) {
    throw new Error('Invalid token')
  }

  // Upsert the response
  const { data, error } = await supabase
    .from('questionnaire_responses')
    .upsert({
      questionnaire_id: tokenInfo.questionnaireId,
      participant_id: tokenInfo.participantId,
      answers,
    })
    .select()
    .single()

  if (error) {
    console.error('Error submitting response:', error)
    throw error
  }

  return data
}

/**
 * Get existing response for a participant token
 */
export async function getExistingResponse(
  supabase: SupabaseClient<Database>,
  token: string
) {
  const tokenInfo = await validateParticipantToken(supabase, token)

  if (!tokenInfo.isValid || !tokenInfo.participantId || !tokenInfo.questionnaireId) {
    return null
  }

  const { data, error } = await supabase
    .from('questionnaire_responses')
    .select('*')
    .eq('questionnaire_id', tokenInfo.questionnaireId)
    .eq('participant_id', tokenInfo.participantId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching existing response:', error)
    return null
  }

  return data
}

