/**
 * Type definitions for the public landing-page self-assessment questionnaire.
 * Content is sourced from the JSON documents in this directory and scored
 * entirely on the client; no data is persisted.
 */

export type DimensionId =
  | 'decision_logic'
  | 'contradiction_handling'
  | 'learning_under_uncertainty'
  | 'transparency'
  | 'transformation_focus'

export type ScoreLevel = 'low' | 'medium' | 'high'

export interface ScaleQuestion {
  id: string
  dimension: DimensionId
  type: 'scale'
  question: string
  scale: {
    min: number
    max: number
    labels: Record<string, string>
  }
}

export interface SingleChoiceQuestion {
  id: string
  dimension: DimensionId
  type: 'single_choice'
  question: string
  options: Record<string, string>
}

export type Question = ScaleQuestion | SingleChoiceQuestion

export interface QuestionsFile {
  questions: Question[]
}

export interface ScoreLevelRange {
  min: number
  max: number
}

export interface ClassificationBand {
  min: number
  max: number
  label: string
}

export interface TensionRule {
  id: string
  conditions: Record<string, number | string[]>
  message: string
}

export interface SingleChoiceScoring {
  transformation_focus: number
  pattern: string
}

export interface ScoringRules {
  dimensions: Record<DimensionId, { label: string }>
  question_scoring: Record<
    string,
    Record<string, Record<string, number> | SingleChoiceScoring>
  >
  score_levels: {
    low: ScoreLevelRange
    medium: ScoreLevelRange
    high: ScoreLevelRange
  }
  overall_classification: ClassificationBand[]
  tension_rules: TensionRule[]
}

export interface ResultTexts {
  headlines: Record<string, string>
  summaries: Record<string, string>
  strength_texts: Record<string, string>
  development_texts: Record<string, string>
  recommendations: Record<string, string>
}

/** Answers keyed by question id: a numeric scale value or a single-choice option key. */
export type Answers = Record<string, number | string>

export interface DimensionResult {
  id: DimensionId
  label: string
  score: number
  level: ScoreLevel
}

export interface QuestionnaireResult {
  dimensions: DimensionResult[]
  overallScore: number
  classification: string
  headline: string
  summary: string
  recommendation: string
  strengths: string[]
  developments: string[]
  tensions: string[]
}

