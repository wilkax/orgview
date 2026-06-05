import { createSSRClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Tables } from '@/lib/types'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface QuestionSchema {
  id: string
  text: string
  type: 'scale' | 'single-choice' | 'multiple-choice' | 'ranking' | 'free-text'
  scale?: { min: number; max: number; minLabel: string; maxLabel: string }
  options?: string[]
}

interface SectionSchema {
  id: string
  title: string
  description?: string
  questions: QuestionSchema[]
}

interface QuestionnaireSchema {
  sections: SectionSchema[]
}

type ResponseAnswers = Record<string, unknown>

function renderAnswer(question: QuestionSchema, answers: ResponseAnswers): string {
  const value = answers[question.id]
  if (value === undefined || value === null || value === '') return '—'

  switch (question.type) {
    case 'scale':
      return String(value)
    case 'free-text':
      return String(value)
    case 'single-choice': {
      const idx = typeof value === 'number' ? value : parseInt(String(value), 10)
      if (!isNaN(idx) && question.options) return question.options[idx] ?? String(value)
      return String(value)
    }
    case 'multiple-choice':
    case 'ranking': {
      if (Array.isArray(value)) {
        return value
          .map((v) => {
            const idx = typeof v === 'number' ? v : parseInt(String(v), 10)
            if (!isNaN(idx) && question.options) return question.options[idx] ?? String(v)
            return String(v)
          })
          .join(', ')
      }
      return String(value)
    }
    default:
      return String(value)
  }
}

export default async function ParticipantResultPage({
  params,
}: {
  params: Promise<{ slug: string; participantId: string }>
}) {
  const { slug, participantId } = await params
  const supabase = await createSSRClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get organization
  const { data: orgData } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (!orgData) notFound()
  const org = orgData as { id: string; name: string }

  // Fetch participant via admin client (bypasses RLS)
  const adminClient = createAdminClient()
  const { data: participantData } = await adminClient
    .from('participants')
    .select('*')
    .eq('id', participantId)
    .eq('organization_id', org.id)
    .single()

  if (!participantData) notFound()
  const participant = participantData as Tables<'participants'>

  // Fetch all responses for this participant
  const { data: responsesData } = await adminClient
    .from('questionnaire_responses')
    .select('id, questionnaire_id, answers, submitted_at')
    .eq('participant_id', participantId)
    .order('submitted_at', { ascending: false })

  const responses = (responsesData || []) as Array<{
    id: string
    questionnaire_id: string
    answers: ResponseAnswers
    submitted_at: string
  }>

  // Fetch questionnaire schemas for each unique questionnaire
  const questionnaireIds = [...new Set(responses.map((r) => r.questionnaire_id))]
  const questionnairesMap: Record<string, { title: string; schema: QuestionnaireSchema }> = {}

  if (questionnaireIds.length > 0) {
    const { data: questionnairesData } = await adminClient
      .from('questionnaires')
      .select('id, title, schema')
      .in('id', questionnaireIds)

    for (const q of questionnairesData || []) {
      const schema = q.schema as unknown as QuestionnaireSchema
      if (schema?.sections) {
        questionnairesMap[q.id] = { title: q.title, schema }
      }
    }
  }

  return (
    <div className="px-4 sm:px-0">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/app/org/${slug}/participants`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Participants
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {participant.name || participant.email}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{participant.email}</p>
      </div>

      {/* No responses */}
      {responses.length === 0 && (
        <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
          <p className="text-sm">This participant has not submitted any responses yet.</p>
        </div>
      )}

      {/* Responses */}
      {responses.map((response) => {
        const q = questionnairesMap[response.questionnaire_id]
        if (!q) return null
        return (
          <div key={response.id} className="bg-white shadow rounded-lg mb-6 overflow-hidden">
            {/* Questionnaire header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{q.title}</h2>
              <span className="text-xs text-gray-500">
                Submitted: {new Date(response.submitted_at).toLocaleString()}
              </span>
            </div>

            {/* Sections & Questions */}
            <div className="divide-y divide-gray-100">
              {q.schema.sections.map((section) => (
                <div key={section.id} className="px-6 py-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    {section.title}
                  </h3>
                  <div className="space-y-4">
                    {section.questions.map((question) => {
                      const answerText = renderAnswer(question, response.answers)
                      return (
                        <div key={question.id} className="flex flex-col gap-1">
                          <p className="text-sm text-gray-800">{question.text}</p>
                          <p className="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md self-start">
                            {answerText}
                          </p>
                          {question.type === 'scale' && question.scale && (
                            <p className="text-xs text-gray-400">
                              Scale {question.scale.min}–{question.scale.max}
                              {' '}({question.scale.minLabel} → {question.scale.maxLabel})
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

