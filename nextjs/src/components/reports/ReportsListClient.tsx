'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BarChart3, FileText, LayoutDashboard, RefreshCw, AlertCircle } from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  type: string;
  description?: string;
}

interface Report {
  id: string;
  template_id: string;
  status: string;
  generated_at: string | null;
  response_count: number;
  template: ReportTemplate;
}

interface ReportsListClientProps {
  slug: string;
  questionnaireId: string;
  questionnaireTitle: string;
  responseCount: number;
  reports: Report[];
  availableTemplates: ReportTemplate[];
}

export function ReportsListClient({
  slug,
  questionnaireId,
  responseCount,
  reports: initialReports,
  availableTemplates,
}: ReportsListClientProps) {
  const [reports] = useState(initialReports);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = responseCount >= 5;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'visualization':
        return <BarChart3 className="h-5 w-5" />;
      case 'pdf':
        return <FileText className="h-5 w-5" />;
      case 'dashboard':
        return <LayoutDashboard className="h-5 w-5" />;
      default:
        return <BarChart3 className="h-5 w-5" />;
    }
  };

  const generateAllReports = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/org/${slug}/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionnaireId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate reports');
      }

      // Refresh the page to show new reports
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate reports');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      {/* Response count info */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">
              Total Responses: {responseCount}
            </p>
            {!canGenerate && (
              <p className="text-sm text-blue-700 mt-1">
                At least 5 responses are required to generate reports
              </p>
            )}
            {availableTemplates.length > 0 && (
              <p className="text-sm text-blue-700 mt-1">
                {availableTemplates.length} report template{availableTemplates.length !== 1 ? 's' : ''} available
              </p>
            )}
          </div>
          {canGenerate && availableTemplates.length > 0 && (
            <button
              onClick={generateAllReports}
              disabled={generating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : 'Generate All Reports'}
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Error generating reports</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Reports list */}
      {reports.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/app/org/${slug}/questionnaires/${questionnaireId}/reports/${report.id}`}
              className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="text-gray-400">
                    {getTypeIcon(report.template.type)}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {report.template.name}
                  </h3>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    report.status === 'ready'
                      ? 'bg-green-100 text-green-800'
                      : report.status === 'generating'
                      ? 'bg-blue-100 text-blue-800'
                      : report.status === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {report.status}
                </span>
              </div>

              {report.template.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {report.template.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="capitalize">{report.template.type}</span>
                {report.generated_at && (
                  <span>
                    {new Date(report.generated_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <div className="text-gray-400 mb-4">
            <BarChart3 className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-500 mb-4">No reports generated yet</p>
          {canGenerate && availableTemplates.length > 0 && (
            <button
              onClick={generateAllReports}
              disabled={generating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : 'Generate Reports'}
            </button>
          )}
          {!canGenerate && (
            <p className="text-sm text-gray-500">
              Collect at least 5 responses to generate reports
            </p>
          )}
        </div>
      )}
    </div>
  );
}

