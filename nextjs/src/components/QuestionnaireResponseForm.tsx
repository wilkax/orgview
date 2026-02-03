'use client'

import { useState, useEffect, useRef } from 'react'
import { createSPASassClient } from '@/lib/supabase/client'
import { Tables } from '@/lib/types'
import { CheckCircle2, AlertCircle } from 'lucide-react'

type Questionnaire = Tables<'questionnaires'>
type Participant = Tables<'participants'>
type QuestionnaireResponse = Tables<'questionnaire_responses'>

interface Question {
  id: string
  text: string
  type: 'scale' | 'single-choice' | 'multiple-choice' | 'ranking' | 'free-text'
  required?: boolean
  scale?: {
    min: number
    max: number
    minLabel: string
    maxLabel: string
  }
  options?: string[]
  maxLength?: number
}

interface Section {
  id: string
  title: string
  description?: string
  questions: Question[]
}

interface QuestionnaireSchema {
  sections: Section[]
}

interface Answers {
  [questionId: string]: number | string | string[] | undefined
}

interface Props {
  questionnaire: Questionnaire
  participant: Participant
  existingResponse: QuestionnaireResponse | null
  isWithinTimeFrame?: boolean
}

export default function QuestionnaireResponseForm({
  questionnaire,
  participant,
  existingResponse,
  isWithinTimeFrame = true
}: Props) {
  const [answers, setAnswers] = useState<Answers>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(!!existingResponse)
  const [error, setError] = useState<string | null>(null)
  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Type guard: check if schema has the expected structure
  const schemaData = questionnaire.schema
  let schema: QuestionnaireSchema = { sections: [] }

  if (
    schemaData &&
    typeof schemaData === 'object' &&
    !Array.isArray(schemaData) &&
    'sections' in schemaData &&
    Array.isArray(schemaData.sections)
  ) {
    schema = schemaData as unknown as QuestionnaireSchema
  }

  useEffect(() => {
    if (existingResponse && existingResponse.answers) {
      setAnswers(existingResponse.answers as unknown as Answers)
    }
  }, [existingResponse])

  function scrollToNextQuestion(currentQuestionId: string) {
    // Get all question IDs in order
    const allQuestionIds: string[] = []
    schema.sections.forEach(section => {
      section.questions.forEach(q => allQuestionIds.push(q.id))
    })

    // Find current question index
    const currentIndex = allQuestionIds.indexOf(currentQuestionId)

    // If there's a next question, scroll to it
    if (currentIndex >= 0 && currentIndex < allQuestionIds.length - 1) {
      const nextQuestionId = allQuestionIds[currentIndex + 1]
      const nextElement = questionRefs.current[nextQuestionId]

      if (nextElement) {
        setTimeout(() => {
          nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 150)
      }
    }
  }

  function handleAnswerChange(questionId: string, value: number | string | string[]) {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
    scrollToNextQuestion(questionId)
  }

  function handleMultipleChoiceChange(questionId: string, option: string, checked: boolean) {
    setAnswers(prev => {
      const current = (prev[questionId] as string[]) || []
      if (checked) {
        return { ...prev, [questionId]: [...current, option] }
      } else {
        return { ...prev, [questionId]: current.filter(o => o !== option) }
      }
    })
  }

  function handleRankingChange(questionId: string, options: string[]) {
    setAnswers(prev => ({
      ...prev,
      [questionId]: options
    }))
  }

  function validateAnswers(): boolean {
    for (const section of schema.sections) {
      for (const question of section.questions) {
        if (question.required !== false) {
          const answer = answers[question.id]
          if (answer === undefined || answer === null || answer === '' || 
              (Array.isArray(answer) && answer.length === 0)) {
            setError(`Please answer: ${question.text}`)
            return false
          }
        }
      }
    }
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!validateAnswers()) {
      return
    }

    setSubmitting(true)

    const supabaseWrapper = await createSPASassClient()
    const supabase = supabaseWrapper.getSupabaseClient()

    if (existingResponse) {
      // Update existing response
      const { error: updateError } = await supabase
        .from('questionnaire_responses')
        .update({ 
          answers: answers,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingResponse.id)

      if (updateError) {
        setError('Failed to update response. Please try again.')
        setSubmitting(false)
        return
      }
    } else {
      // Create new response
      const { error: insertError } = await supabase
        .from('questionnaire_responses')
        .insert({
          questionnaire_id: questionnaire.id,
          participant_id: participant.id,
          answers: answers,
          submitted_at: new Date().toISOString()
        })

      if (insertError) {
        setError('Failed to submit response. Please try again.')
        setSubmitting(false)
        return
      }
    }

    setSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-3" />
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          {existingResponse ? 'Response Updated!' : 'Thank You!'}
        </h2>
        <p className="text-sm text-gray-600">
          {existingResponse
            ? 'Your response has been successfully updated.'
            : 'Your response has been submitted successfully.'}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-800">{error}</p>
        </div>
      )}

      {schema.sections.map((section, sectionIndex) => (
        <div key={section.id} className="bg-white shadow rounded-lg p-4">
          <h3 className="text-base font-medium text-gray-900 mb-1">
            {section.title}
          </h3>
          {section.description && (
            <p className="text-xs text-gray-600 mb-3">{section.description}</p>
          )}

          <div className="space-y-4">
            {section.questions.map((question, questionIndex) => (
              <div
                key={question.id}
                ref={el => { questionRefs.current[question.id] = el }}
                className="border-l-2 border-blue-500 pl-3 py-1"
              >
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  {sectionIndex + 1}.{questionIndex + 1} {question.text}
                  {question.required !== false && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>

                {/* Scale Question */}
                {question.type === 'scale' && question.scale && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>{question.scale.minLabel}</span>
                      <span>{question.scale.maxLabel}</span>
                    </div>
                    <div className="flex gap-1.5 justify-between">
                      {Array.from(
                        { length: question.scale.max - question.scale.min + 1 },
                        (_, i) => question.scale!.min + i
                      ).map((value) => (
                        <label
                          key={value}
                          className={`flex-1 flex flex-col items-center gap-1 p-2 border-2 rounded-md cursor-pointer transition-colors ${
                            answers[question.id] === value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={question.id}
                            value={value}
                            checked={answers[question.id] === value}
                            onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value))}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium">{value}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Single Choice Question */}
                {question.type === 'single-choice' && question.options && (
                  <div className="space-y-1.5">
                    {question.options.map((option, idx) => (
                      <label
                        key={idx}
                        className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer transition-colors ${
                          answers[question.id] === option
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Multiple Choice Question */}
                {question.type === 'multiple-choice' && question.options && (
                  <div className="space-y-1.5">
                    {question.options.map((option, idx) => (
                      <label
                        key={idx}
                        className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer transition-colors ${
                          (answers[question.id] as string[] || []).includes(option)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={(answers[question.id] as string[] || []).includes(option)}
                          onChange={(e) => handleMultipleChoiceChange(question.id, option, e.target.checked)}
                          className="h-3.5 w-3.5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-xs">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Ranking Question */}
                {question.type === 'ranking' && question.options && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-500 mb-1">
                      Use arrows to reorder from most to least important
                    </p>
                    {(answers[question.id] as string[] || question.options).map((option, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 border border-gray-200 rounded-md bg-white"
                      >
                        <span className="text-xs font-medium text-gray-500 w-5">{idx + 1}.</span>
                        <span className="text-xs flex-1">{option}</span>
                        <div className="flex gap-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              const current = (answers[question.id] as string[]) || [...question.options!]
                              if (idx > 0) {
                                const newOrder = [...current]
                                ;[newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]]
                                handleRankingChange(question.id, newOrder)
                              }
                            }}
                            disabled={idx === 0}
                            className="text-xs px-1.5 py-0.5 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const current = (answers[question.id] as string[]) || [...question.options!]
                              const maxIdx = current.length - 1
                              if (idx < maxIdx) {
                                const newOrder = [...current]
                                ;[newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]]
                                handleRankingChange(question.id, newOrder)
                              }
                            }}
                            disabled={idx === ((answers[question.id] as string[]) || question.options).length - 1}
                            className="text-xs px-1.5 py-0.5 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Free Text Question */}
                {question.type === 'free-text' && (
                  <div>
                    <textarea
                      value={(answers[question.id] as string) || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      maxLength={question.maxLength || 500}
                      rows={3}
                      className="block w-full text-xs border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Type your answer here..."
                    />
                    <p className="text-xs text-gray-500 mt-0.5 text-right">
                      {((answers[question.id] as string) || '').length} / {question.maxLength || 500}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Submit Button */}
      <div className="bg-white shadow rounded-lg p-4">
        {!isWithinTimeFrame && (
          <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-xs text-gray-600">
              This questionnaire is not currently accepting responses due to time restrictions.
            </p>
          </div>
        )}
        <button
          type="submit"
          disabled={submitting || !isWithinTimeFrame}
          className="w-full py-2 px-3 text-sm bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Submitting...' : existingResponse ? 'Update Response' : 'Submit Response'}
        </button>
      </div>
    </form>
  )
}

