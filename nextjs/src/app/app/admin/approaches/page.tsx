'use client'

import { useEffect, useState } from 'react'
import { createSPASassClient } from '@/lib/supabase/client'
import { Tables } from '@/lib/types'
import { Plus, Edit, Trash2, FileText, Layers } from 'lucide-react'
import Link from 'next/link'

type Approach = Tables<'approaches'>
type ApproachTemplate = Tables<'approach_questionnaire_templates'>

export default function ApproachesPage() {
  const [approaches, setApproaches] = useState<Approach[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newApproach, setNewApproach] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
  })

  useEffect(() => {
    loadApproaches()
  }, [])

  async function loadApproaches() {
    const supabaseWrapper = await createSPASassClient()
    const supabase = supabaseWrapper.getSupabaseClient()

    const { data } = await supabase
      .from('approaches')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setApproaches(data)
    }
    setLoading(false)
  }

  async function createApproach(e: React.FormEvent) {
    e.preventDefault()
    const supabaseWrapper = await createSPASassClient()
    const supabase = supabaseWrapper.getSupabaseClient()

    const { error } = await supabase
      .from('approaches')
      .insert([{
        name: newApproach.name,
        slug: newApproach.slug,
        description: newApproach.description || null,
        category: newApproach.category || null,
      }])

    if (!error) {
      setShowCreateForm(false)
      setNewApproach({ name: '', slug: '', description: '', category: '' })
      loadApproaches()
    }
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    const supabaseWrapper = await createSPASassClient()
    const supabase = supabaseWrapper.getSupabaseClient()

    await supabase
      .from('approaches')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    loadApproaches()
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Approaches</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage analysis approaches and their questionnaire templates
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Approach
          </button>
        </div>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-medium mb-4">Create New Approach</h2>
            <form onSubmit={createApproach} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  value={newApproach.name}
                  onChange={(e) => setNewApproach({ ...newApproach, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug</label>
                <input
                  type="text"
                  required
                  value={newApproach.slug}
                  onChange={(e) => setNewApproach({ ...newApproach, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input
                  type="text"
                  value={newApproach.category}
                  onChange={(e) => setNewApproach({ ...newApproach, category: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newApproach.description}
                  onChange={(e) => setNewApproach({ ...newApproach, description: e.target.value })}
                  rows={3}
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

      {/* Approaches List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {approaches.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {approaches.map((approach) => (
              <div key={approach.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {approach.name}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          approach.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {approach.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {approach.category && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {approach.category}
                        </span>
                      )}
                    </div>
                    {approach.description && (
                      <p className="mt-2 text-sm text-gray-600">
                        {approach.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      <span>Slug: {approach.slug}</span>
                      <span>Created: {new Date(approach.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <Link
                      href={`/app/admin/approaches/${approach.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      <FileText className="h-4 w-4" />
                      Templates
                    </Link>
                    <button
                      onClick={() => toggleActive(approach.id, approach.is_active)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                        approach.is_active
                          ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                          : 'text-green-700 bg-green-100 hover:bg-green-200'
                      }`}
                    >
                      {approach.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Layers className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No approaches
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new approach.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

