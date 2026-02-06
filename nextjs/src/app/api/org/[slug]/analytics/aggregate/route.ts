/**
 * Analytics Data Aggregation API
 * 
 * Aggregates questionnaire response data for selected questions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { StatisticalCalculator } from '@/lib/reports/core/StatisticalCalculator';
import { Tables } from '@/lib/types';

interface AggregateRequest {
  questionnaireId: string;
  questionIds: string[];
}

interface QuestionnaireSchema {
  sections: Array<{
    id: string;
    title: string;
    questions: Array<{
      id: string;
      text: string;
      type: string;
      scale?: {
        min: number;
        max: number;
        minLabel: string;
        maxLabel: string;
      };
      options?: string[];
      maxLength?: number;
    }>;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json() as AggregateRequest;
    const { questionnaireId, questionIds } = body;

    if (!questionnaireId || !questionIds || questionIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Fetch questionnaire with schema
    const { data: questionnaire, error: qError } = await supabase
      .from('questionnaires')
      .select('schema, organization_id, title')
      .eq('id', questionnaireId)
      .single();

    if (qError || !questionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire not found' },
        { status: 404 }
      );
    }

    // Type assertion for questionnaire
    const typedQuestionnaire = questionnaire as Pick<Tables<'questionnaires'>, 'schema' | 'organization_id' | 'title'>;
    const schema = typedQuestionnaire.schema as unknown as QuestionnaireSchema;

    // Fetch all responses for this questionnaire
    const { data: responses, error: rError } = await supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('questionnaire_id', questionnaireId);

    if (rError) {
      return NextResponse.json(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      );
    }

    // Type assertion for responses
    const typedResponses = (responses || []) as Tables<'questionnaire_responses'>[];

    if (typedResponses.length === 0) {
      return NextResponse.json({
        questions: {},
        responseCount: 0,
        message: 'No responses available'
      });
    }

    // Aggregate data for each selected question
    const aggregatedQuestions: Record<string, any> = {};

    questionIds.forEach(questionId => {
      // Find question in schema
      let questionInfo = null;
      for (const section of schema.sections) {
        const question = section.questions.find(q => q.id === questionId);
        if (question) {
          questionInfo = { ...question, sectionTitle: section.title };
          break;
        }
      }

      if (!questionInfo) return;

      // Extract values for this question from all responses
      const rawValues: any[] = [];
      typedResponses.forEach(response => {
        const answers = response.answers as Record<string, any>;
        const value = answers[questionId];
        if (value !== null && value !== undefined) {
          rawValues.push(value);
        }
      });

      // Type-specific aggregation
      const questionType = questionInfo.type;

      if (questionType === 'scale') {
        // Scale questions: numeric values
        const values: number[] = rawValues.filter(v => typeof v === 'number');

        if (values.length === 0) {
          aggregatedQuestions[questionId] = {
            questionText: questionInfo.text,
            sectionTitle: questionInfo.sectionTitle,
            type: questionInfo.type,
            scale: questionInfo.scale,
            responseCount: 0,
            average: 0,
            distribution: {}
          };
          return;
        }

        const average = StatisticalCalculator.average(values);
        const distribution = StatisticalCalculator.distribution(values);
        const median = StatisticalCalculator.median(values);
        const { min, max } = StatisticalCalculator.range(values);

        aggregatedQuestions[questionId] = {
          questionText: questionInfo.text,
          sectionTitle: questionInfo.sectionTitle,
          type: questionInfo.type,
          scale: questionInfo.scale,
          responseCount: values.length,
          average: Math.round(average * 100) / 100,
          median: Math.round(median * 100) / 100,
          min,
          max,
          distribution
        };
      } else if (questionType === 'single-choice') {
        // Single choice: string values
        const values: string[] = rawValues.filter(v => typeof v === 'string');
        const distribution = StatisticalCalculator.distribution(values);
        const mode = StatisticalCalculator.mode(values);

        // Extract options - handle both simple array and multilingual object
        let options: string[] = [];
        if (questionInfo.options) {
          if (Array.isArray(questionInfo.options)) {
            options = questionInfo.options;
          } else if (typeof questionInfo.options === 'object') {
            // Multilingual format - try to get options from any language
            const optionsObj = questionInfo.options as Record<string, string[]>;
            options = optionsObj.en || optionsObj.de || Object.values(optionsObj)[0] || [];
          }
        }

        aggregatedQuestions[questionId] = {
          questionText: questionInfo.text,
          sectionTitle: questionInfo.sectionTitle,
          type: questionInfo.type,
          options: options,
          responseCount: values.length,
          distribution,
          topAnswer: mode
        };
      } else if (questionType === 'multiple-choice') {
        // Multiple choice: array of strings
        const allSelections: string[] = [];
        rawValues.forEach(value => {
          if (Array.isArray(value)) {
            allSelections.push(...value.filter(v => typeof v === 'string'));
          }
        });

        const distribution = StatisticalCalculator.distribution(allSelections);

        // Extract options - handle both simple array and multilingual object
        let options: string[] = [];
        if (questionInfo.options) {
          if (Array.isArray(questionInfo.options)) {
            options = questionInfo.options;
          } else if (typeof questionInfo.options === 'object') {
            // Multilingual format - try to get options from any language
            const optionsObj = questionInfo.options as Record<string, string[]>;
            options = optionsObj.en || optionsObj.de || Object.values(optionsObj)[0] || [];
          }
        }

        aggregatedQuestions[questionId] = {
          questionText: questionInfo.text,
          sectionTitle: questionInfo.sectionTitle,
          type: questionInfo.type,
          options: options,
          responseCount: rawValues.length,
          totalSelections: allSelections.length,
          distribution
        };
      } else if (questionType === 'ranking') {
        // Ranking: array of strings (ordered)
        // Extract options - handle both simple array and multilingual object
        let options: string[] = [];
        if (questionInfo.options) {
          if (Array.isArray(questionInfo.options)) {
            options = questionInfo.options;
          } else if (typeof questionInfo.options === 'object') {
            // Multilingual format - try to get options from any language
            const optionsObj = questionInfo.options as Record<string, string[]>;
            options = optionsObj.en || optionsObj.de || Object.values(optionsObj)[0] || [];
          }
        }

        const rankSums: Record<string, number> = {};
        const rankCounts: Record<string, number> = {};

        // Initialize all options
        options.forEach(option => {
          rankSums[option] = 0;
          rankCounts[option] = 0;
        });

        rawValues.forEach(value => {
          if (Array.isArray(value)) {
            value.forEach((option, index) => {
              if (typeof option === 'string') {
                rankSums[option] = (rankSums[option] || 0) + (index + 1); // rank starts at 1
                rankCounts[option] = (rankCounts[option] || 0) + 1;
              }
            });
          }
        });

        // Calculate average rank for each option
        const averageRanks: Record<string, number> = {};
        Object.keys(rankSums).forEach(option => {
          if (rankCounts[option] > 0) {
            averageRanks[option] = Math.round((rankSums[option] / rankCounts[option]) * 100) / 100;
          }
        });

        aggregatedQuestions[questionId] = {
          questionText: questionInfo.text,
          sectionTitle: questionInfo.sectionTitle,
          type: questionInfo.type,
          options: options,
          responseCount: rawValues.length,
          averageRanks,
          rankCounts
        };
      } else if (questionType === 'free-text') {
        // Free text: collect all text responses
        const textResponses: string[] = rawValues.filter(v => typeof v === 'string' && v.trim() !== '');

        aggregatedQuestions[questionId] = {
          questionText: questionInfo.text,
          sectionTitle: questionInfo.sectionTitle,
          type: questionInfo.type,
          maxLength: questionInfo.maxLength,
          responseCount: textResponses.length,
          responses: textResponses
        };
      } else {
        // Unknown type - return basic info
        aggregatedQuestions[questionId] = {
          questionText: questionInfo.text,
          sectionTitle: questionInfo.sectionTitle,
          type: questionInfo.type,
          responseCount: rawValues.length
        };
      }
    });

    return NextResponse.json({
      questions: aggregatedQuestions,
      responseCount: typedResponses.length,
      questionnaireTitle: typedQuestionnaire.title
    });

  } catch (error) {
    console.error('Analytics aggregation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

