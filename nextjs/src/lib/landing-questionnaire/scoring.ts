/**
 * Pure scoring logic for the landing-page self-assessment.
 *
 * Given a set of answers, it derives per-dimension scores and levels, the
 * overall classification band, matching strength/development texts, and any
 * triggered tension rules. No side effects, fully unit-testable.
 */

import { questions, resultTexts, scoringRules } from './data'
import type {
  Answers,
  DimensionId,
  DimensionResult,
  QuestionnaireResult,
  ScoreLevel,
  SingleChoiceScoring,
  TensionRule,
} from './types'

function levelForScore(score: number): ScoreLevel {
  const { low, medium } = scoringRules.score_levels
  if (score <= low.max) return 'low'
  if (score <= medium.max) return 'medium'
  return 'high'
}

function classify(overallScore: number): string {
  const bands = scoringRules.overall_classification
  for (const band of bands) {
    if (overallScore <= band.max) return band.label
  }
  return bands[bands.length - 1].label
}

function evaluateTension(
  rule: TensionRule,
  scores: Record<DimensionId, number>,
  patterns: string[]
): boolean {
  return Object.entries(rule.conditions).every(([key, value]) => {
    if (key === 'transformation_patterns') {
      const expected = value as string[]
      return patterns.some((p) => expected.includes(p))
    }
    if (key === 'all_scores_equal') {
      return Object.values(scores).every((s) => s === value)
    }
    if (key.endsWith('_min')) {
      const dim = key.slice(0, -'_min'.length) as DimensionId
      return scores[dim] >= (value as number)
    }
    if (key.endsWith('_max')) {
      const dim = key.slice(0, -'_max'.length) as DimensionId
      return scores[dim] <= (value as number)
    }
    return false
  })
}

/**
 * Compute the full result for a complete set of answers.
 * Assumes every question has been answered with a valid value.
 */
export function computeResult(answers: Answers): QuestionnaireResult {
  const scores = {} as Record<DimensionId, number>
  const patterns: string[] = []

  for (const question of questions) {
    const answer = answers[question.id]
    const questionScoring = scoringRules.question_scoring[question.id]

    if (question.type === 'scale') {
      const dimScoring = questionScoring[question.dimension] as Record<string, number>
      scores[question.dimension] = dimScoring[String(answer)]
    } else {
      const optionScoring = questionScoring[String(answer)] as SingleChoiceScoring
      scores[question.dimension] = optionScoring.transformation_focus
      patterns.push(optionScoring.pattern)
    }
  }

  const dimensions: DimensionResult[] = (
    Object.keys(scores) as DimensionId[]
  ).map((id) => ({
    id,
    label: scoringRules.dimensions[id].label,
    score: scores[id],
    level: levelForScore(scores[id]),
  }))

  const scoreValues = Object.values(scores)
  const overallScore =
    scoreValues.reduce((sum, s) => sum + s, 0) / scoreValues.length
  const classification = classify(overallScore)

  const strengths = dimensions
    .filter((d) => d.level === 'high')
    .map((d) => resultTexts.strength_texts[`${d.id}_high`])
    .filter(Boolean)

  const developments = dimensions
    .filter((d) => d.level === 'low')
    .map((d) => resultTexts.development_texts[`${d.id}_low`])
    .filter(Boolean)

  const tensions = scoringRules.tension_rules
    .filter((rule) => evaluateTension(rule, scores, patterns))
    .map((rule) => rule.message)

  return {
    dimensions,
    overallScore,
    classification,
    headline: resultTexts.headlines[classification],
    summary: resultTexts.summaries[classification],
    recommendation: resultTexts.recommendations[classification],
    strengths,
    developments,
    tensions,
  }
}

