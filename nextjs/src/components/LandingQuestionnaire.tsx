'use client'

import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  TrendingUp,
} from 'lucide-react'
import { questions } from '@/lib/landing-questionnaire/data'
import { computeResult } from '@/lib/landing-questionnaire/scoring'
import type {
  Answers,
  QuestionnaireResult,
  ScoreLevel,
} from '@/lib/landing-questionnaire/types'

const LEVEL_LABELS: Record<ScoreLevel, string> = {
  low: 'gering',
  medium: 'mittel',
  high: 'hoch',
}

const LEVEL_STYLES: Record<ScoreLevel, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-primary-100 text-primary-700',
}

export default function LandingQuestionnaire() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [result, setResult] = useState<QuestionnaireResult | null>(null)

  const currentQuestion = questions[step]
  const currentAnswered = answers[currentQuestion.id] !== undefined
  const isLast = step === questions.length - 1

  function selectAnswer(value: number | string) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
  }

  function handleNext() {
    if (!isLast) {
      setStep((s) => s + 1)
    } else {
      setResult(computeResult(answers))
    }
  }

  function handleBack() {
    setStep((s) => s - 1)
  }

  function handleRestart() {
    setAnswers({})
    setResult(null)
    setStep(0)
  }

  /* ── Result view ── */
  if (result) {
    return (
      <div className="space-y-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-100 rounded-full mb-2">
            <TrendingUp className="h-3 w-3 text-primary-600" />
            <span className="text-xs font-medium text-primary-700">
              {result.classification}
            </span>
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">{result.headline}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{result.summary}</p>
        </div>

        <div className="space-y-2 border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Profil
          </p>
          {result.dimensions.map((dim) => (
            <div key={dim.id} className="flex items-center gap-2">
              <span className="w-44 text-xs text-gray-600 truncate">{dim.label}</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full"
                  style={{ width: `${(dim.score / 5) * 100}%` }}
                />
              </div>
              <span
                className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${LEVEL_STYLES[dim.level]}`}
              >
                {LEVEL_LABELS[dim.level]}
              </span>
            </div>
          ))}
        </div>

        {result.strengths.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Stärken
            </p>
            <ul className="space-y-1.5">
              {result.strengths.map((text, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-xs text-gray-600">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary-500 flex-shrink-0 mt-0.5" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.developments.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Entwicklungsfelder
            </p>
            <ul className="space-y-1.5">
              {result.developments.map((text, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-xs text-gray-600">
                  <TrendingUp className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.tensions.length > 0 && (
          <div className="bg-amber-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1.5">
              Spannungsfelder
            </p>
            <ul className="space-y-1.5">
              {result.tensions.map((text, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-xs text-amber-800">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-primary-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-1">
            Empfehlung
          </p>
          <p className="text-xs text-primary-800 leading-relaxed">{result.recommendation}</p>
        </div>

        <button
          type="button"
          onClick={handleRestart}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-primary-700 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Test erneut starten
        </button>
      </div>
    )
  }

  /* ── Wizard view ── */
  const progressPct =
    ((step + (currentAnswered ? 1 : 0)) / questions.length) * 100

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-gray-500">
          <span>
            Frage {step + 1} von {questions.length}
          </span>
          <span>{Math.round(progressPct)}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Question text */}
      <p className="text-sm font-semibold text-gray-900">
        <span className="text-primary-600">{step + 1}.</span>{' '}
        {currentQuestion.question}
      </p>

      {/* Options – scale */}
      {currentQuestion.type === 'scale' && (
        <div className="space-y-1.5">
          {Array.from(
            {
              length:
                currentQuestion.scale.max - currentQuestion.scale.min + 1,
            },
            (_, i) => currentQuestion.scale.min + i
          ).map((value) => {
            const selected = answers[currentQuestion.id] === value
            return (
              <label
                key={value}
                className={`flex items-center gap-2.5 px-3 py-2.5 border-2 rounded-lg cursor-pointer transition-colors ${
                  selected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  checked={selected}
                  onChange={() => selectAnswer(value)}
                  className="sr-only"
                />
                <span
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    selected
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {value}
                </span>
                <span className="text-xs text-gray-700">
                  {currentQuestion.scale.labels[String(value)]}
                </span>
              </label>
            )
          })}
        </div>
      )}

      {/* Options – single choice */}
      {currentQuestion.type === 'single_choice' && (
        <div className="space-y-1.5">
          {Object.entries(currentQuestion.options).map(([key, label]) => {
            const selected = answers[currentQuestion.id] === key
            return (
              <label
                key={key}
                className={`flex items-center gap-2.5 px-3 py-2.5 border-2 rounded-lg cursor-pointer transition-colors ${
                  selected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  checked={selected}
                  onChange={() => selectAnswer(key)}
                  className="sr-only"
                />
                <span
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    selected
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {key}
                </span>
                <span className="text-xs text-gray-700">{label}</span>
              </label>
            )
          })}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-2 pt-1">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 0}
          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Zurück
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!currentAnswered}
          className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-lg hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLast ? 'Auswerten' : 'Weiter'}
          {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  )
}

