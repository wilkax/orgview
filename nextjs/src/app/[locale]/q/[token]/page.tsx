import { createSSRClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/types'
import { redirect } from 'next/navigation'
import QuestionnaireResponseForm from '@/components/QuestionnaireResponseForm'
import QuestionnaireLanguageSelector from '@/components/QuestionnaireLanguageSelector'
import { getTranslations } from 'next-intl/server'

export default async function ParticipantQuestionnairePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createSSRClient()
  const t = await getTranslations('questionnaire')

  // Validate token
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tokenValidation } = await (supabase as any).rpc(
    'validate_participant_token',
    {
      token_value: token,
    }
  )

  if (
    !tokenValidation ||
    tokenValidation.length === 0 ||
    !tokenValidation[0].is_valid
  ) {
    redirect('/invalid-token')
  }

  const tokenInfo = tokenValidation[0]

  // Get questionnaire
  const { data: questionnaireData } = await supabase
    .from('questionnaires')
    .select('*')
    .eq('id', tokenInfo.questionnaire_id)
    .single()

  if (!questionnaireData) {
    redirect('/invalid-token')
  }

  const questionnaire = questionnaireData as Tables<'questionnaires'>

  // Get participant
  const { data: participantData } = await supabase
    .from('participants')
    .select('*')
    .eq('id', tokenInfo.participant_id)
    .single()

  if (!participantData) {
    redirect('/invalid-token')
  }

  const participant = participantData as Tables<'participants'>

  // Get organization
  const { data: organizationData } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', tokenInfo.organization_id)
    .single()

  if (!organizationData) {
    redirect('/invalid-token')
  }

  const organization = organizationData as Tables<'organizations'>

  // Check for existing response
  const { data: existingResponseData } = await supabase
    .from('questionnaire_responses')
    .select('*')
    .eq('questionnaire_id', tokenInfo.questionnaire_id)
    .eq('participant_id', tokenInfo.participant_id)
    .maybeSingle()

  const existingResponse = existingResponseData ? (existingResponseData as Tables<'questionnaire_responses'>) : null

  if (!questionnaire || !participant || !organization) {
    redirect('/invalid-token')
  }

  // Check time frame
  const now = new Date()
  const startDate = questionnaire.start_date ? new Date(questionnaire.start_date) : null
  const endDate = questionnaire.end_date ? new Date(questionnaire.end_date) : null

  const isBeforeStart = startDate && now < startDate
  const isAfterEnd = endDate && now > endDate
  const isWithinTimeFrame = !isBeforeStart && !isAfterEnd

  // Get available languages from questionnaire
  const availableLanguages = questionnaire.available_languages || ['en'];

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-4 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">{organization.name}</div>
              <h1 className="text-xl font-bold text-gray-900">
                {questionnaire.title}
              </h1>
              {questionnaire.description && (
                <p className="mt-1 text-sm text-gray-600">{questionnaire.description}</p>
              )}
            </div>
            {/* Language Selector */}
            {availableLanguages.length > 1 && (
              <QuestionnaireLanguageSelector availableLanguages={availableLanguages} />
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              {t('participant')}: <span className="font-medium">{participant.email}</span>
              {participant.name && ` (${participant.name})`}
            </p>
            {(startDate || endDate) && (
              <p className="text-xs text-gray-500 mt-1">
                {startDate && `${t('availableFrom')}: ${startDate.toLocaleDateString()}`}
                {startDate && endDate && ' • '}
                {endDate && `${t('until')}: ${endDate.toLocaleDateString()}`}
              </p>
            )}
          </div>
        </div>

        {/* Time Frame Warning */}
        {isBeforeStart && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-4 w-4 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-2">
                <h3 className="text-xs font-medium text-yellow-800">
                  {t('notYetAvailable')}
                </h3>
                <p className="mt-0.5 text-xs text-yellow-700">
                  {t('notYetAvailableMessage', { date: startDate?.toLocaleDateString() })}
                </p>
              </div>
            </div>
          </div>
        )}

        {isAfterEnd && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-4 w-4 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-2">
                <h3 className="text-xs font-medium text-red-800">
                  {t('closed')}
                </h3>
                <p className="mt-0.5 text-xs text-red-700">
                  {t('closedMessage', { date: endDate?.toLocaleDateString() })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Message */}
        {questionnaire.status !== 'active' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-4 w-4 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-2">
                <h3 className="text-xs font-medium text-yellow-800">
                  Questionnaire {questionnaire.status}
                </h3>
                <p className="mt-0.5 text-xs text-yellow-700">
                  This questionnaire is currently {questionnaire.status} and may
                  not accept responses.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Existing Response Message */}
        {existingResponse && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-4 w-4 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-2">
                <h3 className="text-xs font-medium text-blue-800">
                  Response already submitted
                </h3>
                <p className="mt-0.5 text-xs text-blue-700">
                  You submitted a response on{' '}
                  {new Date(existingResponse.submitted_at).toLocaleString()}.
                  You can update your response below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Questionnaire Form */}
        <QuestionnaireResponseForm
          questionnaire={questionnaire}
          participant={participant}
          existingResponse={existingResponse}
          isWithinTimeFrame={isWithinTimeFrame}
        />
      </div>
    </div>
  )
}

