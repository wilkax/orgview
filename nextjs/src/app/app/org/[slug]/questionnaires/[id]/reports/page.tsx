/**
 * Reports List Page
 * 
 * Lists all available reports for a questionnaire
 */

import { createSSRClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ReportsListClient } from '@/components/reports/ReportsListClient';

interface PageProps {
  params: Promise<{
    slug: string;
    id: string;
  }>;
}

export default async function ReportsListPage({ params }: PageProps) {
  const { slug, id: questionnaireId } = await params;
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

  // Fetch questionnaire
  const { data: questionnaire, error: qError } = await supabase
    .from('questionnaires')
    .select('id, title, status, organization_id, approach_questionnaire_id')
    .eq('id', questionnaireId)
    .eq('organization_id', orgId)
    .single();

  if (qError || !questionnaire) {
    notFound();
  }

  const questionnaireData = questionnaire as {
    id: string;
    title: string;
    status: string;
    organization_id: string;
    approach_questionnaire_id: string;
  };

  // Get the approach from the approach_questionnaire
  const { data: approachQuestionnaire } = await supabase
    .from('approach_questionnaires')
    .select('approach_id')
    .eq('id', questionnaireData.approach_questionnaire_id)
    .single();

  const approachId = (approachQuestionnaire as { approach_id: string } | null)?.approach_id;

  // Fetch available report templates for this approach
  const { data: templates } = await supabase
    .from('approach_report_templates')
    .select('id, name, type, description')
    .eq('approach_id', approachId || '')
    .order('order', { ascending: true });

  type TemplateData = {
    id: string;
    name: string;
    type: string;
    description?: string;
  };

  const availableTemplates = (templates || []) as TemplateData[];

  // Count responses
  const { count: responseCount } = await supabase
    .from('questionnaire_responses')
    .select('*', { count: 'exact', head: true })
    .eq('questionnaire_id', questionnaireId);

  // Fetch all reports
  const { data: reports } = await supabase
    .from('organization_reports')
    .select(`
      id,
      template_id,
      status,
      generated_at,
      response_count,
      template:approach_report_templates(id, name, type, description)
    `)
    .eq('questionnaire_id', questionnaireId)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  type ReportData = {
    id: string;
    template_id: string;
    status: string;
    generated_at: string | null;
    response_count: number;
    template: { id: string; name: string; type: string; description?: string };
  };

  const reportsData = (reports || []) as ReportData[];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center space-x-2 text-sm text-gray-600">
        <Link href={`/app/org/${slug}`} className="hover:text-gray-900">
          {orgName}
        </Link>
        <span>/</span>
        <Link
          href={`/app/org/${slug}/questionnaires/${questionnaireId}`}
          className="hover:text-gray-900"
        >
          {questionnaireData.title}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Reports</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
        <p className="text-gray-600">
          View and generate reports for {questionnaireData.title}
        </p>
      </div>

      {/* Reports List Client Component */}
      <ReportsListClient
        slug={slug}
        questionnaireId={questionnaireId}
        questionnaireTitle={questionnaireData.title}
        responseCount={responseCount || 0}
        reports={reportsData}
        availableTemplates={availableTemplates}
      />
    </div>
  );
}

