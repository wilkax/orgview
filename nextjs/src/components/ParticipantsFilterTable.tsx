'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

export interface ParticipantRow {
  id: string
  email: string
  name: string | null
  created_at: string
  questionnaireIds: string[]
  hasResponded: boolean
}

export interface QuestionnaireOption {
  id: string
  title: string
}

interface Props {
  participants: ParticipantRow[]
  questionnaires: QuestionnaireOption[]
  slug: string
  labels: {
    searchPlaceholder: string
    filterByQuestionnaire: string
    allQuestionnaires: string
    filterByStatus: string
    allStatuses: string
    statusResponded: string
    statusNotResponded: string
    noResults: string
    email: string
    name: string
    created: string
    actions: string
    view: string
  }
}

type StatusFilter = 'all' | 'responded' | 'not-responded'

export default function ParticipantsFilterTable({ participants, questionnaires, slug, labels }: Props) {
  const [search, setSearch] = useState('')
  const [questionnaireFilter, setQuestionnaireFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return participants.filter((p) => {
      if (q && !p.email.toLowerCase().includes(q) && !(p.name ?? '').toLowerCase().includes(q)) {
        return false
      }
      if (questionnaireFilter !== 'all' && !p.questionnaireIds.includes(questionnaireFilter)) {
        return false
      }
      if (statusFilter === 'responded' && !p.hasResponded) return false
      if (statusFilter === 'not-responded' && p.hasResponded) return false
      return true
    })
  }, [participants, search, questionnaireFilter, statusFilter])

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={labels.searchPlaceholder}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={questionnaireFilter}
          onChange={(e) => setQuestionnaireFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">{labels.allQuestionnaires}</option>
          {questionnaires.map((q) => (
            <option key={q.id} value={q.id}>{q.title}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">{labels.allStatuses}</option>
          <option value="responded">{labels.statusResponded}</option>
          <option value="not-responded">{labels.statusNotResponded}</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-500">{labels.noResults}</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{labels.email}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{labels.name}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{labels.created}</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">{labels.actions}</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.name || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {p.hasResponded ? (
                    <Link href={`/app/org/${slug}/participants/${p.id}`} className="text-blue-600 hover:text-blue-900">
                      {labels.view}
                    </Link>
                  ) : (
                    <span className="text-gray-400 cursor-not-allowed">{labels.view}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

