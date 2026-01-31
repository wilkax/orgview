import { redirect } from 'next/navigation'
import { createSSRClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/types'
import Link from 'next/link'

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createSSRClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get organization by slug
  const { data: orgData, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !orgData) {
    redirect('/app')
  }

  const org = orgData as Tables<'organizations'>

  // Check if user has access (system admin or org member)
  const { data: isSystemAdmin } = await supabase.rpc('is_system_admin')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: isOrgMember } = await (supabase as any).rpc('is_org_member', {
    org_id: org.id,
  })

  if (!isSystemAdmin && !isOrgMember) {
    redirect('/app')
  }

  // Get user's role in the organization
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userRole } = await (supabase as any).rpc('get_user_org_role', {
    org_id: org.id,
  })

  const isAdmin = isSystemAdmin || userRole === 'admin'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Organization Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">{org.name}</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href={`/org/${slug}`}
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href={`/org/${slug}/questionnaires`}
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Questionnaires
                </Link>
                <Link
                  href={`/org/${slug}/participants`}
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Participants
                </Link>
                {isAdmin && (
                  <Link
                    href={`/org/${slug}/settings`}
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Settings
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isSystemAdmin && (
                <Link
                  href="/admin"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Admin Panel
                </Link>
              )}
              <Link
                href="/app"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Back to App
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

