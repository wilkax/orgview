import { createSSRClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTranslations } from 'next-intl/server'
import { Tables } from '@/lib/types'
import ParticipantsFilterTable, { ParticipantRow, QuestionnaireOption } from '@/components/ParticipantsFilterTable'

export default async function ParticipantsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const t = await getTranslations('organization')
  const supabase = await createSSRClient()

  // Get organization
  const { data: orgData } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!orgData) return null

  const org = orgData as Tables<'organizations'>

  const adminClient = createAdminClient()

  // Fetch participants, questionnaires, access tokens, and responses in parallel
  const [
    { data: participantsData },
    { data: questionnairesData },
  ] = await Promise.all([
    supabase
      .from('participants')
      .select('*')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('questionnaires')
      .select('id, title')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false }),
  ])

  const participants = (participantsData || []) as Tables<'participants'>[]
  const questionnaires: QuestionnaireOption[] = (questionnairesData || []) as QuestionnaireOption[]

  // Build sets of responded participants and participant→questionnaire map
  const respondedSet = new Set<string>()
  const participantQuestionnaireMap = new Map<string, string[]>()

  if (participants.length > 0) {
    const participantIds = participants.map((p) => p.id)

    // questionnaire_responses is the source of truth: it has both participant_id and
    // questionnaire_id for every submission, regardless of whether the participant used
    // a shared or individual access token.
    const { data: responsesData } = await adminClient
      .from('questionnaire_responses')
      .select('participant_id, questionnaire_id')
      .in('participant_id', participantIds)

    for (const r of responsesData || []) {
      respondedSet.add(r.participant_id)

      const existing = participantQuestionnaireMap.get(r.participant_id) ?? []
      if (!existing.includes(r.questionnaire_id)) {
        existing.push(r.questionnaire_id)
      }
      participantQuestionnaireMap.set(r.participant_id, existing)
    }
  }

  const participantRows: ParticipantRow[] = participants.map((p) => ({
    id: p.id,
    email: p.email,
    name: p.name ?? null,
    created_at: p.created_at,
    questionnaireIds: participantQuestionnaireMap.get(p.id) ?? [],
    hasResponded: respondedSet.has(p.id),
  }))

  const labels = {
    searchPlaceholder: t('searchPlaceholder'),
    filterByQuestionnaire: t('filterByQuestionnaire'),
    allQuestionnaires: t('allQuestionnaires'),
    filterByStatus: t('filterByStatus'),
    allStatuses: t('allStatuses'),
    statusResponded: t('statusResponded'),
    statusNotResponded: t('statusNotResponded'),
    noResults: t('noResults'),
    email: t('common.email'),
    name: t('common.name'),
    created: t('created'),
    actions: t('common.actions'),
    view: t('common.view'),
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">{t('participants')}</h1>
          <p className="mt-2 text-sm text-gray-700">
            {t('manageParticipants', { org: org.name })}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            disabled
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {t('addParticipant')}
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden p-4">
        {participants.length > 0 ? (
          <ParticipantsFilterTable
            participants={participantRows}
            questionnaires={questionnaires}
            slug={slug}
            labels={labels}
          />
        ) : (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {t('noParticipants')}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('getStartedParticipants')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

