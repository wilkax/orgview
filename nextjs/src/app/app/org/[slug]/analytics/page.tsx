/**
 * Analytics Page
 * 
 * Lists all questionnaires with their available reports for quick access
 */

import { createSSRClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, FileText, LayoutDashboard, ChevronRight } from 'lucide-react';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function AnalyticsPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createSSRClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Get organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', slug)
    .single();

  if (orgError || !org) {
    notFound();
  }

  const orgId = (org as { id: string; name: string }).id;
  const orgName = (org as { id: string; name: string }).name;

  // Fetch all questionnaires for this organization
  const { data: questionnaires } = await supabase
    .from('questionnaires')
    .select('id, title, status, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  type QuestionnaireData = {
    id: string;
    title: string;
    status: string;
    created_at: string;
  };

  const questionnairesData = (questionnaires || []) as QuestionnaireData[];

  // For each questionnaire, fetch report count and response count
  const questionnairesWithStats = await Promise.all(
    questionnairesData.map(async (q) => {
      const { count: reportCount } = await supabase
        .from('organization_reports')
        .select('*', { count: 'exact', head: true })
        .eq('questionnaire_id', q.id)
        .eq('organization_id', orgId)
        .eq('status', 'ready');

      const { count: responseCount } = await supabase
        .from('questionnaire_responses')
        .select('*', { count: 'exact', head: true })
        .eq('questionnaire_id', q.id);

      return {
        ...q,
        reportCount: reportCount || 0,
        responseCount: responseCount || 0,
      };
    })
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'visualization':
        return <BarChart3 className="h-4 w-4" />;
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'dashboard':
        return <LayoutDashboard className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
        <p className="text-gray-600">
          View reports and analytics for all questionnaires in {orgName}
        </p>
      </div>

      {/* Questionnaires List */}
      {questionnairesWithStats.length > 0 ? (
        <div className="space-y-4">
          {questionnairesWithStats.map((questionnaire) => (
            <div
              key={questionnaire.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {questionnaire.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        questionnaire.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : questionnaire.status === 'draft'
                          ? 'bg-gray-100 text-gray-800'
                          : questionnaire.status === 'closed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {questionnaire.status}
                    </span>
                    <span>{questionnaire.responseCount} responses</span>
                    <span>{questionnaire.reportCount} reports available</span>
                  </div>

                  {questionnaire.reportCount > 0 ? (
                    <Link
                      href={`/app/org/${slug}/questionnaires/${questionnaire.id}/reports`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      View Reports
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <div className="text-sm text-gray-500">
                      {questionnaire.responseCount >= 5 ? (
                        <Link
                          href={`/app/org/${slug}/questionnaires/${questionnaire.id}/reports`}
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                        >
                          Generate Reports
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      ) : (
                        <span>Need at least 5 responses to generate reports</span>
                      )}
                    </div>
                  )}
                </div>

                <Link
                  href={`/app/org/${slug}/questionnaires/${questionnaire.id}`}
                  className="ml-4 text-sm text-gray-500 hover:text-gray-700"
                >
                  View Questionnaire →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No questionnaires yet</h3>
          <p className="text-gray-500 mb-4">
            Create a questionnaire to start collecting data and generating reports
          </p>
          <Link
            href={`/app/org/${slug}/questionnaires`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            Go to Questionnaires
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}


