'use client'

import { useEffect, useState, useCallback } from 'react'
import { createSPASassClient } from '@/lib/supabase/client'
import { Tables } from '@/lib/types'
import { Plus, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type Approach = Tables<'approaches'>
type ApproachTemplate = Tables<'approach_questionnaire_templates'>

export default function ApproachDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [approach, setApproach] = useState<Approach | null>(null)
  const [templates, setTemplates] = useState<ApproachTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    description: '',
    order: 0,
  })

  const loadData = useCallback(async () => {
    const supabaseWrapper = await createSPASassClient()
    const supabase = supabaseWrapper.getSupabaseClient()

    // Load approach
    const { data: approachData } = await supabase
      .from('approaches')
      .select('*')
      .eq('id', id)
      .single()

    if (approachData) {
      setApproach(approachData)
    }

    // Load templates
    const { data: templatesData } = await supabase
      .from('approach_questionnaire_templates')
      .select('*')
      .eq('approach_id', id)
      .order('order', { ascending: true })

    if (templatesData) {
      setTemplates(templatesData)
    }

    setLoading(false)
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function createTemplate(e: React.FormEvent) {
    e.preventDefault()
    const supabaseWrapper = await createSPASassClient()
    const supabase = supabaseWrapper.getSupabaseClient()

    const { error } = await supabase
      .from('approach_questionnaire_templates')
      .insert([{
        approach_id: id,
        title: newTemplate.title,
        description: newTemplate.description || null,
        order: newTemplate.order,
        schema: {},
      }])

    if (!error) {
      setShowCreateForm(false)
      setNewTemplate({ title: '', description: '', order: 0 })
      loadData()
    }
  }

  async function deleteTemplate(templateId: string) {
    if (!confirm('Are you sure you want to delete this template?')) return

    const supabaseWrapper = await createSPASassClient()
    const supabase = supabaseWrapper.getSupabaseClient()

    await supabase
      .from('approach_questionnaire_templates')
      .delete()
      .eq('id', templateId)

    loadData()
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  if (!approach) {
    return <div className="p-6">Approach not found</div>
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <Link
          href="/app/admin/approaches"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Approaches
        </Link>
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-bold text-gray-900">{approach.name}</h1>
            <p className="mt-2 text-sm text-gray-700">
              {approach.description || 'Manage questionnaire templates for this approach'}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Template
            </button>
          </div>
        </div>
      </div>

      {/* Create Template Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-medium mb-4">Add Questionnaire Template</h2>
            <form onSubmit={createTemplate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  required
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Order</label>
                <input
                  type="number"
                  value={newTemplate.order}
                  onChange={(e) => setNewTemplate({ ...newTemplate, order: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {templates.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {templates.map((template) => (
              <div key={template.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                        {template.order}
                      </span>
                      <h3 className="text-lg font-medium text-gray-900">
                        {template.title}
                      </h3>
                    </div>
                    {template.description && (
                      <p className="mt-2 text-sm text-gray-600 ml-11">
                        {template.description}
                      </p>
                    )}
                    <div className="mt-3 ml-11 text-sm text-gray-500">
                      Created: {new Date(template.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Plus className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No templates
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a questionnaire template.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

