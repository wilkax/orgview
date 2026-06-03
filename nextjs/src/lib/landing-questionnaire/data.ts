/**
 * Typed accessors for the landing-page questionnaire content.
 * The underlying JSON files are the single source of truth for the
 * questions, scoring rules, and result texts.
 */

import questionsJson from './questions.json'
import scoringRulesJson from './scoringRules.json'
import resultTextsJson from './resultTexts.json'
import type { QuestionsFile, ResultTexts, ScoringRules } from './types'

export const questionsFile = questionsJson as QuestionsFile
export const questions = questionsFile.questions
export const scoringRules = scoringRulesJson as unknown as ScoringRules
export const resultTexts = resultTextsJson as ResultTexts

