import { createSSRClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/types'
import Link from 'next/link'
import InviteAuditorForm from '@/components/InviteAuditorForm'
import { isOrgAdmin } from '@/lib/auth/roles'

export default async function OrgDashboard({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createSSRClient()

  // Get organization
  const { data: orgData } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!orgData) return null

  const org = orgData as Tables<'organizations'>

  // Check if user is org admin
  const userIsOrgAdmin = await isOrgAdmin(supabase, org.id)

  // First, get questionnaire IDs for this organization
  const { data: questionnairesData } = await supabase
    .from('questionnaires')
    .select('id')
    .eq('organization_id', org.id)

  const questionnaires = (questionnairesData || []) as { id: string }[]
  const questionnaireIds = questionnaires.map(q => q.id)

  // Get statistics
  const [
    { count: questionnaireCount },
    { count: participantCount },
    { count: responseCount },
    { count: memberCount },
  ] = await Promise.all([
    supabase
      .from('questionnaires')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id),
    supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id),
    questionnaireIds.length > 0
      ? supabase
          .from('questionnaire_responses')
          .select('questionnaire_id', { count: 'exact', head: true })
          .in('questionnaire_id', questionnaireIds)
      : Promise.resolve({ count: 0 }),
    supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id),
  ])

  // Get recent questionnaires
  const { data: recentQuestionnairesData } = await supabase
    .from('questionnaires')
    .select('*')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const recentQuestionnaires = (recentQuestionnairesData || []) as Tables<'questionnaires'>[]

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-600">{org.description}</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Questionnaires
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {questionnaireCount || 0}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Participants
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {participantCount || 0}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Responses
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {responseCount || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Team Members
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {memberCount || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Team Members
          </h3>
          {userIsOrgAdmin && <InviteAuditorForm organizationId={org.id} />}
        </div>
        <div className="px-4 py-5 sm:px-6">
          <p className="text-sm text-gray-500">
            {memberCount || 0} member{memberCount !== 1 ? 's' : ''} in this organization
          </p>
          <Link
            href={`/app/org/${slug}/members`}
            className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-500"
          >
            View all members →
          </Link>
        </div>
      </div>

      {/* Recent Questionnaires */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Questionnaires
          </h3>
          <Link
            href={`/app/org/${slug}/questionnaires`}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            View all
          </Link>
        </div>
        <ul className="divide-y divide-gray-200">
          {recentQuestionnaires && recentQuestionnaires.length > 0 ? (
            recentQuestionnaires.map((q) => (
              <li key={q.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {q.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      Status:{' '}
                      <span className="capitalize">{q.status}</span>
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(q.created_at).toLocaleDateString()}
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-4 sm:px-6 text-sm text-gray-500">
              No questionnaires yet
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
