/**
 * DashboardRenderer - Renders dashboard type reports
 * 
 * Displays multiple widgets and visualizations in a dashboard layout
 */

'use client';

import { ReactNode } from 'react';
import { BaseRenderer } from './BaseRenderer';
import {
  ReportType,
  ComputedReportData,
  ReportTemplateConfig,
  DashboardWidget
} from '../types';

export class DashboardRenderer extends BaseRenderer {
  type: ReportType = 'dashboard';

  /**
   * Renders the dashboard
   */
  render(data: ComputedReportData, config: ReportTemplateConfig): ReactNode {
    this.validateData(data);
    this.validateConfig(config);

    if (!config.dashboard) {
      throw new Error('Dashboard configuration is required');
    }

    const { layout = 'grid', widgets = [] } = config.dashboard;

    return (
      <div className="dashboard-container">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {this.renderSummaryCards(data)}
        </div>

        {/* Main Dashboard Content */}
        <div className={this.getLayoutClass(layout)}>
          {this.renderWidgets(data, widgets)}
        </div>
      </div>
    );
  }

  /**
   * Renders summary cards at the top
   */
  private renderSummaryCards(data: ComputedReportData): ReactNode {
    return (
      <>
        {/* Overall Score Card */}
        {data.overall_score !== undefined && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Overall Score
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {this.formatNumber(data.overall_score, 1)}
            </p>
            <div className="mt-2 flex items-center">
              <div
                className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${data.overall_score}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Response Count Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Total Responses
          </h3>
          <p className="text-3xl font-bold text-gray-900">
            {data.response_count}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {data.response_count >= 5 ? '✓ Sufficient data' : '⚠ Need more responses'}
          </p>
        </div>

        {/* Completion Rate Card */}
        {data.completion_rate !== undefined && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Completion Rate
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {this.formatPercentage(data.completion_rate)}
            </p>
            <div className="mt-2 flex items-center">
              <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 rounded-full"
                  style={{ width: `${data.completion_rate * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  /**
   * Renders dashboard widgets
   */
  private renderWidgets(
    data: ComputedReportData,
    widgets: DashboardWidget[]
  ): ReactNode {
    if (widgets.length === 0) {
      // Default widgets if none specified
      return this.renderDefaultWidgets(data);
    }

    return widgets.map((widget, index) => (
      <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        {this.renderWidget(data, widget)}
      </div>
    ));
  }

  /**
   * Renders default widgets when none are configured
   */
  private renderDefaultWidgets(data: ComputedReportData): ReactNode {
    const dimensions = this.getDimensions(data);
    const metrics = this.getMetrics(data);

    return (
      <>
        {/* Dimensions Widget */}
        {Object.keys(dimensions).length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Dimensions
            </h3>
            <div className="space-y-4">
              {Object.entries(dimensions).map(([key, dim]) => (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{key}</span>
                    <span className="text-sm font-bold text-gray-900">
                      {this.formatNumber(dim.value, 1)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${dim.value}%`,
                        backgroundColor: this.getColorForValue(dim.value)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metrics Widget */}
        {Object.keys(metrics).length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Metrics
            </h3>
            <div className="space-y-3">
              {Object.entries(metrics).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{key}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {typeof value === 'number' ? this.formatNumber(value, 2) : value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  }

  /**
   * Renders a single widget
   */
  private renderWidget(data: ComputedReportData, widget: DashboardWidget): ReactNode {
    const title = widget.options.title as string | undefined;

    switch (widget.type) {
      case 'metric':
        return this.renderMetricWidget(data, widget, title);
      case 'chart':
        return this.renderChartWidget(data, widget, title);
      case 'table':
        return this.renderTableWidget(data, widget, title);
      default:
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {title || 'Widget'}
            </h3>
            <p className="text-gray-600">Unknown widget type: {widget.type}</p>
          </div>
        );
    }
  }

  /**
   * Renders a metric widget (single value card)
   */
  private renderMetricWidget(data: ComputedReportData, widget: DashboardWidget, title?: string): ReactNode {
    const dimensionData = data.dimensions[widget.dataSource];

    if (!dimensionData) {
      return (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">{title || widget.dataSource}</h3>
          <p className="text-gray-400">No data available</p>
        </div>
      );
    }

    const value = dimensionData.value || 0;
    const scale = dimensionData.scale || { min: 1, max: 5 };
    const percentage = ((value - scale.min) / (scale.max - scale.min)) * 100;

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 mb-2">{title || widget.dataSource}</h3>
        <div className="flex items-baseline">
          <p className="text-3xl font-bold text-gray-900">{value.toFixed(2)}</p>
          <p className="ml-2 text-sm text-gray-500">/ {scale.max}</p>
        </div>
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">{dimensionData.responses || 0} responses</p>
      </div>
    );
  }

  /**
   * Renders a chart widget
   */
  private renderChartWidget(data: ComputedReportData, widget: DashboardWidget, title?: string): ReactNode {
    const dimensions = Object.entries(data.dimensions);

    if (dimensions.length === 0) {
      return (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title || 'Chart'}</h3>
          <p className="text-gray-400">No data available</p>
        </div>
      );
    }

    const maxValue = Math.max(...dimensions.map(([, d]) => d.value || 0));
    const scale = dimensions[0]?.[1]?.scale || { min: 1, max: 5 };

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title || 'Dimension Scores'}</h3>
        <div className="space-y-4">
          {dimensions.map(([key, dimension]) => {
            const value = dimension.value || 0;
            const percentage = ((value - scale.min) / (scale.max - scale.min)) * 100;

            return (
              <div key={key}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/-/g, ' ')}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{value.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /**
   * Renders a table widget
   */
  private renderTableWidget(data: ComputedReportData, widget: DashboardWidget, title?: string): ReactNode {
    const dimensions = Object.entries(data.dimensions);

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title || 'Summary'}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Dimension
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Score
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Responses
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dimensions.map(([key, dimension]) => (
                <tr key={key}>
                  <td className="px-3 py-2 text-sm text-gray-900 capitalize">
                    {key.replace(/-/g, ' ')}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900 text-right font-medium">
                    {(dimension.value || 0).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500 text-right">
                    {dimension.responses || 0}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td className="px-3 py-2 text-sm font-bold text-gray-900">
                  Overall
                </td>
                <td className="px-3 py-2 text-sm font-bold text-gray-900 text-right">
                  {(data.overall_score || 0).toFixed(2)}
                </td>
                <td className="px-3 py-2 text-sm text-gray-500 text-right">
                  {data.response_count || 0}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /**
   * Gets the CSS class for the layout
   */
  private getLayoutClass(layout: string): string {
    switch (layout) {
      case 'grid':
        return 'grid grid-cols-1 md:grid-cols-2 gap-6';
      case 'single':
        return 'space-y-6';
      case 'three-column':
        return 'grid grid-cols-1 md:grid-cols-3 gap-6';
      default:
        return 'grid grid-cols-1 md:grid-cols-2 gap-6';
    }
  }
}

