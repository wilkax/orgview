import { createSSRClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/types'

export default async function QuestionnairesPage({
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

  // Get questionnaires
  const { data: questionnairesData } = await supabase
    .from('questionnaires')
    .select('*')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })

  const questionnaires = (questionnairesData || []) as Tables<'questionnaires'>[]

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Questionnaires</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage questionnaires for {org.name}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            disabled
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Create Questionnaire
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {questionnaires && questionnaires.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {questionnaires.map((q) => (
              <li key={q.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {q.title}
                    </h3>
                    {q.description && (
                      <p className="mt-1 text-sm text-gray-500">
                        {q.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center space-x-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          q.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : q.status === 'draft'
                            ? 'bg-gray-100 text-gray-800'
                            : q.status === 'closed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {q.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        Created {new Date(q.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <button
                      disabled
                      className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50"
                    >
                      View
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No questionnaires
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new questionnaire.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

