import { createSSRClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import InviteAdminForm from '@/components/InviteAdminForm'
import OrganizationApproaches from '@/components/OrganizationApproaches'

// Disable caching for this page to always show fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSSRClient()

  // Get organization details
  const { data: org, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !org) {
    notFound()
  }

  // Get organization members with user emails
  const adminClient = createAdminClient()
  const { data: membersData } = await adminClient
    .from('organization_members')
    .select('*')
    .eq('organization_id', id)

  // Fetch user emails for each member
  const members = membersData ? await Promise.all(
    membersData.map(async (member) => {
      const { data: userData } = await adminClient.auth.admin.getUserById(member.user_id)
      return {
        ...member,
        user: { email: userData.user?.email || 'Unknown' }
      }
    })
  ) : []

  // Get questionnaires
  const { data: questionnaires } = await supabase
    .from('questionnaires')
    .select('*')
    .eq('organization_id', id)
    .order('created_at', { ascending: false })

  // Get participants
  const { data: participants } = await supabase
    .from('participants')
    .select('*')
    .eq('organization_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="px-4 sm:px-0">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/app/admin/organizations"
          className="text-sm text-blue-600 hover:text-blue-500 mb-2 inline-block"
        >
          ← Back to Organizations
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
        <p className="mt-1 text-sm text-gray-500">/{org.slug}</p>
        {org.description && (
          <p className="mt-2 text-sm text-gray-700">{org.description}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="text-sm font-medium text-gray-500">Members</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">
              {members?.length || 0}
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="text-sm font-medium text-gray-500">
              Questionnaires
            </div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">
              {questionnaires?.length || 0}
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="text-sm font-medium text-gray-500">
              Participants
            </div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">
              {participants?.length || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Members Section */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Members
          </h3>
          <InviteAdminForm organizationId={id} />
        </div>
        <ul className="divide-y divide-gray-200">
          {members && members.length > 0 ? (
            members.map((member: any) => (
              <li key={member.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {member.user?.email || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Role: {member.role}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    Added {new Date(member.created_at).toLocaleDateString()}
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-4 sm:px-6 text-sm text-gray-500">
              No members yet
            </li>
          )}
        </ul>
      </div>

      {/* Approaches Section */}
      <div className="mb-6">
        <OrganizationApproaches organizationId={id} />
      </div>

      {/* Questionnaires Section */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Questionnaires
          </h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {questionnaires && questionnaires.length > 0 ? (
            questionnaires.map((q) => (
              <li key={q.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {q.title}
                    </p>
                    <p className="text-sm text-gray-500">Status: {q.status}</p>
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

